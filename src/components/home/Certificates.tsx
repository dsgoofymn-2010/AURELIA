// Certificates.tsx
// The certificates page: a sheet of the same drawing paper as the projects page,
// carrying the development's formal credentials — RERA, ISO, green ratings, approvals.
//
// Built to stay smooth on weak phones: the cards are a plain CSS grid, each one
// reveals with an IntersectionObserver (transform + opacity only, no per-scroll
// script), and nothing here decodes video or runs a timer.

import { useEffect, useRef, type CSSProperties } from 'react'
import { CERTIFICATES, SITE, type Certificate } from '../../data/site'
import './Certificates.css'

/** a formal seal drawn in SVG — no image needed, scales crisply on every screen */
function Seal() {
  return (
    <svg className="cert-seal" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <circle cx="24" cy="20" r="13" />
      <circle cx="24" cy="20" r="9" opacity="0.5" />
      <path d="M24 13.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7z" />
      <path d="M18 31l-3 11 9-4.5 9 4.5-3-11" />
    </svg>
  )
}

function Card({ cert, i }: { cert: Certificate; i: number }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-in')
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <article ref={ref} className="cert-card" style={{ '--i': i } as CSSProperties}>
      {cert.image ? (
        <img className="cert-scan" src={cert.image} alt={`${cert.body} — ${cert.title}`} loading="lazy" decoding="async" />
      ) : (
        <Seal />
      )}
      <div className="cert-body">
        <div className="cert-issuer">{cert.body}</div>
        <h3 className="cert-title">{cert.title}</h3>
      </div>
      <div className="cert-foot">
        <span className="cert-verified">Verified</span>
        <span className="cert-year tabular-nums">{cert.year}</span>
      </div>
    </article>
  )
}

export function Certificates() {
  return (
    <section id="certificates" className="cert" aria-labelledby="cert-title">
      <div className="cert-wrap">
        {/* header, matching the projects page rhythm */}
        <div className="cert-top">
          <div className="font-display text-xl font-light tracking-[0.42em] text-ink">{SITE.brand}</div>
          <div className="text-[10px] uppercase tracking-luxe text-bronze">Trust &amp; compliance</div>
        </div>

        <header className="cert-head">
          <div className="text-[10px] uppercase tracking-luxe text-bronze">Certificates &amp; accreditations</div>
          <h2 id="cert-title" className="cert-h2">
            Approved, rated and <em className="text-bronze">on the record.</em>
          </h2>
          <p className="cert-sub">Every credential behind the build — registrations, quality standards and green ratings, issued and verifiable.</p>
        </header>

        <div className="cert-grid">
          {CERTIFICATES.map((c, i) => (
            <Card key={c.id} cert={c} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Certificates
