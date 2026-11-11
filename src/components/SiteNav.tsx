// SiteNav.tsx
// The floating glass navigation bar for the pages outside the tower: the projects page
// and the contact page. Home, Projects, Awards, Contact.
//
// `tone` matches the page underneath: 'light' over the paper pages, 'dark' over ink.

import { Link } from 'react-router-dom'
import { SITE } from '../data/site'

type Item = 'home' | 'projects' | 'awards' | 'contact'

const ITEMS: { id: Item; label: string; to: string }[] = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'projects', label: 'Projects', to: '/projects' },
  { id: 'awards', label: 'Awards', to: '/#awards' },
  { id: 'contact', label: 'Contact', to: '/contacts' },
]

export function SiteNav({ current, tone = 'light' }: { current?: Item; tone?: 'light' | 'dark' }) {
  return (
    <header className="nav-wrap">
      <nav className="nav-glass" data-tone={tone} aria-label="Site">
        <Link to="/" className="nav-brand" aria-label={`${SITE.brand} home`}>
          <span className="nav-mark" aria-hidden>
            A
          </span>
          <span className="nav-word">{SITE.brand}</span>
        </Link>
        <ul className="nav-list">
          {ITEMS.map((it) => (
            <li key={it.id}>
              <Link to={it.to} className="nav-link" aria-current={current === it.id ? 'page' : undefined}>
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default SiteNav
