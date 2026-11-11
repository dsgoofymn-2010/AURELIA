/**
 * Plays the pre-rendered films on the shared canvas.
 *
 * One hidden <video> element decodes every film (hardware-decoded on phones) and
 * the renderer draws its current frame, so crossfades, the veil and the zoom all
 * keep working exactly as they do for stills. "Reverse" plays the reversed file.
 */
import { anyLoadedFilm, filmFrameUrl, hasFilm, loadFilm, loadImage, type Film } from './media'
import { renderer } from './renderer'
import { store } from '../store'

let token = 0
/** cancel whatever is playing (the next play call does this implicitly) */
export const cancelPlayback = () => {
  token++
  video?.pause()
}

let video: HTMLVideoElement | null = null
function getVideo() {
  if (video) return video
  const v = document.createElement('video')
  v.muted = true
  v.defaultMuted = true
  v.playsInline = true
  v.preload = 'auto'
  v.setAttribute('muted', '')
  v.setAttribute('playsinline', '')
  v.setAttribute('webkit-playsinline', '')
  v.disableRemotePlayback = true
  video = v
  return v
}

/**
 * Phones in a power-saving mode only let a video start from inside a tap. Starting
 * the shared element once during the visitor's first tap keeps it allowed afterwards.
 */
export function unlockPlayback() {
  const v = getVideo()
  if (v.dataset.unlocked || !v.paused) return
  if (!v.src) {
    const film = anyLoadedFilm()
    if (!film?.src) return // nothing to start yet: try again on the next tap
    v.src = film.src
  }
  v.dataset.unlocked = '1'
  v.play()
    .then(() => v.pause())
    .catch(() => delete v.dataset.unlocked)
}

/**
 * Wait until a film is downloaded. Shows the "Preparing film" progress while the
 * visitor waits. Resolves null when the film is missing, failed, or took longer than
 * `maxWait` ms — the caller then falls back to a crossfade.
 */
export async function buffer(name: string, { reverse = false, maxWait = 20000 } = {}): Promise<Film | null> {
  const film = loadFilm(name, reverse, true)
  if (!film) return null
  if (film.src) return film
  store.set({ waiting: film.progress })
  const id = setInterval(() => store.set({ waiting: film.progress }), 120)
  const ok = await Promise.race([film.ready, new Promise<boolean>((r) => setTimeout(() => r(false), maxWait))])
  clearInterval(id)
  store.set({ waiting: null })
  return ok ? film : null
}

export const firstFrame = (name: string) => loadImage(filmFrameUrl(name, 'first'), 10)
export const lastFrame = (name: string) => loadImage(filmFrameUrl(name, 'last'), 10)

const once = (v: HTMLVideoElement, ok: string, ms: number) =>
  new Promise<boolean>((resolve) => {
    const done = (r: boolean) => {
      clearTimeout(t)
      v.removeEventListener(ok, yes)
      v.removeEventListener('error', no)
      resolve(r)
    }
    const yes = () => done(true)
    const no = () => done(false)
    const t = setTimeout(no, ms)
    v.addEventListener(ok, yes)
    v.addEventListener('error', no)
  })

/**
 * Play a film forward or backward. `fps` above the film's own rate plays it faster.
 * Resolves true when finished (or when it could not be played, so the caller carries
 * on to its closing still), false if cancelled.
 */
export async function play(name: string, { reverse = false, fps = 24 } = {}) {
  const my = ++token
  if (!hasFilm(name)) return true
  const film = loadFilm(name, reverse, true)
  if (!film || !(await film.ready) || !film.src) return true
  if (my !== token) return false

  const v = getVideo()
  // the element is about to change film: never leave it on screen while it does
  if (renderer.base.img === v) renderer.setBase(await loadImage(filmFrameUrl(name, reverse ? 'last' : 'first'), 10))
  if (my !== token) return false
  v.src = film.src
  v.defaultPlaybackRate = v.playbackRate = fps / 24
  if (v.readyState < 2 && !(await once(v, 'loadeddata', 4000))) return true
  if (my !== token) return false
  try {
    await v.play()
  } catch {
    return true // autoplay refused: skip the film
  }
  v.dataset.unlocked = '1'

  // a full-screen rescale every frame is the cost here; stills get full quality back after
  renderer.motion = true
  try {
    return await new Promise<boolean>((resolve) => {
      let live = true
      const finish = (ok: boolean) => {
        if (!live) return
        live = false
        v.removeEventListener('ended', onEnd)
        v.removeEventListener('error', onEnd)
        resolve(ok)
      }
      const onEnd = () => {
        renderer.request()
        finish(my === token)
      }
      const frame = () => {
        if (!live) return
        if (my !== token) {
          v.pause()
          return finish(false)
        }
        // the first decoded frame is on hand: the canvas can switch from the still to the film
        if (renderer.base.img !== v) renderer.setBase(v)
        else renderer.request()
        if (!v.ended) next()
      }
      const next = () => ('requestVideoFrameCallback' in v ? v.requestVideoFrameCallback(frame) : requestAnimationFrame(frame))
      v.addEventListener('ended', onEnd)
      v.addEventListener('error', onEnd)
      next()
    })
  } finally {
    // a newer playback owns the setting now, so only the current one restores it
    if (my === token) renderer.motion = false
  }
}
