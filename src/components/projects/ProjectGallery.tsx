// ProjectGallery.tsx
// The picture half of a project slide: its construction film, or, for a project with no
// film yet, the finished building uncovered from the ground up over the same time.

import { projectFilm, projectStill } from '@/lib/media'
import type { Project } from '@/types/project'

/** where a construction film is in its run; image-only projects step through the same states */
export type BuildState = 'idle' | 'playing' | 'done'

interface Props {
  project: Project
  /** films are fetched only when their slide is shown: this marks the ones near the start */
  eager?: boolean
  /** a film that will not play on its own (reduced motion, data saver, autoplay refused): show the finished building */
  showStill?: boolean
  videoRef?: (el: HTMLVideoElement | null) => void
  onPlaying?: () => void
  onEnded?: () => void
}

export function ProjectGallery({ project: p, eager = false, showStill = false, videoRef, onPlaying, onEnded }: Props) {
  return (
    <div className="fp-film mx-auto h-[38dvh] md:h-[min(56dvh,600px)]">
      {p.noFilm ? (
        <img className="fp-still" src={projectStill(p)} alt={p.name} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      ) : (
        <>
          <video
            ref={videoRef}
            src={projectFilm(p)}
            muted
            playsInline
            preload="none"
            disableRemotePlayback
            aria-label={`${p.name} under construction`}
            onPlaying={onPlaying}
            onEnded={onEnded}
          />
          {showStill && <img src={projectStill(p)} alt={`${p.name}, completed`} loading="lazy" decoding="async" />}
        </>
      )}
    </div>
  )
}

export default ProjectGallery
