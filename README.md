# AURELIA — Cinematic Residences Website

A pre-rendered, photoreal tour of the AURELIA tower. All imagery is rendered in Blender Cycles
(`AURELIA_Cinematic.blend`) and played back in the browser on a single canvas.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP · Framer Motion.
Contact inquiries are stored and emailed by the FastAPI service in `backend/`.

```bash
npm install
npm run dev        # http://localhost:3000 (the contact form answers as a demo without the backend)
npm run build      # production build: every page is prerendered, /api/inquiries runs on the server
npm run start      # serve the production build
npm run typecheck
```

| Variable | Where | What |
| --- | --- | --- |
| `INQUIRY_API_URL` | server | Base URL of the FastAPI inquiries service, e.g. `http://localhost:8000`. Required in production: without it the form refuses rather than losing leads. |

**Hosting on AWS:** the site needs a Node runtime for `/api/inquiries`, so deploy with AWS Amplify
Hosting (Next.js SSR), or run `npm run build && npm run start` on EC2 / ECS / App Runner behind
CloudFront. Run the FastAPI backend alongside it and point `INQUIRY_API_URL` at it.

## Code layout

```
src/
  app/                          routes
    page.tsx                    home: the tower, featured projects, awards, certificates, contact
    projects/page.tsx           every project, in category rows
    projects/[slug]/page.tsx    one project (prerendered for each), swipe on to the others
    contact/page.tsx            contact (/contacts redirects here)
    api/inquiries/route.ts      validates the form and passes it to the FastAPI service
  components/
    layout/                     SiteHeader (glass nav), SiteFooter, PageContainer
    home/                       HomeHero, Home3DScene, FeaturedProjectStoryboard, Awards, Certificates
      scene/                    the tower experience: canvas renderer, film player, director, store,
                                residence / room / rooftop / panel UI. Browser-only and home-only:
                                Home3DScene loads it with next/dynamic (ssr: false)
    projects/                   ProjectCategoryRow, ProjectCard, ProjectCarousel,
                                ProjectGallery (film or rising image), ProjectDetails (story)
    contact/InquiryForm.tsx
  lib/                          media loader, device tier, inquiry validation, reduced motion
  data/                         site copy, projects, awards and certificates (placeholders)
  types/                        Project, Award, Certificate
public/media/                   everything the site loads (built by tools/build-media.py)
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
7. **Featured projects (page two)**: scroll down from the tower. Four projects, each with a short
   film of the building going up. The film plays when its slide is shown; swipe, use the arrows
   or pick a project to move between them. The page only scrolls from the tower view.

Esc always goes back. On phones, a first tap previews a floor and a second tap enters it; in the
residence and rooms you can drag sideways to look around the cropped frame.
`prefers-reduced-motion` replaces the flights with crossfades.

## Media pipeline
`python tools/build-media.py _render public/media` converts the Blender output for the web.
It needs ffmpeg: either on PATH, or `pip install imageio-ffmpeg`.
- hero images and stills become 1920 px WebP
- every camera move (lift, rooftop, room fly-ins) becomes a short H.264 film in `public/media/film/`,
  in two sizes (`hd` 1280x720, `sd` 960x540) and two directions. Browsers cannot play video
  backwards, so going back plays the reversed file (`.rev.mp4`)
- writes `public/media/manifest.json`

Films replaced the folders of WebP frames: one request per move instead of 36 to 100, decoding on
the device's video hardware, and a few megabytes of memory instead of every frame held decoded.
`src/lib/tier.ts` picks `sd` for phones and low-memory devices, and also turns off the blur and
film grain there. Add `?tier=hd` or `?tier=sd` to the address to force one while testing.

Some room flights pass through a wall near the end. Those frames are cut (`SEGMENTS` in the
script) and a dissolve across the gap is baked into the film. If you re-render, re-run the script.
A film missing from the manifest, or one the browser refuses to play, falls back to a crossfade.

The project films on page two are in `public/media/projects/` (`<id>.mp4` plus `<id>.webp`, the
finished building, shown when films do not autoplay). To add one, encode it the same way:
`ffmpeg -i in.mp4 -an -vf scale=720:1280 -c:v libx264 -crf 25 -movflags +faststart <id>.mp4`

`src/data/layout.json` holds the floor outlines and room hotspot positions, projected from the
Blender cameras, so the overlays line up with the renders exactly.

## Edit before launch
- `src/data/site.ts`: contact inbox (`CONTACT_EMAIL`), floor availability, room names,
  areas and copy. **The figures are placeholders until the sales sheet is confirmed.**
- `src/data/projects.ts`: the names and copy of all projects are placeholders. The 8 without a
  film use AI-generated renders; add `<id>.mp4` to `public/media/projects/` and drop `noFilm` to
  give one its construction film.
- `src/data/recognition.ts`: awards and certificates are placeholders. Do not publish
  credentials the developer does not hold.
- Set `INQUIRY_API_URL` and the backend's SES settings (`backend/README.md`) before launch.
