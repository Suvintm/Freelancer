/**
 * Theme System Type Definitions
 * Controls global visuals: background, typography, button styles, colors, and layout spacing.
 */

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video' | 'mesh';
export type GradientType = 'linear' | 'radial';
export type ButtonStyle = 'rounded' | 'pill' | 'square' | 'soft' | 'glass';
export type ButtonShadow = 'none' | 'small' | 'medium' | 'large' | 'glow';
export type ButtonAnimation = 'none' | 'pulse' | 'bounce' | 'glow';
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
  opacity: number;
}

export interface BackgroundConfig {
  type: BackgroundType;
  value?: string;
  color?: string;
  gradient?: BackgroundGradient;
  imageUrl?: string;
  videoUrl?: string;
  overlay?: BackgroundOverlay;
  blur?: number;
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
  id?: string;
  name?: string;
  background: BackgroundConfig;
  typography: TypographyConfig;
  buttons: ButtonThemeConfig;
  spacing: SpacingConfig;
  colors: ColorPaletteConfig;
}
