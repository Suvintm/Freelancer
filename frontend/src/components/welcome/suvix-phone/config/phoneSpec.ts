// ─────────────────────────────────────────────────────────────────────────────
// SUVIX PHONE SPEC — Centralized 3D Specification
// Derived from front, back, side, top, bottom reference views
// Coordinate System: X = width, Y = height, Z = thickness
// Front faces +Z, Back faces -Z
// ─────────────────────────────────────────────────────────────────────────────

export const PHONE_SPEC = {
  // Overall dimensions (proportions based on reference ~6.7" phone form factor)
  width: 2.2,
  height: 4.6,
  thickness: 0.26,
  cornerRadius: 0.28,

  // Display / Screen — Flagship Edge-to-Edge with Ultra-Slim 1.2mm Micro-Bezels
  screen: {
    width: 2.14,
    height: 4.54,
    topInset: 0.03,    // ultra-slim micro-bezel top
    bottomInset: 0.03, // ultra-slim micro-bezel bottom
    sideInset: 0.03,   // ultra-slim micro-bezel sides
    cornerRadius: 0.25, // concentric with outer frame (0.28 - 0.03 = 0.25)
  },

  // Front camera (punch-hole)
  punchHole: {
    x: 0,              // centered horizontally
    y: 2.08,           // near top of screen
    radius: 0.038,     // sleek, modern, minimal punch-hole
    depth: 0.015,
  },

  // Metal frame
  frame: {
    thickness: 0.06,   // how thick the metal band is (Z axis edge)
    edgeRadius: 0.04,  // rounded edge on the frame
  },

  // Glass
  glass: {
    frontThickness: 0.02,
    backThickness: 0.02,
    // Subtle curvature at edges (2.5D glass effect)
    edgeCurve: 0.015,
  },

  // Rear camera module (top-left from back view = top-right from our -Z perspective)
  camera: {
    // Module housing (the raised square island)
    moduleWidth: 1.05,
    moduleHeight: 1.05,
    moduleCornerRadius: 0.18,
    moduleDepth: 0.065,     // how much it protrudes
    moduleOffsetX: -0.42,   // offset from center (left side when viewing back)
    moduleOffsetY: 1.35,    // offset from center (toward top)

    // Individual lenses (3 lenses in triangular layout)
    lensRadius: 0.155,
    lensDepth: 0.03,
    lensRingWidth: 0.018,
    // Positions relative to camera module center
    lens1: { x: -0.2, y: 0.2 },   // top-left
    lens2: { x: 0.2, y: 0.2 },    // top-right
    lens3: { x: -0.2, y: -0.2 },  // bottom-left

    // Flash (top-right area of module)
    flash: {
      x: 0.2,
      y: -0.12,
      radius: 0.045,
    },

    // LiDAR / sensor (bottom-right area)
    sensor: {
      x: 0.2,
      y: -0.28,
      radius: 0.03,
    },
  },

  // Side buttons
  buttons: {
    // Power button (right side of phone = +X side)
    power: {
      side: 'right' as const,
      y: 0.65,          // position along Y axis from center
      width: 0.04,
      height: 0.35,
      depth: 0.015,     // protrusion
    },
    // Volume buttons (left side = -X)
    volumeUp: {
      side: 'left' as const,
      y: 0.9,
      width: 0.04,
      height: 0.25,
      depth: 0.015,
    },
    volumeDown: {
      side: 'left' as const,
      y: 0.5,
      width: 0.04,
      height: 0.25,
      depth: 0.015,
    },
    // Silent/Action switch (left side, above volume up)
    // silentSwitch: {
    //   side: 'left' as const,
    //   y: 1.25,
    //   width: 0.04,
    //   height: 0.1,
    //   depth: 0.015,
    // },
  },

  // SIM tray (left side)
  simTray: {
    side: 'left' as const,
    y: -0.2,
    width: 0.04,
    height: 0.5,
    depth: 0.005,
    holeRadius: 0.012,
  },

  // Bottom features
  bottom: {
    // USB-C port
    usbC: {
      x: 0,
      width: 0.26,
      height: 0.09,
      cornerRadius: 0.035,
    },
    // Speaker grille (left of USB-C from bottom view)
    speakerLeft: {
      x: -0.55,
      holeCount: 6,
      holeRadius: 0.015,
      holeSpacing: 0.055,
    },
    // Speaker grille (right of USB-C)
    speakerRight: {
      x: 0.55,
      holeCount: 6,
      holeRadius: 0.015,
      holeSpacing: 0.055,
    },
    // Microphone
    microphone: {
      x: 0.28,
      radius: 0.012,
    },
  },

  // Logo placement on back
  logo: {
    x: 0,
    y: -0.3,
    width: 0.7,
    height: 0.22,
  },

  // Tagline "CREATORS WITHOUT BORDERS"
  tagline: {
    x: 0,
    y: -0.75,
    fontSize: 0.06,
  },

  // Antenna lines (subtle breaks in the metal frame)
  antennaLines: {
    thickness: 0.008,
    positions: [
      // Top-left corner area
      { side: 'top' as const, x: -0.6 },
      // Top-right corner area
      { side: 'top' as const, x: 0.6 },
      // Bottom-left corner area
      { side: 'bottom' as const, x: -0.6 },
      // Bottom-right corner area
      { side: 'bottom' as const, x: 0.6 },
    ],
  },
} as const;

// Derived constants for convenience
export const HALF_W = PHONE_SPEC.width / 2;
export const HALF_H = PHONE_SPEC.height / 2;
export const HALF_T = PHONE_SPEC.thickness / 2;

export type PhoneSpec = typeof PHONE_SPEC;
