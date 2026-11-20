// ProjectCategoryRow.tsx
// One category of the projects listing: its name and a row of project cards. The row
// swipes sideways on phones and tablets (native scroll-snap) and is a grid on desktop.

import type { Project } from '@/types/project'
import { ProjectCard } from './ProjectCard'

interface Props {
  id: string
  label: string
  blurb: string
  projects: Project[]
  /** each project's number in the full list */
  numberOf: (p: Project) => number
  /** cards in the first row load straight away; the rest as they come into view */
  eager?: boolean
}

export function ProjectCategoryRow({ id, label, blurb, projects, numberOf, eager = false }: Props) {
  return (
    <section className="pj-cat" aria-labelledby={`cat-${id}`}>
      <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
        <h2 id={`cat-${id}`} className="font-display text-2xl font-light text-ink md:text-3xl">
          {label}
        </h2>
        <p className="text-right text-[10px] uppercase tracking-[0.26em] text-graphite">
          <span className="hidden sm:inline">{blurb} · </span>
          <span className="tabular-nums">{projects.length}</span> projects
        </p>
      </div>
      <div className="pj-row scrollbar-none mt-5">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} number={numberOf(p)} eager={eager} delay={i} />
        ))}
      </div>
    </section>
  )
}

export default ProjectCategoryRow
