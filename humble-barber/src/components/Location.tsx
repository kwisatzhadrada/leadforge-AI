import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";
import { SectionHead } from "./ui/SectionHead";
import { Icon } from "./ui/Icon";
import { business, hours } from "../data/business";

export function Location() {
  const headRef = useReveal<HTMLDivElement>();
  const infoRef = useReveal<HTMLDivElement>();
  const mapRef = useReveal<HTMLDivElement>();

  return (
    <section id="location" className="py-24">
      <div className="wrap">
        <div ref={headRef}>
          <SectionHead
            center
            kicker="Location & Hours"
            title={
              <>
                Find Us On <span className="signal-text">King&rsquo;s Cross Road</span>
              </>
            }
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div ref={infoRef} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-8 md:p-9">
            <Row icon="pin" title="Address">
              <p>{business.address.line1}</p>
              <p>
                {business.address.line2}, {business.address.country}
              </p>
            </Row>
            <Row icon="phone" title="Phone">
              <a href={`tel:${business.phone.tel}`} className="hover:text-[var(--amber)]">
                {business.phone.display}
              </a>
            </Row>
            <Row icon="clock" title="Hours">
              <div className="grid gap-1.5">
                {hours.map((h) => (
                  <div key={h.day} className="flex justify-between gap-4 text-[0.88rem]">
                    <span className="text-[var(--text-dim)]">{h.day}</span>
                    <span className="font-mono text-[var(--text)]">{h.time}</span>
                  </div>
                ))}
              </div>
            </Row>

            <div className="mt-2 flex flex-wrap gap-3">
              <a
                href={business.directionsUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#14100a] bg-[linear-gradient(135deg,var(--amber-bright),var(--amber))]"
              >
                Directions <Icon name="arrowRight" className="h-[18px] w-[18px]" />
              </a>
              <a
                href={`tel:${business.phone.tel}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:border-[var(--amber)]"
              >
                <Icon name="phone" className="h-[18px] w-[18px]" /> Call Now
              </a>
            </div>

            <div className="mt-6 flex gap-2.5 border-t border-[var(--border-soft)] pt-6 text-[0.82rem] text-[var(--text-faint)]">
              <Icon name="pin" className="h-4 w-4 shrink-0 text-[var(--cyan)]" />
              A short walk from King&rsquo;s Cross St. Pancras station — easy to reach by Tube,
              rail, or on foot.
            </div>
          </div>

          <div ref={mapRef} className="min-h-[340px] overflow-hidden rounded-[22px] border border-[var(--border)]">
            <iframe
              title="The Humble Barber London location map"
              src={business.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[340px] w-full border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="mb-6 flex gap-3.5">
      <Icon name={icon as never} className="mt-0.5 h-5 w-5 shrink-0 text-[var(--amber)]" />
      <div className="w-full">
        <h4 className="mb-1 text-[0.95rem] font-semibold">{title}</h4>
        <div className="text-[0.88rem] text-[var(--text-dim)]">{children}</div>
      </div>
    </div>
  );
}
