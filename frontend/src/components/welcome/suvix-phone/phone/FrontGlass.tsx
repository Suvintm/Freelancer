// ─────────────────────────────────────────────────────────────────────────────
// SUVIX FRONT GLASS — Protective 2.5D Physical Display Glass
// Positioned at +Z over the display surface
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

interface FrontGlassProps {
  material: THREE.Material;
}

export function FrontGlass(_props: FrontGlassProps) {
  // Omit front overlay mesh to prevent depth fighting, glare whitewash, or occlusion over the OLED display
  return null;
}
