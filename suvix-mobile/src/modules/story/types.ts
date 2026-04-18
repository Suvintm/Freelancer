// ─────────────────────────────────────────────────────────────────────────────
// Story Module — Types
// ─────────────────────────────────────────────────────────────────────────────

export type StoryObjectType = 'TEXT' | 'STICKER' | 'IMAGE';

export type FontStyle =
  | 'Modern'
  | 'Classic'
  | 'Italic'
  | 'Neon'
  | 'Typewriter'
  | 'Cursive'
  | 'Comic';

export type TextEffect = 'none' | 'shadow' | 'outline' | 'glow' | 'neon';
export type TextAlign  = 'left' | 'center' | 'right';
export type ImageFilter =
  | 'none'
  | 'warm'
  | 'cool'
  | 'fade'
  | 'retro'
  | 'vivid'
  | 'noir'
  | 'dramatic';

export interface StoryObject {
  id: string;
  type: StoryObjectType;
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity?: number;

  // ── Text ──────────────────────────────────────────────────────────────────
  fontStyle?: FontStyle;
  color?: string;
  textBackground?: boolean;
  textBackgroundColor?: string;
  textAlign?: TextAlign;
  textEffect?: TextEffect;
  fontSize?: number;
  height?: number;
  aspectRatio?: number;

  // ── Image ─────────────────────────────────────────────────────────────────
  imageFilter?: ImageFilter;

  // ── Widget / Sticker extras ───────────────────────────────────────────────
  pollQuestion?: string;
  pollOptions?: string[];
  musicTitle?: string;
  musicArtist?: string;
  countdownTargetMs?: number;
  labelText?: string;
}

// ── Canvas background ──────────────────────────────────────────────────────────
export type BgType = 'solid' | 'gradient';

export interface CanvasBg {
  type: BgType;
  color: string;                       // primary / solid color
  gradientColors?: [string, string];   // only when type === 'gradient'
}

// ── Drawing ────────────────────────────────────────────────────────────────────
export interface DrawPath {
  id: string;
  d: string;          // SVG path data
  color: string;
  strokeWidth: number;
  opacity: number;
  isEraser?: boolean;
}