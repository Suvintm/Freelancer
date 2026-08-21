/**
 * Theme System Type Definitions
 * Enterprise-Grade Link-in-Bio Canvas Master & Visual Tokens
 */

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video' | 'mesh';
export type GradientType = 'linear' | 'radial';
export type ButtonStyle = 'rounded' | 'pill' | 'square' | 'soft' | 'glass';
export type ButtonShadow = 'none' | 'small' | 'medium' | 'large' | 'glow';
export type ButtonAnimation = 'none' | 'pulse' | 'bounce' | 'glow';
export type CardVariant = 'solid' | 'glass' | 'outline' | 'shadow';
export type SpacingScale = 'compact' | 'comfortable' | 'spacious' | 'small' | 'medium' | 'large';
export type MaxWidthScale = 'narrow' | 'medium' | 'wide';

export interface BackgroundGradient {
  colors: string[];
  angle: number;
  type: GradientType;
}

export interface BackgroundOverlay {
  enabled: boolean;
  color: string;
  opacity: number; // 0.0 (transparent) to 0.8 (dark)
}

export interface BackgroundConfig {
  type: BackgroundType;
  value?: string; // Hex, CSS gradient, or asset URL
  color?: string; // Solid color fallback
  gradient?: BackgroundGradient;
  assetId?: string; // Resolved CDN Asset ID for uploaded wallpapers
  dominantColor?: string; // Hex code of dominant color for instant luminance/contrast computation
  imageUrl?: string;
  videoUrl?: string;
  overlay?: BackgroundOverlay;
  blur?: number; // Frosted blur capped at 0–12px for mobile performance
}

export interface TypographyConfig {
  fontFamily: string;
  headingSize: 'small' | 'medium' | 'large';
  bodySize: 'small' | 'medium' | 'large';
  headingWeight?: 'normal' | 'medium' | 'bold' | 'black';
}

export interface ButtonThemeConfig {
  style: ButtonStyle;
  shadow: ButtonShadow;
  animation: ButtonAnimation;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
}

export interface SpacingConfig {
  blockGap: SpacingScale;
  pagePadding: SpacingScale;
  maxWidth: MaxWidthScale;
}

export interface ColorPaletteConfig {
  primary: string;
  secondary: string;
  accent?: string;
  text: string;
  textMuted: string;
  background: string;
  cardBackground?: string;
}

export interface Theme {
  schemaVersion?: number;
  id?: string;
  name?: string;
  background: BackgroundConfig;
  typography: TypographyConfig;
  buttons: ButtonThemeConfig;
  spacing: SpacingConfig;
  colors: ColorPaletteConfig;
  cardVariant?: CardVariant;
}
