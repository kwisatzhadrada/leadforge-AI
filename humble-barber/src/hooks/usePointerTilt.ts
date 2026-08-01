import { useEffect, useRef } from "react";

/** Normalized pointer/gyroscope position in [-1, 1] on both axes, read each frame by the 3D scene. */
export function usePointerTilt() {
  const tiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      tiltRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      tiltRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }

    function onOrientation(e: DeviceOrientationEvent) {
      if (e.beta == null || e.gamma == null) return;
      // Clamp to a comfortable range so the tilt stays subtle on mobile.
      tiltRef.current.x = Math.max(-1, Math.min(1, e.gamma / 30));
      tiltRef.current.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  return tiltRef;
}
