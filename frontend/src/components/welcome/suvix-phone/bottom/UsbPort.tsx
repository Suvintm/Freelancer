// ─────────────────────────────────────────────────────────────────────────────
// SUVIX USB-C PORT — Machined Reversible Type-C Port on Bottom Edge (-Y)
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC, HALF_H } from '../config/phoneSpec';
import { createBeveledRoundedBoxGeometry } from '../phone/geometryUtils';

interface UsbPortProps {
  materials: {
    portInterior: THREE.Material;
    portPin: THREE.Material;
  };
}

export function UsbPort({ materials }: UsbPortProps) {
  const { width, height, cornerRadius } = PHONE_SPEC.bottom.usbC;
  const depth = 0.05;

  // Beveled outer port chamber
  const chamberGeom = useMemo(() => {
    return createBeveledRoundedBoxGeometry(width, depth, height, cornerRadius, 0.01, 2);
  }, [width, depth, height, cornerRadius]);

  const yPos = -HALF_H - 0.001;

  return (
    <group position={[0, yPos, 0]} name="UsbCPortGroup">
      {/* Dark Port Recess Chamber */}
      <mesh
        geometry={chamberGeom}
        material={materials.portInterior}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Center Gold Reversible Connector Tongue */}
      <mesh
        position={[0, 0.015, 0]}
        material={materials.portPin}
      >
        <boxGeometry args={[width * 0.55, 0.03, 0.015]} />
      </mesh>
    </group>
  );
}
