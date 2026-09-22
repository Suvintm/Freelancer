// ─────────────────────────────────────────────────────────────────────────────
// SUVIX BOTTOM SPEAKER GRILLE — Precision CNC Acoustic Holes
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC, HALF_H } from '../config/phoneSpec';

interface SpeakerProps {
  material: THREE.Material;
}

export function Speaker({ material }: SpeakerProps) {
  const { holeRadius } = PHONE_SPEC.bottom.speakerLeft;
  const y = -HALF_H - 0.002;

  // Left speaker array (5 holes)
  const leftHoles = useMemo(() => {
    return [-0.48, -0.42, -0.36, -0.30, -0.24];
  }, []);

  // Right speaker array (4 holes)
  const rightHoles = useMemo(() => {
    return [0.24, 0.30, 0.36, 0.42];
  }, []);

  const holeGeom = useMemo(() => {
    return new THREE.CylinderGeometry(holeRadius, holeRadius, 0.02, 16);
  }, [holeRadius]);

  return (
    <group name="SpeakerGrilleGroup">
      {/* Left Speaker Holes */}
      {leftHoles.map((x, i) => (
        <mesh
          key={`left-speaker-${i}`}
          geometry={holeGeom}
          material={material}
          position={[x, y, 0]}
        />
      ))}

      {/* Right Speaker Holes */}
      {rightHoles.map((x, i) => (
        <mesh
          key={`right-speaker-${i}`}
          geometry={holeGeom}
          material={material}
          position={[x, y, 0]}
        />
      ))}
    </group>
  );
}
