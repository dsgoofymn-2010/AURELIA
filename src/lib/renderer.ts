/**
 * Full-screen canvas compositor for the pre-rendered frames.
 *
 * Everything the visitor sees of the building is drawn here: the hero stills,
 * per-floor lighting layers, image sequences and stills. DOM overlays (floor
 * outlines, hotspots) use `toScreen` so they line up with the frame exactly,
 * including cover-fit cropping on narrow screens and the zoom used in
 * transitions.
 */
import gsap from 'gsap'
import { MAX_DPR, TIER } from './tier'

export type Pt = [number, number]
/** a still, or the shared <video> while a film plays */
export type Frame = HTMLImageElement | HTMLVideoElement
type Layer = { key: string; img: Frame | null; alpha: number; noZoom?: boolean }

const IW = 1920
const IH = 1080

class Renderer {
  canvas: HTMLCanvasElement | null = null
  ctx: CanvasRenderingContext2D | null = null
  W = 1
  H = 1
  dpr = 1
  layers: Layer[] = [{ key: 'base', img: null, alpha: 1 }]
  /** crop focal point in image coordinates */
  focus: Pt = [0.5, 0.5]
  /** transition camera: scale around an image point, optionally panning it to screen centre */
  zoom = { s: 1, u: 0.5, v: 0.5, pan: 0 }
  /** black veil 0..1 */
  veil = 0
  /** true while a film plays: resampling drops a step, since a full-screen rescale runs every frame */
  motion = false
  placeholder = 'Rendering in progress'
  private raf = 0
  private viewSubs = new Set<() => void>()

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.resize()
  }

  resize() {
    if (!this.canvas) return
    this.W = window.innerWidth
    this.H = window.innerHeight
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    this.canvas.width = Math.round(this.W * this.dpr)
    this.canvas.height = Math.round(this.H * this.dpr)
    this.canvas.style.width = `${this.W}px`
    this.canvas.style.height = `${this.H}px`
    this.emitView()
    this.draw()
  }

  /* ------------------------------------------------------------ geometry */

  /** displayed rect of the full frame (before zoom) */
  frameRect() {
    const k = Math.max(this.W / IW, this.H / IH)
    const w = IW * k
    const h = IH * k
    const left = Math.min(0, Math.max(this.W - w, this.W / 2 - this.focus[0] * w))
    const top = Math.min(0, Math.max(this.H - h, this.H / 2 - this.focus[1] * h))
    return { left, top, w, h }
  }

  private zoomed() {
    const r = this.frameRect()
    const { s, u, v, pan } = this.zoom
    const px = r.left + u * r.w
    const py = r.top + v * r.h
    const dx = (this.W / 2 - px) * pan
    const dy = (this.H / 2 - py) * pan
    return { left: px + (r.left - px) * s + dx, top: py + (r.top - py) * s + dy, w: r.w * s, h: r.h * s }
  }

  /** displayed rect of the full frame, transition zoom included */
  viewRect() {
    return this.zoomed()
  }

  toScreen(u: number, v: number): Pt {
    const r = this.zoomed()
    return [r.left + u * r.w, r.top + v * r.h]
  }

  onView(fn: () => void) {
    this.viewSubs.add(fn)
    return () => this.viewSubs.delete(fn)
  }
  private emitView() {
    this.viewSubs.forEach((f) => f())
  }

  /* ------------------------------------------------------------ layers */

  get base() {
    return this.layers[0]
  }
  setBase(img: Frame | null) {
    this.layers[0].img = img
    this.request()
  }
  layer(key: string, img?: Frame | null) {
    let l = this.layers.find((x) => x.key === key)
    if (!l) {
      l = { key, img: img ?? null, alpha: 0 }
      this.layers.push(l)
    } else if (img !== undefined) l.img = img
    return l
  }
  /** fade a layer to an alpha */
  fadeLayer(key: string, alpha: number, duration = 0.45) {
    const l = this.layer(key)
    return gsap.to(l, { alpha, duration, ease: 'power2.out', overwrite: true, onUpdate: () => this.request() })
  }
  clearLayers() {
    this.layers.slice(1).forEach((l) => gsap.killTweensOf(l))
    this.layers.length = 1
    this.request()
  }

  /** crossfade from whatever is showing to img; resolves when done */
  /** crossfade to img. `resetZoom`: the new image is drawn unzoomed and the zoom is cleared when done
   *  (used to dissolve from a zoomed-in still into the first frame of a sequence). */
  crossfade(img: Frame | null, duration = 0.6, resetZoom = false): Promise<void> {
    const finish = () => {
      if (resetZoom) this.setZoom({ s: 1, pan: 0 })
      this.clearLayers()
      this.setBase(img)
    }
    if (duration <= 0) {
      finish()
      return Promise.resolve()
    }
    const l = this.layer('xfade', img)
    l.img = img
    l.alpha = 0
    l.noZoom = resetZoom
    return new Promise((resolve) => {
      gsap.to(l, {
        alpha: 1,
        duration,
        ease: 'power1.inOut',
        overwrite: true,
        onUpdate: () => this.request(),
        onComplete: () => {
          finish()
          resolve()
        },
      })
    })
  }

  tweenZoom(to: Partial<Renderer['zoom']>, duration: number, ease = 'power2.inOut') {
    return new Promise<void>((resolve) => {
      gsap.to(this.zoom, {
        ...to,
        duration,
        ease,
        overwrite: true,
        onUpdate: () => {
          this.request()
          this.emitView()
        },
        onComplete: () => {
          this.emitView()
          resolve()
        },
      })
    })
  }
  setZoom(z: Partial<Renderer['zoom']>) {
    gsap.killTweensOf(this.zoom)
    Object.assign(this.zoom, z)
    this.request()
    this.emitView()
  }
  setFocus(f: Pt) {
    this.focus = f
    this.request()
    this.emitView()
  }

  /* ------------------------------------------------------------ drawing */

  request() {
    if (this.raf) return
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.draw()
    })
  }

  draw() {
    const ctx = this.ctx
    if (!ctx || !this.canvas) return
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.fillStyle = '#0b0a10'
    ctx.fillRect(0, 0, this.W, this.H)
    const rz = this.zoomed()
    const r0 = this.frameRect()
    ctx.imageSmoothingQuality = TIER === 'sd' ? (this.motion ? 'low' : 'medium') : this.motion ? 'medium' : 'high'
    let drew = false
    for (const l of this.layers) {
      if (l.alpha <= 0.001) continue
      ctx.globalAlpha = l.alpha
      if (l.img) {
        const r = l.noZoom ? r0 : rz
        ctx.drawImage(l.img, r.left, r.top, r.w, r.h)
        drew = true
      } else if (l === this.layers[0]) this.drawPlaceholder(ctx)
    }
    ctx.globalAlpha = 1
    if (!drew && this.layers[0].img === null) this.drawPlaceholder(ctx)
    if (this.veil > 0.001) {
      ctx.fillStyle = `rgba(11,10,16,${this.veil})`
      ctx.fillRect(0, 0, this.W, this.H)
    }
  }

  private drawPlaceholder(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, 0, 0, this.H)
    g.addColorStop(0, '#3a2350')
    g.addColorStop(0.55, '#7a3f52')
    g.addColorStop(1, '#0b0a10')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.W, this.H)
    ctx.fillStyle = 'rgba(239,224,198,0.55)'
    ctx.font = '500 11px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(this.placeholder.toUpperCase().split('').join(' '), this.W / 2, this.H / 2)
  }
}

export const renderer = new Renderer()
;(window as unknown as { __renderer: Renderer }).__renderer = renderer
