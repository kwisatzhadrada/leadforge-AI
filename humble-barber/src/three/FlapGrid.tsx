import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COLS = 14;
const ROWS = 7;
const COUNT = COLS * ROWS;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const NAVY = new THREE.Color("#1b2231");
const AMBER = new THREE.Color("#ffc369");
const CYAN = new THREE.Color("#4fe0e8");

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type Props = {
  progressRef: React.RefObject<number>;
  tiltRef: React.RefObject<{ x: number; y: number }>;
};

/**
 * The site's signature motif: a King's Cross departure-board grid of flap
 * tiles that mechanically "update" (a scroll-scrubbed flip, staggered per
 * tile), then migrate from their board grid into a radial phyllotaxis
 * arrangement, and finally recolor into a literal fade gradient — amber at
 * the center loosening to cyan at the rim, echoing a skin fade.
 */
export function FlapGrid({ progressRef, tiltRef }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tiltCurrent = useRef({ x: 0, y: 0 });
  const scratchColor = useMemo(() => new THREE.Color(), []);
  const scratchColorB = useMemo(() => new THREE.Color(), []);

  const { gridPos, discPos, flipPhase, discRadiusNorm } = useMemo(() => {
    const grid: THREE.Vector3[] = [];
    const disc: THREE.Vector3[] = [];
    const phase: number[] = [];
    const radiusNorm: number[] = [];

    const spacing = 0.34;
    const maxDiscRadius = 2.3;

    let i = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        grid.push(
          new THREE.Vector3(
            (col - (COLS - 1) / 2) * spacing,
            ((ROWS - 1) / 2 - row) * spacing,
            0,
          ),
        );

        const discAngle = GOLDEN_ANGLE * i;
        const rNorm = Math.sqrt(i / COUNT);
        const r = rNorm * maxDiscRadius;
        disc.push(new THREE.Vector3(Math.cos(discAngle) * r, Math.sin(discAngle) * r, (Math.random() - 0.5) * 0.04));

        radiusNorm.push(rNorm);
        phase.push(Math.random());
        i++;
      }
    }

    return { gridPos: grid, discPos: disc, flipPhase: phase, discRadiusNorm: radiusNorm };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < COUNT; i++) mesh.setColorAt(i, NAVY);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    const material = materialRef.current;
    if (!mesh || !group || !material) return;

    const rawT = progressRef.current ?? 0;
    const t = easeInOutCubic(Math.min(1, Math.max(0, rawT)));

    const gridToDisc = THREE.MathUtils.smoothstep(rawT, 0.28, 0.58);
    const fadeResolve = THREE.MathUtils.smoothstep(rawT, 0.55, 0.82);

    for (let i = 0; i < COUNT; i++) {
      const flipLocalT = THREE.MathUtils.clamp((rawT - flipPhase[i] * 0.13) / 0.15, 0, 1);

      const pos = gridPos[i].clone().lerp(discPos[i], gridToDisc);
      dummy.position.copy(pos);
      dummy.rotation.set(flipLocalT * Math.PI * 4, 0, 0);
      const scale = THREE.MathUtils.lerp(1, 0.78, discRadiusNorm[i] * gridToDisc);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      scratchColor.copy(NAVY).lerp(AMBER, flipLocalT);
      scratchColorB.copy(AMBER).lerp(CYAN, discRadiusNorm[i]);
      scratchColor.lerp(scratchColorB, fadeResolve);
      mesh.setColorAt(i, scratchColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    group.rotation.z = THREE.MathUtils.lerp(0, Math.PI * 0.06, t);
    group.rotation.y += delta * t * 0.06;

    const target = tiltRef.current ?? { x: 0, y: 0 };
    tiltCurrent.current.x = THREE.MathUtils.damp(tiltCurrent.current.x, target.x, 3, delta);
    tiltCurrent.current.y = THREE.MathUtils.damp(tiltCurrent.current.y, target.y, 3, delta);
    group.rotation.y += tiltCurrent.current.x * 0.1;
    group.rotation.x = tiltCurrent.current.y * -0.07;

    const camZ = THREE.MathUtils.lerp(2.1, 7.4, t);
    const camX = THREE.MathUtils.lerp(0, -0.9, t);
    const camY = THREE.MathUtils.lerp(0, 0.5, t);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, camZ, 4, delta);
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, camX, 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, camY, 4, delta);
    state.camera.lookAt(0, 0, 0);

    const cam = state.camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      const fov = THREE.MathUtils.lerp(40, 58, t);
      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = THREE.MathUtils.damp(cam.fov, fov, 4, delta);
        cam.updateProjectionMatrix();
      }
    }

    const fadeOut = 1 - THREE.MathUtils.smoothstep(rawT, 0.84, 1);
    material.opacity = fadeOut;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[0.26, 0.34, 0.02]} />
        <meshStandardMaterial ref={materialRef} metalness={0.3} roughness={0.55} transparent opacity={1} />
      </instancedMesh>
    </group>
  );
}
