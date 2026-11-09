import { motion } from 'framer-motion'
import { FLOORS, SITE } from '../data/site'
import { back, goHome, openFloor, openRooftop } from '../director'
import { store, useStore, type Panel } from '../store'

export function TopBar() {
  const mode = useStore((s) => s.mode)
  const floor = useStore((s) => s.floor)
  const room = useStore((s) => s.room)
  const panel = useStore((s) => s.panel)
  if (mode === 'loading') return null
  const busy = mode === 'transition'
  const openPanel = (p: Panel) => store.set({ panel: panel === p ? null : p })
  const backLabel = mode === 'room' ? FLOORS[floor - 1].label : mode === 'dollhouse' || mode === 'rooftop' ? 'The Tower' : null
  const link = 'rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-champagne-soft/80 transition hover:text-champagne disabled:opacity-40'

  return (
    <motion.header
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-4 px-[max(16px,env(safe-area-inset-left,0px))] pt-[calc(16px+env(safe-area-inset-top,0px))] sm:px-8 sm:pt-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.9 } }}
    >
      <div className="pointer-events-auto flex items-center gap-5">
        <button onClick={() => !busy && goHome()} className="group text-left" aria-label="AURELIA home">
          <div className="font-display text-2xl font-light leading-none tracking-[0.42em] text-gradient-gold sm:text-[28px]">{SITE.brand}</div>
          <div className="mt-1 text-[8px] uppercase tracking-[0.5em] text-mist/80">Residences</div>
        </button>
        {backLabel && (
          <button
            onClick={() => back()}
            disabled={busy}
            className="hidden items-center gap-2 border-l hairline pl-5 text-[10px] uppercase tracking-[0.28em] text-champagne-soft/80 transition hover:text-champagne disabled:opacity-40 sm:flex"
          >
            <span aria-hidden>←</span> {backLabel}
          </button>
        )}
      </div>
      <nav className="pointer-events-auto flex items-center gap-1" aria-label="Main">
        <div className="hidden items-center gap-1 md:flex">
          <button className={link} disabled={busy || mode !== 'hero'} onClick={() => openFloor(floor)}>
            Residences
          </button>
          <button className={link} disabled={busy || mode !== 'hero'} onClick={() => openRooftop()}>
            Sky Garden
          </button>
          <button className={link} onClick={() => openPanel('amenities')}>
            Amenities
          </button>
          <button className={link} onClick={() => openPanel('discover')}>
            Discover
          </button>
        </div>
        <button
          onClick={() => openPanel('contact')}
          className="ml-2 rounded-full border border-champagne/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-champagne-soft transition hover:bg-champagne hover:text-ink"
        >
          Book a viewing
        </button>
      </nav>
      {/* mobile back */}
      {backLabel && (
        <button
          onClick={() => back()}
          disabled={busy}
          className="glass pointer-events-auto fixed left-4 top-[72px] rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-champagne-soft sm:hidden"
        >
          ← {mode === 'room' && room ? 'Residence' : 'Tower'}
        </button>
      )}
    </motion.header>
  )
}
