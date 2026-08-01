import { useReveal } from "../hooks/useReveal";
import { experienceItems, experienceImage, pexelsUrl } from "../data/business";

export function Experience() {
  const mediaRef = useReveal<HTMLDivElement>();
  const textRef = useReveal<HTMLDivElement>();

  return (
    <section id="experience" className="py-24">
      <div className="wrap grid gap-12 lg:grid-cols-2 lg:items-center">
        <div ref={textRef}>
          <div className="kicker mb-4">The Experience</div>
          <h2 className="text-[clamp(2.1rem,4.6vw,3.3rem)] mb-5">
            Sit Down. <span className="brass-text">Slow Down.</span>
          </h2>
          <p className="text-[var(--text-dim)] text-[1.05rem] max-w-[54ch] mb-9">
            Nothing here is rushed. A cut at Smart Design Barber comes with a proper
            conversation, a glass of tea, and a barber who's been doing this long enough to
            know exactly how a hot towel should feel.
          </p>

          <div className="grid gap-6">
            {experienceItems.map((item, i) => (
              <ExperienceRow key={item.title} title={item.title} body={item.body} index={i} />
            ))}
          </div>
        </div>

        <div ref={mediaRef} className="relative overflow-hidden rounded-[22px] border border-[var(--border)] aspect-[5/4]">
          <img
            src={pexelsUrl(experienceImage.photoId, 1200)}
            alt={experienceImage.alt}
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ filter: "grayscale(15%) contrast(1.06)" }}
          />
        </div>
      </div>
    </section>
  );
}

function ExperienceRow({ title, body, index }: { title: string; body: string; index: number }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] font-mono text-[0.95rem] text-[var(--brass)]">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div>
        <h4 className="text-[1.05rem] mb-1" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h4>
        <p className="text-[0.9rem] text-[var(--text-dim)]">{body}</p>
      </div>
    </div>
  );
}
