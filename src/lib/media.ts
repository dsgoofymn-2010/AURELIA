/**
 * Media registry + loader.
 *
 * public/media/manifest.json is written by tools/build-media.py and lists what
 * has actually been rendered, so the site degrades to still-to-still crossfades
 * for any film that is missing.
 *
 * Stills are WebP images. Camera moves are short H.264 films (one file per
 * direction, see build-media.py): they are fetched whole into memory as a Blob,
 * so playback never waits on the network and "back" can start instantly.
 */
import type { RoomId } from '../data/site'
import { TIER } from './tier'

export interface Manifest {
  hero: string[] // 'all', 'f01'…
  stills: string[] // 'dollhouse', 'living'…
  /** 'lift', 'rooftop', 'rooms/living' → file stem + length */
  films: Record<string, { file: string; frames: number; fps: number }>
  tiers?: string[]
  ext: string
}

const BASE = './media/'
let manifest: Manifest = { hero: [], stills: [], films: {}, ext: 'webp' }

export async function loadManifest() {
  try {
    const r = await fetch(`${BASE}manifest.json`, { cache: 'no-cache' })
    if (r.ok) manifest = { ...manifest, ...(await r.json()) }
  } catch {
    /* keep empty manifest → fallbacks */
  }
  return manifest
}

export const getManifest = () => manifest
export const heroUrl = (k: string) => (manifest.hero.includes(k) ? `${BASE}hero/${k}.${manifest.ext}` : null)
export const stillUrl = (k: string) => (manifest.stills.includes(k) ? `${BASE}stills/${k}.${manifest.ext}` : null)
export const roomSeq = (r: RoomId) => `rooms/${r}`
export const hasFilm = (name: string) => name in manifest.films
/** end frame of a film as an image: what the site dissolves through while the film starts */
export const filmFrameUrl = (name: string, end: 'first' | 'last') => (hasFilm(name) ? `${BASE}film/${manifest.films[name].file}.${end}.${manifest.ext}` : null)
const filmUrl = (name: string, reverse: boolean) => {
  const tier = manifest.tiers?.includes(TIER) ? TIER : (manifest.tiers?.[0] ?? 'hd')
  return `${BASE}film/${manifest.films[name].file}.${tier}${reverse ? '.rev' : ''}.mp4`
}

/* ---------------- image cache with a small priority queue ---------------- */

type Job = { url: string; prio: number; resolve: (i: HTMLImageElement | null) => void }
const cache = new Map<string, Promise<HTMLImageElement | null>>()
const queue: Job[] = []
let active = 0
const MAX = 4

function pump() {
  while (active < MAX && queue.length) {
    queue.sort((a, b) => b.prio - a.prio)
    const job = queue.shift()!
    active++
    const img = new Image()
    img.decoding = 'async'
    img.src = job.url
    img
      .decode()
      .then(() => job.resolve(img))
      .catch(() => job.resolve(null))
      .finally(() => {
        active--
        pump()
      })
  }
}

export function loadImage(url: string | null, prio = 0): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  const hit = cache.get(url)
  if (hit) {
    // bump priority of a queued job
    const q = queue.find((j) => j.url === url)
    if (q) q.prio = Math.max(q.prio, prio)
    return hit
  }
  const p = new Promise<HTMLImageElement | null>((resolve) => queue.push({ url, prio, resolve }))
  cache.set(url, p)
  pump()
  return p
}

/* ---------------- films ---------------- */

export interface Film {
  name: string
  reverse: boolean
  /** download progress 0..1 */
  progress: number
  /** object URL of the downloaded film, null until it has arrived */
  src: string | null
  /** resolves true once `src` is set, false if the film could not be fetched */
  ready: Promise<boolean>
}

const films = new Map<string, Film>()

async function download(film: Film, url: string, urgent: boolean): Promise<boolean> {
  try {
    const res = await fetch(url, { priority: urgent ? 'high' : 'low' } as RequestInit)
    if (!res.ok) return false
    const total = Number(res.headers.get('content-length')) || 0
    let blob: Blob
    if (res.body && total) {
      const reader = res.body.getReader()
      const parts: BlobPart[] = []
      let got = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        parts.push(value)
        got += value.byteLength
        film.progress = Math.min(0.99, got / total)
      }
      blob = new Blob(parts, { type: 'video/mp4' })
    } else blob = await res.blob()
    film.src = URL.createObjectURL(blob)
    film.progress = 1
    return true
  } catch {
    return false
  }
}

/** start (or join) the download of a film. `urgent`: the visitor is waiting for it */
export function loadFilm(name: string, reverse = false, urgent = false): Film | null {
  if (!hasFilm(name)) return null
  const key = `${name}${reverse ? ':rev' : ''}`
  const have = films.get(key)
  if (have) return have
  const film: Film = { name, reverse, progress: 0, src: null, ready: Promise.resolve(false) }
  film.ready = download(film, filmUrl(name, reverse), urgent)
  // a failed download is forgotten so the next visit to this shot retries it
  film.ready.then((ok) => !ok && films.delete(key))
  films.set(key, film)
  return film
}

/** any film that has already been downloaded */
export const anyLoadedFilm = () => [...films.values()].find((f) => f.src) ?? null

/** warm a film and its end frames in the background */
export function preloadFilm(name: string, reverse = false) {
  loadFilm(name, reverse)
  loadImage(filmFrameUrl(name, reverse ? 'last' : 'first'), 1)
}
