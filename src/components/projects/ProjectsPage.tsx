// ProjectsPage.tsx
// /projects: every building on one sheet of the drawing paper. Choosing one opens it
// in the same film-and-story carousel as the home page's second page (?p=<id>), with
// all the projects in its track.

import { useEffect, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PROJECTS, SITE } from '../../data/site'
import { Footer } from '../Footer'
import { FeaturedProjectStoryTelling } from '../home/FeaturedProjectStoryTelling'
import { Sketch } from './Sketch'

const pad = (n: number) => String(n).padStart(2, '0')

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams()
  const open = PROJECTS.findIndex((p) => p.id === params.get('p'))

  useEffect(() => {
    // this page scrolls freely: clear the home page's scroll lock if it was left on
    document.documentElement.classList.remove('locked')
    window.scrollTo(0, 0)
  }, [open])

  if (open >= 0) return <FeaturedProjectStoryTelling key={open} projects={PROJECTS} initial={open} seeMore={false} onBack={() => setParams({})} />

  return (
    <>
      <main className="fp" style={{ boxShadow: 'none' }}>
        <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-[calc(18px+env(safe-area-inset-top,0px))] sm:px-10 lg:px-14">
          <div className="flex items-center justify-between">
            <div className="font-display text-xl font-light tracking-[0.42em] text-ink">{SITE.brand}</div>
            <Link to="/" className="rounded-full border border-ink/20 px-4 py-2 text-[10px] uppercase tracking-[0.26em] text-ink transition hover:border-ink/60">
              ← The tower
            </Link>
          </div>

          <header className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/15 pb-4 md:mt-6 md:pb-5">
            <div>
              <div className="text-[10px] uppercase tracking-luxe text-bronze">Projects</div>
              <h1 className="mt-2 font-display text-[34px] font-light leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
                Everything <em className="text-bronze">we have built.</em>
              </h1>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-graphite">{PROJECTS.length} buildings. Open any one to watch it rise from bare structure to the day it opens.</p>
          </header>

          <div className="pj-grid mt-8 md:mt-10">
            {PROJECTS.map((p, i) => (
              <button key={p.id} className="pj-card pj-in" style={{ '--i': i } as CSSProperties} onClick={() => setParams({ p: p.id })} aria-label={`Open ${p.name}`}>
                <div className="pj-pic">
                  {p.sketch ? (
                    <>
                      <span className="pj-tag">Film coming soon</span>
                      <Sketch floors={p.sketch[0]} bays={p.sketch[1]} />
                    </>
                  ) : (
                    <img src={`./media/projects/${p.id}.webp`} alt="" loading={i < 4 ? 'eager' : 'lazy'} decoding="async" />
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.26em] text-bronze">
                  <span className="tabular-nums">{pad(i + 1)}</span>
                  <span className="h-px w-6 bg-bronze/50" />
                  <span className="truncate">{p.kind}</span>
                </div>
                <div className="mt-1.5 font-display text-2xl font-light leading-tight text-ink md:text-[28px]">{p.name}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer nav={false} />
    </>
  )
}
