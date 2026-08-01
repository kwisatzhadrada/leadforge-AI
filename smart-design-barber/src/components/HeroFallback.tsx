// Static, no-WebGL / reduced-motion version of the hero backdrop — same
// "fade disc" motif rendered as a pure CSS conic gradient instead of 3D.
export function HeroFallback() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{
          background:
            "conic-gradient(from 90deg, var(--brass-bright), var(--brass), var(--steel), var(--brass-dark), var(--brass-bright))",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 60% 35%, rgba(201,151,74,0.14), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(191,233,255,0.06), transparent 50%), linear-gradient(180deg, rgba(11,10,9,0.2) 0%, rgba(11,10,9,0.85) 60%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}
