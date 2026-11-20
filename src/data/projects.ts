/**
 * Projects. Each one has a finished-building image (public/media/projects/<id>.webp)
 * and, unless it is marked noFilm, a short film of it going up (<id>.mp4).
 * The home page's second page shows the ones with a film; /projects shows them all.
 * Names and copy are placeholders: replace them with the real projects.
 */
import type { Project, ProjectCategory } from '@/types/project'

export const PROJECTS: Project[] = [
  {
    id: 'tower',
    category: 'residential',
    name: 'The Residential Tower',
    kind: 'High-rise living',
    blurb: 'A slender tower of stacked homes over a glazed double-height podium, with a balcony for every residence.',
    stages: ['Core and columns climb floor by floor', 'Balconies and glazing wrap the frame', 'The podium lights up at street level'],
  },
  {
    id: 'residences',
    category: 'residential',
    name: 'The Courtyard Residences',
    kind: 'Mid-rise apartments',
    blurb: 'Eight storeys of classical proportion around a pool court: arched top floor, deep cornice, wrought balconies.',
    stages: ['Scaffold and frame rise together', 'Stone-toned façade closes the envelope', 'Pool court and terraces are finished'],
  },
  {
    id: 'hospital',
    category: 'civic',
    name: 'The Medical Centre',
    kind: 'Healthcare',
    blurb: 'A clinical block and a glazed tower joined on one base, planned around daylight and short walking distances.',
    stages: ['Slabs and columns set the grid', 'Ribbon windows and curtain wall go on', 'Rooftop plant and signage complete it'],
  },
  {
    id: 'chapel',
    category: 'civic',
    name: 'The Stone Chapel',
    kind: 'Place of worship',
    blurb: 'Rough-cut stone on a brick plinth, lancet windows and a slate spire: traditional craft, built to last.',
    stages: ['Stone walls rise from the brick base', 'Gables and traceried windows take shape', 'The spire and cross crown the tower'],
  },
  // ---- below: AI-generated renders, no film yet; shown on the projects page only ----
  {
    id: 'harbour',
    category: 'commercial',
    name: 'The Harbour Offices',
    kind: 'Commercial',
    blurb: 'Twelve floors of column-free workspace behind a shaded glass front, set on the waterfront road.',
    stages: ['Piles and raft go in below the tide line', 'Steel frame and decks rise two floors a week', 'Shading fins and glazing close the front'],
    noFilm: true,
  },
  {
    id: 'school',
    category: 'civic',
    name: 'The Garden School',
    kind: 'Education',
    blurb: 'Low classroom wings around a planted court, with deep verandas so every room opens to shade.',
    stages: ['Wings are set out around the old trees', 'Brick walls and verandas go up', 'The court is planted and the gates open'],
    noFilm: true,
  },
  {
    id: 'villas',
    category: 'residential',
    name: 'The Palm Villas',
    kind: 'Private homes',
    blurb: 'A row of courtyard villas in lime plaster and timber, each with its own pool and garden wall.',
    stages: ['Garden walls mark out each plot', 'Roofs and timber screens are fixed', 'Pools are filled and the palms go in'],
    noFilm: true,
  },
  {
    id: 'hotel',
    category: 'commercial',
    name: 'The Marina Hotel',
    kind: 'Hospitality',
    blurb: 'A curved tower of sea-facing rooms over a lobby, ballroom and rooftop pool deck.',
    stages: ['The curved core climbs first', 'Room floors follow, balcony by balcony', 'Lobby, ballroom and pool deck are fitted'],
    noFilm: true,
  },
  {
    id: 'arcade',
    category: 'commercial',
    name: 'The Arcade',
    kind: 'Retail',
    blurb: 'Three levels of shops along a daylit internal street, with parking tucked below.',
    stages: ['Basement parking is dug and cast', 'The long roof light is lifted into place', 'Shopfronts and paving finish the street'],
    noFilm: true,
  },
  {
    id: 'library',
    category: 'civic',
    name: 'The Civic Library',
    kind: 'Public building',
    blurb: 'A stone reading hall under a folded roof, with a quiet garden court at its centre.',
    stages: ['Stone piers are raised around the court', 'The folded roof spans the hall', 'Shelving, lamps and the garden are set'],
    noFilm: true,
  },
  {
    id: 'lofts',
    category: 'residential',
    name: 'The Mill Lofts',
    kind: 'Adaptive reuse',
    blurb: 'An old brick mill kept and opened up as tall loft homes, with a new glass storey on the roof.',
    stages: ['The mill is stripped back to brick and iron', 'New floors and windows are threaded in', 'A glass storey is added on the roof'],
    noFilm: true,
  },
  {
    id: 'campus',
    category: 'commercial',
    name: 'The Tech Campus',
    kind: 'Workplace',
    blurb: 'Four linked office blocks around a shaded plaza, planned for natural light and cross-breeze.',
    stages: ['Four cores rise together', 'Bridges link the blocks at every third floor', 'The plaza is paved, planted and shaded'],
    noFilm: true,
  },
]


/** the projects with a film: these are the ones on the home page's second page */
export const FEATURED = PROJECTS.filter((p) => !p.noFilm)

export const CATEGORIES: { id: ProjectCategory; label: string; blurb: string }[] = [
  { id: 'residential', label: 'Residential', blurb: 'Towers, apartments and private homes.' },
  { id: 'commercial', label: 'Commercial & hospitality', blurb: 'Offices, retail and hotels.' },
  { id: 'civic', label: 'Civic & community', blurb: 'Healthcare, education, culture and worship.' },
]

export const projectBySlug = (slug: string) => PROJECTS.find((p) => p.id === slug)
