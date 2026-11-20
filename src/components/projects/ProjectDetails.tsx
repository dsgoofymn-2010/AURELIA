// ProjectDetails.tsx
// The story half of a project slide: number and kind, name, description, the three
// stages of the build, and a progress line that runs for as long as the film does.

import type { CSSProperties } from 'react'
import type { Project } from '@/types/project'
import type { BuildState } from './ProjectGallery'

const pad = (n: number) => String(n).padStart(2, '0')
const rise = (i: number) => ({ '--i': i }) as CSSProperties

interface Props {
  project: Project
  /** 0-based position and total, shown as 03 / 12 */
  index: number
  total: number
  state: BuildState
  /** this is the slide on screen: its controls take keyboard focus */
  current: boolean
  onPlay: () => void
}

export function ProjectDetails({ project: p, index, total, state, current, onPlay }: Props) {
  return (
    <div className="min-w-0 pb-2 md:pb-0">
      <div className="fp-rise flex items-center gap-4 text-[10px] uppercase tracking-luxe text-bronze" style={rise(0)}>
        <span className="tabular-nums">
          {pad(index + 1)} / {pad(total)}
        </span>
        <span className="h-px w-10 bg-bronze/50" />
        <span>{p.kind}</span>
      </div>
      <h3 className="fp-rise mt-3 font-display text-4xl font-light leading-none text-ink sm:text-5xl lg:text-6xl" style={rise(1)}>
        {p.name}
      </h3>
      <p className="fp-rise mt-4 max-w-md text-sm leading-relaxed text-graphite md:text-[15px]" style={rise(2)}>
        {p.blurb}
      </p>

      <ol className="fp-rise mt-5 max-w-md border-t border-ink/15 md:mt-7" style={rise(3)}>
        {p.stages.map((s, b) => (
          <li key={s} className="fp-beat flex items-baseline gap-4 border-b border-ink/15 py-2.5" style={{ '--b': b } as CSSProperties}>
            <span className="text-[9px] tabular-nums tracking-[0.3em] text-bronze">{pad(b + 1)}</span>
            <span className="font-display text-lg leading-tight text-ink md:text-xl">{s}</span>
          </li>
        ))}
      </ol>

      <div className="fp-rise mt-5 flex max-w-md items-center gap-4" style={rise(4)}>
        <span className="relative h-px flex-1 overflow-hidden bg-ink/15">
          <span className="fp-progress absolute inset-0 bg-bronze" />
        </span>
        <button
          onClick={onPlay}
          disabled={state === 'playing'}
          tabIndex={current ? 0 : -1}
          className="rounded-full border border-ink/25 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-ink transition hover:border-ink/70 disabled:border-transparent disabled:text-graphite"
        >
          {state === 'playing' ? 'Building…' : state === 'done' ? 'Replay' : p.noFilm ? 'Play' : 'Play film'}
        </button>
      </div>
    </div>
  )
}

export default ProjectDetails
