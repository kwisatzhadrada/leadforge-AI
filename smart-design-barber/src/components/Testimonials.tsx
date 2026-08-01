import { useReveal } from "../hooks/useReveal";
import { SectionHead } from "./ui/SectionHead";
import { Icon } from "./ui/Icon";
import { testimonials, type Testimonial } from "../data/business";

export function Testimonials() {
  const headRef = useReveal<HTMLDivElement>();

  return (
    <section id="reviews" className="py-24 bg-[var(--bg-elevated)]">
      <div className="wrap">
        <div ref={headRef}>
          <SectionHead
            center
            kicker="Reviews"
            title={
              <>
                What The <span className="brass-text">Chair</span> Says
              </>
            }
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface)] p-8">
      <div className="mb-4 flex gap-1 text-[#ffc94d]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} name="star" className="h-[15px] w-[15px]" />
        ))}
      </div>
      <p className="mb-6 text-[0.98rem] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface-2),var(--bg-elevated))] font-mono text-[0.9rem]">
          {t.name.charAt(0)}
        </div>
        <div>
          <div className="text-[0.88rem] font-semibold">{t.name}</div>
          <div className="text-[0.78rem] text-[var(--text-faint)]">{t.meta}</div>
        </div>
      </div>
    </div>
  );
}
