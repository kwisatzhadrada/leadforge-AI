import { useReveal } from "../hooks/useReveal";
import { SectionHead } from "./ui/SectionHead";
import { Icon } from "./ui/Icon";
import { services, pricingNote, type Service } from "../data/business";

export function Services() {
  const headRef = useReveal<HTMLDivElement>();
  const noteRef = useReveal<HTMLDivElement>();

  return (
    <section id="services" className="py-24 bg-[var(--ink-elevated)]">
      <div className="wrap">
        <div ref={headRef}>
          <SectionHead
            center
            kicker="Services"
            title={
              <>
                Every Service, <span className="signal-text">Clearly Priced</span>
              </>
            }
            lead="Prices shown are placeholders, ready to swap for the real card."
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <ServiceCard key={s.name} service={s} index={i} />
          ))}
        </div>

        <div
          ref={noteRef}
          className="mt-8 flex items-start gap-4 rounded-[16px] border border-[var(--amber-dim)]/50 bg-[radial-gradient(ellipse_at_top_left,rgba(255,171,46,0.08),transparent_60%)] p-6"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--amber-dim)]/60 text-[var(--amber)]">
            <Icon name="check" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="mb-1 text-[0.98rem] font-semibold">No surprises on the bill</h3>
            <p className="text-[0.9rem] text-[var(--text-dim)] max-w-[68ch]">{pricingNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index % 6) * 70}ms` }}
      className="group relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(160deg,var(--surface)_0%,var(--ink-elevated)_100%)] p-8 transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--amber-dim)]"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] scale-x-0 bg-[linear-gradient(90deg,transparent,var(--amber),transparent)] transition-transform duration-300 group-hover:scale-x-100" />
      <div className="mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--amber)]">
        <Icon name={service.icon as never} className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-[1.05rem] font-semibold">{service.name}</h3>
      <p className="text-[0.92rem] text-[var(--text-dim)] mb-6">{service.description}</p>
      <div className="flex items-center justify-between border-t border-[var(--border-soft)] pt-4">
        <div className="font-mono text-[1.3rem]">
          £XX
          <span className="block font-sans text-[0.65rem] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            From
          </span>
        </div>
        <a
          href="#location"
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[var(--text-dim)] transition-colors hover:text-[var(--amber)]"
        >
          Book <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
