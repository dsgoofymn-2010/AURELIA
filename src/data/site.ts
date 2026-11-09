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
  label: string // "Level 07"
  status: 'Available' | 'Reserved'
}

export const FLOORS: Floor[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1
  return {
    n,
    key: `f${String(n).padStart(2, '0')}`,
    label: `Level ${String(n).padStart(2, '0')}`,
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
