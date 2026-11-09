import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FLOORS, LAYOUT, RESIDENCE_FACTS, ROOMS, ROOM_BY_ID, type RoomId } from '../data/site'
import { openRoom, switchFloor } from '../director'
import { stillUrl } from '../lib/media'
import { useView } from '../hooks/useView'
import { store, useStore } from '../store'
import { useIsMobile } from '../hooks/useMediaQuery'
import { PanLayer } from './PanLayer'

const ease = [0.22, 1, 0.36, 1] as const

export function Residence() {
  const mode = useStore((s) => s.mode)
  const floor = useStore((s) => s.floor)
  const r = useView()
  const mobile = useIsMobile()
  const [hot, setHot] = useState<RoomId | null>(null)
  const f = FLOORS[floor - 1]

  return (
    <AnimatePresence>
      {mode === 'dollhouse' && (
        <motion.div key="res" className="fixed inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.7 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,10,16,0.78)_0%,rgba(11,10,16,0.2)_30%,transparent_50%),linear-gradient(0deg,rgba(11,10,16,0.85)_0%,transparent_28%)]" />

          {mobile && <PanLayer />}
          {/* room hotspots */}
          {ROOMS.map((room, i) => {
            const [u, v] = LAYOUT.dollhouse_rooms[room.id]
            const [x, y] = r.toScreen(u, v)
            const on = hot === room.id
            return (
              <motion.button
                key={room.id}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: x, top: y }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.25 + i * 0.07, duration: 0.5, ease } }}
                onPointerEnter={() => setHot(room.id)}
                onPointerLeave={() => setHot(null)}
                onFocus={() => setHot(room.id)}
                onBlur={() => setHot(null)}
                onClick={() => openRoom(room.id)}
                aria-label={`Enter ${room.name}`}
              >
                <span className="relative flex h-7 w-7 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-champagne/25 [animation-duration:2.4s]" />
                  <span className={`relative h-3 w-3 rounded-full border border-ink/40 transition ${on ? 'scale-125 bg-champagne-soft' : 'bg-champagne'} shadow-[0_0_16px_rgba(217,185,138,0.9)]`} />
                </span>
                <span
                  className={`glass absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.24em] transition ${on ? 'text-champagne' : 'text-champagne-soft/90'}`}
                >
                  {room.name}
                </span>
                <AnimatePresence>
                  {on && !mobile && (
                    <motion.span
                      className="glass pointer-events-none absolute bottom-full left-1/2 mb-3 block w-56 -translate-x-1/2 overflow-hidden rounded-sm text-left"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.25 }}
                    >
                      <img src={stillUrl(room.id) ?? ''} alt="" className="block aspect-video w-full object-cover" />
                      <span className="block px-3 py-2">
                        <span className="block font-display text-lg leading-tight text-champagne-soft">{room.name}</span>
                        <span className="text-[9px] uppercase tracking-[0.22em] text-mist">{room.area} · click to enter</span>
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}

          {/* residence card */}
          <motion.aside
            className="pointer-events-none absolute left-4 top-[118px] max-w-[19rem] sm:top-24 [&_button]:pointer-events-auto sm:left-8 lg:left-14 md:top-1/2 md:-translate-y-1/2"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.15, duration: 0.8, ease } }}
          >
            <div className="text-[10px] uppercase tracking-luxe text-champagne/90">Residence</div>
            <h2 className="mt-2 font-display text-4xl sm:mt-3 sm:text-5xl font-light leading-none text-champagne-soft lg:text-6xl">{f.label}</h2>
            <p className="mt-4 hidden text-sm leading-relaxed text-mist md:block">
              A full-floor home with terraces on every side. Shown here is the typical plan, lifted from the tower with the ceiling removed — choose a room to walk in.
            </p>
            <div className="mt-6 hidden grid-cols-2 gap-x-6 gap-y-4 border-t hairline pt-5 md:grid">
              {RESIDENCE_FACTS.map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl text-champagne-soft">{v}</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-mist">{l}</div>
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
            <button onClick={() => switchFloor(floor + 1)} disabled={floor >= 10} aria-label="Level above" className="glass h-10 w-10 rounded-full text-champagne-soft transition hover:text-champagne disabled:opacity-30">
              ↑
            </button>
            <div className="py-1 text-center">
              <div className="text-[8px] uppercase tracking-[0.3em] text-mist">Level</div>
              <div className="font-display text-3xl tabular-nums text-champagne-soft">{String(floor).padStart(2, '0')}</div>
            </div>
            <button onClick={() => switchFloor(floor - 1)} disabled={floor <= 1} aria-label="Level below" className="glass h-10 w-10 rounded-full text-champagne-soft transition hover:text-champagne disabled:opacity-30">
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
