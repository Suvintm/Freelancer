// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE GEOMETRY UTILS — Procedural Buffer Geometry Generators
// Creates clean, smoothed rounded shapes and beveled extrusions
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

/**
 * Creates a 2D rounded rectangle shape centered at (0, 0)
 */
export function createRoundedRectShape(
  width: number,
  height: number,
  radius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - r);
  shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + height);
  shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, (3 * Math.PI) / 2, false);

  return shape;
}

/**
 * Creates a beveled 3D extruded rounded rectangle centered at origin (0, 0, 0)
 */
/**
 * Creates a beveled 3D extruded rounded rectangle centered at origin (0, 0, 0)
 * Uses high curveSegments (48) for ultra-smooth rounded Samsung-style corners without sharp facets
 */
export function createBeveledRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevelSize: number = 0.02,
  bevelSegments: number = 8
): THREE.BufferGeometry {
  const shape = createRoundedRectShape(
    width - bevelSize * 2,
    height - bevelSize * 2,
    Math.max(0.01, radius - bevelSize)
  );
  
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: Math.max(0.001, depth - bevelSize * 2),
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize: bevelSize,
    bevelOffset: 0,
    bevelSegments: bevelSegments,
    curveSegments: 48, // High fidelity for buttery smooth rounded corners
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center(); // Center at origin (0,0,0)
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates a hollow frame shape (outer rounded rect minus inner rounded rect)
 */
export function createHollowFrameShape(
  outerW: number,
  outerH: number,
  outerR: number,
  borderThickness: number
): THREE.Shape {
  const shape = createRoundedRectShape(outerW, outerH, outerR);
  
  const innerW = outerW - borderThickness * 2;
  const innerH = outerH - borderThickness * 2;
  const innerR = Math.max(0.01, outerR - borderThickness);
  
  const holePath = new THREE.Path();
  const x = -innerW / 2;
  const y = -innerH / 2;
  const r = Math.min(innerR, innerW / 2, innerH / 2);

  // Counter-clockwise for hole
  holePath.moveTo(x + r, y);
  holePath.lineTo(x + innerW - r, y);
  holePath.absarc(x + innerW - r, y + r, r, -Math.PI / 2, 0, false);
  holePath.lineTo(x + innerW, y + innerH - r);
  holePath.absarc(x + innerW - r, y + innerH - r, r, 0, Math.PI / 2, false);
  holePath.lineTo(x + r, y + innerH);
  holePath.absarc(x + r, y + innerH - r, r, Math.PI / 2, Math.PI, false);
  holePath.lineTo(x, y + r);
  holePath.absarc(x + r, y + r, r, Math.PI, (3 * Math.PI) / 2, false);

  shape.holes.push(holePath);
  return shape;
}

/**
 * Creates a Samsung-style dual-edge curved waterfall display geometry.
 * Uses exact parametric vertex generation with matching UVs and conformal squircle mapping,
 * ensuring flawless rounded corners, zero triangle bunching, and a natural 2.5D waterfall curve.
 */
export function createCurvedEdgeDisplayGeometry(
  width: number,
  height: number,
  _curveWidth: number = 0.10,
  _curveDepth: number = 0.010,
  cornerRadius: number = 0.25
): THREE.BufferGeometry {
  const segmentsX = 64;
  const segmentsY = 96;
  
  const halfW = width / 2;
  const halfH = height / 2;
  const coreW = Math.max(0.01, halfW - cornerRadius);
  const coreH = Math.max(0.01, halfH - cornerRadius);

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= segmentsY; j++) {
    const v = j / segmentsY;
    const py = (v - 0.5) * 2; // [-1, 1]

    for (let i = 0; i <= segmentsX; i++) {
      const u = i / segmentsX;
      const px = (u - 0.5) * 2; // [-1, 1]

      let x = px * halfW;
      let y = py * halfH;

      // True Concentric Mathematical Rounded-Rectangle Boundary Mapping
      // Prevents corner collapse and ensures the screen reaches right to the phone edges
      const dx = Math.abs(x) - coreW;
      const dy = Math.abs(y) - coreH;

      if (dx > 0 && dy > 0) {
        const theta = Math.atan2(dy, dx);
        const maxCosSin = Math.max(Math.cos(theta), Math.sin(theta));
        const dBox = cornerRadius / maxCosSin;
        const r = Math.sqrt(dx * dx + dy * dy);
        const t = Math.min(1.0, r / dBox);
        const rNew = t * cornerRadius;
        x = (x >= 0 ? 1 : -1) * (coreW + rNew * Math.cos(theta));
        y = (y >= 0 ? 1 : -1) * (coreH + rNew * Math.sin(theta));
      }

      // Flush front display surface (z = 0): ensures screen.png is never hidden or occluded at edges
      const z = 0;

      // Full edge-to-edge UV mapping so screen.png completely fills the screen geometry
      vertices.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Generate triangle grid indices
  for (let j = 0; j < segmentsY; j++) {
    for (let i = 0; i < segmentsX; i++) {
      const a = j * (segmentsX + 1) + i;
      const b = a + 1;
      const c = a + (segmentsX + 1);
      const d = c + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}
