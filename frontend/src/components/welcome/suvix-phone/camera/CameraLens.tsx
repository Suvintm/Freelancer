// ─────────────────────────────────────────────────────────────────────────────
// SUVIX CAMERA LENS — Flagship Multi-Element Optical Barrel with Bold Jet-Black
// Sapphire Glass, Polished Silver Titanium Chamfer Ring, and Optical AR Coating
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC } from '../config/phoneSpec';

interface CameraLensProps {
  position: [number, number, number];
  materials: {
    lensRing: THREE.Material;
    lensGlass: THREE.Material;
    lensIris: THREE.Material;
  };
}

export function CameraLens({ position, materials }: CameraLensProps) {
  const r = PHONE_SPEC.camera.lensRadius;
  const depth = PHONE_SPEC.camera.lensDepth;

  // 1. Precision CNC Machined Outer Titanium Barrel (Tapered Chamfer)
  const ringGeom = useMemo(() => {
    return new THREE.CylinderGeometry(r, r + 0.008, depth, 48);
  }, [r, depth]);

  // 2. Polished Silver Titanium Chamfered Top Rim
  const rimGeom = useMemo(() => {
    return new THREE.TorusGeometry(r - 0.008, 0.008, 16, 48);
  }, [r]);

  // 3. Inner Stepped Obsidian Black Retaining Bezel Ring
  const innerBezelGeom = useMemo(() => {
    return new THREE.RingGeometry(r - 0.022, r - 0.007, 48);
  }, [r]);

  // 4. Bold Jet-Black Flat Sapphire Optical Glass Disc (Flush, zero awkward domes)
  const glassDiscGeom = useMemo(() => {
    return new THREE.CircleGeometry(r - 0.008, 48);
  }, [r]);

  // 5. Internal Optical Aperture & Pupil
  const pupilGeom = useMemo(() => {
    return new THREE.CircleGeometry(r * 0.44, 36);
  }, [r]);

  // 6. Subtle Multi-Coating Anti-Reflective Optical Ring (Cyan/Navy Glint)
  const arRingGeom = useMemo(() => {
    return new THREE.RingGeometry(r * 0.42, r * 0.56, 36);
  }, [r]);

  return (
    <group position={position} name="CameraLensBarrel">
      {/* 1. Outer Polished Silver Titanium Barrel */}
      <mesh
        geometry={ringGeom}
        material={materials.lensRing}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, depth / 2]}
        castShadow
      />

      {/* 2. Chamfered Silver Titanium Top Rim */}
      <mesh
        geometry={rimGeom}
        material={materials.lensRing}
        position={[0, 0, depth + 0.002]}
      />

      {/* 3. Inner Stepped Obsidian Black Retaining Ring */}
      <mesh position={[0, 0, depth + 0.003]}>
        <primitive object={innerBezelGeom} attach="geometry" />
        <meshStandardMaterial
          color="#050811"
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* 4. Bold Jet-Black Flat Sapphire Glass Surface */}
      <mesh
        geometry={glassDiscGeom}
        material={materials.lensGlass}
        position={[0, 0, depth + 0.0025]}
      />

      {/* 5. Deep Internal Optical Pupil (Pitch Black) */}
      <mesh position={[0, 0, depth + 0.0035]}>
        <primitive object={pupilGeom} attach="geometry" />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* 6. Subtle Multi-Coated Anti-Reflective Optical Glint */}
      <mesh position={[0, 0, depth + 0.0038]}>
        <primitive object={arRingGeom} attach="geometry" />
        <meshBasicMaterial
          color="#38bdf8"
          transparent={true}
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
