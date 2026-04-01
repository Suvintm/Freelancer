export const Colors = {
  // BRANDING (Monochrome / Zinc / AI Inspired)
  accent: '#FFFFFF', // High-Contrast Active Accent
  accentGradient: ['#FFFFFF', '#D4D4D8'] as const, // Zinc Flow
  error: '#EF4444',
  success: '#22C55E',
  white: '#FFFFFF',
  black: '#000000',
  heart: '#FF3040',

  // DARK THEME (Pure Black / OLED / Play Store Inspired)
  dark: {
    primary: '#000000', // Absolute pure black for OLED
    secondary: '#0B0B0B', // Very subtle elevation for cards
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    border: '#1A1A1B',
    inputBg: '#0F0F12',
    overlay: 'rgba(0, 0, 0, 0.8)',
    tabBar: 'rgba(0, 0, 0, 0.96)',
  },

  // LIGHT THEME (Clean/Corporate Inspired)
  light: {
    primary: '#F8FAFC',
    secondary: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    inputBg: '#F1F5F9',
    overlay: 'rgba(255, 255, 255, 0.8)',
    tabBar: 'rgba(255, 255, 255, 0.9)',
  }
};
