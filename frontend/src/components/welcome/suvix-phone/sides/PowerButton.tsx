// ─────────────────────────────────────────────────────────────────────────────
// SUVIX POWER BUTTON — Machined Side Button on Right Edge (+X)
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC, HALF_W } from '../config/phoneSpec';
import { createBeveledRoundedBoxGeometry } from '../phone/geometryUtils';

interface PowerButtonProps {
  material: THREE.Material;
}

export function PowerButton({ material }: PowerButtonProps) {
  const { y, width, height, depth } = PHONE_SPEC.buttons.power;

  const btnGeom = useMemo(() => {
    // Oriented with depth along X
    return createBeveledRoundedBoxGeometry(
      depth * 2, // X dimension
      height,    // Y dimension
      width,     // Z dimension
      0.015,
      0.005,
      3
    );
  }, [depth, height, width]);

  return (
    <mesh
      geometry={btnGeom}
      material={material}
      position={[HALF_W + depth / 2, y, 0]}
      name="PowerButton"
      castShadow
    />
  );
}
