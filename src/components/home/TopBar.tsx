import { motion } from 'framer-motion'
import { FLOORS, SITE } from '../../data/site'
import { back, goHome } from '../../director'
import { useStore } from '../../store'

export function TopBar() {
  const mode = useStore((s) => s.mode)
  const floor = useStore((s) => s.floor)
  const room = useStore((s) => s.room)
  if (mode === 'loading') return null
  const busy = mode === 'transition'
  const backLabel = mode === 'room' ? FLOORS[floor - 1].label : mode === 'dollhouse' || mode === 'rooftop' ? 'The Tower' : null

  return (
    <motion.header
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 px-[max(16px,env(safe-area-inset-left,0px))] pt-[calc(16px+env(safe-area-inset-top,0px))] sm:px-8 sm:pt-6"
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
      {/* mobile back */}
      {backLabel && (
        <button
          onClick={() => back()}
          disabled={busy}
          className="glass pointer-events-auto absolute left-4 top-[72px] rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-champagne-soft sm:hidden"
        >
          ← {mode === 'room' && room ? 'Residence' : 'Tower'}
        </button>
      )}
    </motion.header>
  )
}
