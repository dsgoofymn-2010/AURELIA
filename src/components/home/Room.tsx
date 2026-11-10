import { AnimatePresence, motion } from 'framer-motion'
import { FLOORS, ROOMS, ROOM_BY_ID } from '../../data/site'
import { closeRoom, stepRoom } from '../../director'
import { useStore } from '../../store'
import { PanLayer } from './PanLayer'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { RoomStrip } from './Residence'

const ease = [0.22, 1, 0.36, 1] as const

export function Room() {
  const mode = useStore((s) => s.mode)
  const roomId = useStore((s) => s.room)
  const floor = useStore((s) => s.floor)
  const mobile = useIsMobile()
  const room = roomId ? ROOM_BY_ID[roomId] : null
  const idx = room ? ROOMS.findIndex((r) => r.id === room.id) : 0

  return (
    <AnimatePresence>
      {mode === 'room' && room && (
        <motion.div key={room.id} className="absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.6 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
          {mobile && <PanLayer />}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(11,10,16,0.92)_0%,rgba(11,10,16,0.45)_30%,transparent_55%)]" />

          <div className="absolute inset-x-0 bottom-[132px] flex flex-col gap-6 px-4 sm:bottom-[150px] sm:px-8 md:flex-row md:items-end md:justify-between lg:px-14">
            <motion.div className="max-w-xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.9, ease } }}>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-luxe text-champagne/90">
                <span className="tabular-nums">
                  0{idx + 1} / 0{ROOMS.length}
                </span>
                <span className="h-px w-10 bg-champagne/50" />
                <span>{FLOORS[floor - 1].label}</span>
              </div>
              <h2 className="mt-3 font-display text-5xl font-light leading-none text-champagne-soft sm:text-6xl lg:text-7xl">{room.name}</h2>
              <p className="mt-4 hidden max-w-lg text-sm leading-relaxed text-mist sm:block">{room.blurb}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-champagne/60 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-champagne">{room.area}</span>
                {room.features.map((f) => (
                  <span key={f} className="hidden rounded-full border border-white/15 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-mist sm:inline-block">
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }}>
              <button onClick={() => stepRoom(-1)} aria-label="Previous room" className="glass h-12 w-12 rounded-full text-lg text-champagne-soft transition hover:text-champagne">
                ←
              </button>
              <button onClick={() => stepRoom(1)} aria-label="Next room" className="glass h-12 w-12 rounded-full text-lg text-champagne-soft transition hover:text-champagne">
                →
              </button>
              <button
                onClick={() => closeRoom()}
                className="ml-2 rounded-full border border-champagne/60 px-5 py-3 text-[10px] uppercase tracking-[0.26em] text-champagne-soft transition hover:bg-champagne hover:text-ink"
              >
                Residence overview
              </button>
            </motion.div>
          </div>

          <RoomStrip current={room.id} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
