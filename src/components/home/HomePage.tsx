import { useEffect } from 'react'
import { AwardsAndAchvements } from './AwardsAndAchvements'
import { Caption, Lens, Waiting } from './Chrome'
import { FeaturedProjectStoryTelling } from './FeaturedProjectStoryTelling'
import { Hero } from './Hero'
import { Loader } from './Loader'
import { Panels } from './Panels'
import { Residence } from './Residence'
import { Room } from './Room'
import { Rooftop } from './Rooftop'
import { Stage } from './Stage'
import { TopBar } from './TopBar'
import { back, boot, intro, stepRoom, switchFloor } from '../../director'
import { loadManifest } from '../../lib/media'
import { store } from '../../store'

export default function HomePage() {
  useEffect(() => {
    let alive = true
      ; (async () => {
        await loadManifest()
        await boot((p) => store.set({ loadProgress: p }))
        if (!alive) return
        await new Promise((r) => setTimeout(r, 350))
        intro()
      })()
    const onKey = (e: KeyboardEvent) => {
      const s = store.get()
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return
      if (e.key === 'Escape') back()
      else if (s.mode === 'room' && e.key === 'ArrowRight') stepRoom(1)
      else if (s.mode === 'room' && e.key === 'ArrowLeft') stepRoom(-1)
      else if (s.mode === 'dollhouse' && e.key === 'ArrowUp') switchFloor(s.floor + 1)
      else if (s.mode === 'dollhouse' && e.key === 'ArrowDown') switchFloor(s.floor - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      alive = false
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <main className="relative h-screen w-full overflow-x-hidden overflow-y-auto bg-ink">
      <div className="relative h-screen w-full overflow-hidden">
        <Stage />
        <Lens />
        <Hero />
        <Residence />
        <Room />
        <Rooftop />
        <TopBar />
        <Caption />
        <Waiting />
        <Panels />
        <Loader />
      </div>
      <FeaturedProjectStoryTelling />
      <AwardsAndAchvements />
    </main>
  )
}

