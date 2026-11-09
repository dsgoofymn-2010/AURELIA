import { useEffect } from 'react'
import { Caption, Lens, Waiting } from './components/Chrome'
import { Hero } from './components/Hero'
import { Loader } from './components/Loader'
import { Panels } from './components/Panels'
import { Residence } from './components/Residence'
import { Room } from './components/Room'
import { Rooftop } from './components/Rooftop'
import { Stage } from './components/Stage'
import { TopBar } from './components/TopBar'
import { back, boot, intro, stepRoom, switchFloor } from './director'
import { loadManifest } from './lib/media'
import { store } from './store'

export default function App() {
  useEffect(() => {
    let alive = true
    ;(async () => {
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
    <main className="fixed inset-0 overflow-hidden bg-ink">
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
    </main>
  )
}
