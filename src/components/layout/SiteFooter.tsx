// SiteFooter.tsx
// The last thing on every page: brand, links to each part of the site, the legal line.
import Link from 'next/link'
import { SITE } from '@/data/site'
import { PageContainer } from './PageContainer'

const LINKS = [
  ['The tower', '/'],
  ['Projects', '/projects'],
  ['Awards', '/#awards'],
  ['Certificates', '/#certificates'],
  ['Contact', '/contact'],
] as const

// pages are prerendered, so this is the year of the latest build
const YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-champagne/15 bg-ink pb-[max(28px,env(safe-area-inset-bottom))] pt-10">
      <PageContainer>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-display text-2xl font-light tracking-[0.42em] text-champagne-soft">{SITE.brand}</div>
            <p className="mt-3 font-display text-lg italic text-champagne">{SITE.tagline}</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-1">
            {LINKS.map(([label, href]) => (
              <Link key={label} href={href} className="py-2 text-[10px] uppercase tracking-[0.26em] text-mist transition hover:text-champagne-soft">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-champagne/10 pt-5 text-[11px] tracking-wide text-mist/70">
          <span>
            © {YEAR} {SITE.brand}. All rights reserved.
          </span>
          <span>Images are artist’s impressions.</span>
        </div>
      </PageContainer>
    </footer>
  )
}

export default SiteFooter
