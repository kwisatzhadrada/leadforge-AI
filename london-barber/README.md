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
- **Photos**: hero, about, experience and gallery images are real, free-to-use
  photographs from Pexels (not AI-generated) — see Photo Credits below. Swap
  the `src` (and `data-full` on gallery items) for real London Barber shop/work
  photos whenever they're available; same aspect ratios recommended for a
  clean layout (hero: wide, about/experience: 4:5, gallery: square-ish).
- **Reviews**: the three testimonials in the Reviews section are
  representative copy, not real client quotes — replace with real reviews
  when available.
- **Social links**: the footer social icons (`Instagram`, `Facebook`,
  `TikTok`) currently point to `#` — add real profile URLs.
- **Map**: the embed URL in the Location section is keyless (`?output=embed`).
  For a pin-accurate result or analytics, swap in a Google Maps Embed API key.

## Photo credits

All photos are real photographs sourced from [Pexels](https://www.pexels.com)
(free license, no attribution legally required — credited here anyway for
transparency and easy sourcing). None are AI-generated.

| Section | Photo | Source |
|---|---|---|
| Hero | Barber cutting a client's hair | [pexels.com/photo/1836983](https://www.pexels.com/photo/barber-cutting-man-s-hair-1836983/) |
| About | Barber shop interior — Pavel Danilyuk | [pexels.com/photo/7518728](https://www.pexels.com/photo/the-interior-of-a-barber-shop-7518728/) |
| The Experience | Barber consulting a client | [pexels.com/photo/7697322](https://www.pexels.com/photo/a-barber-smiling-at-his-client-in-a-barbershop-7697322/) |
| Gallery — Skin Fade | Close-up fade being cut | [pexels.com/photo/12464842](https://www.pexels.com/photo/close-up-shot-of-a-person-having-a-haircut-12464842/) |
| Gallery — Beard Styling | Beard trim — cottonbro studio | [pexels.com/photo/3998417](https://www.pexels.com/photo/man-getting-a-beard-cut-3998417/) |
| Gallery — Finished Cut | Client at the mirror | [pexels.com/photo/7697333](https://www.pexels.com/photo/a-man-with-a-mirror-in-a-barbershop-7697333/) |
| Gallery — In the Chair | Clippers close-up — Thanh Dat | [pexels.com/photo/11793730](https://www.pexels.com/photo/a-close-up-shot-of-a-collection-of-hair-clippers-11793730/) |
| Gallery — Detail Work | Beard/hair detail — Alex Urezkov | [pexels.com/photo/9992819](https://www.pexels.com/photo/bearded-man-in-a-barber-shop-9992819/) |
| Gallery — Hot Towel Shave | Shave in progress — alexandre saraiva carniato | [pexels.com/photo/6007400](https://www.pexels.com/photo/a-person-shaving-a-man-s-beard-6007400/) |

Two photos (hero, finished-cut) didn't have a photographer name surfaced in
search results — click through to the source link for full credit. These are
still stand-in photography, not the actual London Barber shop or staff —
swap for real shop photos whenever you have them; the layout is built to drop
them straight in.

**Note on verification:** these URLs were sourced via web search and Pexels'
standard, well-established image CDN URL pattern
(`images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg`) rather than fetched
and visually inspected — this working environment's network policy blocks
outbound requests to external hosts, so it couldn't load or screenshot them.
Click through each source link above before publishing to confirm they render
and look right.

## Deploying

Any static host works — Netlify, Vercel, Cloudflare Pages, GitHub Pages, or a
plain web server. Just upload the `london-barber/` folder contents (or point
the host at this directory).
