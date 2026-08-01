import { useReveal } from "../hooks/useReveal";
import { Photo } from "./ui/Photo";
import { atmosphereItems, atmosphereImage, pexelsUrl } from "../data/business";

export function Atmosphere() {
  const mediaRef = useReveal<HTMLDivElement>();
  const textRef = useReveal<HTMLDivElement>();

  return (
    <section id="atmosphere" className="py-24 bg-[var(--ink-elevated)]">
      <div className="wrap grid gap-12 lg:grid-cols-2 lg:items-center">
        <div ref={textRef}>
          <div className="kicker mb-4">The Atmosphere</div>
          <h2 className="text-[clamp(2.1rem,4.6vw,3.3rem)] mb-5">
            Relaxed. <span className="signal-text">Sociable. Unhurried.</span>
          </h2>
          <p className="text-[var(--text-dim)] text-[1.05rem] max-w-[54ch] mb-9">
            Reviewers describe the same thing again and again: a friendly, welcoming shop where
            staff actually take the time to get the style right, whether you&rsquo;re a regular
            or you just walked in off King&rsquo;s Cross Road.
          </p>

          <div className="grid gap-6">
            {atmosphereItems.map((item, i) => (
              <Row key={item.title} title={item.title} body={item.body} index={i} />
            ))}
          </div>
        </div>

        <div ref={mediaRef} className="relative overflow-hidden rounded-[22px] border border-[var(--border)] aspect-[5/4]">
          <Photo
            src={pexelsUrl(atmosphereImage.photoId, 1200)}
            alt={atmosphereImage.alt}
            icon="walkin"
            style={{ filter: "grayscale(15%) contrast(1.06)" }}
          />
        </div>
      </div>
    </section>
  );
}

function Row({ title, body, index }: { title: string; body: string; index: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] font-mono text-[0.95rem] text-[var(--amber)]">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div>
        <h4 className="text-[1.02rem] font-bold mb-1">{title}</h4>
        <p className="text-[0.9rem] text-[var(--text-dim)]">{body}</p>
      </div>
    </div>
  );
}
