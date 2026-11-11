// ProjectsPage.tsx
// /projects: a page of its own with every building on one sheet of the drawing paper.
// Choosing one opens it (/projects?p=<id>) in the same film-and-story carousel as the
// home page's second page, with all the projects in its track.

import { useCallback, useEffect, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PROJECTS, type Project } from '../../data/site'
import { Footer } from '../Footer'
import { SiteNav } from '../SiteNav'
import { FeaturedProjectStoryTelling } from '../home/FeaturedProjectStoryTelling'

const pad = (n: number) => String(n).padStart(2, '0')

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams()
  const open = PROJECTS.findIndex((p) => p.id === params.get('p'))
  const detail = open >= 0

  useEffect(() => {
    // this page scrolls freely: clear the home page's scroll lock if it was left on
    document.documentElement.classList.remove('locked')
    window.scrollTo(0, 0)
  }, [detail])

  // keep the address on the building in view, so a reload or a shared link opens it again
  const onChange = useCallback((p: Project | null) => p && setParams({ p: p.id }, { replace: true }), [setParams])

  return (
    <>
      <SiteNav current="projects" />
      {detail ? (
        <FeaturedProjectStoryTelling projects={PROJECTS} initial={open} seeMore={false} nav onBack={() => setParams({})} onChange={onChange} />
      ) : (
        <>
          <main className="fp" style={{ boxShadow: 'none' }}>
            <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-[calc(84px+env(safe-area-inset-top,0px))] sm:px-10 lg:px-14">
              <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/15 pb-4 md:pb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-luxe text-bronze">Projects</div>
                  <h1 className="mt-2 font-display text-[34px] font-light leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
                    Everything <em className="text-bronze">we have built.</em>
                  </h1>
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-graphite">
                  {PROJECTS.length} buildings, homes to hospitals. Open any one to watch it rise from the ground to the day it opens.
                </p>
              </header>

              <div className="pj-grid mt-8 md:mt-10">
                {PROJECTS.map((p, i) => (
                  <button key={p.id} className="pj-card pj-in" style={{ '--i': i } as CSSProperties} onClick={() => setParams({ p: p.id })} aria-label={`Open ${p.name}`}>
                    <div className="pj-pic">
                      {!p.noFilm && <span className="pj-tag">Film</span>}
                      <img src={`./media/projects/${p.id}.webp`} alt="" loading={i < 4 ? 'eager' : 'lazy'} decoding="async" />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.26em] text-bronze">
                      <span className="tabular-nums">{pad(i + 1)}</span>
                      <span className="h-px w-6 shrink-0 bg-bronze/50" />
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
      )}
    </>
  )
}
