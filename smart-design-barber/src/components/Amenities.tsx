import { useReveal } from "../hooks/useReveal";
import { SectionHead } from "./ui/SectionHead";
import { Icon } from "./ui/Icon";
import { amenities } from "../data/business";

export function Amenities() {
  const headRef = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 bg-[var(--bg-elevated)]">
      <div className="wrap">
        <div ref={headRef}>
          <SectionHead
            center
            kicker="Good to Know"
            title={
              <>
                Practical <span className="brass-text">Details</span>
              </>
            }
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {amenities.map((a) => (
            <AmenityCard key={a.label} label={a.label} icon={a.icon} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AmenityCard({ label, icon }: { label: string; icon: string }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-4 rounded-[22px] border border-[var(--border-soft)] bg-[var(--bg)] px-6 py-8 text-center transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--brass)]">
        <Icon name={icon as never} className="h-6 w-6" />
      </div>
      <span className="text-[0.9rem] text-[var(--text-dim)]">{label}</span>
    </div>
  );
}
