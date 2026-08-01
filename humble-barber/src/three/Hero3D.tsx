import { Canvas } from "@react-three/fiber";
import { FlapGrid } from "./FlapGrid";
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
      camera={{ fov: 40, near: 0.1, far: 30, position: [0, 0, 2.1] }}
    >
      <color attach="background" args={["#0a0e15"]} />
      <ambientLight intensity={0.55} color="#141a26" />
      <pointLight position={[3, 2.5, 3]} intensity={40} color="#ffc369" />
      <pointLight position={[-3, -1.5, 2]} intensity={7} color="#2fb8d6" />
      <pointLight position={[0, 3, -2]} intensity={9} color="#f4efe2" />
      <EnvSlabs progressRef={progressRef} />
      <FlapGrid progressRef={progressRef} tiltRef={tiltRef} />
      <fog attach="fog" args={["#0a0e15", 4, 12]} />
    </Canvas>
  );
}
