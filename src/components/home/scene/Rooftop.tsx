import { AnimatePresence, motion } from 'framer-motion'
import { closeRooftop } from './director'
import { store, useStore } from './store'

const ease = [0.22, 1, 0.36, 1] as const
const ITEMS = [
  ['Sky garden', 'Planted terrace beneath the sculpted canopy'],
  ['The monogram', 'The illuminated "M" crown, visible across the city'],
  ['Sunset lounge', 'Glass-edged deck facing the evening sky'],
]

export function Rooftop() {
  const mode = useStore((s) => s.mode)
  return (
    <AnimatePresence>
      {mode === 'rooftop' && (
        <motion.div key="roof" className="fixed inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.7 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(11,10,16,0.9)_0%,rgba(11,10,16,0.3)_35%,transparent_60%)]" />
          <motion.div
            className="absolute inset-x-0 bottom-0 px-4 pb-[max(28px,env(safe-area-inset-bottom))] sm:px-8 lg:px-14"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.9, ease } }}
          >
            <div className="text-[10px] uppercase tracking-luxe text-champagne/90">Floor 11 · Amenity</div>
            <h2 className="mt-3 font-display text-5xl font-light leading-none text-champagne-soft sm:text-7xl">The Crown</h2>
            <div className="mt-6 grid max-w-4xl gap-4 border-t hairline pt-5 sm:grid-cols-3">
              {ITEMS.map(([t, d]) => (
                <div key={t}>
                  <div className="font-display text-xl text-champagne-soft">{t}</div>
                  <div className="mt-1 text-xs leading-relaxed text-mist">{d}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => closeRooftop()} className="glass rounded-full px-5 py-3 text-[10px] uppercase tracking-[0.26em] text-champagne-soft hover:text-champagne">
                ← Back to the tower
              </button>
              <button
                onClick={() => store.set({ panel: 'contact' })}
                className="rounded-full border border-champagne/60 px-5 py-3 text-[10px] uppercase tracking-[0.26em] text-champagne-soft transition hover:bg-champagne hover:text-ink"
              >
                Book a viewing
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
