import { Canvas } from "@react-three/fiber";
import { BladeCluster } from "./BladeCluster";
import { EnvSlabs } from "./EnvSlabs";

type Props = {
  progressRef: React.RefObject<number>;
  tiltRef: React.RefObject<{ x: number; y: number }>;
};

// Default export so Hero.tsx can React.lazy() this whole chunk — keeps
// Three.js out of the initial bundle and off the critical rendering path.
export default function Hero3D({ progressRef, tiltRef }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 32, near: 0.1, far: 30, position: [0, 0.05, 1.7] }}
    >
      <color attach="background" args={["#0b0a09"]} />
      <ambientLight intensity={0.35} color="#3a3226" />
      <pointLight position={[3, 2.5, 3]} intensity={38} color="#e2b568" />
      <pointLight position={[-3, -1.5, 2]} intensity={18} color="#bfe9ff" />
      <pointLight position={[0, 3, -2]} intensity={10} color="#ffffff" />
      <EnvSlabs progressRef={progressRef} />
      <BladeCluster progressRef={progressRef} tiltRef={tiltRef} />
      <fog attach="fog" args={["#0b0a09", 4, 12]} />
    </Canvas>
  );
}
