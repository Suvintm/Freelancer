// ─────────────────────────────────────────────────────────────────────────────
// SUVIX CAMERA FLASH & SENSORS — Dual-LED Flash Diffuser & LiDAR Sensor
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { PHONE_SPEC } from '../config/phoneSpec';

interface CameraFlashProps {
  position: [number, number, number];
  materials: {
    flash: THREE.Material;
    sensor: THREE.Material;
    lensRing: THREE.Material;
  };
}

export function CameraFlash({ position, materials }: CameraFlashProps) {
  const flashRadius = PHONE_SPEC.camera.flash.radius;
  const sensorRadius = PHONE_SPEC.camera.sensor.radius;

  return (
    <group position={position} name="FlashAndSensors">
      {/* 1. True-Tone Dual LED Flash Element */}
      <group position={[0, 0, 0]}>
        {/* Subtle metal bezel ring around flash */}
        <mesh material={materials.lensRing} position={[0, 0, 0.002]}>
          <ringGeometry args={[flashRadius, flashRadius + 0.008, 24]} />
        </mesh>
        {/* Translucent LED diffuser disc */}
        <mesh material={materials.flash} position={[0, 0, 0.003]}>
          <circleGeometry args={[flashRadius, 24]} />
        </mesh>
      </group>

      {/* 2. LiDAR Scanner Sensor (below flash) */}
      <group position={[0, -0.16, 0]}>
        <mesh material={materials.sensor} position={[0, 0, 0.002]}>
          <circleGeometry args={[sensorRadius, 20]} />
        </mesh>
        {/* Subtle dark glass reflection */}
        <mesh position={[0, 0, 0.003]}>
          <circleGeometry args={[sensorRadius * 0.5, 16]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* 3. Tiny Rear Noise-Canceling Microphone Pinhole */}
      <mesh position={[0.07, -0.08, 0.002]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#050507" />
      </mesh>
    </group>
  );
}
