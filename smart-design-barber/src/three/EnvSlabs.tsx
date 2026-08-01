import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = { progressRef: React.RefObject<number> };

// A handful of large, minimal geometric panels that fade/scale in once the
// camera pulls back — an abstract suggestion of the shop, not a literal
// cluttered 3D room.
export function EnvSlabs({ progressRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);

  const slabs = [
    { pos: [-3.2, -0.6, -2.5], size: [2.6, 5, 0.05], rot: [0, 0.35, 0], color: "#332b1e" },
    { pos: [3.4, 0.2, -3.2], size: [2.2, 4.4, 0.05], rot: [0, -0.3, 0], color: "#211c14" },
    { pos: [0, -1.9, -1.5], size: [8, 0.05, 4], rot: [0, 0, 0], color: "#18150f" },
  ] as const;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = progressRef.current ?? 0;
    // Reveal window: roughly 0.5 -> 0.85 of the scroll range.
    const reveal = THREE.MathUtils.smoothstep(t, 0.5, 0.85);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(t, 0.88, 1);
    const visible = reveal * fadeOut;

    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, 0.85 + reveal * 0.15, 4, delta));
    mats.current.forEach((m) => {
      if (m) m.opacity = THREE.MathUtils.damp(m.opacity, visible * 0.4, 4, delta);
    });
  });

  return (
    <group ref={groupRef} scale={0.85}>
      {slabs.map((s, i) => (
        <mesh key={i} position={s.pos as unknown as THREE.Vector3Tuple} rotation={s.rot as unknown as THREE.EulerTuple}>
          <boxGeometry args={s.size as unknown as [number, number, number]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            color={s.color}
            metalness={0.4}
            roughness={0.6}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}
