import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 160;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const BRASS = new THREE.Color("#e2b568");
const STEEL = new THREE.Color("#bfe9ff");

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type Props = {
  progressRef: React.RefObject<number>;
  tiltRef: React.RefObject<{ x: number; y: number }>;
};

export function BladeCluster({ progressRef, tiltRef }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tiltCurrent = useRef({ x: 0, y: 0 });

  // Precompute two position sets per instance: a tight "macro cluster" sphere
  // (fibonacci sphere — even spread, reads as a dense mass of blades close
  // to camera) and a flat phyllotaxis "fade disc" (a literal circular
  // gradient fan, the visual signature of a skin fade).
  const { spherePos, discPos, colors, discRadiusNorm } = useMemo(() => {
    const sphere: THREE.Vector3[] = [];
    const disc: THREE.Vector3[] = [];
    const cols: THREE.Color[] = [];
    const radiusNorm: number[] = [];

    const sphereRadius = 0.62;
    const maxDiscRadius = 2.35;

    for (let i = 0; i < COUNT; i++) {
      // Fibonacci sphere distribution.
      const y = 1 - (i / (COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const sphereAngle = GOLDEN_ANGLE * i;
      sphere.push(
        new THREE.Vector3(
          Math.cos(sphereAngle) * radiusAtY * sphereRadius,
          y * sphereRadius,
          Math.sin(sphereAngle) * radiusAtY * sphereRadius,
        ),
      );

      // Vogel / phyllotaxis disc distribution — even area coverage, natural
      // sunburst pattern.
      const discAngle = GOLDEN_ANGLE * i;
      const rNorm = Math.sqrt(i / COUNT);
      const r = rNorm * maxDiscRadius;
      disc.push(
        new THREE.Vector3(
          Math.cos(discAngle) * r,
          Math.sin(discAngle) * r,
          (Math.random() - 0.5) * 0.05,
        ),
      );

      radiusNorm.push(rNorm);
      cols.push(BRASS.clone().lerp(STEEL, Math.min(1, rNorm * 1.15)));
    }

    return { spherePos: sphere, discPos: disc, colors: cols, discRadiusNorm: radiusNorm };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < COUNT; i++) mesh.setColorAt(i, colors[i]);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [colors]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    const material = materialRef.current;
    if (!mesh || !group || !material) return;

    const rawT = progressRef.current ?? 0;
    const t = easeInOutCubic(Math.min(1, Math.max(0, rawT)));

    // Morph each blade from its sphere position to its disc position, and
    // orient it to point outward along its own radial direction (the same
    // logic reads as "spiky cluster" at t=0 and "sunburst fade" at t=1).
    for (let i = 0; i < COUNT; i++) {
      const pos = spherePos[i].clone().lerp(discPos[i], t);
      const outward = pos.lengthSq() > 0.0001 ? pos.clone().normalize() : new THREE.Vector3(0, 1, 0);
      dummy.position.copy(pos);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
      const scale = THREE.MathUtils.lerp(1, 0.85, discRadiusNorm[i]);
      dummy.scale.set(scale, scale * THREE.MathUtils.lerp(1, 1.6, t), scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Slow constant spin plus a touch more as it resolves into a disc.
    group.rotation.y += delta * (0.08 + t * 0.05);
    group.rotation.x = THREE.MathUtils.lerp(0.15, -0.05, t);

    // Pointer/gyro reactive tilt, smoothed.
    const target = tiltRef.current ?? { x: 0, y: 0 };
    tiltCurrent.current.x = THREE.MathUtils.damp(tiltCurrent.current.x, target.x, 3, delta);
    tiltCurrent.current.y = THREE.MathUtils.damp(tiltCurrent.current.y, target.y, 3, delta);
    group.rotation.y += tiltCurrent.current.x * 0.12;
    group.rotation.x += tiltCurrent.current.y * -0.08;

    // Camera dolly: macro close-up -> pulled back reveal.
    const camZ = THREE.MathUtils.lerp(1.7, 7.6, t);
    const camY = THREE.MathUtils.lerp(0.05, 0.65, t);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, camZ, 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, camY, 4, delta);
    state.camera.lookAt(0, THREE.MathUtils.lerp(0.1, -0.2, t), 0);

    const cam = state.camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      const fov = THREE.MathUtils.lerp(32, 55, t);
      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = THREE.MathUtils.damp(cam.fov, fov, 4, delta);
        cam.updateProjectionMatrix();
      }
    }

    // Dissolve near the end of the scroll range, handing off to page content.
    const fadeOut = 1 - THREE.MathUtils.smoothstep(rawT, 0.82, 1);
    material.opacity = fadeOut;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[0.045, 0.7, 0.02]} />
        <meshStandardMaterial
          ref={materialRef}
          metalness={0.92}
          roughness={0.22}
          transparent
          opacity={1}
        />
      </instancedMesh>
    </group>
  );
}
