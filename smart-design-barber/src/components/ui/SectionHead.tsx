import type { PropsWithChildren, ReactNode } from "react";

export function SectionHead({
  kicker,
  title,
  center = false,
  lead,
}: PropsWithChildren<{
  kicker: string;
  title: ReactNode;
  center?: boolean;
  lead?: ReactNode;
}>) {
  return (
    <div className={`max-w-[640px] mb-14 ${center ? "mx-auto text-center" : ""}`}>
      <div className={`kicker mb-4 ${center ? "justify-center" : ""}`}>{kicker}</div>
      <h2 className="text-[clamp(2.1rem,4.6vw,3.4rem)]">{title}</h2>
      {lead ? (
        <p className={`mt-4 text-[var(--text-dim)] text-[1.05rem] max-w-[58ch] ${center ? "mx-auto" : ""}`}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}
