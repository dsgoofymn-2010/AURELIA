'use client'
// SceneStage.tsx
// The tower experience: the full-screen canvas the pre-rendered films and stills are
// drawn on, and the interface over it (hero, residence, rooms, rooftop, panels).
// Loaded only in the browser and only on the home page (see Home3DScene), so none of
// this code or its media reaches the other pages.

import { useEffect, useRef } from 'react'
import { Caption, Lens, Waiting } from './Chrome'
import { HomeHero } from '@/components/home/HomeHero'
import { Loader } from './Loader'
import { Panels } from './Panels'
import { Residence } from './Residence'
import { Room } from './Room'
import { Rooftop } from './Rooftop'
import { Stage } from './Stage'
import { TopBar } from './TopBar'
import { back, boot, intro, stepRoom, switchFloor } from './director'
import { loadManifest } from '@/lib/media'
import { unlockPlayback } from './player'
import { store, useStore } from './store'

export default function SceneStage() {
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

  // The page scrolls from the tower view (and while the tower loads, so the pages below can
  // be read meanwhile). Inside a residence, a room or a panel it is locked in place at the
  // top, so a swipe pans the frame instead of the page.
  const mode = useStore((s) => s.mode)
  const panel = useStore((s) => s.panel)
  useEffect(() => {
    document.documentElement.classList.toggle('locked', (mode !== 'hero' && mode !== 'loading') || !!panel)
  }, [mode, panel])
  // leaving the home page must never leave the next page locked
  useEffect(() => () => document.documentElement.classList.remove('locked'), [])

  // once the next page fully covers the tower, stop painting the stage underneath it
  // (page one is this fixed stage, seen through the empty screen-high #tower-window on the home page)
  const stage = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const window1 = document.getElementById('tower-window')
    if (!window1) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (stage.current) stage.current.style.visibility = e.isIntersecting ? '' : 'hidden'
      },
      { rootMargin: '-2px 0px' }, // touching the top edge still counts as on screen without this
    )
    io.observe(window1)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={stage} className="fixed inset-0 overflow-hidden bg-ink" aria-label="The AURELIA tower">
      <Stage />
      <Lens />
      <HomeHero />
      <Residence />
      <Room />
      <Rooftop />
      <TopBar />
      <Caption />
      <Waiting />
      <Panels />
      <Loader />
    </div>
  )
}
