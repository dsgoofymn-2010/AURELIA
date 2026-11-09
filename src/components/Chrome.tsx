import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'

/** film grain + vignette + letterbox hairlines: the "lens" over every frame */
export function Lens() {
  const shot = useStore((s) => s.mode) === 'transition'
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10 vignette" />
      <div className="pointer-events-none fixed inset-0 z-10 grain" style={{ animationPlayState: shot ? 'paused' : 'running' }} />
    </>
  )
}

export function Waiting() {
  const w = useStore((s) => s.waiting)
  return (
    <AnimatePresence>
      {w !== null && (
        <motion.div
          className="pointer-events-none fixed bottom-8 left-1/2 z-40 -translate-x-1/2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="status"
        >
          <div className="glass flex items-center gap-3 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-champagne-soft">
            <span className="relative h-px w-16 overflow-hidden bg-white/15">
              <span className="absolute inset-y-0 left-0 bg-champagne" style={{ width: `${Math.round(w * 100)}%` }} />
            </span>
            Preparing film {Math.round(w * 100)}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Caption() {
  const c = useStore((s) => s.caption)
  const mode = useStore((s) => s.mode)
  return (
    <AnimatePresence>
      {c && mode === 'transition' && (
        <motion.div
          key={c}
          className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
          initial={{ opacity: 0, letterSpacing: '0.6em' }}
          animate={{ opacity: 1, letterSpacing: '0.42em' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="font-display text-5xl font-light uppercase text-champagne-soft sm:text-7xl">{c}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
