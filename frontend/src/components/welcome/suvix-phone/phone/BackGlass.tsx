// ─────────────────────────────────────────────────────────────────────────────
// SUVIX BACK GLASS — Matte AG Frosted Glass with SuviX Titanium Branding
// Positioned at -Z facing backwards
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { PHONE_SPEC, HALF_T } from '../config/phoneSpec';
import { createRoundedRectShape } from './geometryUtils';
import { createBackBrandingTexture } from './createBackBrandingTexture';

interface BackGlassProps {
  material: THREE.Material;
}

export function BackGlass({ material }: BackGlassProps) {
  // 1. Back panel geometry
  const backGeom = useMemo(() => {
    const shape = createRoundedRectShape(
      PHONE_SPEC.width - 0.03,
      PHONE_SPEC.height - 0.03,
      PHONE_SPEC.cornerRadius - 0.015
    );
    const geom = new THREE.ShapeGeometry(shape, 32);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 2. Branding decal texture
  const brandingTexture = useMemo(() => {
    return createBackBrandingTexture();
  }, []);

  useEffect(() => {
    return () => {
      brandingTexture.dispose();
    };
  }, [brandingTexture]);

  // Decal material with transparency
  const decalMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: brandingTexture,
      transparent: true,
      roughness: 0.25,
      metalness: 0.85,
      opacity: 0.95,
      depthWrite: false,
    });
  }, [brandingTexture]);

  const decalGeom = useMemo(() => {
    const shape = createRoundedRectShape(
      PHONE_SPEC.width - 0.1,
      PHONE_SPEC.height - 0.1,
      PHONE_SPEC.cornerRadius - 0.05
    );
    const geom = new THREE.ShapeGeometry(shape, 32);
    
    // UVs for branding decal
    const pos = geom.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    const w = PHONE_SPEC.width - 0.1;
    const h = PHONE_SPEC.height - 0.1;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Correct non-reversed UV mapping for rear-facing plane
      uvs[i * 2] = (x + w / 2) / w;
      uvs[i * 2 + 1] = (y + h / 2) / h;
    }
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geom.computeVertexNormals();
    return geom;
  }, []);

  const backZ = -HALF_T - 0.001;

  return (
    <group name="BackPanelSystem">
      {/* Matte AG Back Glass */}
      <mesh
        geometry={backGeom}
        material={material}
        position={[0, 0, backZ]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      />

      {/* Titanium SuviX Logo & Typography Decal */}
      <mesh
        geometry={decalGeom}
        material={decalMaterial}
        position={[0, 0, backZ - 0.002]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}
