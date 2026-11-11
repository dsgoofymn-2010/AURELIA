// AwardsAndAchvements.tsx
// The recognition page: a fanned row of award medallions on the dark stage colour.
// The centre one is the current award; its citation is written out underneath.
//
// Built to stay smooth on weak phones: the cards only ever change transform and
// opacity, the auto-advance timer stops while the page is off screen, and nothing
// here loads an image unless an award actually has one.

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SITE } from '../../data/site'
import { prefersReducedMotion } from '../../hooks/useReducedMotion'
import './AwardsAndAchvements.css'

export interface AwardItem {
  id: string | number
  title?: string
  description?: string
  /** awarding body or category */
  kind?: string
  year?: string
  image?: string
  alt?: string
  [key: string]: unknown
}

export interface AwardsAndAchvementsProps {
  items?: AwardItem[]
  /** ms each award stays in the centre before the row advances */
  interval?: number
  autoPlay?: boolean
  pauseOnHover?: boolean
  className?: string
  onCardClick?: (item: AwardItem, index: number) => void
  onCardChange?: (item: AwardItem, index: number) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

/** laurel wreath, drawn once: seven leaves a side around an open centre */
const LEAVES = Array.from({ length: 7 }, (_, i) => {
  const a = ((118 + i * 23) * Math.PI) / 180 // down the left side, from the top
  return { x: 50 + Math.cos(a) * 31, y: 50 - Math.sin(a) * 31, r: 28 - (118 + i * 23) }
})

function Laurel({ label }: { label: string }) {
  return (
    <svg className="aw-laurel" viewBox="0 0 100 100" aria-hidden>
      {[1, -1].map((side) => (
        <g key={side} transform={side === -1 ? 'matrix(-1 0 0 1 100 0)' : undefined}>
          <path d="M33 21 A31 31 0 0 0 47 80.5" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
          {LEAVES.map((l, i) => (
            <ellipse key={i} cx={l.x} cy={l.y} rx="7.2" ry="2.9" fill="currentColor" opacity={0.92 - i * 0.05} transform={`rotate(${l.r} ${l.x} ${l.y})`} />
          ))}
        </g>
      ))}
      <text x="50" y="57" textAnchor="middle" className="aw-laurel-n">
        {label}
      </text>
    </svg>
  )
}

export const AwardsAndAchvements: React.FC<AwardsAndAchvementsProps> = ({
  items = [],
  interval = 4200,
  autoPlay = true,
  pauseOnHover = true,
  className = '',
  onCardClick,
  onCardChange,
}) => {
  const total = items.length
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [inView, setInView] = useState(false)
  const [stageWidth, setStageWidth] = useState(1200)
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const touch = useRef<number | null>(null)

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setStageWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // the row only advances on its own while someone can see it
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!autoPlay || !inView || total < 2 || (pauseOnHover && hovered) || prefersReducedMotion()) return
    const t = setTimeout(() => setActive((i) => (i + 1) % total), interval)
    return () => clearTimeout(t)
  }, [active, autoPlay, inView, pauseOnHover, hovered, total, interval])

  useEffect(() => {
    if (total) onCardChange?.(items[active], active)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((i: number) => setActive(((i % total) + total) % total), [total])

  if (!total) return null
  const current = items[active]
  // distance between neighbouring cards: tighter on phones so the fan stays on screen
  const stepX = Math.min(250, Math.max(132, stageWidth * 0.2))

  return (
    <section
      ref={section}
      id="awards"
      className={`aw ${className}`}
      aria-labelledby="aw-title"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aw-wrap">
        <div className="aw-top">
          <div className="font-display text-xl font-light tracking-[0.42em] text-champagne-soft">{SITE.brand}</div>
          <div className="text-[10px] uppercase tracking-luxe text-champagne/80">Recognition</div>
        </div>

        <header className="aw-head">
          <div className="text-[10px] uppercase tracking-luxe text-champagne">Awards &amp; achievements</div>
          <h2 id="aw-title" className="aw-h2">
            Recognised for the way <em>we build.</em>
          </h2>
        </header>

        {/* the fan of medallions */}
        <div
          ref={stage}
          className="aw-stage"
          role="group"
          aria-roledescription="carousel"
          aria-label="Awards"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(active + 1)
            else if (e.key === 'ArrowLeft') go(active - 1)
          }}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return
            const dx = e.changedTouches[0].clientX - touch.current
            touch.current = null
            if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1))
          }}
        >
          <div className="aw-glow" />
          {items.map((item, index) => {
            // shortest way round from the current card
            let d = index - active
            if (d > total / 2) d -= total
            if (d < -total / 2) d += total
            const abs = Math.abs(d)
            const sign = Math.sign(d)
            const slot =
              abs === 0
                ? { x: 0, y: 0, r: 0, s: 1, o: 1 }
                : abs === 1
                  ? { x: sign * stepX, y: 30, r: sign * 9, s: 0.86, o: 0.6 }
                  : abs === 2
                    ? { x: sign * stepX * 1.9, y: 84, r: sign * 18, s: 0.74, o: 0.28 }
                    : { x: sign * stepX * 2.6, y: 150, r: sign * 26, s: 0.66, o: 0 }
            const on = abs === 0
            return (
              <div
                key={item.id}
                className="aw-slot"
                style={{
                  transform: `translate3d(calc(-50% + ${slot.x}px), ${slot.y}px, 0) rotate(${slot.r}deg) scale(${slot.s})`,
                  opacity: slot.o,
                  zIndex: 30 - abs * 10,
                  pointerEvents: slot.o ? 'auto' : 'none',
                }}
              >
                <button
                  type="button"
                  className="aw-card"
                  data-active={on}
                  tabIndex={slot.o && !on ? 0 : -1}
                  aria-hidden={!slot.o}
                  aria-label={on ? undefined : `Show ${item.title}`}
                  onClick={() => {
                    go(index)
                    onCardClick?.(item, index)
                  }}
                >
                  {item.image ? (
                    <img className="aw-photo" src={item.image} alt={item.alt ?? item.title ?? ''} loading="lazy" decoding="async" />
                  ) : (
                    <>
                      <Laurel label={pad(index + 1)} />
                      <span className="aw-card-kind">{item.kind}</span>
                      <span className="aw-card-title">{item.title}</span>
                      <span className="aw-card-year tabular-nums">{item.year}</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* the current award, written out */}
        <div className="aw-info" aria-live="polite">
          <div key={current.id} className="aw-info-in">
            <h3 className="aw-title">{current.title}</h3>
            {current.description && <p className="aw-desc">{current.description}</p>}
          </div>
        </div>

        <nav className="aw-nav" aria-label="Choose an award">
          <button onClick={() => go(active - 1)} aria-label="Previous award" className="aw-arrow">
            ←
          </button>
          <span className="aw-count tabular-nums">
            {pad(active + 1)} <i /> {pad(total)}
          </span>
          <button onClick={() => go(active + 1)} aria-label="Next award" className="aw-arrow">
            →
          </button>
        </nav>
      </div>
    </section>
  )
}

export const AwardsAndAchievements = AwardsAndAchvements
export default AwardsAndAchvements
