import { useEffect, useState } from "react";
import { Icon } from "./ui/Icon";
import { business } from "../data/business";

const LINKS = [
  ["About", "#heritage"],
  ["Services", "#services"],
  ["Experience", "#experience"],
  ["Gallery", "#gallery"],
  ["Reviews", "#reviews"],
  ["Location", "#location"],
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-all duration-300 border-b ${
          scrolled
            ? "bg-[#0b0a09]/85 backdrop-blur-md border-[var(--border-soft)] py-3.5"
            : "border-transparent py-5"
        }`}
      >
        <div className="wrap flex items-center justify-between">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-[1.15rem] tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-[var(--brass)]">
              <Icon name="logo" className="h-7 w-7" />
            </span>
            Smart Design Barber
          </a>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
            {LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${business.phone.tel}`}
              className="hidden lg:inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-dim)]"
            >
              <Icon name="phone" className="h-4 w-4 text-[var(--brass)]" />
              {business.phone.display}
            </a>
            <a
              href={business.directionsUrl}
              target="_blank"
              rel="noopener"
              className="hidden sm:inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-[#150f06] bg-[linear-gradient(135deg,var(--brass-bright),var(--brass))]"
            >
              Directions
            </a>
            <button
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded border border-[var(--border)]"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[99] flex flex-col items-center justify-center gap-7 backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        style={{ background: "rgba(6,5,4,0.98)" }}
      >
        {LINKS.map(([label, href]) => (
          <a
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="text-3xl text-[var(--text)] hover:text-[var(--brass)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {label}
          </a>
        ))}
        <a
          href={`tel:${business.phone.tel}`}
          onClick={() => setOpen(false)}
          className="mt-3 inline-flex items-center rounded-full px-7 py-3 text-base font-semibold text-[#150f06] bg-[linear-gradient(135deg,var(--brass-bright),var(--brass))]"
        >
          Call {business.phone.display}
        </a>
      </div>
    </>
  );
}
