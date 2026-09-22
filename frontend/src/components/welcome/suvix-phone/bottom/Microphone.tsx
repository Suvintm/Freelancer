// ─────────────────────────────────────────────────────────────────────────────
// SUVIX MICROPHONE — Primary Bottom Microphone Pinhole
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { PHONE_SPEC, HALF_H } from '../config/phoneSpec';

interface MicrophoneProps {
  material: THREE.Material;
}

export function Microphone({ material }: MicrophoneProps) {
  const { x, radius } = PHONE_SPEC.bottom.microphone;
  const y = -HALF_H - 0.002;

  return (
    <group position={[x, y, 0]} name="MicrophoneGroup">
      <mesh material={material}>
        <cylinderGeometry args={[radius, radius, 0.02, 16]} />
      </mesh>
    </group>
  );
}
