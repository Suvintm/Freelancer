// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE MATERIALS — Physically Based Rendering (PBR) Materials
// White Titanium & Ceramic Pearlescent Finish (Clean, Bright, Luxury Edition)
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

/**
 * Creates and returns the material library for the SuviX 3D Phone
 */
export function createPhoneMaterials() {
  // 1. Polished Silver Titanium Frame (Beveled perimeter band)
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#e2e8f0'),
    metalness: 0.95,
    roughness: 0.16,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    reflectivity: 0.95,
    envMapIntensity: 1.8,
  });

  // 2. Front Glass (Thin protective display glass with subtle specular reflection)
  const frontGlassMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.1,
    metalness: 0.15,
    transparent: true,
    opacity: 0.12,
    depthWrite: false, // Never occlude or whitewash the screen texture underneath!
    envMapIntensity: 1.6,
  });

  // 3. Back Glass Panel (Frost White AG Ceramic Glass finish)
  const backGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fafafb'),
    metalness: 0.08,
    roughness: 0.22,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
    reflectivity: 0.75,
    envMapIntensity: 1.3,
  });

  // 4. Camera Island Base (Crisp Ceramic White Beveled Plateau matching reference)
  const cameraHousingMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'), // Crisp bright white ceramic
    metalness: 0.06,                   // Low metalness keeps it clean white, not dark grey
    roughness: 0.16,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    reflectivity: 0.85,
    envMapIntensity: 1.3,
  });

  // 5. Camera Lens Outer Metal Rings (Polished Silver Titanium Chamfer Rings as shown in reference)
  const lensRingMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f1f5f9'), // Bright polished silver titanium
    metalness: 0.95,
    roughness: 0.14,
    envMapIntensity: 2.0,
  });

  // 6. Camera Lens Sapphire Glass Element (Bold Deep Jet-Black Optical Sapphire)
  const lensGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#000000'), // Bold pure jet black
    metalness: 0.05,                   // Low metalness preserves rich dark ink black
    roughness: 0.02,                   // Glass-smooth high gloss
    clearcoat: 1.0,                    // Luxury optical glass shine
    clearcoatRoughness: 0.02,
    reflectivity: 0.98,
    envMapIntensity: 1.5,
  });

  // 7. Internal Camera Sensor / Aperture iris (Pitch Black)
  const lensIrisMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#000000'), // Pure pitch black
  });

  // 8. Camera Flash Diffuser (Dual-tone warm/cool translucent LED)
  const flashMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fef3c7'),
    emissive: new THREE.Color('#fde68a'),
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.1,
  });

  // 9. LiDAR Sensor (Deep black optical window)
  const sensorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0a0a0a'),
    roughness: 0.1,
    metalness: 0.5,
  });

  // 10. Futuristic Purple Accent Glow Strip on Camera Module (SuviX Signature)
  const cameraAccentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c084fc'),
    emissive: new THREE.Color('#9333ea'),
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.1,
  });

  // 11. SuviX Camera Plateau Badge Emblem
  const cameraBadgeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#475569'),
    metalness: 0.9,
    roughness: 0.25,
    envMapIntensity: 1.4,
  });

  // 12. Side Buttons (Polished Silver Titanium)
  const buttonMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'),
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 1.5,
  });

  // 13. USB-C Port Inner Chamber
  const portInteriorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e2229'),
    metalness: 0.4,
    roughness: 0.7,
  });

  // 14. USB-C Center Contact Pin / Tongue
  const portPinMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d97706'), // Gold plated contacts
    metalness: 0.9,
    roughness: 0.3,
  });

  // 15. Speaker Grille & Microphone Mesh
  const speakerGrilleMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#475569'),
    metalness: 0.85,
    roughness: 0.4,
  });

  // 16. Antenna Polymer Break Lines (Subtle light grey on silver frame)
  const antennaMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cbd5e1'),
    metalness: 0.1,
    roughness: 0.5,
  });

  // 17. Punch-hole Selfie Camera
  const punchHoleMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#020617'),
    metalness: 0.2,
    roughness: 0.05,
    clearcoat: 0.8,
    envMapIntensity: 1.5,
  });

  return {
    frame: frameMaterial,
    frontGlass: frontGlassMaterial,
    backGlass: backGlassMaterial,
    cameraHousing: cameraHousingMaterial,
    lensRing: lensRingMaterial,
    lensGlass: lensGlassMaterial,
    lensIris: lensIrisMaterial,
    flash: flashMaterial,
    sensor: sensorMaterial,
    cameraAccent: cameraAccentMaterial,
    cameraBadge: cameraBadgeMaterial,
    button: buttonMaterial,
    portInterior: portInteriorMaterial,
    portPin: portPinMaterial,
    speakerGrille: speakerGrilleMaterial,
    antenna: antennaMaterial,
    punchHole: punchHoleMaterial,
  };
}
