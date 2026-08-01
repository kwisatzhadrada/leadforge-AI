import { useEffect, useState } from "react";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/** Also treats small/low-power devices as unsupported to keep the 3D scene desktop/high-end-mobile only. */
export function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const lowPower =
      typeof navigator !== "undefined" &&
      "hardwareConcurrency" in navigator &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency <= 2;
    setSupported(detectWebGL() && !lowPower);
  }, []);

  return supported; // null while unknown (SSR/first paint), then boolean
}
