import Link from 'next/link'
import { SiteHeader } from '@/components/layout/SiteHeader'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="fp grid min-h-dvh place-items-center px-5 text-center" style={{ boxShadow: 'none' }}>
        <div>
          <div className="text-[10px] uppercase tracking-luxe text-bronze">404</div>
          <h1 className="mt-3 font-display text-5xl font-light text-ink sm:text-6xl">
            This page is <em className="text-bronze">not on the plans.</em>
          </h1>
          <Link href="/" className="mt-8 inline-block rounded-full bg-ink px-7 py-4 text-[11px] uppercase tracking-[0.28em] text-champagne-soft">
            Back to the tower
          </Link>
        </div>
      </main>
    </>
  )
}
