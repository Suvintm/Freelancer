import React from 'react';
import type { Theme } from '../types/theme.types';

export interface ResolvedBackground {
  containerStyle: React.CSSProperties;
  bgImageLayerStyle: React.CSSProperties;
  overlayStyle: React.CSSProperties;
  isImage: boolean;
  effectiveBgColor: string;
  contrastRatio: number;
  isContrastLow: boolean;
  recommendedOverlayOpacity: number;
}

const DEFAULT_THEME_COLOR = '#4D6234';
const DEFAULT_TEXT_COLOR = '#ffffff';

/**
 * 1. Schema Migration: Upgrades any legacy or unversioned theme record safely to Theme v1
 */
export function migrateTheme(rawTheme: any): Theme {
  if (!rawTheme) {
    return {
      schemaVersion: 1,
      background: {
        type: 'solid',
        value: DEFAULT_THEME_COLOR,
      },
      typography: {
        fontFamily: 'Inter',
        headingSize: 'medium',
        bodySize: 'medium',
        headingWeight: 'bold',
      },
      buttons: {
        style: 'rounded',
        shadow: 'medium',
        animation: 'none',
        borderRadius: 14,
      },
      spacing: {
        blockGap: 'comfortable',
        pagePadding: 'medium',
        maxWidth: 'medium',
      },
      colors: {
        primary: DEFAULT_THEME_COLOR,
        secondary: '#D4E0C0',
        text: '#ffffff',
        textMuted: '#D4E0C0',
        background: DEFAULT_THEME_COLOR,
        cardBackground: '#ffffff',
      },
      cardVariant: 'solid',
    };
  }

  // If rawTheme was just a string (legacy color)
  if (typeof rawTheme === 'string') {
    return {
      schemaVersion: 1,
      background: {
        type: rawTheme.startsWith('linear-gradient') ? 'gradient' : 'solid',
        value: rawTheme,
      },
      typography: {
        fontFamily: 'Inter',
        headingSize: 'medium',
        bodySize: 'medium',
        headingWeight: 'bold',
      },
      buttons: {
        style: 'rounded',
        shadow: 'medium',
        animation: 'none',
        borderRadius: 14,
      },
      spacing: {
        blockGap: 'comfortable',
        pagePadding: 'medium',
        maxWidth: 'medium',
      },
      colors: {
        primary: rawTheme,
        secondary: '#ffffff',
        text: '#ffffff',
        textMuted: '#e2e8f0',
        background: rawTheme,
      },
      cardVariant: 'solid',
    };
  }

  // Ensure background has canonical value
  const rawBg = rawTheme.background || {};
  const bgType = rawBg.type || (rawBg.imageUrl ? 'image' : rawBg.value?.startsWith('linear') ? 'gradient' : 'solid');
  const bgValue = rawBg.value || rawBg.color || rawBg.imageUrl || DEFAULT_THEME_COLOR;

  return {
    schemaVersion: 1,
    id: rawTheme.id,
    name: rawTheme.name,
    background: {
      type: bgType,
      value: bgValue,
      assetId: rawBg.assetId,
      dominantColor: rawBg.dominantColor,
      overlay: rawBg.overlay || { enabled: false, color: '#000000', opacity: 0.4 },
      blur: typeof rawBg.blur === 'number' ? Math.min(12, Math.max(0, rawBg.blur)) : 0,
    },
    typography: rawTheme.typography || {
      fontFamily: 'Inter',
      headingSize: 'medium',
      bodySize: 'medium',
      headingWeight: 'bold',
    },
    buttons: rawTheme.buttons || {
      style: 'rounded',
      shadow: 'medium',
      animation: 'none',
      borderRadius: 14,
    },
    spacing: rawTheme.spacing || {
      blockGap: 'comfortable',
      pagePadding: 'medium',
      maxWidth: 'medium',
    },
    colors: rawTheme.colors || {
      primary: DEFAULT_THEME_COLOR,
      secondary: '#ffffff',
      text: '#ffffff',
      textMuted: '#94a3b8',
      background: bgValue,
      cardBackground: '#ffffff',
    },
    cardVariant: rawTheme.cardVariant || 'solid',
  };
}

/**
 * 2. WCAG Luminance and Contrast Calculation
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return [77, 98, 52]; // default #4D6234
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(c1Hex: string, c2Hex: string): number {
  try {
    const [r1, g1, b1] = hexToRgb(c1Hex);
    const [r2, g2, b2] = hexToRgb(c2Hex);
    const lum1 = getRelativeLuminance(r1, g1, b1);
    const lum2 = getRelativeLuminance(r2, g2, b2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
  } catch {
    return 7.0;
  }
}

/**
 * Extracts worst-case color stop from CSS gradient string against text color
 */
export function extractWorstCaseGradientStop(gradientStr: string, textHex: string): string {
  try {
    const hexMatches = gradientStr.match(/#[0-9a-fA-F]{3,6}/g);
    if (!hexMatches || hexMatches.length === 0) return DEFAULT_THEME_COLOR;

    let worstHex = hexMatches[0];
    let minRatio = 999;

    for (const stop of hexMatches) {
      const ratio = calculateContrastRatio(stop, textHex);
      if (ratio < minRatio) {
        minRatio = ratio;
        worstHex = stop;
      }
    }
    return worstHex;
  } catch {
    return DEFAULT_THEME_COLOR;
  }
}

/**
 * Suggests optimal overlay opacity to achieve WCAG AA (4.5:1 ratio)
 */
export function getRecommendedOverlayOpacity(bgHex: string, textHex: string, targetRatio: number = 4.5): number {
  const currentRatio = calculateContrastRatio(bgHex, textHex);
  if (currentRatio >= targetRatio) return 0.0;
  // If contrast is poor, calculate needed opacity (clamped between 0.35 and 0.70)
  const deficit = targetRatio - currentRatio;
  const needed = Math.min(0.70, Math.max(0.35, deficit / targetRatio));
  return parseFloat(needed.toFixed(2));
}

/**
 * 3. Canonical Unified Background Style Resolver
 * Consumed identically by:
 * - Studio BioCanvasPreview
 * - Dashboard BioPageCard mini phone
 * - Live Public Visitor Profile (PublicBioVisitorPage)
 */
export function resolveBackgroundStyle(
  themeInput?: Partial<Theme> | null,
  options?: { isThumbnail?: boolean }
): ResolvedBackground {
  try {
    const theme = migrateTheme(themeInput);
    const bg = theme.background;
    const textColor = theme.colors?.text || DEFAULT_TEXT_COLOR;

    let isImage = false;
    let effectiveBgColor = DEFAULT_THEME_COLOR;
    const containerStyle: React.CSSProperties = {};
    const bgImageLayerStyle: React.CSSProperties = {};
    const overlayStyle: React.CSSProperties = {};

    const bgVal = bg.value || bg.color || bg.imageUrl || DEFAULT_THEME_COLOR;

    if (bg.type === 'solid' || !bg.type) {
      containerStyle.backgroundColor = bgVal;
      effectiveBgColor = bgVal.startsWith('#') ? bgVal : DEFAULT_THEME_COLOR;
    } else if (bg.type === 'gradient') {
      containerStyle.backgroundImage = bgVal;
      effectiveBgColor = extractWorstCaseGradientStop(bgVal, textColor);
    } else if (bg.type === 'image') {
      isImage = true;
      effectiveBgColor = bg.dominantColor || '#121316';
      containerStyle.backgroundColor = effectiveBgColor;

      const imgUrl = options?.isThumbnail && bgVal.includes('unsplash')
        ? bgVal.replace(/w=\d+/, 'w=400')
        : bgVal;

      bgImageLayerStyle.backgroundImage = `url("${imgUrl}")`;
      bgImageLayerStyle.backgroundSize = 'cover';
      bgImageLayerStyle.backgroundPosition = 'center';
      bgImageLayerStyle.backgroundRepeat = 'no-repeat';

      // Blur capped at 12px with hardware acceleration
      const blurPx = Math.min(12, Math.max(0, bg.blur || 0));
      if (blurPx > 0) {
        bgImageLayerStyle.filter = `blur(${blurPx}px)`;
        bgImageLayerStyle.transform = 'scale(1.08) translate3d(0,0,0)'; // prevents edge clipping
      }
    } else {
      // Graceful fallback for future/unimplemented types
      containerStyle.backgroundColor = DEFAULT_THEME_COLOR;
      effectiveBgColor = DEFAULT_THEME_COLOR;
    }

    // Configure overlay
    const overlay = bg.overlay;
    if (overlay?.enabled || (isImage && overlay?.opacity && overlay.opacity > 0)) {
      const opacity = Math.min(0.80, Math.max(0, overlay?.opacity ?? 0.4));
      overlayStyle.backgroundColor = overlay?.color || '#000000';
      overlayStyle.opacity = opacity;
    }

    // Compute Contrast
    const rawContrast = calculateContrastRatio(effectiveBgColor, textColor);
    // If overlay is active on image, boost the effective contrast estimation
    const overlayBoost = (overlay?.enabled ? (overlay.opacity || 0.4) : 0) * 3.5;
    const finalContrast = parseFloat((rawContrast + overlayBoost).toFixed(2));
    const isContrastLow = finalContrast < 4.5;
    const recommendedOverlayOpacity = getRecommendedOverlayOpacity(effectiveBgColor, textColor);

    return {
      containerStyle,
      bgImageLayerStyle,
      overlayStyle,
      isImage,
      effectiveBgColor,
      contrastRatio: finalContrast,
      isContrastLow,
      recommendedOverlayOpacity,
    };
  } catch (err) {
    console.error('[resolveBackgroundStyle] Graceful fallback on malformed theme:', err);
    return {
      containerStyle: { backgroundColor: DEFAULT_THEME_COLOR },
      bgImageLayerStyle: {},
      overlayStyle: {},
      isImage: false,
      effectiveBgColor: DEFAULT_THEME_COLOR,
      contrastRatio: 7.0,
      isContrastLow: false,
      recommendedOverlayOpacity: 0.0,
    };
  }
}
