'use client'
// ProjectCarousel.tsx
// A carousel of projects: each slide is a ProjectGallery (the building going up) beside
// its ProjectDetails (the story). The current slide's film plays and holds on the
// finished building.
//
// Shared by the home page's featured projects (ending in a "See more" slide) and each
// project's own page, where every project is in the track.
//
// Built to stay smooth on weak phones: the slides are a native scroll-snap track
// (swipe is handled by the browser, not by script), a film is only fetched when its
// slide is shown, and only one film ever plays at a time.

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { prefersReducedMotion } from '@/lib/reducedMotion'
import { LITE } from '@/lib/tier'
import type { Project } from '@/types/project'
import { PageContainer } from '@/components/layout/PageContainer'
import { ProjectDetails } from './ProjectDetails'
import { ProjectGallery, type BuildState } from './ProjectGallery'
import './projects.css'

const pad = (n: number) => String(n).padStart(2, '0')
const rise = (i: number) => ({ '--i': i }) as CSSProperties
/** the length of the construction films, and of the reveal for projects without one */
const BUILD_MS = 2960
const noSubscribe = () => () => {}

interface Props {
  projects: Project[]
  /** slide to open on */
  initial?: number
  /** end the track with a "See more" slide leading to /projects; the number is how many there are */
  seeMore?: number
  /** the page header above the track */
  eyebrow: ReactNode
  title: ReactNode
  /** the heading level of the page title: h1 when the carousel is the page */
  titleAs?: 'h1' | 'h2'
  intro?: string
  /** top-right link of a page that has no site navigation bar (the home page) */
  corner?: ReactNode
  /** the page has the fixed site navigation bar: leave room for it */
  underNav?: boolean
  /** keep the address on the project in view (/projects/<id>), so a reload or a shared link reopens it */
  syncAddress?: boolean
}

export function ProjectCarousel({ projects, initial = 0, seeMore, eyebrow, title, titleAs: Title = 'h2', intro, corner, underNav = false, syncAddress = false }: Props) {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLElement | null)[]>([])
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const timers = useRef<number[]>([])
  const count = projects.length + (seeMore ? 1 : 0)
  const [active, setActive] = useState(initial)
  const [inView, setInView] = useState(false)
  const [states, setStates] = useState<BuildState[]>(() => projects.map(() => 'idle'))
  /** films wait for a tap on slow connections or with reduced motion (false on the server, which cannot know,
      so the first client render matches its HTML), and from then on once the browser has refused autoplay */
  const prefersStill = useSyncExternalStore(noSubscribe, () => LITE || prefersReducedMotion(), () => false)
  const [refused, setManual] = useState(false)
  const manual = prefersStill || refused

  const setState = useCallback((i: number, s: BuildState) => setStates((prev) => (prev[i] === s ? prev : prev.map((x, k) => (k === i ? s : x)))), [])

  const start = useCallback(
    (i: number) => {
      if (projects[i]?.noFilm) {
        // no film: the reveal steps through the same states on a timer
        clearTimeout(timers.current[i])
        setState(i, 'idle')
        requestAnimationFrame(() => setState(i, 'playing')) // next frame, so a replay restarts from the ground
        timers.current[i] = window.setTimeout(() => setState(i, 'done'), BUILD_MS + 40)
        return
      }
      const v = videos.current[i]
      if (!v) return
      v.currentTime = 0
      v.play().catch(() => {
        // autoplay refused (power saving): show the finished building and a play button instead
        setManual(true)
        setState(i, 'idle')
      })
    },
    [projects, setState],
  )

  // open on the asked-for slide, before the first paint
  useLayoutEffect(() => {
    const el = slides.current[initial]
    if (el && track.current) track.current.scrollLeft = el.offsetLeft - track.current.offsetLeft
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = projects[active]
    if (syncAddress && p && location.pathname !== `/projects/${p.id}`) history.replaceState(history.state, '', `/projects/${p.id}`)
  }, [active, syncAddress, projects])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // is the section on screen?
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

  // play the current slide, stop the rest
  useEffect(() => {
    projects.forEach((p, i) => {
      if (i === active && inView) {
        // an image reveal is cheap and downloads nothing, so it runs even where films wait for a tap
        if (!manual || p.noFilm) start(i)
      } else {
        videos.current[i]?.pause()
        clearTimeout(timers.current[i])
        setState(i, 'idle')
      }
    })
  }, [active, inView, manual, start, setState, projects])

  // keep the current project's chip in view in the picker
  useEffect(() => {
    const box = picker.current
    const chip = box?.children[active] as HTMLElement | undefined
    if (box && chip) box.scrollTo({ left: chip.offsetLeft - box.offsetLeft - (box.clientWidth - chip.clientWidth) / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [active])

  const go = (i: number) => {
    const el = slides.current[(i + count) % count]
    if (el && track.current) track.current.scrollTo({ left: el.offsetLeft - track.current.offsetLeft, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] transition ${on ? 'border-ink bg-ink text-champagne-soft' : 'border-ink/20 text-ink hover:border-ink/60'}`

  return (
    <section ref={section} id="projects" className="fp" aria-labelledby="fp-title">
      <PageContainer
        className={`flex min-h-dvh flex-col pb-[max(20px,env(safe-area-inset-bottom))] ${underNav ? 'pt-[calc(76px+env(safe-area-inset-top,0px))]' : 'pt-[calc(18px+env(safe-area-inset-top,0px))]'}`}
      >
        {corner}

        <header className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/15 pb-4 first:mt-0 md:mt-6 md:pb-5 md:first:mt-0">
          <div>
            <div className="text-[10px] uppercase tracking-luxe text-bronze">{eyebrow}</div>
            <Title id="fp-title" className="mt-2 font-display text-[34px] font-light leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
              {title}
            </Title>
          </div>
          {intro && <p className="hidden max-w-xs text-sm leading-relaxed text-graphite md:block">{intro}</p>}
        </header>

        <div
          ref={track}
          className="fp-track mt-4 flex-1"
          role="group"
          aria-roledescription="carousel"
          aria-label="Projects"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(active + 1)
            else if (e.key === 'ArrowLeft') go(active - 1)
          }}
        >
          {projects.map((p, i) => {
            const on = i === active
            return (
              <article
                key={p.id}
                ref={(el) => {
                  slides.current[i] = el
                }}
                className="fp-slide grid content-center items-center gap-x-14 gap-y-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
                data-active={on}
                data-state={states[i]}
                style={{ '--dur': `${BUILD_MS / 1000}s` } as CSSProperties}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${projects.length}: ${p.name}`}
                aria-hidden={!on}
              >
                <ProjectGallery
                  project={p}
                  eager={Math.abs(i - initial) < 2}
                  showStill={manual && states[i] === 'idle'}
                  videoRef={(el) => {
                    videos.current[i] = el
                  }}
                  onPlaying={() => setState(i, 'playing')}
                  onEnded={() => setState(i, 'done')}
                />
                <ProjectDetails project={p} index={i} total={projects.length} state={states[i]} current={on} onPlay={() => start(i)} />
              </article>
            )
          })}

          {/* after the last building: the way to all of them */}
          {seeMore && (
            <article
              ref={(el) => {
                slides.current[projects.length] = el
              }}
              className="fp-slide grid place-items-center"
              data-active={active === projects.length}
              aria-roledescription="slide"
              aria-label="See more projects"
              aria-hidden={active !== projects.length}
            >
              <Link href="/projects" tabIndex={active === projects.length ? 0 : -1} className="fp-more group">
                <span className="fp-rise text-[10px] uppercase tracking-luxe text-bronze" style={rise(0)}>
                  {pad(seeMore)} projects in all
                </span>
                <span className="fp-rise font-display text-7xl font-light leading-none text-ink sm:text-8xl lg:text-9xl" style={rise(1)}>
                  See <em className="text-bronze">more</em>
                </span>
                <span className="fp-rise max-w-sm text-sm leading-relaxed text-graphite md:text-[15px]" style={rise(2)}>
                  Homes, workplaces, schools and public buildings. Open any one to watch it go up.
                </span>
                <span className="fp-rise fp-more-go" style={rise(3)}>
                  All projects <span aria-hidden>→</span>
                </span>
              </Link>
            </article>
          )}
        </div>

        {/* project picker */}
        <nav className="mt-4 flex items-center gap-3 border-t border-ink/15 pt-4" aria-label="Choose a project">
          <div ref={picker} className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {projects.map((p, i) => (
              <button key={p.id} onClick={() => go(i)} aria-current={i === active ? 'true' : undefined} className={chip(i === active)}>
                <span className="tabular-nums opacity-60">{pad(i + 1)}</span> {p.name.replace(/^The /, '')}
              </button>
            ))}
            {seeMore && (
              <button onClick={() => go(projects.length)} aria-current={active === projects.length ? 'true' : undefined} className={chip(active === projects.length)}>
                See more <span aria-hidden>→</span>
              </button>
            )}
          </div>
          <button onClick={() => go(active - 1)} aria-label="Previous project" className="h-11 w-11 shrink-0 rounded-full border border-ink/25 text-lg text-ink transition hover:border-ink/70">
            ←
          </button>
          <button onClick={() => go(active + 1)} aria-label="Next project" className="h-11 w-11 shrink-0 rounded-full border border-ink/25 text-lg text-ink transition hover:border-ink/70">
            →
          </button>
        </nav>
      </PageContainer>
    </section>
  )
}

export default ProjectCarousel
