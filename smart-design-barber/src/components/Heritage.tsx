import { useReveal } from "../hooks/useReveal";
import { Icon } from "./ui/Icon";
import { aboutImage, business, pexelsUrl } from "../data/business";

const POINTS = [
  "A genuine Turkish-style barbershop, not a chain imitating one",
  "Traditional wet shaving and hot towel treatments, done the proper way",
  "The same attention to fades and beard work that's kept regulars coming back for years",
];

export function Heritage() {
  const mediaRef = useReveal<HTMLDivElement>();
  const textRef = useReveal<HTMLDivElement>();

  return (
    <section id="heritage" className="py-24">
      <div className="wrap grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div ref={mediaRef}>
          <div className="relative overflow-hidden rounded-[22px] border border-[var(--border)] aspect-[4/5]">
            <img
              src={pexelsUrl(aboutImage.photoId, 1200)}
              alt={aboutImage.alt}
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ filter: "grayscale(20%) contrast(1.08)" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(11,10,9,0.75))]" />
          </div>
          <div className="relative z-10 -mt-16 flex overflow-hidden rounded-[10px] border border-[var(--border)] bg-[rgba(18,16,16,0.85)] backdrop-blur">
            <Stat value={`${business.rating}★`} label="Rating" />
            <Stat value={`${new Date().getFullYear() - business.since}+`} label="Years running" />
            <Stat value="7" label="Days a week" />
          </div>
        </div>

        <div ref={textRef}>
          <div className="kicker mb-4">Since {business.since}</div>
          <h2 className="text-[clamp(2.1rem,4.6vw,3.3rem)] mb-6">
            A Barbershop Built On <span className="brass-text">Turkish Tradition</span>
          </h2>
          <p className="text-[var(--text-dim)] text-[1.05rem] mb-4 max-w-[58ch]">
            Smart Design Barber has been part of Stroud Green Road since 2005 — long enough to
            see several generations of regulars come through the door. It's a Turkish-style
            barbershop at heart: traditional craft first, modern grooming layered on top, not
            the other way round.
          </p>
          <p className="text-[var(--text-dim)] text-[1.05rem] mb-8 max-w-[58ch]">
            That means straight-razor wet shaves, proper hot towel prep, and fades cut with the
            kind of patience that only comes from doing this for almost two decades — all
            served, more often than not, with a glass of tea in your hand.
          </p>

          <div className="grid gap-3.5">
            {POINTS.map((p) => (
              <div key={p} className="flex items-start gap-3 text-[var(--text-dim)] text-[0.96rem]">
                <Icon name="check" className="h-[18px] w-[18px] text-[var(--brass)] mt-0.5 shrink-0" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 border-r border-[var(--border)] px-2 py-4 text-center last:border-r-0">
      <div className="font-mono text-[1.6rem] text-[var(--text)]">{value}</div>
      <div className="text-[0.65rem] uppercase tracking-[0.08em] text-[var(--text-faint)]">{label}</div>
    </div>
  );
}
