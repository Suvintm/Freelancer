// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE LIGHTING — High-Key Studio Lighting (Minimal Soft Shadows)
// Optimized for white ceramic and silver titanium materials
// ─────────────────────────────────────────────────────────────────────────────

import { ContactShadows } from '@react-three/drei';

export function PhoneLighting() {
  return (
    <group name="StudioLightingRig">
      {/* 1. Bright, High-Key Ambient Baseline Lighting */}
      <ambientLight intensity={1.15} color="#ffffff" />

      {/* 2. Key Light — Studio Softbox (Top-Right Front) */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.2}
        color="#ffffff"
      />

      {/* 3. Fill Light — Soft Diffuse White (Bottom-Left Front) */}
      <directionalLight
        position={[-3, -1, 3]}
        intensity={0.95}
        color="#f8fafc"
      />

      {/* 4. Top-Back Rim Light — Silver Edge Specular Highlighter */}
      <directionalLight
        position={[0, 4, -4]}
        intensity={1.1}
        color="#ffffff"
      />

      {/* 5. Bottom Rim Uplight for Edge Definition */}
      <directionalLight
        position={[0, -3, 2]}
        intensity={0.7}
        color="#f1f5f9"
      />

      {/* 6. Soft Studio Ground Shadow on Pure Black Stage */}
      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.4}
        scale={4.6}
        blur={2.6}
        far={3.0}
        resolution={512}
        color="#000000"
      />
    </group>
  );
}
