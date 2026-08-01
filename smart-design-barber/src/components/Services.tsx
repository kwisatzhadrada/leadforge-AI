import { useReveal } from "../hooks/useReveal";
import { SectionHead } from "./ui/SectionHead";
import { Icon } from "./ui/Icon";
import { services, signaturePackage, type Service } from "../data/business";

export function Services() {
  const headRef = useReveal<HTMLDivElement>();

  return (
    <section id="services" className="py-24 bg-[var(--bg-elevated)]">
      <div className="wrap">
        <div ref={headRef}>
          <SectionHead
            center
            kicker="Services"
            title={
              <>
                Every Cut, <span className="brass-text">Every Ritual</span>
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

        <SignatureCard />
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
      className="group relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(160deg,var(--surface)_0%,var(--bg-elevated)_100%)] p-8 transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--brass-dark)]"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] scale-x-0 bg-[linear-gradient(90deg,transparent,var(--brass),transparent)] transition-transform duration-300 group-hover:scale-x-100" />
      <div className="mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brass)]">
        <Icon name={service.icon as never} className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-[1.05rem] font-semibold" style={{ fontFamily: "var(--font-body)" }}>
        {service.name}
      </h3>
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
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[var(--text-dim)] transition-colors hover:text-[var(--brass)]"
        >
          Book <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function SignatureCard() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="mt-6 rounded-[22px] border border-[var(--brass-dark)]/60 bg-[radial-gradient(ellipse_at_top_left,rgba(201,151,74,0.12),transparent_60%),linear-gradient(160deg,var(--surface)_0%,var(--bg-elevated)_100%)] p-9 md:p-11"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="kicker mb-3">The Full Ritual</div>
          <h3 className="text-[1.6rem] mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {signaturePackage.name}
          </h3>
          <p className="text-[var(--text-dim)] max-w-[52ch]">{signaturePackage.description}</p>
        </div>
        <div className="font-mono text-[1.8rem] shrink-0">
          £XX
          <span className="block font-sans text-[0.65rem] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            Package from
          </span>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-2.5">
        {signaturePackage.includes.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[var(--border)] bg-white/[0.03] px-3.5 py-1.5 text-[0.8rem] text-[var(--text-dim)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
