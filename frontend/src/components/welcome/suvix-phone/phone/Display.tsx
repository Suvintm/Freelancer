// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE DISPLAY — Screen Surface with Ask SuviX Interface & Punch Hole
// Positioned at front (+Z)
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC, HALF_T } from '../config/phoneSpec';
import { createCurvedEdgeDisplayGeometry, createRoundedRectShape } from './geometryUtils';
import screenImg from '../../../../assets/screen.png';

interface DisplayProps {
  materials: {
    punchHole: THREE.Material;
    lensGlass: THREE.Material;
  };
}

export function Display({ materials }: DisplayProps) {
  const [, setLoaded] = useState(false);

  // 1. High-Resolution Authentic Screen Image Texture (screen.png)
  const screenTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(screenImg, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      setLoaded(true);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }, []);

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      screenTexture.dispose();
    };
  }, [screenTexture]);

  // 2. Precision OLED Black Bezel Foundation (eliminates any gap to the chassis)
  const bezelGeom = useMemo(() => {
    const shape = createRoundedRectShape(
      PHONE_SPEC.width - 0.012,
      PHONE_SPEC.height - 0.012,
      PHONE_SPEC.cornerRadius - 0.006
    );
    const geom = new THREE.ShapeGeometry(shape, 32);
    geom.computeVertexNormals();
    return geom;
  }, []);

  const bezelMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({ color: '#ffffff' });
  }, []);

  // 3. Procedural Smooth White Gradient Sheen Textures for Lateral Edges
  const leftSheenTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 64, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.10)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 8);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  const rightSheenTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 64, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.10)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 8);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      leftSheenTexture.dispose();
      rightSheenTexture.dispose();
    };
  }, [leftSheenTexture, rightSheenTexture]);

  // 4. Samsung-Style Dual-Edge Curved Display Geometry (Flush)
  const displayGeom = useMemo(() => {
    return createCurvedEdgeDisplayGeometry(
      PHONE_SPEC.screen.width,
      PHONE_SPEC.screen.height,
      0.08,
      0.0,
      PHONE_SPEC.screen.cornerRadius
    );
  }, []);

  // Screen material with self-illumination
  const displayMaterial = useMemo(() => {
    screenTexture.needsUpdate = true;
    return new THREE.MeshBasicMaterial({
      map: screenTexture,
      transparent: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
  }, [screenTexture]);

  // Flush positions on front chassis (+Z)
  const bezelZ = HALF_T + 0.001;
  const displayZ = HALF_T + 0.003;
  const overlayZ = displayZ + 0.001;
  const punchHoleZ = displayZ + 0.002;

  return (
    <group name="DisplaySystem">
      {/* 1. Precision White Foundation Backplate */}
      <mesh
        geometry={bezelGeom}
        material={bezelMaterial}
        position={[0, 0, bezelZ]}
      />

      {/* 2. Flush Active Display Screen (100% Unoccluded) */}
      <mesh
        geometry={displayGeom}
        material={displayMaterial}
        position={[0, 0, displayZ]}
      />

      {/* 3. Luminous White Curved-Glass Lateral Edge Overlays (Clean gradient white sheen) */}
      <group position={[0, 0, overlayZ]}>
        {/* Left lateral edge white glass sheen */}
        <mesh position={[-PHONE_SPEC.screen.width / 2 + 0.03, 0, 0]}>
          <planeGeometry args={[0.06, PHONE_SPEC.screen.height - PHONE_SPEC.screen.cornerRadius * 1.5]} />
          <meshBasicMaterial
            map={leftSheenTexture}
            transparent={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Right lateral edge white glass sheen */}
        <mesh position={[PHONE_SPEC.screen.width / 2 - 0.03, 0, 0]}>
          <planeGeometry args={[0.06, PHONE_SPEC.screen.height - PHONE_SPEC.screen.cornerRadius * 1.5]} />
          <meshBasicMaterial
            map={rightSheenTexture}
            transparent={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 4. Physical Selfie Punch-Hole Camera */}
      <group position={[PHONE_SPEC.punchHole.x, PHONE_SPEC.punchHole.y, punchHoleZ]}>
        {/* Dark camera recess */}
        <mesh material={materials.punchHole}>
          <circleGeometry args={[PHONE_SPEC.punchHole.radius, 32]} />
        </mesh>
        {/* Inner optical lens reflection */}
        <mesh position={[0, 0, 0.001]} material={materials.lensGlass}>
          <circleGeometry args={[PHONE_SPEC.punchHole.radius * 0.45, 24]} />
        </mesh>
      </group>
    </group>
  );
}
