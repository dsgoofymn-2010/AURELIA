/**
 * Site content. Everything a sales team would edit lives here:
 * contact inbox, floor facts, room copy. Figures are placeholders until the
 * developer's sales sheet is confirmed.
 */
import layout from './layout.json'

export const SITE = {
  brand: 'AURELIA',
  tagline: 'Live beyond ordinary',
  supporting: 'Ten full-floor residences above the city, drawn in warm architectural light.',
  CONTACT_EMAIL: 'sales@aurelia-residences.com',
}

export type RoomId = 'living' | 'master' | 'bedroom2' | 'kitchen' | 'dining' | 'bathroom' | 'balcony'
export type HeroZone = 'rooftop' | 'ground' | `f${string}`

export interface Room {
  id: RoomId
  name: string
  area: string
  blurb: string
  features: string[]
}

export const ROOMS: Room[] = [
  {
    id: 'living',
    name: 'Living Room',
    area: '46 m²',
    blurb: 'A double-aspect salon opening onto the curved front terrace — oak floors, walnut feature wall and the city framed in floor-to-ceiling glass.',
    features: ['Floor-to-ceiling glazing', 'Walnut feature wall', 'Terrace access', 'Concealed lighting'],
  },
  {
    id: 'master',
    name: 'Master Suite',
    area: '34 m²',
    blurb: 'A quiet corner suite with its own terrace, upholstered headboard wall and dressing area, oriented to the evening sky.',
    features: ['Private terrace', 'Dressing area', 'Blackout drapery', 'Corner views'],
  },
  {
    id: 'bedroom2',
    name: 'Second Bedroom',
    area: '22 m²',
    blurb: 'A calm guest or family bedroom with full-height glazing behind the bronze slat screen and generous built-in storage.',
    features: ['Bronze slat screen', 'Built-in wardrobe', 'Rear outlook', 'Oak floors'],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    area: '19 m²',
    blurb: 'Tall integrated joinery, a stone island with seating and a full cooking line — designed to disappear when not in use.',
    features: ['Stone island', 'Integrated appliances', 'Tall pantry units', 'Island seating'],
  },
  {
    id: 'dining',
    name: 'Dining',
    area: '21 m²',
    blurb: 'An eight-seat dining room between kitchen and salon, lit by a sculptural pendant over the table.',
    features: ['Eight seats', 'Sculptural pendant', 'Open to kitchen', 'Foyer link'],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    area: '12 m²',
    blurb: 'Freestanding tub, double vanity and walk-in shower in warm stone, with a frosted privacy band to the façade.',
    features: ['Freestanding tub', 'Double vanity', 'Walk-in shower', 'Frosted privacy glass'],
  },
  {
    id: 'balcony',
    name: 'Terrace',
    area: '14 m²',
    blurb: 'The curved front terrace, edged in warm LED light and planted along the rail — the residence’s outdoor room.',
    features: ['Glass balustrade', 'Planted edge', 'LED-lit soffit', 'Lounge seating'],
  },
]

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<RoomId, Room>

export interface Floor {
  n: number
  key: string // f01..f10
  label: string // "Floor 07"
  status: 'Available' | 'Reserved'
}

export const FLOORS: Floor[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1
  return {
    n,
    key: `f${String(n).padStart(2, '0')}`,
    label: `Floor ${String(n).padStart(2, '0')}`,
    status: n === 3 || n === 8 ? 'Reserved' : 'Available',
  }
})

export const RESIDENCE_FACTS = [
  ['≈ 224 m²', 'Interior'],
  ['2', 'Bedrooms'],
  ['6', 'Terraces'],
  ['3.0 m', 'Ceilings'],
] as const

type Pt = [number, number]
export const LAYOUT = layout as unknown as {
  image: [number, number]
  hero_floors: Record<string, { poly: Pt[]; label: Pt }>
  dollhouse_rooms: Record<RoomId, Pt>
}

/** where the tower sits in the hero frame — used as the crop focal point on narrow screens */
export const HERO_FOCUS: Pt = [0.48, 0.55]

/**
 * Projects. The second page shows the ones with a film (FEATURED); the projects page shows
 * them all. Each film is a short clip of the building going up
 * (public/media/projects/<id>.mp4, with <id>.webp as the finished-building still).
 * Names and copy are placeholders: replace them with the real projects.
 */
export interface Project {
  id: string
  name: string
  kind: string
  blurb: string
  /** the three beats of the film, in order */
  stages: [string, string, string]
  /**
   * No film yet: the project is shown as a line drawing instead. [floors, bays] sets
   * the drawing's proportions. Remove this once <id>.mp4 and <id>.webp are in place.
   */
  sketch?: [number, number]
}

/**
 * Awards & achievements shown on the recognition page. Placeholder copy —
 * replace with the developer's real accolades. `image` is optional; leave it
 * out and the card shows a labelled placeholder.
 */
export interface Award {
  id: string
  title: string
  description: string
  /** awarding body or category, shown as the small caption on the medallion */
  kind: string
  /** year conferred */
  year: string
  image?: string
  [key: string]: unknown
}

export const AWARDS: Award[] = [
  { id: 'a1', title: 'Design Excellence', kind: 'Residential high-rise', year: '2025', description: 'Named residential high-rise of the year for form and liveability.' },
  { id: 'a2', title: 'Green Building', kind: 'Sustainability', year: '2025', description: 'Recognised for sustainable construction and energy performance.' },
  { id: 'a3', title: 'Architectural Merit', kind: 'Skyline', year: '2024', description: 'For the façade and its contribution to the city skyline.' },
  { id: 'a4', title: 'Luxury Living', kind: 'Premium homes', year: '2025', description: 'Honoured for the standard of its full-floor residences.' },
  { id: 'a5', title: 'Innovation Award', kind: 'Smart living', year: '2024', description: 'For smart-home integration delivered at building scale.' },
  { id: 'a6', title: 'Safety Standard', kind: 'Structure', year: '2025', description: 'Highest-grade structural safety and compliance rating.' },
  { id: 'a7', title: 'Interior Design', kind: 'Styling', year: '2024', description: 'For the styling and craft of the residence interiors.' },
  { id: 'a8', title: 'Developer of Note', kind: 'Delivery', year: '2025', description: 'For a regional record of trust and on-time delivery.' },
]

/**
 * Certificates & accreditations shown on the certificates page. Each card is a
 * formal credential — body that issued it, the title, and the year. Replace the
 * placeholders with the real certificates; add `image` to show a scan.
 */
export interface Certificate {
  id: string
  body: string
  title: string
  year: string
  image?: string
}

export const CERTIFICATES: Certificate[] = [
  { id: 'c1', body: 'RERA Tamil Nadu', title: 'Project Registration', year: '2025' },
  { id: 'c2', body: 'ISO 9001', title: 'Quality Management System', year: '2024' },
  { id: 'c3', body: 'IGBC', title: 'Green Homes — Gold Rating', year: '2025' },
  { id: 'c4', body: 'Chennai Corporation', title: 'Building Plan Approval', year: '2024' },
  { id: 'c5', body: 'ISO 14001', title: 'Environmental Management', year: '2024' },
  { id: 'c6', body: 'Fire & Rescue Services', title: 'No-Objection Certificate', year: '2025' },
]

export const PROJECTS: Project[] = [
  {
    id: 'tower',
    name: 'The Residential Tower',
    kind: 'High-rise living',
    blurb: 'A slender tower of stacked homes over a glazed double-height podium, with a balcony for every residence.',
    stages: ['Core and columns climb floor by floor', 'Balconies and glazing wrap the frame', 'The podium lights up at street level'],
  },
  {
    id: 'residences',
    name: 'The Courtyard Residences',
    kind: 'Mid-rise apartments',
    blurb: 'Eight storeys of classical proportion around a pool court: arched top floor, deep cornice, wrought balconies.',
    stages: ['Scaffold and frame rise together', 'Stone-toned façade closes the envelope', 'Pool court and terraces are finished'],
  },
  {
    id: 'hospital',
    name: 'The Medical Centre',
    kind: 'Healthcare',
    blurb: 'A clinical block and a glazed tower joined on one base, planned around daylight and short walking distances.',
    stages: ['Slabs and columns set the grid', 'Ribbon windows and curtain wall go on', 'Rooftop plant and signage complete it'],
  },
  {
    id: 'chapel',
    name: 'The Stone Chapel',
    kind: 'Place of worship',
    blurb: 'Rough-cut stone on a brick plinth, lancet windows and a slate spire: traditional craft, built to last.',
    stages: ['Stone walls rise from the brick base', 'Gables and traceried windows take shape', 'The spire and cross crown the tower'],
  },
  // ---- placeholders below: shown on the projects page only, until their films are rendered ----
  {
    id: 'harbour',
    name: 'The Harbour Offices',
    kind: 'Commercial',
    blurb: 'Twelve floors of column-free workspace behind a shaded glass front, set on the waterfront road.',
    stages: ['Piles and raft go in below the tide line', 'Steel frame and decks rise two floors a week', 'Shading fins and glazing close the front'],
    sketch: [12, 6],
  },
  {
    id: 'school',
    name: 'The Garden School',
    kind: 'Education',
    blurb: 'Low classroom wings around a planted court, with deep verandas so every room opens to shade.',
    stages: ['Wings are set out around the old trees', 'Brick walls and verandas go up', 'The court is planted and the gates open'],
    sketch: [3, 8],
  },
  {
    id: 'villas',
    name: 'The Palm Villas',
    kind: 'Private homes',
    blurb: 'A row of courtyard villas in lime plaster and timber, each with its own pool and garden wall.',
    stages: ['Garden walls mark out each plot', 'Roofs and timber screens are fixed', 'Pools are filled and the palms go in'],
    sketch: [2, 5],
  },
  {
    id: 'hotel',
    name: 'The Marina Hotel',
    kind: 'Hospitality',
    blurb: 'A curved tower of sea-facing rooms over a lobby, ballroom and rooftop pool deck.',
    stages: ['The curved core climbs first', 'Room floors follow, balcony by balcony', 'Lobby, ballroom and pool deck are fitted'],
    sketch: [16, 5],
  },
  {
    id: 'arcade',
    name: 'The Arcade',
    kind: 'Retail',
    blurb: 'Three levels of shops along a daylit internal street, with parking tucked below.',
    stages: ['Basement parking is dug and cast', 'The long roof light is lifted into place', 'Shopfronts and paving finish the street'],
    sketch: [4, 9],
  },
  {
    id: 'library',
    name: 'The Civic Library',
    kind: 'Public building',
    blurb: 'A stone reading hall under a folded roof, with a quiet garden court at its centre.',
    stages: ['Stone piers are raised around the court', 'The folded roof spans the hall', 'Shelving, lamps and the garden are set'],
    sketch: [5, 7],
  },
  {
    id: 'lofts',
    name: 'The Mill Lofts',
    kind: 'Adaptive reuse',
    blurb: 'An old brick mill kept and opened up as tall loft homes, with a new glass storey on the roof.',
    stages: ['The mill is stripped back to brick and iron', 'New floors and windows are threaded in', 'A glass storey is added on the roof'],
    sketch: [7, 7],
  },
  {
    id: 'campus',
    name: 'The Tech Campus',
    kind: 'Workplace',
    blurb: 'Four linked office blocks around a shaded plaza, planned for natural light and cross-breeze.',
    stages: ['Four cores rise together', 'Bridges link the blocks at every third floor', 'The plaza is paved, planted and shaded'],
    sketch: [9, 8],
  },
]

/** the projects with a film: these are the ones on the second page */
export const FEATURED = PROJECTS.filter((p) => !p.sketch)
