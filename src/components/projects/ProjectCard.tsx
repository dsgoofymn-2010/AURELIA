// ProjectCard.tsx
// One building in the projects listing: its picture, number, kind and name. Opens the
// project's own page.

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Project } from '@/types/project'
import { projectStill } from '@/lib/media'

const pad = (n: number) => String(n).padStart(2, '0')

export function ProjectCard({ project: p, number, eager = false, delay = 0 }: { project: Project; number: number; eager?: boolean; delay?: number }) {
  return (
    <Link href={`/projects/${p.id}`} className="pj-card pj-in" style={{ '--i': delay } as CSSProperties} aria-label={`${p.name}, ${p.kind}`}>
      <div className="pj-pic">
        {!p.noFilm && <span className="pj-tag">Film</span>}
        <img src={projectStill(p)} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </div>
      <div className="mt-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.26em] text-bronze">
        <span className="tabular-nums">{pad(number)}</span>
        <span className="h-px w-6 shrink-0 bg-bronze/50" />
        <span className="truncate">{p.kind}</span>
      </div>
      <div className="mt-1.5 font-display text-2xl font-light leading-tight text-ink md:text-[28px]">{p.name}</div>
    </Link>
  )
}

export default ProjectCard
