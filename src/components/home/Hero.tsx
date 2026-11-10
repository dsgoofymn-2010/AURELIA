import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FLOORS, LAYOUT, RESIDENCE_FACTS, SITE } from '../../data/site'
import { hoverZone, openFloor, openRooftop } from '../../director'
import { useIsMobile, isTouchDevice } from '../../hooks/useMediaQuery'
import { useView } from '../../hooks/useView'
import { store, useStore } from '../../store'

const ease = [0.22, 1, 0.36, 1] as const

type Zone = { key: string; title: string; sub: string; status?: string }
const ZONES: Zone[] = [
  { key: 'rooftop', title: 'The Crown', sub: 'Sky garden & monogram terrace' },
  ...[...FLOORS].reverse().map((f) => ({ key: f.key, title: f.label, sub: 'Full-floor residence', status: f.status })),
  { key: 'ground', title: 'Lobby', sub: 'Double-height arrival hall' },
]
const ZONE = Object.fromEntries(ZONES.map((z) => [z.key, z]))

function activate(key: string) {
  if (key === 'rooftop') return openRooftop()
  if (key === 'ground') return store.set({ panel: 'lobby' })
  return openFloor(Number(key.slice(1)))
}

export function Hero() {
  const mode = useStore((s) => s.mode)
  const hover = useStore((s) => s.hover)
  const r = useView(mode === 'hero')
  const mobile = useIsMobile()
  const touch = isTouchDevice()
  const [armed, setArmed] = useState<string | null>(null)
  const show = mode === 'hero'

  const onZone = (key: string) => {
    // touch: first tap previews (lights the floor), second tap enters
    if (touch && armed !== key) {
      setArmed(key)
      hoverZone(key)
      return
    }
    setArmed(null)
    activate(key)
  }

  const tag = hover ? LAYOUT.hero_floors[hover] : null
  const tagPt = tag ? r.toScreen(tag.label[0], tag.label[1]) : null
  const z = hover ? ZONE[hover] : null

  return (
    <AnimatePresence>
      {show && (
        <motion.div key="hero" className="absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.8 } }} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
          {/* scrim behind the copy */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,10,16,0.82)_0%,rgba(11,10,16,0.35)_34%,transparent_55%,transparent_74%,rgba(11,10,16,0.7)_100%)] max-md:bg-[linear-gradient(180deg,rgba(11,10,16,0.75)_0%,transparent_32%,transparent_70%,rgba(11,10,16,0.85)_100%)]" />

          {/* floor hit areas, drawn over the exact rendered floors */}
          <svg className="absolute inset-0 h-full w-full" onPointerLeave={() => !touch && hoverZone(null)}>
            <defs>
              <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {Object.entries(LAYOUT.hero_floors).map(([key, f]) => {
              const pts = f.poly.map(([u, v]) => r.toScreen(u, v).join(',')).join(' ')
              const on = hover === key
              return (
                <polygon
                  key={key}
                  points={pts}
                  role="button"
                  tabIndex={0}
                  aria-label={`${ZONE[key]?.title ?? key} — ${ZONE[key]?.sub ?? ''}`}
                  className="cursor-pointer outline-none transition-[fill,stroke] duration-300"
                  fill={on ? 'rgba(239,224,198,0.07)' : 'rgba(0,0,0,0)'}
                  stroke={on ? 'rgba(233,205,160,0.95)' : 'rgba(0,0,0,0)'}
                  strokeWidth={1.2}
                  filter={on ? 'url(#glow)' : undefined}
                  onPointerEnter={() => !touch && hoverZone(key)}
                  onFocus={() => hoverZone(key)}
                  onClick={() => onZone(key)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && activate(key)}
                />
              )
            })}
          </svg>

          {/* floating floor tag */}
          <AnimatePresence>
            {tagPt && z && !mobile && (
              <motion.div
                key={hover}
                className="pointer-events-none absolute z-10"
                style={{ left: tagPt[0], top: tagPt[1] }}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex -translate-y-1/2 items-center">
                  <span className="h-px w-10 bg-champagne/80 sm:w-16" />
                  <span className="h-1.5 w-1.5 -translate-x-px rounded-full bg-champagne shadow-[0_0_12px_#d9b98a]" />
                  <div className="glass ml-3 rounded-sm px-4 py-3">
                    <div className="font-display text-2xl leading-none text-champagne-soft">{z.title}</div>
                    <div className="mt-1.5 flex items-center gap-3 text-[9px] uppercase tracking-[0.26em] text-mist">
                      {z.sub}
                      {z.status && <span className={z.status === 'Available' ? 'text-champagne' : 'text-mist/60'}>· {z.status}</span>}
                    </div>
                    <div className="mt-2 text-[9px] uppercase tracking-[0.3em] text-champagne/90">
                      {touch ? (armed === hover ? 'Tap again to enter →' : 'Tap to preview') : 'Click to enter →'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* copy */}
          <div className="pointer-events-none absolute left-4 top-[84px] max-w-md sm:left-8 md:top-1/2 md:-translate-y-1/2 lg:left-14">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 1, ease } }} className="text-[10px] uppercase tracking-luxe text-champagne/90">
              Ten residences · Twilight
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.65, duration: 1.1, ease } }}
              className="mt-3 font-display text-[40px] font-light leading-[0.95] sm:mt-4 sm:text-6xl text-champagne-soft sm:text-6xl lg:text-7xl"
            >
              Live beyond
              <br />
              <em className="text-gradient-gold not-italic">ordinary.</em>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.9, duration: 1 } }} className="mt-5 hidden max-w-sm text-sm leading-relaxed text-mist sm:block">
              {SITE.supporting} Hover a floor to light it — click to step inside.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.05, duration: 1 } }} className="mt-8 hidden gap-8 border-t hairline pt-5 md:flex">
              {RESIDENCE_FACTS.slice(0, 3).map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl text-champagne-soft">{v}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.24em] text-mist">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* floor rail */}
          {mobile ? (
            <div className="absolute inset-x-0 bottom-0 pb-[max(16px,env(safe-area-inset-bottom))]">
              <AnimatePresence mode="wait">
                {z ? (
                  <motion.div key={hover} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass mx-4 mb-3 flex items-center justify-between rounded-sm px-4 py-3">
                    <div>
                      <div className="font-display text-2xl leading-none text-champagne-soft">{z.title}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.22em] text-mist">
                        {z.sub}
                        {z.status && <span className={z.status === 'Available' ? 'text-champagne' : ''}> · {z.status}</span>}
                      </div>
                    </div>
                    <button onClick={() => hover && activate(hover)} className="rounded-full bg-champagne px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink">
                      Enter →
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-2 px-4 text-[9px] uppercase tracking-[0.3em] text-mist">
                    Tap a floor to preview
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="scrollbar-none flex gap-2 overflow-x-auto px-4">
                {ZONES.map((zz) => (
                  <button
                    key={zz.key}
                    onClick={() => onZone(zz.key)}
                    className={`glass shrink-0 rounded-full px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] transition ${hover === zz.key ? 'border-champagne/80 text-ink !bg-champagne' : 'text-champagne-soft'}`}
                  >
                    {zz.key.startsWith('f') ? `L${zz.key.slice(1)}` : zz.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <motion.nav
              aria-label="Floors"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.9, duration: 1, ease } }}
              className="absolute right-6 top-1/2 w-52 -translate-y-1/2 lg:right-10"
              onPointerLeave={() => hoverZone(null)}
            >
              <div className="mb-3 flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-mist">
                <span>Select a floor</span>
                <span className="tabular-nums">10 / 10</span>
              </div>
              <ul className="border-t hairline">
                {ZONES.map((zz) => {
                  const on = hover === zz.key
                  return (
                    <li key={zz.key}>
                      <button
                        onPointerEnter={() => hoverZone(zz.key)}
                        onFocus={() => hoverZone(zz.key)}
                        onClick={() => activate(zz.key)}
                        className={`group flex w-full items-center justify-between border-b hairline py-[7px] text-left transition ${on ? 'text-champagne' : 'text-champagne-soft/75 hover:text-champagne-soft'}`}
                      >
                        <span className="flex items-baseline gap-3">
                          <span className={`h-px transition-all duration-300 ${on ? 'w-5 bg-champagne' : 'w-2 bg-champagne/30'}`} />
                          <span className="font-display text-[17px] leading-none">{zz.title}</span>
                        </span>
                        <span className={`text-[8px] uppercase tracking-[0.22em] ${zz.status === 'Reserved' ? 'text-mist/50' : 'text-mist'}`}>{zz.status ?? (zz.key === 'rooftop' ? 'Amenity' : 'Arrival')}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </motion.nav>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  )
}
