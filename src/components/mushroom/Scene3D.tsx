import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type * as THREE from 'three';
import type { Model3D } from '@/data/types';
import { buildMushroom, disposeGroup } from './buildMushroom';

export interface Controls3D {
  ry: number;
  rx: number;
  zoom: number;
  lastTouch: number;
}

function MushroomModel({ spec, seed, controls }: { spec: Model3D; seed: number; controls: MutableRefObject<Controls3D> }) {
  const holder = useRef<THREE.Group>(null);
  const model = useMemo(() => buildMushroom(spec, seed), [spec, seed]);
  useEffect(() => () => disposeGroup(model), [model]);

  useFrame((state, dt) => {
    const c = controls.current;
    const g = holder.current;
    if (!g) return;
    if (Date.now() - c.lastTouch > 1600) c.ry += dt * 0.5; // gentle auto-rotation when idle
    g.rotation.y = c.ry;
    g.rotation.x = c.rx;
    const target = 4.6 / c.zoom;
    state.camera.position.z += (target - state.camera.position.z) * 0.15;
  });

  return (
    <group ref={holder}>
      <primitive object={model} />
    </group>
  );
}

/** The actual R3F scene – loaded lazily so a GL problem can never take the whole app down. */
export default function Scene3D({ spec, seed, controls, bg }: { spec: Model3D; seed: number; controls: MutableRefObject<Controls3D>; bg: string }) {
  return (
    <Canvas camera={{ position: [0, 0.35, 4.6], fov: 36 }}>
      <color attach="background" args={[bg]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#fff4d0', '#2b3410', 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.7} color="#ffd9a0" />
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 48]} />
        <meshStandardMaterial color="#35441a" roughness={1} />
      </mesh>
      <MushroomModel spec={spec} seed={seed} controls={controls} />
    </Canvas>
  );
}
