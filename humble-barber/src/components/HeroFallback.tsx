// Static, no-WebGL / reduced-motion version of the hero backdrop — same
// amber/cyan "fade disc" motif rendered as a pure CSS conic gradient.
export function HeroFallback() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35"
        style={{
          background:
            "conic-gradient(from 90deg, var(--amber-bright), var(--amber), var(--cyan), var(--amber-dim), var(--amber-bright))",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 60% 35%, rgba(255,171,46,0.14), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(79,224,232,0.08), transparent 50%), linear-gradient(180deg, rgba(10,14,21,0.2) 0%, rgba(10,14,21,0.85) 60%, var(--ink) 100%)",
        }}
      />
    </div>
  );
}
