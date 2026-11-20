import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/PageContainer'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ProjectCategoryRow } from '@/components/projects/ProjectCategoryRow'
import '@/components/projects/projects.css'
import { CATEGORIES, PROJECTS } from '@/data/projects'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Every AURELIA building, from bare structure to the day it opens: homes, workplaces, hotels, schools and public buildings.',
}

const numberOf = (p: (typeof PROJECTS)[number]) => PROJECTS.indexOf(p) + 1

export default function ProjectsPage() {
  return (
    <>
      <SiteHeader />
      <main className="fp" style={{ boxShadow: 'none' }}>
        <PageContainer className="pb-20 pt-[calc(84px+env(safe-area-inset-top,0px))]">
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

          <div className="mt-10 md:mt-14">
            {CATEGORIES.map((c, i) => (
              <ProjectCategoryRow
                key={c.id}
                id={c.id}
                label={c.label}
                blurb={c.blurb}
                projects={PROJECTS.filter((p) => p.category === c.id)}
                numberOf={numberOf}
                eager={i === 0}
              />
            ))}
          </div>
        </PageContainer>
      </main>
      <SiteFooter />
    </>
  )
}
