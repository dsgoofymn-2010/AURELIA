import { useEffect, useRef } from 'react'
import { Caption, Lens, Waiting } from '../Chrome'
import { Hero } from '../Hero'
import { Loader } from '../Loader'
import { Panels } from '../Panels'
import { Residence } from '../Residence'
import { Room } from '../Room'
import { Rooftop } from '../Rooftop'
import { Stage } from '../Stage'
import { TopBar } from '../TopBar'
import { back, boot, intro, stepRoom, switchFloor } from '../../director'
import { loadManifest } from '../../lib/media'
import { unlockPlayback } from '../../lib/player'
import { store, useStore } from '../../store'
import { AwardsAndAchvements } from './AwardsAndAchvements'
import { FeaturedProjectStoryTelling } from './FeaturedProjectStoryTelling'
import { Certificates } from './Certificates'
import { InquiryForm } from '../contacts/InquiryForm'
import { Footer } from '../Footer'
import { AWARDS } from '../../data/site'

export default function HomePage() {
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
    window.addEventListener('pointerdown', unlockPlayback)
    return () => {
      alive = false
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', unlockPlayback)
    }
  }, [])

  // The page scrolls only from the tower view. Inside a residence, a room or a panel
  // it is locked in place at the top, so a swipe pans the frame instead of the page.
  const mode = useStore((s) => s.mode)
  const panel = useStore((s) => s.panel)
  useEffect(() => {
    document.documentElement.classList.toggle('locked', mode !== 'hero' || !!panel)
  }, [mode, panel])

  // once the next page fully covers the tower, stop painting the stage underneath it
  const stage = useRef<HTMLElement>(null)
  const window1 = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (stage.current) stage.current.style.visibility = e.isIntersecting ? '' : 'hidden'
    }, { rootMargin: '-2px 0px' }) // touching the top edge still counts as on screen without this
    if (window1.current) io.observe(window1.current)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <main ref={stage} className="fixed inset-0 overflow-hidden bg-ink">
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
      {/* page one is the fixed stage above, seen through this empty screen-high window */}
      <div ref={window1} className="h-dvh snap-start" aria-hidden />
      <div className="after-stage">
        <FeaturedProjectStoryTelling />
        <AwardsAndAchvements items={AWARDS} />
        <Certificates />
        <InquiryForm />
        <Footer />
      </div>
    </>
  )
}
