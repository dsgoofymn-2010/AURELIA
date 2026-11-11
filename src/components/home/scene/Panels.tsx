import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { FLOORS, RESIDENCE_FACTS, SITE } from '@/data/site'
import { goHome, openFloor, openRooftop } from './director'
import { useIsMobile } from './useMediaQuery'
import { store, useStore } from './store'

const ease = [0.65, 0, 0.35, 1] as const
const TITLES = { discover: 'Discover AURELIA', amenities: 'Amenities', contact: 'Book a private viewing', lobby: 'Lobby & arrival' } as const

export function Panels() {
  const panel = useStore((s) => s.panel)
  const compact = useIsMobile()
  const close = () => store.set({ panel: null })
  return (
    <AnimatePresence>
      {panel && (
        <>
          <motion.div key="scrim" className="fixed inset-0 z-40 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            key={panel}
            className={`fixed z-50 ${compact ? 'inset-x-3 bottom-3 top-20' : 'bottom-6 right-6 top-24 w-[27rem]'}`}
            initial={{ opacity: 0, x: compact ? 0 : 40, y: compact ? 30 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0, transition: { duration: 0.55, ease } }}
            exit={{ opacity: 0, x: compact ? 0 : 30, y: compact ? 20 : 0, transition: { duration: 0.3 } }}
            role="dialog"
            aria-label={TITLES[panel]}
          >
            <div className="glass flex h-full flex-col overflow-hidden rounded-md" style={{ background: 'rgba(14,12,22,0.9)' }}>
              <div className="flex items-center justify-between border-b hairline px-6 py-4">
                <span className="text-[10px] uppercase tracking-luxe text-champagne/80">{TITLES[panel]}</span>
                <button onClick={close} className="h-8 w-8 rounded-full border hairline text-champagne-soft hover:bg-champagne/10" aria-label="Close panel">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
                {panel === 'discover' && <Discover />}
                {panel === 'amenities' && <Amenities />}
                {panel === 'contact' && <Contact />}
                {panel === 'lobby' && <Lobby />}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** run an action from any screen: close the panel, return to the tower first if needed */
async function fromTower(fn: () => unknown) {
  store.set({ panel: null })
  const m = store.get().mode
  if (m !== 'hero') {
    await goHome()
    if (store.get().mode === 'room') await goHome()
  }
  fn()
}

function Discover() {
  return (
    <div>
      <h3 className="font-display text-4xl font-light leading-tight text-champagne-soft">A tower drawn in light.</h3>
      <p className="mt-4 text-sm leading-relaxed text-mist">
        AURELIA rises from a marble-clad podium in ten full-floor residences. Curved terraces wrap every level, their edges traced in warm architectural light, while a
        sculpted crown carries the gilded monogram above the skyline.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t hairline pt-6">
        {RESIDENCE_FACTS.map(([v, l]) => (
          <div key={l}>
            <div className="font-display text-3xl text-gradient-gold">{v}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-mist">{l}</div>
          </div>
        ))}
      </div>
      <ul className="mt-6 space-y-2 border-t hairline pt-6 text-sm text-mist">
        <li>— Floor-to-ceiling glazing on all four elevations</li>
        <li>— Nero marble, champagne metal and bronze-fin façade</li>
        <li>— Planted terraces on every residence</li>
        <li>— Double-height lobby with private drop-off</li>
      </ul>
      <button
        onClick={() => fromTower(() => openFloor(store.get().floor))}
        className="mt-8 w-full rounded-sm bg-champagne py-3 text-[11px] font-semibold uppercase tracking-luxe text-ink transition hover:bg-champagne-soft"
      >
        Step inside a residence
      </button>
    </div>
  )
}

function Amenities() {
  const items: [string, string, (() => void) | null][] = [
    ['Sky garden', 'Rooftop garden terrace beneath the sculpted crown.', () => fromTower(openRooftop)],
    ['Arrival hall', 'Double-height lobby, marble reception and chandelier rings.', () => store.set({ panel: 'lobby' })],
    ['Private terraces', 'Wrap-around planted terraces on every residence.', () => fromTower(() => openFloor(store.get().floor))],
    ['Water court', 'Illuminated water feature at the porte-cochère.', null],
    ['Private drop-off', 'Covered arrival with valet and concierge.', null],
  ]
  return (
    <div className="space-y-3">
      {items.map(([t, d, go]) => (
        <button
          key={t}
          onClick={go ?? undefined}
          disabled={!go}
          className="group flex w-full items-center justify-between rounded-sm border hairline px-4 py-4 text-left transition enabled:hover:border-champagne/60 enabled:hover:bg-champagne/5"
        >
          <span>
            <span className="block font-display text-2xl text-champagne-soft">{t}</span>
            <span className="mt-0.5 block text-xs text-mist">{d}</span>
          </span>
          {go && <span className="text-champagne transition group-hover:translate-x-1">→</span>}
        </button>
      ))}
    </div>
  )
}

function Lobby() {
  return (
    <div>
      <h3 className="font-display text-4xl font-light leading-tight text-champagne-soft">Arrive in light.</h3>
      <p className="mt-4 text-sm leading-relaxed text-mist">
        A double-height arrival hall behind full glazing: Nero marble, champagne-metal reveals and a pair of illuminated chandelier rings. A covered porte-cochère and water
        court lead from the street to the private lifts.
      </p>
      <ul className="mt-6 space-y-2 border-t hairline pt-6 text-sm text-mist">
        <li>— 24-hour concierge and valet</li>
        <li>— Private lift lobby for every residence</li>
        <li>— Illuminated water court at the entrance</li>
      </ul>
      <button onClick={() => store.set({ panel: 'contact' })} className="mt-8 w-full rounded-sm bg-champagne py-3 text-[11px] font-semibold uppercase tracking-luxe text-ink transition hover:bg-champagne-soft">
        Book a viewing
      </button>
    </div>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const floor = useStore((s) => s.floor)
  const mode = useStore((s) => s.mode)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const name = String(d.get('name') || '').trim()
    const email = String(d.get('email') || '').trim()
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Please enter your name and a valid email.')
      return
    }
    setErr(null)
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${d.get('phone') || '-'}`,
      `Preferred date: ${d.get('date') || '-'}`,
      `Residence of interest: ${d.get('floor') || '-'}`,
      '',
      String(d.get('message') || ''),
    ].join('\n')
    window.location.href = `mailto:${SITE.CONTACT_EMAIL}?subject=${encodeURIComponent('AURELIA — Private viewing request')}&body=${encodeURIComponent(body)}`
    setSent(true)
  }
  const field =
    'w-full rounded-sm border hairline bg-white/[0.03] px-3 py-2.5 text-sm text-champagne-soft placeholder:text-mist/50 focus:border-champagne/70 focus:outline-none'
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <h3 className="font-display text-3xl font-light text-champagne-soft">Arrange a private viewing</h3>
      <p className="pb-2 text-sm text-mist">
        Our residence advisors will confirm your appointment. Or email <span className="select-all text-champagne-soft">{SITE.CONTACT_EMAIL}</span>
      </p>
      <input name="name" placeholder="Full name" className={field} autoComplete="name" />
      <input name="email" type="email" placeholder="Email" className={field} autoComplete="email" />
      <input name="phone" type="tel" placeholder="Phone (optional)" className={field} autoComplete="tel" />
      <div className="grid grid-cols-2 gap-3">
        <input name="date" type="date" className={field} aria-label="Preferred date" />
        <select name="floor" className={field} defaultValue={mode === 'dollhouse' || mode === 'room' ? FLOORS[floor - 1].label : ''} aria-label="Residence of interest">
          <option value="" className="bg-ink">
            Any residence
          </option>
          {FLOORS.map((f) => (
            <option key={f.key} value={f.label} className="bg-ink">
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <textarea name="message" rows={3} placeholder="Message (optional)" className={field} />
      {err && <p className="text-xs text-red-300">{err}</p>}
      {sent && (
        <p className="text-xs leading-relaxed text-champagne">
          We tried to open your email app with the request filled in. If nothing opened, write to{' '}
          <span className="select-all font-medium underline underline-offset-2">{SITE.CONTACT_EMAIL}</span>.
        </p>
      )}
      <button type="submit" className="w-full rounded-sm bg-champagne py-3 text-[11px] font-semibold uppercase tracking-luxe text-ink transition hover:bg-champagne-soft">
        Email my request
      </button>
    </form>
  )
}
