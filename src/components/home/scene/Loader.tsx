import { AnimatePresence, motion } from 'framer-motion'
import { SITE } from '@/data/site'
import { useStore } from './store'

export function Loader() {
  const mode = useStore((s) => s.mode)
  const p = useStore((s) => s.loadProgress)
  return (
    <AnimatePresence>
      {mode === 'loading' && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink px-4"
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.65, 0, 0.35, 1] } }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            className="font-display text-5xl font-light tracking-[0.45em] text-gradient-gold sm:text-6xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.2 } }}
          >
            {SITE.brand}
          </motion.div>
          <div className="mt-3 text-[10px] uppercase tracking-luxe text-mist">{SITE.tagline}</div>
          <div className="mt-12 h-px w-56 overflow-hidden bg-white/10">
            <motion.div className="h-full bg-champagne" animate={{ width: `${Math.max(3, p * 100)}%` }} transition={{ ease: 'easeOut', duration: 0.4 }} />
          </div>
          <div className="mt-3 text-[10px] tabular-nums tracking-[0.3em] text-mist">{Math.round(p * 100)}%</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
