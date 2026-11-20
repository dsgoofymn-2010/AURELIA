import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FLOORS, RESIDENCE_FACTS, ROOMS, ROOM_BY_ID, type RoomId } from '@/data/site'
import { openRoom, switchFloor } from './director'
import { stillUrl } from '@/lib/media'
import { store, useStore } from './store'
import { useIsMobile } from './useMediaQuery'
import { PanLayer } from './PanLayer'

const ease = [0.22, 1, 0.36, 1] as const

export function Residence() {
  const mode = useStore((s) => s.mode)
  const floor = useStore((s) => s.floor)
  const mobile = useIsMobile()
  const [hot, setHot] = useState<RoomId | null>(null)
  const f = FLOORS[floor - 1]

  return (
    <AnimatePresence>
      {mode === 'dollhouse' && (
        <motion.div key="res" className="fixed inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.7 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,10,16,0.78)_0%,rgba(11,10,16,0.2)_30%,transparent_50%),linear-gradient(0deg,rgba(11,10,16,0.85)_0%,transparent_28%)]" />

          {mobile && <PanLayer />}

          {/* residence card */}
          <motion.aside
            className="pointer-events-none absolute left-4 top-[118px] max-w-[380px] sm:top-24 [&_button]:pointer-events-auto sm:left-8 lg:left-14 md:top-1/2 md:-translate-y-1/2"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.15, duration: 0.8, ease } }}
          >
            {/* text scrim */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10 bg-[linear-gradient(90deg,rgba(10,8,12,0.75)_0%,transparent_100%)] [mask-image:linear-gradient(180deg,transparent_0%,#000_14%,#000_86%,transparent_100%)]"
            />
            <div className="text-[10px] uppercase tracking-luxe text-champagne/90">Residence</div>
            <h2 className="mt-2 font-display text-4xl sm:mt-3 sm:text-5xl font-light leading-none text-champagne-soft lg:text-6xl">{f.label}</h2>
            <p className="mt-4 hidden max-w-[380px] text-[17px] leading-[1.7] text-[rgba(255,255,255,0.92)] [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] md:block">
              A full-floor home with terraces on every side. Shown here is the typical plan, lifted from the tower with the ceiling removed — choose a room to walk in.
            </p>
            <div className="mt-6 hidden grid-cols-2 gap-x-6 gap-y-4 border-t hairline pt-5 md:grid">
              {RESIDENCE_FACTS.map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl text-champagne-soft">{v}</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.92)] [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">{l}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 hidden items-center gap-3 md:flex">
              <span className={`rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.24em] ${f.status === 'Available' ? 'border-champagne/60 text-champagne' : 'border-white/20 text-mist'}`}>{f.status}</span>
              <button onClick={() => store.set({ panel: 'contact' })} className="text-[10px] uppercase tracking-[0.26em] text-champagne-soft underline decoration-champagne/50 underline-offset-4 hover:text-champagne">
                Request details
              </button>
            </div>
          </motion.aside>

          {/* level stepper */}
          <motion.div
            className="absolute bottom-[132px] right-4 flex flex-col items-center gap-1 sm:bottom-auto sm:right-8 sm:top-1/2 sm:-translate-y-1/2 sm:gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
          >
            <button onClick={() => switchFloor(floor + 1)} disabled={floor >= 10} aria-label="Floor above" className="glass h-10 w-10 rounded-full text-champagne-soft transition hover:text-champagne disabled:opacity-30">
              ↑
            </button>
            <div className="py-1 text-center">
              <div className="text-[8px] uppercase tracking-[0.3em] text-mist">Floor</div>
              <div className="font-display text-3xl tabular-nums text-champagne-soft">{String(floor).padStart(2, '0')}</div>
            </div>
            <button onClick={() => switchFloor(floor - 1)} disabled={floor <= 1} aria-label="Floor below" className="glass h-10 w-10 rounded-full text-champagne-soft transition hover:text-champagne disabled:opacity-30">
              ↓
            </button>
          </motion.div>

          <RoomStrip active={hot} onHover={setHot} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function RoomStrip({ active, onHover, current }: { active?: RoomId | null; onHover?: (r: RoomId | null) => void; current?: RoomId | null }) {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 pb-[max(16px,env(safe-area-inset-bottom))]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.7, ease } }}
    >
      <div className="scrollbar-none mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 sm:gap-3 sm:px-8">
        {ROOMS.map((room, i) => {
          const on = active === room.id || current === room.id
          return (
            <button
              key={room.id}
              onPointerEnter={() => onHover?.(room.id)}
              onPointerLeave={() => onHover?.(null)}
              onClick={() => openRoom(room.id)}
              className={`group relative w-32 shrink-0 overflow-hidden rounded-sm border text-left transition sm:w-36 ${on ? 'border-champagne/80' : 'border-white/10 hover:border-champagne/50'}`}
              aria-current={current === room.id ? 'true' : undefined}
            >
              <img src={stillUrl(room.id) ?? ''} alt="" loading="lazy" className="block aspect-[16/10] w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              <span className="absolute bottom-2 left-2.5 right-2">
                <span className="block text-[8px] tabular-nums tracking-[0.3em] text-champagne/80">0{i + 1}</span>
                <span className="block font-display text-[15px] leading-tight text-champagne-soft">{ROOM_BY_ID[room.id].name}</span>
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
