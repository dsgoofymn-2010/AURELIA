'use client'
// SiteHeader.tsx
// Unified floating glass navigation bar for Aurelia.
//
// In Hero mode (top of home page):
//   Renders as a compact glass capsule in the top-right corner (matching screenshot 2)
//   without disturbing the underlying 3D tower animation or interactions.
//
// When scrolled past the hero section (or on other pages):
//   Smoothly and continuously expands into the full-width floating glass pill (matching screenshot 3)
//   revealing the brand monogram and name on the left and navigation links on the right.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { SITE } from '@/data/site'
import { prefersReducedMotion } from '@/lib/reducedMotion'
import { useStore } from '@/components/home/scene/store'
import { useMediaQuery } from '@/components/home/scene/useMediaQuery'

const NAV_ITEMS = [
  { id: 'home', label: 'HOME', href: '/', sectionId: 'tower-window' },
  { id: 'projects', label: 'PROJECTS', href: '/projects', sectionId: 'projects' },
  { id: 'awards', label: 'AWARDS', href: '/#awards', sectionId: 'awards' },
  { id: 'contact', label: 'CONTACT', href: '/contact', sectionId: 'contact' },
] as const

interface SiteHeaderProps {
  tone?: 'light' | 'dark'
}

export function SiteHeader({ tone = 'light' }: SiteHeaderProps) {
  const pathname = usePathname() ?? '/'
  const isHome = pathname === '/'
  const isSmall = useMediaQuery('(max-width: 640px)')

  // Track 3D scene state: if exploring a residence, room, dollhouse or panel is open,
  // hide the nav bar so it does not disturb the 3D walkthrough or back controls.
  const mode = useStore((s) => s.mode)
  const panel = useStore((s) => s.panel)
  const is3DExploring = isHome && ((mode !== 'hero' && mode !== 'loading') || !!panel)

  const [isHero, setIsHero] = useState(isHome)
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (pathname.startsWith('/projects')) return 'projects'
    if (pathname.startsWith('/contact')) return 'contact'
    return 'home'
  })

  // Smooth scroll tracking on the home page with hysteresis and rAF
  useEffect(() => {
    if (!isHome) return

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollY = window.scrollY

        // Hysteresis: expands at scrollY > 60, smoothly contracts back at scrollY < 25
        setIsHero((prev) => {
          if (prev && scrollY > 60) return false
          if (!prev && scrollY < 25) return true
          return prev
        })

        // Section tracking for active pill indicator
        const projectsEl = document.getElementById('projects')
        const awardsEl = document.getElementById('awards')
        const contactEl = document.getElementById('contact')

        const projectsTop = projectsEl ? projectsEl.offsetTop - 260 : window.innerHeight * 0.75
        const awardsTop = awardsEl ? awardsEl.offsetTop - 260 : Infinity
        const contactTop = contactEl ? contactEl.offsetTop - 260 : Infinity

        if (scrollY >= contactTop) {
          setActiveSection('contact')
        } else if (scrollY >= awardsTop) {
          setActiveSection('awards')
        } else if (scrollY >= projectsTop) {
          setActiveSection('projects')
        } else {
          setActiveSection('home')
        }

        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  // Handle clicking navigation links
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, item: (typeof NAV_ITEMS)[number]) => {
    if (isHome) {
      if (item.id === 'home') {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
        setActiveSection('home')
      } else {
        const el = document.getElementById(item.sectionId)
        if (el) {
          e.preventDefault()
          el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
          setActiveSection(item.id)
        }
      }
    }
  }

  // Determine current active item
  const currentActive = isHome
    ? activeSection
    : pathname.startsWith('/projects')
      ? 'projects'
      : pathname.startsWith('/contact')
        ? 'contact'
        : 'home'


  return (
    <header
      className={`fixed inset-x-0 z-50 pointer-events-none px-4 sm:px-8 lg:px-12 pt-3 sm:pt-4 flex transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        is3DExploring ? '-top-4 opacity-0' : 'top-0 opacity-100'
      }`}
    >
      <motion.nav
        layout
        data-tone={tone}
        aria-label="Site"
        transition={{
          layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
        }}
        className={`pointer-events-auto flex items-center justify-between rounded-full nav-glass py-1.5 relative ${
          isHome && isHero
            ? 'ml-auto mr-0 w-auto'
            : 'mx-auto w-full max-w-[1128px]'
        }`}
        style={{
          paddingLeft: isHome && isHero ? 8 : (isSmall ? 12 : 18),
          paddingRight: isHome && isHero ? 8 : (isSmall ? 8 : 12),
        }}
      >
        {/* Brand Monogram & Name - smoothly expands when passing hero */}
        <motion.div
          animate={{
            width: isHome && isHero ? 0 : 'auto',
            opacity: isHome && isHero ? 0 : 1,
            x: isHome && isHero ? -14 : 0,
          }}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="overflow-hidden flex items-center shrink-0 pr-2 sm:pr-6"
          style={{ pointerEvents: isHome && isHero ? 'none' : 'auto' }}
        >
          <Link
            href="/"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
                setActiveSection('home')
              }
            }}
            className="flex items-center gap-2 sm:gap-3 no-underline group shrink-0"
            aria-label={`${SITE.brand} home`}
          >
            <span
              className="grid w-7 h-7 sm:w-8 sm:h-8 place-items-center rounded-full border border-champagne/60 font-display font-semibold text-[15px] sm:text-[16px] leading-none text-champagne transition-colors group-hover:border-champagne shrink-0"
              aria-hidden
            >
              A
            </span>
            <span className="font-display text-[15px] sm:text-[17px] font-semibold tracking-[0.38em] sm:tracking-[0.42em] text-gradient-gold whitespace-nowrap">
              {SITE.brand}
            </span>
          </Link>
        </motion.div>

        {/* Navigation items capsule */}
        <ul className="flex items-center gap-0.5 sm:gap-1.5 m-0 p-0 list-none ml-auto shrink-0">
          {NAV_ITEMS.map((item) => {
            const active = currentActive === item.id
            return (
              <li key={item.id} className="relative shrink-0">
                <Link
                  href={item.href}
                  onClick={(e) => handleClick(e, item)}
                  className="relative block rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.24em] transition-colors duration-200 no-underline px-3 py-2 sm:px-4 sm:py-2 select-none whitespace-nowrap hover:bg-champagne/10"
                  aria-current={active ? 'page' : undefined}
                >
                  {/* Active capsule rendered directly above glass background */}
                  {active && (
                    <motion.span
                      layoutId="activeNavCapsule"
                      className="absolute inset-0 bg-[#0b0a10] border border-champagne/40 rounded-full z-0 shadow-[0_0_15px_rgba(217,185,138,0.12)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  {/* Text layer: signature website gold */}
                  <span
                    className={`relative z-10 transition-colors duration-200 whitespace-nowrap ${
                      active
                        ? 'text-champagne font-bold drop-shadow-[0_0_8px_rgba(217,185,138,0.3)]'
                        : 'text-champagne font-medium hover:text-champagne-soft'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </motion.nav>
    </header>
  )
}

export default SiteHeader
