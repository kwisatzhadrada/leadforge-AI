import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Tracks scroll progress (0..1) of `triggerEl` from "top top" to "bottom bottom"
 * into a mutable ref, so the 3D scene can read it every frame without
 * triggering React re-renders per scroll tick.
 */
export function useScrollProgress(triggerEl: HTMLElement | null) {
  const progressRef = useRef(0);

  useEffect(() => {
    if (!triggerEl) return;

    const st = ScrollTrigger.create({
      trigger: triggerEl,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    return () => st.kill();
  }, [triggerEl]);

  return progressRef;
}
