// Footer.tsx
// The last thing on the site: brand, the way back to each page, and the legal line.
import { SITE } from '../data/site'
import { prefersReducedMotion } from '../hooks/useReducedMotion'

const LINKS = [
  ['The tower', null],
  ['Projects', 'projects'],
  ['Awards', 'awards'],
  ['Certificates', 'certificates'],
  ['Contact', 'contact'],
] as const

export function Footer({ nav = true }: { nav?: boolean }) {
  const go = (id: string | null) => {
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    if (id) document.getElementById(id)?.scrollIntoView({ behavior })
    else window.scrollTo({ top: 0, behavior })
  }
  return (
    <footer className="relative z-10 border-t border-champagne/15 bg-ink px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-10 sm:px-10 lg:px-14">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-display text-2xl font-light tracking-[0.42em] text-champagne-soft">{SITE.brand}</div>
          <p className="mt-3 font-display text-lg italic text-champagne">{SITE.tagline}</p>
        </div>
        {nav && (
          <nav aria-label="Site" className="flex flex-wrap gap-x-7 gap-y-1">
            {LINKS.map(([label, id]) => (
              <button key={label} onClick={() => go(id)} className="py-2 text-[10px] uppercase tracking-[0.26em] text-mist transition hover:text-champagne-soft">
                {label}
              </button>
            ))}
          </nav>
        )}
      </div>
      <div className="mx-auto mt-8 flex max-w-[1240px] flex-wrap justify-between gap-2 border-t border-champagne/10 pt-5 text-[11px] tracking-wide text-mist/70">
        <span>© {new Date().getFullYear()} {SITE.brand}. All rights reserved.</span>
        <span>Images are artist’s impressions.</span>
      </div>
    </footer>
  )
}

export default Footer
