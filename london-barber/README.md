# London Barber — Website

A dependency-free static site (HTML/CSS/JS, no build step) for London Barber, a
barbershop at 371–373 Edgware Rd, London W2 1BS.

## Preview locally

```bash
cd london-barber
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` directly in a browser (the map embed and Google Fonts
need network access; everything else works offline).

## Structure

```
london-barber/
├── index.html      # all page markup, organized into commented section blocks
├── css/style.css   # design tokens + component-based stylesheet (see file header)
└── js/main.js      # nav, scroll-reveal, hero parallax, gallery lightbox
```

Each section in `index.html` (Hero, About, Services, Why Choose Us, Experience,
Gallery, Testimonials, Location, Footer) is a self-contained block using shared,
reusable CSS component classes (`.btn`, `.badge`, `.service-card`, `.why-card`,
`.testimonial-card`, etc.) defined once in `style.css`.

## Swapping in real content

- **Prices**: search `£XX` in `index.html` (one per service card) and replace
  with real pricing.
- **Photos**: hero, about, experience and gallery images currently point to
  royalty-free Unsplash placeholders. Swap the `src` (and `data-full` on
  gallery items) for real shop/work photos — same aspect ratios recommended
  for a clean layout (hero: wide, about/experience: 4:5, gallery: square-ish).
- **Reviews**: the three testimonials in the Reviews section are
  representative copy, not real client quotes — replace with real reviews
  when available.
- **Social links**: the footer social icons (`Instagram`, `Facebook`,
  `TikTok`) currently point to `#` — add real profile URLs.
- **Map**: the embed URL in the Location section is keyless (`?output=embed`).
  For a pin-accurate result or analytics, swap in a Google Maps Embed API key.

## Deploying

Any static host works — Netlify, Vercel, Cloudflare Pages, GitHub Pages, or a
plain web server. Just upload the `london-barber/` folder contents (or point
the host at this directory).
