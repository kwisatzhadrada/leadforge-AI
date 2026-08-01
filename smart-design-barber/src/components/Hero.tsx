import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Icon } from "./ui/Icon";
import { Button } from "./ui/Button";
import { HeroFallback } from "./HeroFallback";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { usePointerTilt } from "../hooks/usePointerTilt";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useWebGLSupport } from "../hooks/useWebGLSupport";
import { business } from "../data/business";

const Hero3D = lazy(() => import("../three/Hero3D"));

const PHASES = [
  "Precision, up close",
  "Where the fade begins",
  "Finsbury Park, since 2005",
];

export function Hero() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [mountedTrigger, setMountedTrigger] = useState<HTMLDivElement | null>(null);
  const progressRef = useScrollProgress(mountedTrigger);
  const tiltRef = usePointerTilt();
  const reducedMotion = usePrefersReducedMotion();
  const webglSupported = useWebGLSupport();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setMountedTrigger(wrapperRef.current);
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const t = progressRef.current;
      const bucket = t < 0.22 ? 0 : t < 0.55 ? 1 : 2;
      setPhase((prev) => (prev === bucket ? prev : bucket));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  const show3D = webglSupported === true && !reducedMotion;
  const showFallback = webglSupported === false || reducedMotion;

  return (
    <div ref={wrapperRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          {show3D ? (
            <Suspense fallback={<HeroFallback />}>
              <Hero3D progressRef={progressRef} tiltRef={tiltRef} />
            </Suspense>
          ) : showFallback ? (
            <HeroFallback />
          ) : null}
        </div>

        {/* Precision grid overlay, subtle */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(242,236,224,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(242,236,224,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 30% 30%, black, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at 30% 30%, black, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex h-full items-center">
          <div className="wrap">
            <div className="max-w-[760px]">
              <div className="kicker mb-5">Stroud Green Rd, Finsbury Park</div>
              <h1 className="text-[clamp(2.7rem,7vw,5.6rem)] mb-6">
                <span className="block">Turkish Precision.</span>
                <span className="block brass-text">Since 2005.</span>
              </h1>
              <p className="text-[var(--text-dim)] text-[1.1rem] max-w-[520px] mb-8">
                Traditional wet shaves, hot towel treatments, and skin fades cut with real
                attention to detail — Smart Design Barber has been Finsbury Park's barbershop
                for almost two decades.
              </p>

              <div className="flex flex-wrap gap-3 mb-9">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.03] px-4 py-2 text-sm text-[#ffc94d] backdrop-blur">
                  <Icon name="star" className="h-3.5 w-3.5" />
                  <strong className="font-mono text-[var(--text)]">{business.rating}</strong>
                  <span className="text-[var(--text-dim)]">/ 5 rated</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.03] px-4 py-2 text-sm text-[var(--text-dim)] backdrop-blur">
                  Est. {business.since} · Turkish-style barbering
                </span>
              </div>

              <div className="flex flex-wrap gap-3.5 mb-7">
                <Button href={business.directionsUrl} target="_blank" rel="noopener">
                  Directions <Icon name="arrowRight" className="h-[18px] w-[18px]" />
                </Button>
                <Button variant="outline" href={`tel:${business.phone.tel}`}>
                  <Icon name="phone" className="h-[18px] w-[18px]" /> Call {business.phone.display}
                </Button>
              </div>

              <div className="inline-flex items-center gap-2.5 text-sm text-[var(--text-dim)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#33e08a] shadow-[0_0_8px_#33e08a]" />
                <Icon name="clock" className="h-4 w-4 text-[var(--steel)]" />
                Open until 7:00 PM today
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-driven phase label — the small "copy that changes alongside
            the 3D scene" beat from the storyboard. */}
        <div className="absolute bottom-24 right-6 z-10 hidden sm:block text-right">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-faint)] transition-opacity duration-500">
            {PHASES[phase]}
          </span>
        </div>

        <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[var(--text-faint)]">
          <span className="text-[0.65rem] uppercase tracking-[0.24em]">Scroll</span>
          <Icon name="chevronDown" className="h-4 w-4 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
