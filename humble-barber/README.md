# The Humble Barber London

A React + Three.js marketing site for The Humble Barber London, a barber
shop at 157 King's Cross Rd, London WC1X 9BN.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Three.js via `@react-three/fiber` / `@react-three/drei` — the hero's
  scroll-driven 3D scene
- GSAP `ScrollTrigger` — drives 2D reveal animations from scroll position
  (the 3D scene reads scroll progress directly, see below)

## Run it

```bash
cd humble-barber
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## The hero 3D scene

`src/three/` holds a procedurally-generated instanced "flap grid" — no
external 3D model or texture files, so there's nothing to fetch and nothing
that can 404. The concept is drawn from two things genuinely true of this
business: it sits a short walk from King's Cross station, famous for its
analogue split-flap departure boards, and it's known for skin fades — a
literal radial gradient. As you scroll through the hero:

1. A grid of ~98 tiles (`FlapGrid.tsx`), like a departure board, each
   mechanically "flips" (a scroll-scrubbed rotation) at a staggered moment —
   lighting up navy-to-amber as they turn, like a board updating.
2. The tiles migrate from their rectangular grid into a radial phyllotaxis
   arrangement as the camera pulls back.
3. The radial arrangement recolors into a literal fade gradient — amber at
   the center, cyan at the rim — while headline copy pins and changes
   alongside it.
4. The whole scene dissolves into the page's real content.

It also tilts subtly toward the pointer (desktop) or device orientation
(mobile, where permitted) — `src/hooks/usePointerTilt.ts`.

**Fallbacks are real, not decorative:** `src/hooks/useWebGLSupport.ts` and
`usePrefersReducedMotion.ts` gate the 3D scene — no WebGL, a low-power
device, or `prefers-reduced-motion: reduce` all fall back to
`HeroFallback.tsx`, a static CSS gradient in the same amber/cyan palette.
The 3D scene itself is lazy-loaded (`React.lazy` in `Hero.tsx`) so Three.js
never blocks first paint; check `dist/` after a build — `Hero3D-*.js` is its
own chunk.

## Fonts

Self-hosted, not loaded from Google Fonts / Fontshare (no external request
at runtime): Bricolage Grotesque (display headlines), IBM Plex Mono
(kickers/stats/prices — the signage/departure-board voice), Instrument Sans
(body) — files in `public/fonts/`, declared via `@font-face` in
`src/index.css`, and registered as real Tailwind v4 theme tokens (`@theme`
block) so `font-mono` etc. resolve to the actual fonts.

## Content

All real business facts (address, phone, hours, services, amenities) live
in one place: `src/data/business.ts`. Edit there, not in components.

- **The "no surprises on the bill" note** in the Services section directly
  addresses a real theme from customer feedback (a minority of reviews
  mention unexpected charges) — it's a genuine trust-building line, not
  boilerplate. `pricingNote` in `business.ts`.
- **Prices** are `£XX` placeholders throughout — search `£XX` to find every
  spot and drop in real pricing.
- **Testimonials** (`src/data/business.ts`) are representative copy written
  from the reputation themes in the client brief, not real named
  reviewers — swap in real reviews when available.
- **Photos** are real, licensed stock photography from Pexels (not
  AI-generated) — every image is documented in `galleryImages` /
  `heroImage` / `aboutImage` / `atmosphereImage` in `business.ts`, with a
  `sourceUrl` back to Pexels, and the footer renders a collapsible photo
  credits list on the live site. **This build environment could not load
  external images to visually verify them** (its network policy blocks
  outbound requests) — click through each `sourceUrl` before publishing to
  confirm they render and look right, and swap them for real shop/staff
  photos whenever those exist. Every photo renders through
  `src/components/ui/Photo.tsx`, which falls back to a styled placeholder
  tile (icon + label) if an image ever fails to load, instead of a broken
  image icon — real production behavior, not just a preview workaround.
- **Map**: `business.mapEmbedUrl` is a keyless Google Maps embed. For a
  pin-accurate result or analytics, swap in a Google Maps Embed API key.
- **Social links**: footer Instagram/Facebook/TikTok icons point to `#` —
  add real profile URLs.

## Deploying

Static output from `npm run build` (`dist/`) — deploy to Netlify, Vercel,
Cloudflare Pages, or any static host.

## Generating a single-file preview

`vite.config.singlefile.ts` is a preview-only build config that disables
code splitting so the whole app — including the lazily loaded 3D scene —
lands in one JS file, for tools that need a single self-contained HTML file
(e.g. embedding as an artifact). It is **not** what gets deployed; the real
production build is `npm run build` / `vite.config.ts`.

```bash
npx vite build --config vite.config.singlefile.ts
# then inline dist-singlefile/assets/*.js and *.css (plus font url()
# references in the CSS, as base64) into dist-singlefile/index.html
```
