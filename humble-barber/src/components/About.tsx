import { useReveal } from "../hooks/useReveal";
import { Icon } from "./ui/Icon";
import { Photo } from "./ui/Photo";
import { aboutImage, business, pexelsUrl } from "../data/business";

const POINTS = [
  "Skilled barbers known specifically for fades and beard shaping",
  "Staff who take the time to understand the style you actually want",
  "A short walk from King's Cross St. Pancras — easy to reach, easy to return to",
];

export function About() {
  const mediaRef = useReveal<HTMLDivElement>();
  const textRef = useReveal<HTMLDivElement>();

  return (
    <section id="about" className="py-24">
      <div className="wrap grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div ref={mediaRef}>
          <div className="relative overflow-hidden rounded-[22px] border border-[var(--border)] aspect-[4/5]">
            <Photo
              src={pexelsUrl(aboutImage.photoId, 1200)}
              alt={aboutImage.alt}
              icon="photo"
              style={{ filter: "grayscale(15%) contrast(1.08)" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(10,14,21,0.75))]" />
          </div>
          <div className="relative z-10 -mt-16 flex overflow-hidden rounded-[10px] border border-[var(--border)] bg-[rgba(16,21,31,0.85)] backdrop-blur">
            <Stat value={`${business.rating}★`} label="Rating" />
            <Stat value="7" label="Days a week" />
            <Stat value="0" label="Hidden fees" />
          </div>
        </div>

        <div ref={textRef}>
          <div className="kicker mb-4">About</div>
          <h2 className="text-[clamp(2.1rem,4.6vw,3.3rem)] mb-6">
            A Barbershop Built For <span className="signal-text">King&rsquo;s Cross</span>
          </h2>
          <div>
            <p className="text-[var(--text-dim)] text-[1.05rem] mb-4 max-w-[58ch]">
              The Humble Barber London sits right on King&rsquo;s Cross Road, a short walk from the
              station — a genuine mix of local regulars and people passing through who found a
              barber worth coming back for.
            </p>
            <p className="text-[var(--text-dim)] text-[1.05rem] mb-8 max-w-[58ch]">
              Traditional and modern grooming, side by side: classic hot towel shaves next to
              precision skin fades, all from barbers reviewers consistently single out for
              attention to detail — and for actually listening before they pick up the clippers.
            </p>
          </div>

          <div className="grid gap-3.5">
            {POINTS.map((p) => (
              <div key={p} className="flex items-start gap-3 text-[var(--text-dim)] text-[0.96rem]">
                <Icon name="check" className="h-[18px] w-[18px] text-[var(--amber)] mt-0.5 shrink-0" />
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
