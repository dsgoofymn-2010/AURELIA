'use client'
// SiteHeader.tsx
// The floating glass navigation bar for the pages outside the tower: Home, Projects,
// Awards, Contact. The current page is worked out from the address.
//
// `tone` matches the page underneath: 'light' over the paper pages, 'dark' over ink.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE } from '@/data/site'

const ITEMS = [
  { label: 'Home', href: '/', match: (p: string) => p === '/' },
  { label: 'Projects', href: '/projects', match: (p: string) => p.startsWith('/projects') },
  { label: 'Awards', href: '/#awards', match: () => false },
  { label: 'Contact', href: '/contact', match: (p: string) => p.startsWith('/contact') },
]

export function SiteHeader({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const path = usePathname() ?? '/'
  return (
    <header className="nav-wrap">
      <nav className="nav-glass" data-tone={tone} aria-label="Site">
        <Link href="/" className="nav-brand" aria-label={`${SITE.brand} home`}>
          <span className="nav-mark" aria-hidden>
            A
          </span>
          <span className="nav-word">{SITE.brand}</span>
        </Link>
        <ul className="nav-list">
          {ITEMS.map((it) => (
            <li key={it.label}>
              <Link href={it.href} className="nav-link" aria-current={it.match(path) ? 'page' : undefined}>
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default SiteHeader
