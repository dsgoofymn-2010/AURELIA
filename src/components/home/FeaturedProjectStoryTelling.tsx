// FeaturedProjectStoryTelling.tsx
// The second page: a carousel of featured projects. Each slide has a short film of
// the building going up (left) and its story (right). The film plays when its slide
// becomes the current one and holds on the finished building.
//
// Built to stay smooth on weak phones: the slides are a native scroll-snap track
// (swipe is handled by the browser, not by script), a film is only fetched when its
// slide is shown, and only one film ever plays at a time.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { PROJECTS, SITE, type Project } from '../../data/site'
import { prefersReducedMotion } from '../../hooks/useReducedMotion'
import { LITE } from '../../lib/tier'
import './FeaturedProjectStoryTelling.css'

type FilmState = 'idle' | 'playing' | 'done'

const filmUrl = (p: Project) => `./media/projects/${p.id}.mp4`
const stillUrl = (p: Project) => `./media/projects/${p.id}.webp`
const pad = (n: number) => String(n).padStart(2, '0')

export function FeaturedProjectStoryTelling() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLElement | null)[]>([])
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [inView, setInView] = useState(false)
  const [states, setStates] = useState<FilmState[]>(() => PROJECTS.map(() => 'idle'))
  /** films wait for a tap on slow connections, with reduced motion, or once the browser has refused autoplay */
  const [manual, setManual] = useState(() => LITE || prefersReducedMotion())

  const setState = useCallback((i: number, s: FilmState) => setStates((prev) => (prev[i] === s ? prev : prev.map((x, k) => (k === i ? s : x)))), [])

  const start = useCallback(
    (i: number) => {
      const v = videos.current[i]
      if (!v) return
      v.currentTime = 0
      v.play().catch(() => {
        // autoplay refused (power saving): show the finished building and a play button instead
        setManual(true)
        setState(i, 'idle')
      })
    },
    [setState],
  )

  // is the page on screen?
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // which slide is the current one?
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(slides.current.indexOf(e.target as HTMLElement))
      },
      { root: track.current, threshold: 0.6 },
    )
    slides.current.forEach((s) => s && io.observe(s))
    return () => io.disconnect()
  }, [])

  // play the current film, stop the rest
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return
      if (i === active && inView) {
        if (!manual) start(i)
      } else {
        v.pause()
        setState(i, 'idle')
      }
    })
  }, [active, inView, manual, start, setState])

  const go = (i: number) => {
    const n = (i + PROJECTS.length) % PROJECTS.length
    const el = slides.current[n]
    if (el) track.current?.scrollTo({ left: el.offsetLeft, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <section ref={section} id="projects" className="fp" aria-labelledby="fp-title">
      <div className="mx-auto flex min-h-dvh max-w-[1240px] flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top,0px))] sm:px-10 lg:px-14">
        {/* page header */}
        <div className="flex items-center justify-between">
          <div className="font-display text-xl font-light tracking-[0.42em] text-ink">{SITE.brand}</div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
            className="rounded-full border border-ink/20 px-4 py-2 text-[10px] uppercase tracking-[0.26em] text-ink transition hover:border-ink/60"
          >
            ↑ The tower
          </button>
        </div>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/15 pb-4 md:mt-6 md:pb-5">
          <div>
            <div className="text-[10px] uppercase tracking-luxe text-bronze">Featured projects</div>
            <h2 id="fp-title" className="mt-2 font-display text-[34px] font-light leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
              From first pour to <em className="text-bronze">final light.</em>
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm leading-relaxed text-graphite md:block">Four buildings, each shown rising from bare structure to the day it opens.</p>
        </header>

        {/* slides */}
        <div
          ref={track}
          className="fp-track mt-4 flex-1"
          role="group"
          aria-roledescription="carousel"
          aria-label="Featured projects"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(active + 1)
            else if (e.key === 'ArrowLeft') go(active - 1)
          }}
        >
          {PROJECTS.map((p, i) => {
            const state = states[i]
            const on = i === active
            return (
              <article
                key={p.id}
                ref={(el) => {
                  slides.current[i] = el
                }}
                className="fp-slide grid content-center items-center gap-x-14 gap-y-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
                data-active={on}
                data-state={state}
                style={{ '--dur': '2.96s' } as CSSProperties}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${PROJECTS.length}: ${p.name}`}
                aria-hidden={!on}
              >
                {/* the film */}
                <div className="fp-film mx-auto h-[38dvh] md:h-[min(56dvh,600px)]">
                  <video
                    ref={(el) => {
                      videos.current[i] = el
                    }}
                    src={filmUrl(p)}
                    muted
                    playsInline
                    preload="none"
                    disableRemotePlayback
                    aria-label={`${p.name} under construction`}
                    onPlaying={() => setState(i, 'playing')}
                    onEnded={() => setState(i, 'done')}
                  />
                  {/* nothing has played yet and nothing will on its own: show the finished building */}
                  {manual && state === 'idle' && <img src={stillUrl(p)} alt={`${p.name}, completed`} loading="lazy" decoding="async" />}
                </div>

                {/* the story */}
                <div className="min-w-0 pb-2 md:pb-0">
                  <div className="fp-rise flex items-center gap-4 text-[10px] uppercase tracking-luxe text-bronze" style={{ '--i': 0 } as CSSProperties}>
                    <span className="tabular-nums">
                      {pad(i + 1)} / {pad(PROJECTS.length)}
                    </span>
                    <span className="h-px w-10 bg-bronze/50" />
                    <span>{p.kind}</span>
                  </div>
                  <h3 className="fp-rise mt-3 font-display text-4xl font-light leading-none text-ink sm:text-5xl lg:text-6xl" style={{ '--i': 1 } as CSSProperties}>
                    {p.name}
                  </h3>
                  <p className="fp-rise mt-4 max-w-md text-sm leading-relaxed text-graphite md:text-[15px]" style={{ '--i': 2 } as CSSProperties}>
                    {p.blurb}
                  </p>

                  <ol className="fp-rise mt-5 max-w-md border-t border-ink/15 md:mt-7" style={{ '--i': 3 } as CSSProperties}>
                    {p.stages.map((s, b) => (
                      <li key={s} className="fp-beat flex items-baseline gap-4 border-b border-ink/15 py-2.5" style={{ '--b': b } as CSSProperties}>
                        <span className="text-[9px] tabular-nums tracking-[0.3em] text-bronze">{pad(b + 1)}</span>
                        <span className="font-display text-lg leading-tight text-ink md:text-xl">{s}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="fp-rise mt-5 flex max-w-md items-center gap-4" style={{ '--i': 4 } as CSSProperties}>
                    <span className="relative h-px flex-1 overflow-hidden bg-ink/15">
                      <span className="fp-progress absolute inset-0 bg-bronze" />
                    </span>
                    <button
                      onClick={() => start(i)}
                      disabled={state === 'playing'}
                      tabIndex={on ? 0 : -1}
                      className="rounded-full border border-ink/25 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-ink transition hover:border-ink/70 disabled:border-transparent disabled:text-graphite"
                    >
                      {state === 'playing' ? 'Building…' : state === 'done' ? 'Replay' : 'Play film'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* project picker */}
        <nav className="mt-4 flex items-center gap-3 border-t border-ink/15 pt-4" aria-label="Choose a project">
          <div className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {PROJECTS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => go(i)}
                aria-current={i === active ? 'true' : undefined}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] transition ${i === active ? 'border-ink bg-ink text-champagne-soft' : 'border-ink/20 text-ink hover:border-ink/60'}`}
              >
                <span className="tabular-nums opacity-60">{pad(i + 1)}</span> {p.name.replace(/^The /, '')}
              </button>
            ))}
          </div>
          <button onClick={() => go(active - 1)} aria-label="Previous project" className="h-11 w-11 shrink-0 rounded-full border border-ink/25 text-lg text-ink transition hover:border-ink/70">
            ←
          </button>
          <button onClick={() => go(active + 1)} aria-label="Next project" className="h-11 w-11 shrink-0 rounded-full border border-ink/25 text-lg text-ink transition hover:border-ink/70">
            →
          </button>
        </nav>
      </div>
    </section>
  )
}

export default FeaturedProjectStoryTelling
