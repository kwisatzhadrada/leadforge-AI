import { Icon } from "./ui/Icon";
import { aboutImage, atmosphereImage, business, galleryImages, heroImage, hours } from "../data/business";

type Credit = { label: string; alt: string; sourceUrl: string; photographer?: string };

const credits: Credit[] = [
  { label: "Hero", ...heroImage },
  { label: "About", ...aboutImage },
  { label: "Atmosphere", ...atmosphereImage },
  ...galleryImages.map((g) => ({ label: g.tag, alt: g.alt, sourceUrl: g.sourceUrl, photographer: g.photographer })),
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-soft)] bg-[var(--ink-elevated)] pb-8 pt-16">
      <div className="wrap">
        <div className="mb-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <a
              href="#top"
              className="flex items-center gap-2.5 text-[1.1rem] font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="text-[var(--amber)]">
                <Icon name="logo" className="h-6 w-6" />
              </span>
              {business.name}
            </a>
            <p className="mt-3.5 max-w-[320px] text-[0.9rem] text-[var(--text-dim)]">
              Traditional and modern barbering on King&rsquo;s Cross Road, steps from the station.
            </p>
            <div className="mt-4 flex gap-2.5">
              {(["instagram", "facebook", "tiktok"] as const).map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-dim)] transition-colors hover:border-[var(--amber)] hover:text-[var(--amber)]"
                >
                  <Icon name={s} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h5 className="mb-4 text-[0.75rem] uppercase tracking-[0.1em] text-[var(--text-faint)]">Contact</h5>
            <ul className="grid gap-2.5 text-[0.88rem] text-[var(--text-dim)]">
              <li>{business.address.line1}</li>
              <li>{business.address.line2}</li>
              <li>
                <a href={`tel:${business.phone.tel}`} className="hover:text-[var(--amber)]">
                  {business.phone.display}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-[0.75rem] uppercase tracking-[0.1em] text-[var(--text-faint)]">Hours</h5>
            <ul className="grid gap-1.5 text-[0.85rem] text-[var(--text-dim)]">
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-4">
                  <span>{h.day}</span>
                  <span className="font-mono">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <details className="mb-8 rounded-[14px] border border-[var(--border-soft)] p-5 text-[0.82rem] text-[var(--text-faint)]">
          <summary className="cursor-pointer select-none text-[var(--text-dim)]">
            Photo credits — real photography, not AI-generated
          </summary>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {credits.map((c) => (
              <a
                key={c.sourceUrl}
                href={c.sourceUrl}
                target="_blank"
                rel="noopener"
                className="hover:text-[var(--amber)]"
              >
                {c.label}
                {c.photographer ? ` — ${c.photographer}` : ""} (Pexels)
              </a>
            ))}
          </div>
          <p className="mt-4">
            Stand-in photography, not the actual shop or staff — swap for real Humble Barber
            photos when available.
          </p>
        </details>

        <div className="flex flex-col gap-2 border-t border-[var(--border-soft)] pt-7 text-[0.78rem] text-[var(--text-faint)] sm:flex-row sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {business.name}. All rights reserved.
          </span>
          <span>
            {business.address.full} · {business.phone.display}
          </span>
        </div>
      </div>
    </footer>
  );
}
