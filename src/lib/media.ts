/**
 * Media registry + loader for the pre-rendered frames.
 *
 * public/media/manifest.json is written by tools/build-media.py and lists what
 * has actually been rendered, so the site degrades to still-to-still crossfades
 * for any sequence that is missing.
 */
import type { RoomId } from '../data/site'

export interface Manifest {
  hero: string[] // 'all', 'f01'…
  stills: string[] // 'dollhouse', 'living'…
  seq: Record<string, number> // 'lift': 100, 'rooftop': 72, 'rooms/living': 36
  /** clean frame ranges (1-based, inclusive); frames outside them are not shipped */
  segs?: Record<string, [number, number][]>
  ext: string
}

const BASE = './media/'
let manifest: Manifest = { hero: [], stills: [], seq: {}, ext: 'webp' }

export async function loadManifest() {
  try {
    const r = await fetch(`${BASE}manifest.json`, { cache: 'no-cache' })
    if (r.ok) manifest = await r.json()
  } catch {
    /* keep empty manifest → fallbacks */
  }
  return manifest
}

export const getManifest = () => manifest
export const heroUrl = (k: string) => (manifest.hero.includes(k) ? `${BASE}hero/${k}.${manifest.ext}` : null)
export const stillUrl = (k: string) => (manifest.stills.includes(k) ? `${BASE}stills/${k}.${manifest.ext}` : null)
export const seqLength = (name: string) => manifest.seq[name] ?? 0
export const segments = (name: string): [number, number][] => manifest.segs?.[name] ?? (seqLength(name) ? [[1, seqLength(name)]] : [])
const frameList = (name: string) => segments(name).flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, k) => a + k))
export const roomSeq = (r: RoomId) => `rooms/${r}`
const frameUrl = (name: string, i: number) => `${BASE}${name}/${String(i).padStart(4, '0')}.${manifest.ext}`

/* ---------------- image cache with a small priority queue ---------------- */

type Job = { url: string; prio: number; resolve: (i: HTMLImageElement | null) => void }
const cache = new Map<string, Promise<HTMLImageElement | null>>()
const done = new Map<string, HTMLImageElement>()
const queue: Job[] = []
let active = 0
const MAX = 6

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
      .then(() => {
        done.set(job.url, img)
        job.resolve(img)
      })
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

export const getLoaded = (url: string | null) => (url ? done.get(url) ?? null : null)

/* ---------------- sequences ---------------- */

export interface Sequence {
  name: string
  length: number
  frames: (HTMLImageElement | null)[]
  /** number of shipped frames */
  total: number
  loaded: number
  /** frames that will never arrive (404 or decode failure) */
  failed: number
  ready: Promise<void>
}

const seqs = new Map<string, Sequence>()
const listeners = new Set<() => void>()
export const onSeqProgress = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function loadSequence(name: string, prio = 0): Sequence | null {
  const length = seqLength(name)
  if (!length) return null
  const have = seqs.get(name)
  const list = frameList(name)
  if (have) {
    if (prio > 0) for (const i of list) loadImage(frameUrl(name, i), prio + (length - i) / length)
    return have
  }
  const s: Sequence = { name, length, total: list.length, frames: new Array(length).fill(null), loaded: 0, failed: 0, ready: Promise.resolve() }
  const all: Promise<unknown>[] = []
  for (const i of list) {
    // earlier frames first so playback can start before the tail arrives
    all.push(
      loadImage(frameUrl(name, i), prio + (length - i) / length).then((img) => {
        s.frames[i - 1] = img
        if (img) s.loaded++
        else s.failed++
        listeners.forEach((l) => l())
      }),
    )
  }
  s.ready = Promise.all(all).then(() => undefined)
  seqs.set(name, s)
  return s
}

export const getSequence = (name: string) => seqs.get(name) ?? null
