import { useReveal } from "../hooks/useReveal";
import { SectionHead } from "./ui/SectionHead";
import { Icon } from "./ui/Icon";
import { whyChooseUs } from "../data/business";

export function WhyChooseUs() {
  const headRef = useReveal<HTMLDivElement>();

  return (
    <section className="py-24">
      <div className="wrap">
        <div ref={headRef}>
          <SectionHead
            center
            kicker="Why Choose Us"
            title={
              <>
                What Regulars <span className="signal-text">Come Back For</span>
              </>
            }
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyChooseUs.map((item) => (
            <Card key={item.label} label={item.label} body={item.body} icon={item.icon} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ label, body, icon }: { label: string; body: string; icon: string }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-3.5 rounded-[22px] border border-[var(--border-soft)] bg-[var(--ink-elevated)] px-6 py-8 text-center transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--amber)]">
        <Icon name={icon as never} className="h-6 w-6" />
      </div>
      <h3 className="text-[0.95rem] font-semibold">{label}</h3>
      <p className="text-[0.85rem] text-[var(--text-dim)]">{body}</p>
    </div>
  );
}
