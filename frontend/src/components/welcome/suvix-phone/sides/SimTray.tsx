// ─────────────────────────────────────────────────────────────────────────────
// SUVIX SIM TRAY — Left-edge SIM Tray outline & Ejector Pinhole
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { PHONE_SPEC, HALF_W } from '../config/phoneSpec';

interface SimTrayProps {
  materials: {
    frame: THREE.Material;
    button: THREE.Material;
  };
}

export function SimTray({ materials }: SimTrayProps) {
  const { y, height, width, holeRadius } = PHONE_SPEC.simTray;
  const x = -HALF_W - 0.001;

  return (
    <group position={[x, y, 0]} rotation={[0, -Math.PI / 2, 0]} name="SimTrayGroup">
      {/* Subtle tray outline seam */}
      <mesh material={materials.button}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* SIM Ejector Pinhole */}
      <mesh position={[0, -height / 2 + 0.06, 0.002]}>
        <circleGeometry args={[holeRadius, 16]} />
        <meshBasicMaterial color="#050507" />
      </mesh>
    </group>
  );
}
