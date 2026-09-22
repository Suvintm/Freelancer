// ─────────────────────────────────────────────────────────────────────────────
// SUVIX REAR CAMERA MODULE — Custom Asymmetrical Ceramic Island with Triple Lens,
// Official SuviX Medallion (logo.png), and Futuristic Purple Accent LED Strip
// Matches the Reference Design Sheet Exactly
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC, HALF_T } from '../config/phoneSpec';
import { CameraLens } from './CameraLens';
import { CameraFlash } from './CameraFlash';
import logoImg from '../../../../assets/logo.png';

interface CameraModuleProps {
  materials: {
    cameraHousing: THREE.Material;
    lensRing: THREE.Material;
    lensGlass: THREE.Material;
    lensIris: THREE.Material;
    flash: THREE.Material;
    sensor: THREE.Material;
    cameraAccent?: THREE.Material;
    cameraBadge?: THREE.Material;
  };
}

/**
 * Creates the parametric asymmetrical camera island shape:
 * Smooth rounded left side, diagonal top-right chamfer, and aerodynamic right wing.
 * Supports an inset parameter for concentric framing.
 */
function createCustomCameraIslandShape(inset: number = 0): THREE.Shape {
  const shape = new THREE.Shape();
  const leftX = -0.55 + inset;
  const bottomY = -0.50 + inset;
  const topY = 0.50 - inset;
  const rLeft = Math.max(0.04, 0.22 - inset);

  // 1. Bottom edge start
  shape.moveTo(leftX + rLeft, bottomY);
  // 2. Bottom-left rounded corner
  shape.quadraticCurveTo(leftX, bottomY, leftX, bottomY + rLeft);
  // 3. Left vertical edge
  shape.lineTo(leftX, topY - rLeft);
  // 4. Top-left rounded corner
  shape.quadraticCurveTo(leftX, topY, leftX + rLeft, topY);
  // 5. Top horizontal edge
  shape.lineTo(0.12 - inset * 0.4, topY);
  // 6. Smooth curve into top-right diagonal slope
  shape.quadraticCurveTo(0.20 - inset * 0.3, topY, 0.26 - inset * 0.6, topY - 0.05 + inset * 0.3);
  // 7. Diagonal chamfer edge (parallel to purple LED accent bar)
  shape.lineTo(0.50 - inset * 0.8, 0.12 + inset * 0.4);
  // 8. Round into extended right wing (holding the official SuviX logo medallion)
  shape.quadraticCurveTo(0.58 - inset, 0.04 - inset * 0.2, 0.58 - inset, -0.12);
  shape.lineTo(0.58 - inset, -0.32 + inset);
  // 9. Round bottom-right corner back into bottom edge
  shape.quadraticCurveTo(0.58 - inset, bottomY, 0.38 - inset, bottomY);
  // 10. Bottom horizontal edge
  shape.lineTo(leftX + rLeft, bottomY);

  return shape;
}

/**
 * Creates the outer 3D camera island geometry (with bold black side edges and bevels).
 */
function createCustomCameraIslandGeometry(depth: number): THREE.BufferGeometry {
  const shape = createCustomCameraIslandShape(0);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: Math.max(0.005, depth - 0.016),
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.016,
    bevelOffset: 0,
    bevelSegments: 8,
    curveSegments: 48,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.computeVertexNormals();
  // Translate Z so top surface sits at +depth/2 and base sits at -depth/2
  geom.translate(0, 0, -depth / 2);
  return geom;
}

/**
 * Creates the inset ceramic white faceplate nested within the bold black perimeter frame.
 */
function createCameraFacePlateGeometry(): THREE.BufferGeometry {
  const shape = createCustomCameraIslandShape(0.024);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 4,
    curveSegments: 48,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.computeVertexNormals();
  return geom;
}

export function CameraModule({ materials }: CameraModuleProps) {
  const { moduleDepth, moduleOffsetX, moduleOffsetY } = PHONE_SPEC.camera;

  // 1. Bold Black Island Chassis Geometry (forms all side edges, bevels, and outer frame)
  const islandGeom = useMemo(() => {
    return createCustomCameraIslandGeometry(moduleDepth);
  }, [moduleDepth]);

  // 2. Inset Ceramic White Faceplate Geometry
  const facePlateGeom = useMemo(() => {
    return createCameraFacePlateGeometry();
  }, []);

  // 3. Bold Black Outer Edge & Side Wall Material
  const boldBlackEdgeMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#020617'), // Bold deep black
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.95,
      envMapIntensity: 1.8,
    });
  }, []);

  // 4. Official SuviX Circular Logo Texture from assets/logo.png
  const logoTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(logoImg);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  const islandZ = -HALF_T - moduleDepth / 2;
  const surfaceZ = moduleDepth / 2;
  const elementZ = surfaceZ + 0.004;

  return (
    <group
      position={[moduleOffsetX, moduleOffsetY, islandZ]}
      rotation={[0, Math.PI, 0]}
      name="RearCameraSystem"
    >
      {/* 1. Outer Bold Black Island Chassis (Forms all side edges, side walls, and perimeter frame) */}
      <mesh
        geometry={islandGeom}
        material={boldBlackEdgeMaterial}
        castShadow
        receiveShadow
      />

      {/* 2. Inset Ceramic White Plateau Faceplate (Framed cleanly by bold black side edges) */}
      <mesh
        geometry={facePlateGeom}
        material={materials.cameraHousing}
        position={[0, 0, surfaceZ]}
      />

      {/* 3. Top-Left Optical Lens */}
      <CameraLens
        position={[-0.25, 0.22, elementZ]}
        materials={materials}
      />

      {/* 4. Top-Right Optical Lens */}
      <CameraLens
        position={[0.10, 0.22, elementZ]}
        materials={materials}
      />

      {/* 5. Bottom-Left Optical Lens */}
      <CameraLens
        position={[-0.25, -0.22, elementZ]}
        materials={materials}
      />

      {/* 6. True-Tone Dual Flash, LiDAR & Microphone Array */}
      <CameraFlash
        position={[0.06, -0.06, elementZ]}
        materials={materials}
      />

      {/* 7. Signature SuviX Futuristic Purple LED Accent Light Strip */}
      <group position={[0.34, 0.30, elementZ + 0.003]} rotation={[0, 0, -Math.PI / 4]}>
        {/* Outer diffuse purple glow frame */}
        <mesh material={materials.cameraAccent}>
          <boxGeometry args={[0.26, 0.024, 0.008]} />
        </mesh>
        {/* Inner bright neon light core */}
        <mesh position={[0, 0, 0.003]}>
          <boxGeometry args={[0.24, 0.012, 0.004]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 7. Official SuviX Circular Medallion with logo.png */}
      <group position={[0.36, -0.16, elementZ + 0.002]}>
        {/* Outer Polished Titanium Chamfer Bezel Ring */}
        <mesh material={materials.lensRing} position={[0, 0, 0.002]}>
          <ringGeometry args={[0.095, 0.115, 36]} />
        </mesh>
        {/* Recessed Dark Titanium Medallion Base */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.098, 36]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        {/* Official SuviX Logo Decal from logo.png (non-mirrored) */}
        <mesh position={[0, 0, 0.003]} scale={[-1, 1, 1]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshBasicMaterial
            map={logoTexture}
            transparent={true}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
