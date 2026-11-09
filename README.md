# AURELIA — Cinematic Residences Website

A pre-rendered, photoreal tour of the AURELIA tower. All imagery is rendered in Blender Cycles
(`AURELIA_Cinematic.blend`) and played back in the browser on a single canvas.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · GSAP · Framer Motion

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/ — upload the whole folder to any static host
```

## The visitor's journey
1. **Tower (hero)**: hover a floor (or the floor list) and only that floor's lights stay on,
   using the per-floor renders. Click to enter.
2. **Floor lift**: the camera zooms into the floor, which slides out of the tower and opens
   up into a dollhouse view (100-frame sequence).
3. **Residence**: room hotspots, room thumbnails, and a level stepper (↑/↓) for the other floors.
   All ten levels share the typical plan.
4. **Rooms**: each room has a fly-in sequence that dissolves into a high-quality still.
   Use ←/→ to move between rooms. Back plays the flight in reverse.
5. **The Crown**: the rooftop sequence and still.
6. **Panels**: Discover, Amenities, Lobby, and Book a viewing (pre-filled email).

Esc always goes back. On phones, a first tap previews a floor and a second tap enters it; in the
residence and rooms you can drag sideways to look around the cropped frame.
`prefers-reduced-motion` replaces the flights with crossfades.

## Media pipeline
`tools/build-media.py <_render folder> public/media` converts the Blender output to WebP:
- stills and hero images at 1920 px, sequence frames at 1280 px
- writes `public/media/manifest.json`

Some room flights pass through a wall near the end. Those frames are cut, and the player
dissolves across the gap (`SEGMENTS` in the script). If you re-render, re-run the script.
Any image or sequence missing from the manifest falls back to a crossfade.

`src/data/layout.json` holds the floor outlines and room hotspot positions, projected from the
Blender cameras, so the overlays line up with the renders exactly.

## Edit before launch
- `src/data/site.ts`: contact inbox (`CONTACT_EMAIL`), floor availability, room names,
  areas and copy. **The figures are placeholders until the sales sheet is confirmed.**
- The booking form opens the visitor's email app. Connect it to a CRM or form backend for real
  lead capture.
