export const Colors = {
  // CORE BRANDING
  error: '#EF4444',
  success: '#22C55E',
  white: '#FFFFFF',
  black: '#000000',
  heart: '#FF3040',

  // DARK THEME (Pure Black / OLED)
  dark: {
    primary: '#000000',
    secondary: '#0B0B0B',
    accent: '#FFFFFF',
    accentGradient: ['#FFFFFF', '#D4D4D8'] as const,
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    border: '#1A1A1B',
    inputBg: '#0F0F12',
    overlay: 'rgba(0, 0, 0, 0.8)',
    tabBar: 'rgba(0, 0, 0, 0.96)',
  },

  // LIGHT THEME (Clean / Zinc)
  light: {
    primary: '#F8FAFC',
    secondary: '#FFFFFF',
    accent: '#000000',
    accentGradient: ['#000000', '#27272A'] as const,
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    inputBg: '#F1F5F9',
    overlay: 'rgba(255, 255, 255, 0.8)',
    tabBar: 'rgba(255, 255, 255, 0.9)',
  }
};
