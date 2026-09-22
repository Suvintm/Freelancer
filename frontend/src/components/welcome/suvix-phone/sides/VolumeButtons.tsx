// ─────────────────────────────────────────────────────────────────────────────
// SUVIX VOLUME BUTTONS — Volume Up & Down Buttons on Left Edge (-X)
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC, HALF_W } from '../config/phoneSpec';
import { createBeveledRoundedBoxGeometry } from '../phone/geometryUtils';

interface VolumeButtonsProps {
  material: THREE.Material;
}

export function VolumeButtons({ material }: VolumeButtonsProps) {
  const { volumeUp, volumeDown } = PHONE_SPEC.buttons;

  const btnGeom = useMemo(() => {
    return createBeveledRoundedBoxGeometry(
      volumeUp.depth * 2,
      volumeUp.height,
      volumeUp.width,
      0.015,
      0.005,
      3
    );
  }, [volumeUp.depth, volumeUp.height, volumeUp.width]);

  const xPos = -HALF_W - volumeUp.depth / 2;

  return (
    <group name="VolumeButtonsGroup">
      {/* Volume Up */}
      <mesh
        geometry={btnGeom}
        material={material}
        position={[xPos, volumeUp.y, 0]}
        name="VolumeUpButton"
        castShadow
      />

      {/* Volume Down */}
      <mesh
        geometry={btnGeom}
        material={material}
        position={[xPos, volumeDown.y, 0]}
        name="VolumeDownButton"
        castShadow
      />
    </group>
  );
}
