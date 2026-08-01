# Smart Design Barber

A React + Three.js marketing site for Smart Design Barber, a Turkish-style
barbershop at 17 Stroud Green Rd, Finsbury Park, London N4 3SG (since 2005).

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Three.js via `@react-three/fiber` / `@react-three/drei` — the hero's
  scroll-driven 3D scene
- GSAP `ScrollTrigger` — drives the 3D scene and reveal animations from
  scroll position

## Run it

```bash
cd smart-design-barber
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## The hero 3D scene

`src/three/` holds a procedurally-generated instanced "blade cluster" — no
external 3D model or texture files, so there's nothing to fetch and nothing
that can 404. As you scroll through the hero:

1. It starts as a tight macro cluster of ~160 blade-shaped instances (a
   fibonacci-sphere distribution) right up against the camera.
2. It morphs into a flat phyllotaxis "sunburst" — the literal shape of a fade
   gradient — as the camera pulls back, colored brass at the center fading to
   steel at the rim.
3. A few large, minimal panels fade in around it to suggest an abstract
   environment, then the whole scene dissolves into the page content.

It also tilts subtly toward the pointer (desktop) or device orientation
(mobile, where permitted) — `src/hooks/usePointerTilt.ts`.

**Fallbacks are real, not decorative:** `src/hooks/useWebGLSupport.ts` and
`usePrefersReducedMotion.ts` gate the 3D scene — no WebGL, a low-power device,
or `prefers-reduced-motion: reduce` all fall back to `HeroFallback.tsx`, a
static CSS gradient with the same brass/steel palette. The 3D scene itself is
lazy-loaded (`React.lazy` in `Hero.tsx`) so Three.js never blocks first paint;
check `dist/` after a build — `Hero3D-*.js` is its own chunk.

## Fonts

Self-hosted, not loaded from Google Fonts / Fontshare (no external request at
runtime): Gloock (display), Geist Mono (kickers/stats/prices), Instrument
Sans (body) — files in `public/fonts/`, declared via `@font-face` in
`src/index.css`. They're also registered as real Tailwind v4 theme tokens
(`@theme` block) so `font-mono` etc. resolve to the actual fonts rather than
Tailwind's generic defaults.

## Content

All real business facts (address, phone, hours, services, the Signature
Grooming Package, amenities) live in one place: `src/data/business.ts`. Edit
there, not in components.

- **Prices** are `£XX` placeholders throughout — search `£XX` to find every
  spot and drop in real pricing.
- **Testimonials** (`src/data/business.ts`) are representative copy written
  from the reputation themes in the client brief, not real named reviewers —
  swap in real reviews when available.
- **Photos** are real, licensed stock photography from Pexels (not
  AI-generated) — every image is documented in `galleryImages` /
  `heroImage` / `aboutImage` / `experienceImage` in `business.ts`, with a
  `sourceUrl` back to Pexels, and the footer renders a collapsible photo
  credits list on the live site. **This build environment could not load
  external images to visually verify them** (its network policy blocks
  outbound requests) — click through each `sourceUrl` before publishing to
  confirm they render and look right, and swap them for real shop/staff
  photos whenever those exist. Every photo renders through
  `src/components/ui/Photo.tsx`, which falls back to a styled placeholder
  tile (icon + label) if an image ever fails to load, instead of a broken
  image icon — this is real production behavior, not just a preview
  workaround.
- **Map**: `business.mapEmbedUrl` is a keyless Google Maps embed. For a
  pin-accurate result or analytics, swap in a Google Maps Embed API key.
- **Social links**: footer Instagram/Facebook/TikTok icons point to `#` —
  add real profile URLs.

## Deploying

Static output from `npm run build` (`dist/`) — deploy to Netlify, Vercel,
Cloudflare Pages, or any static host.

## Generating a single-file preview

`vite.config.singlefile.ts` is a preview-only build config that disables code
splitting (`inlineDynamicImports`) so the whole app — including the lazily
loaded 3D scene — lands in one JS file, for tools that need a single
self-contained HTML file (e.g. an offline demo, or embedding as an artifact).
It is **not** what gets deployed; `npm run build` / `vite.config.ts` is the
real, properly code-split production build.

```bash
npx vite build --config vite.config.singlefile.ts
# then inline dist-singlefile/assets/*.js and *.css (plus font url()
# references in the CSS, as base64) into dist-singlefile/index.html
```
