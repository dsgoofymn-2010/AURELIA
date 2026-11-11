'use client'
// FeaturedProjectStoryboard.tsx
// Page two of the home page: the projects with a construction film, one slide each,
// ending in "See more", which opens /projects.

import { FEATURED, PROJECTS } from '@/data/projects'
import { SITE } from '@/data/site'
import { prefersReducedMotion } from '@/lib/reducedMotion'
import { ProjectCarousel } from '@/components/projects/ProjectCarousel'

export function FeaturedProjectStoryboard() {
  return (
    <ProjectCarousel
      projects={FEATURED}
      seeMore={PROJECTS.length}
      eyebrow="Featured projects"
      title={
        <>
          From first pour to <em className="text-bronze">final light.</em>
        </>
      }
      intro={`${FEATURED.length === 4 ? 'Four' : FEATURED.length} buildings, each shown rising from bare structure to the day it opens.`}
      corner={
        <div className="flex items-center justify-between">
          <div className="font-display text-xl font-light tracking-[0.42em] text-ink">{SITE.brand}</div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
            className="rounded-full border border-ink/20 px-4 py-2 text-[10px] uppercase tracking-[0.26em] text-ink transition hover:border-ink/60"
          >
            ↑ The tower
          </button>
        </div>
      }
    />
  )
}

export default FeaturedProjectStoryboard
