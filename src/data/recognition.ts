/**
 * Awards and certificates. Placeholder copy: replace with the developer's real
 * accolades and credentials before going live. Add `image` to any entry to show a
 * photo or scan in place of the drawn medallion / seal.
 */
import type { Award, Certificate } from '@/types/recognition'

export const AWARDS: Award[] = [
  { id: 'a1', title: 'Design Excellence', kind: 'Residential high-rise', year: '2025', description: 'Named residential high-rise of the year for form and liveability.', image: '/media/awards/design-excellence.png' },
  { id: 'a2', title: 'Green Building', kind: 'Sustainability', year: '2025', description: 'Recognised for sustainable construction and energy performance.', image: '/media/awards/green-building1.png' },
  { id: 'a3', title: 'Architectural Merit', kind: 'Skyline', year: '2024', description: 'For the façade and its contribution to the city skyline.', image: '/media/awards/architectural-merit.png' },
  { id: 'a4', title: 'Luxury Living', kind: 'Premium homes', year: '2025', description: 'Honoured for the standard of its full-floor residences.', image: '/media/awards/luxury-living.png' },
  { id: 'a5', title: 'Innovation Award', kind: 'Smart living', year: '2024', description: 'For smart-home integration delivered at building scale.', image: '/media/awards/smart-living.png' },
  { id: 'a6', title: 'Safety Standard', kind: 'Structure', year: '2025', description: 'Highest-grade structural safety and compliance ratg .', image: '/media/awards/safety-standards.png' },
  { id: 'a7', title: 'Interior Design', kind: 'Styling', year: '2024', description: 'For the styling and craft of the residence interiors.', image: '/media/awards/interior-design.png' },
  { id: 'a8', title: 'Developer of Note', kind: 'Delivery', year: '2025', description: 'For a regional record of trust and on-time delivery.', image: '/media/awards/developer-of-note.png' },
]


export const CERTIFICATES: Certificate[] = [
  { id: 'c1', body: 'RERA Tamil Nadu', title: 'Project Registration', year: '2025' },
  { id: 'c2', body: 'ISO 9001', title: 'Quality Management System', year: '2024' },
  { id: 'c3', body: 'IGBC', title: 'Green Homes — Gold Rating', year: '2025' },
  { id: 'c4', body: 'Chennai Corporation', title: 'Building Plan Approval', year: '2024' },
  { id: 'c5', body: 'ISO 14001', title: 'Environmental Management', year: '2024' },
  { id: 'c6', body: 'Fire & Rescue Services', title: 'No-Objection Certificate', year: '2025' },
]

