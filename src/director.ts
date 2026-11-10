/**
 * The cinematic state machine: every transition between hero, residence
 * (dollhouse), rooms and the rooftop is an async "shot" built from the
 * pre-rendered stills and sequences.
 */
import { FLOORS, HERO_FOCUS, ROOMS, type RoomId } from './data/site'
import { heroUrl, loadFilm, loadImage, preloadFilm, roomSeq, stillUrl } from './lib/media'
import { buffer, cancelPlayback, firstFrame, lastFrame, play } from './lib/player'
import { renderer, type Frame, type Pt } from './lib/renderer'
import { LITE } from './lib/tier'
import { prefersReducedMotion } from './hooks/useReducedMotion'
import { store, type Mode } from './store'

/** hero zoom that matches the first frame of each sequence (found by image registration) */
const LIFT_ZOOM = { s: 2.3, u: 0.46, v: 0.43, pan: 0 }
const ROOF_ZOOM = { s: 1.1, u: 0.44, v: 0.88, pan: 0 }
const CENTER: Pt = [0.5, 0.5]
/** going back never keeps the visitor waiting long: past this, the shot becomes a crossfade */
const BACK = { reverse: true, maxWait: 1500 }

let busy = false
const reduced = () => prefersReducedMotion()
const img = (url: string | null, prio = 5) => loadImage(url, prio)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function shot(mode: Mode, fn: () => Promise<void>) {
  if (busy) return
  busy = true
  store.set({ mode: 'transition', panel: null, caption: null })
  try {
    await fn()
  } finally {
    busy = false
    store.set({ mode, waiting: null })
  }
}

/** dissolve into `next` while it is drawn under the zoom of the old frame (reverse of a zoom-in) */
async function dissolveZoomed(next: Frame | null, z: typeof LIFT_ZOOM, dur = 0.45) {
  renderer.base.noZoom = true
  renderer.setZoom(z)
  await renderer.crossfade(next, dur)
  renderer.base.noZoom = false
}

/* ------------------------------------------------------------ boot */

export async function boot(onProgress: (p: number) => void) {
  // only the tower itself holds up the first paint; everything else arrives behind it
  const critical = [heroUrl('all')]
  let done = 0
  await Promise.all(
    critical.map((u) =>
      img(u, 20).then(() => {
        done++
        onProgress(done / critical.length)
      }),
    ),
  )
  return true
}

export async function intro() {
  renderer.setFocus(HERO_FOCUS)
  renderer.clearLayers()
  renderer.setBase(await img(heroUrl('all')))
  if (reduced()) {
    store.set({ mode: 'hero' })
    warmHero()
    return
  }
  renderer.setZoom({ s: 1.08, u: 0.48, v: 0.5, pan: 0 })
  store.set({ mode: 'hero' })
  // the lift is the first shot a visitor can trigger: fetch it while the hero settles
  if (!LITE) preloadFilm('lift')
  await renderer.tweenZoom({ s: 1 }, 2.8, 'power3.out')
  warmHero()
}

/** background loading once the tower is on screen: floor lighting, then the next likely shots */
async function warmHero() {
  if (LITE) return
  for (const f of FLOORS) await img(heroUrl(f.key), 1)
  img(stillUrl('dollhouse'), 1)
  if (reduced()) return
  preloadFilm('lift')
  preloadFilm('rooftop')
}

/** inside a residence: fetch the room fly-ins one at a time, and the way back out */
async function warmResidence() {
  if (LITE || reduced()) return
  preloadFilm('lift', true)
  for (const r of ROOMS) await loadFilm(roomSeq(r.id))?.ready
}

/* ------------------------------------------------------------ hero hover */

let hoverKey: string | null = null
export async function hoverZone(key: string | null) {
  if (store.get().mode !== 'hero') return
  store.set({ hover: key })
  hoverKey = key
  const lit = key && key.startsWith('f') ? key : null
  if (lit) {
    const im = await img(heroUrl(lit), 15)
    if (hoverKey !== key) return
    renderer.layer(lit, im)
  }
  for (const f of FLOORS) {
    if (f.key === lit) renderer.fadeLayer(f.key, 1, 0.5)
    else if (renderer.layers.some((l) => l.key === f.key)) renderer.fadeLayer(f.key, 0, 0.6)
  }
  if (reduced()) return
  if (lit) preloadFilm('lift')
  if (key === 'rooftop') preloadFilm('rooftop')
}

/* ------------------------------------------------------------ residence */

export function openFloor(n: number) {
  return shot('dollhouse', async () => {
    store.set({ floor: n, room: null })
    const key = FLOORS[n - 1].key
    // keep only the chosen floor lit while we dive in
    renderer.layer(key, await img(heroUrl(key), 15))
    for (const f of FLOORS) renderer.fadeLayer(f.key, f.key === key ? 1 : 0, 0.35)
    store.set({ hover: null })
    const doll = await img(stillUrl('dollhouse'), 15)
    if (reduced() || !(await buffer('lift'))) {
      renderer.setFocus(CENTER)
      await renderer.crossfade(doll, 0.6, true)
      return
    }
    const first = await firstFrame('lift')
    // the way back out downloads while the lift plays
    if (!LITE) preloadFilm('lift', true)
    // the hero and the lift are separate renders, so let the zoom settle first and
    // swap under a veil dip: the dissolve runs between two static frames, and the
    // veil covers the jump in sky and exposure that no zoom can register away
    await renderer.tweenZoom(LIFT_ZOOM, 1.25, 'power2.in')
    await tweenVeil(0.85, 0.3)
    renderer.setFocus(CENTER)
    await renderer.crossfade(first, 0.25, true)
    await tweenVeil(0, 0.45)
    await play('lift', { fps: 24 })
    await renderer.crossfade(doll, 0.5)
    warmResidence()
  })
}

export function closeFloor() {
  return shot('hero', async () => {
    cancelPlayback()
    store.set({ room: null })
    const hero = await img(heroUrl('all'))
    if (!reduced() && (await buffer('lift', BACK))) {
      await renderer.crossfade(await lastFrame('lift'), 0.3)
      await play('lift', { reverse: true, fps: 36 })
      renderer.setFocus(HERO_FOCUS)
      await dissolveZoomed(hero, LIFT_ZOOM, 0.5)
      await renderer.tweenZoom({ s: 1 }, 1.1, 'power2.out')
    } else {
      renderer.setFocus(HERO_FOCUS)
      await renderer.crossfade(hero, 0.6)
    }
  })
}

/** jump to another level from inside the residence (all levels share the typical plan) */
export function switchFloor(n: number) {
  if (n < 1 || n > FLOORS.length) return
  return shot('dollhouse', async () => {
    await tweenVeil(1, 0.35)
    store.set({ floor: n, caption: FLOORS[n - 1].label })
    await wait(350)
    await tweenVeil(0, 0.5)
  })
}

function tweenVeil(to: number, dur: number) {
  return new Promise<void>((resolve) => {
    const from = renderer.veil
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / (dur * 1000))
      renderer.veil = from + (to - from) * k
      renderer.request()
      if (k < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

/* ------------------------------------------------------------ rooms */

async function flyIn(r: RoomId) {
  const still = await img(stillUrl(r), 15)
  renderer.setFocus(CENTER)
  const name = roomSeq(r)
  if (!reduced() && (await buffer(name))) {
    await renderer.crossfade(await firstFrame(name), 0.25)
    await play(name, { fps: 24 })
    if (!LITE) preloadFilm(name, true)
  }
  await renderer.crossfade(still, reduced() ? 0.6 : 0.45)
}

async function flyOut(r: RoomId, fast = false) {
  const name = roomSeq(r)
  renderer.setFocus(CENTER)
  if (!reduced() && (await buffer(name, BACK))) {
    await renderer.crossfade(await lastFrame(name), 0.25)
    await play(name, { reverse: true, fps: fast ? 44 : 32 })
  }
  await renderer.crossfade(await img(stillUrl('dollhouse')), fast ? 0.25 : 0.4)
}

export function openRoom(r: RoomId) {
  const cur = store.get()
  if (cur.mode === 'room' && cur.room === r) return
  return shot('room', async () => {
    if (cur.mode === 'room' && cur.room) await flyOut(cur.room, true)
    store.set({ room: r })
    await flyIn(r)
  })
}

export function closeRoom() {
  const r = store.get().room
  if (!r) return
  return shot('dollhouse', async () => {
    await flyOut(r)
    store.set({ room: null })
  })
}

export function stepRoom(d: 1 | -1) {
  const r = store.get().room
  const i = ROOMS.findIndex((x) => x.id === r)
  const next = ROOMS[(i + d + ROOMS.length) % ROOMS.length]
  return openRoom(next.id)
}

/* ------------------------------------------------------------ rooftop */

export function openRooftop() {
  return shot('rooftop', async () => {
    store.set({ hover: null })
    for (const f of FLOORS) if (renderer.layers.some((l) => l.key === f.key)) renderer.fadeLayer(f.key, 0, 0.4)
    const still = await img(stillUrl('rooftop'), 15)
    if (reduced() || !(await buffer('rooftop'))) {
      await renderer.crossfade(still, 0.6, true)
      return
    }
    await renderer.tweenZoom(ROOF_ZOOM, 0.7, 'power2.inOut')
    await renderer.crossfade(await firstFrame('rooftop'), 0.4, true)
    renderer.setFocus([0.5, 0.45])
    await play('rooftop', { fps: 24 })
    await renderer.crossfade(still, 0.5)
    if (!LITE) preloadFilm('rooftop', true)
  })
}

export function closeRooftop() {
  return shot('hero', async () => {
    const hero = await img(heroUrl('all'))
    if (!reduced() && (await buffer('rooftop', BACK))) {
      await renderer.crossfade(await lastFrame('rooftop'), 0.3)
      await play('rooftop', { reverse: true, fps: 36 })
      renderer.setFocus(HERO_FOCUS)
      await dissolveZoomed(hero, ROOF_ZOOM, 0.4)
      await renderer.tweenZoom({ s: 1 }, 0.8, 'power2.out')
    } else {
      renderer.setFocus(HERO_FOCUS)
      await renderer.crossfade(hero, 0.6)
    }
  })
}

/* ------------------------------------------------------------ global back */

export function back() {
  const s = store.get()
  if (s.panel) return store.set({ panel: null })
  if (s.mode === 'room') return closeRoom()
  if (s.mode === 'dollhouse') return closeFloor()
  if (s.mode === 'rooftop') return closeRooftop()
}

export function goHome() {
  const s = store.get()
  if (s.mode === 'room') return closeRoom()?.then(() => closeFloor())
  return back()
}

export const isBusy = () => busy
