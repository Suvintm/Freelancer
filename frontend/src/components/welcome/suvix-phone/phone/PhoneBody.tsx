// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE BODY — Internal Core & Perimeter Frame
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC } from '../config/phoneSpec';
import { createBeveledRoundedBoxGeometry } from './geometryUtils';

interface PhoneBodyProps {
  materials: {
    frame: THREE.Material;
  };
}

export function PhoneBody({ materials }: PhoneBodyProps) {
  // Beveled outer chassis geometry
  const bodyGeom = useMemo(() => {
    return createBeveledRoundedBoxGeometry(
      PHONE_SPEC.width,
      PHONE_SPEC.height,
      PHONE_SPEC.thickness,
      PHONE_SPEC.cornerRadius,
      0.025,
      8
    );
  }, []);

  return (
    <group name="PhoneBodyChassis">
      {/* Outer beveled metal band forming the body and edges */}
      <mesh
        geometry={bodyGeom}
        material={materials.frame}
        castShadow
        receiveShadow
      />
    </group>
  );
}
