// ─────────────────────────────────────────────────────────────────────────────
// SUVIX ANTENNA LINES — Polymer Isolation Bands on the Metal Frame
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { PHONE_SPEC, HALF_W, HALF_H } from '../config/phoneSpec';

interface AntennaLinesProps {
  material: THREE.Material;
}

export function AntennaLines({ material }: AntennaLinesProps) {
  const { thickness } = PHONE_SPEC.antennaLines;
  const frameT = PHONE_SPEC.thickness + 0.002;

  return (
    <group name="AntennaLinesGroup">
      {/* Top Left Frame Break */}
      <mesh
        material={material}
        position={[-0.65, HALF_H, 0]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[thickness, 0.015, frameT]} />
      </mesh>

      {/* Top Right Frame Break */}
      <mesh
        material={material}
        position={[0.65, HALF_H, 0]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[thickness, 0.015, frameT]} />
      </mesh>

      {/* Bottom Left Frame Break */}
      <mesh
        material={material}
        position={[-0.65, -HALF_H, 0]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[thickness, 0.015, frameT]} />
      </mesh>

      {/* Bottom Right Frame Break */}
      <mesh
        material={material}
        position={[0.65, -HALF_H, 0]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[thickness, 0.015, frameT]} />
      </mesh>

      {/* Left Upper Frame Break */}
      <mesh
        material={material}
        position={[-HALF_W, 1.45, 0]}
      >
        <boxGeometry args={[0.015, thickness, frameT]} />
      </mesh>

      {/* Right Upper Frame Break */}
      <mesh
        material={material}
        position={[HALF_W, 1.45, 0]}
      >
        <boxGeometry args={[0.015, thickness, frameT]} />
      </mesh>
    </group>
  );
}
