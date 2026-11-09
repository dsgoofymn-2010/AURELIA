/**
 * Plays pre-rendered image sequences on the shared canvas.
 * Time-based (drops frames rather than slowing down), waits for a frame that
 * has not arrived yet, and dissolves across gaps between clean segments.
 */
import { getSequence, loadImage, loadSequence, segments, type Sequence } from './media'
import { renderer } from './renderer'
import { store } from '../store'

let token = 0
/** cancel whatever is playing (the next play call does this implicitly) */
export const cancelPlayback = () => ++token

async function frameAt(seq: Sequence, i: number) {
  const have = seq.frames[i - 1]
  if (have) return have
  await seq.ready
  return seq.frames[i - 1]
}

/** wait until enough of a sequence is buffered to play it through smoothly */
export async function buffer(name: string, need = 0.85) {
  const seq = loadSequence(name, 10)
  if (!seq) return null
  if (seq.loaded / seq.total >= need) return seq
  store.set({ waiting: seq.loaded / seq.total })
  await new Promise<void>((resolve) => {
    const id = setInterval(() => {
      const p = seq.loaded / seq.total
      store.set({ waiting: p })
      if (p >= need) {
        clearInterval(id)
        resolve()
      }
    }, 120)
  })
  store.set({ waiting: null })
  return seq
}

export const firstFrame = async (name: string) => {
  const s = segments(name)
  const seq = getSequence(name) ?? loadSequence(name, 10)
  return s.length && seq ? frameAt(seq, s[0][0]) : null
}
export const lastFrame = async (name: string) => {
  const s = segments(name)
  const seq = getSequence(name) ?? loadSequence(name, 10)
  return s.length && seq ? frameAt(seq, s[s.length - 1][1]) : null
}

function run(seq: Sequence, from: number, to: number, fps: number, my: number) {
  const dir = to >= from ? 1 : -1
  const count = Math.abs(to - from) + 1
  return new Promise<boolean>((resolve) => {
    let start = performance.now()
    let shown = -1
    let stalled = false
    const tick = (now: number) => {
      if (my !== token) return resolve(false)
      const k = Math.min(count - 1, Math.floor(((now - start) / 1000) * fps))
      const i = from + dir * k
      const img = seq.frames[i - 1]
      if (!img) {
        // frame not here yet: hold the clock until it arrives
        if (!stalled) {
          stalled = true
          const t0 = now
          frameAt(seq, i).then(() => {
            start += performance.now() - t0
            stalled = false
            requestAnimationFrame(tick)
          })
        }
        return
      }
      if (k !== shown) {
        renderer.setBase(img)
        shown = k
      }
      if (k >= count - 1) return resolve(true)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/**
 * Play a whole sequence forward or backward across its clean segments.
 * Resolves true when finished, false if cancelled.
 */
export async function play(name: string, { reverse = false, fps = 24 } = {}) {
  const my = ++token
  const seq = getSequence(name) ?? loadSequence(name, 10)
  if (!seq) return true
  let segs = segments(name).map(([a, b]) => (reverse ? [b, a] : [a, b]) as [number, number])
  if (reverse) segs = segs.reverse()
  for (let s = 0; s < segs.length; s++) {
    const [a, b] = segs[s]
    if (s > 0) {
      // dissolve across the cut where the camera passed through a wall
      const img = await frameAt(seq, a)
      if (my !== token) return false
      await renderer.crossfade(img, 0.32)
    }
    const ok = await run(seq, a, b, fps, my)
    if (!ok) return false
  }
  return true
}

export const preloadImage = (url: string | null, prio = 0) => loadImage(url, prio)
