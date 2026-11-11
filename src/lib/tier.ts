/**
 * Device tier. Decided once at startup and used to pick film resolution, canvas
 * density and which decorative effects run.
 *
 *   hd: 1280x720 films, canvas up to 2x, blur + animated grain
 *   sd: 960x540 films, canvas up to 1.5x, flat panels, still grain
 *
 * A device is `sd` when it is a phone, reports little memory or few cores, or
 * the visitor asked for reduced data. `lite` additionally stops background
 * preloading: films are fetched only when the visitor asks for them.
 */
type Conn = { saveData?: boolean; effectiveType?: string }
type Nav = Navigator & { deviceMemory?: number; connection?: Conn }

export type Tier = 'hd' | 'sd'

function detect(): { tier: Tier; lite: boolean } {
  if (typeof window === 'undefined') return { tier: 'hd', lite: false }
  const forced = new URLSearchParams(location.search).get('tier')
  const nav = navigator as Nav
  const conn = nav.connection
  const slowNet = !!conn && (conn.saveData === true || /(^|-)2g$|^3g$/.test(conn.effectiveType ?? ''))
  if (forced === 'hd' || forced === 'sd') return { tier: forced, lite: slowNet }
  const phone = Math.min(screen.width, screen.height) < 600
  const weak = (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4
  return { tier: phone || weak || slowNet ? 'sd' : 'hd', lite: slowNet }
}

const d = detect()
export const TIER: Tier = d.tier
/** slow connection or Data Saver: load nothing the visitor has not asked for */
export const LITE = d.lite
export const MAX_DPR = TIER === 'sd' ? 1.5 : 2

if (typeof document !== 'undefined') document.documentElement.dataset.tier = TIER
