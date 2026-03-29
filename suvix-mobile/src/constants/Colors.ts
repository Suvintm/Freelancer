export const Colors = {
  // BRANDING
  accent: '#22C55E', // SuviX Emerald
  accentGradient: ['#22C55E', '#059669'] as const,
  error: '#EF4444',
  success: '#10B981',
  white: '#FFFFFF',
  black: '#000000',

  // DARK THEME (Web/Instagram Inspired)
  dark: {
    primary: '#050509', // Deep space dark background
    secondary: '#11111A', // Elevated surface dark
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    border: '#27272A',
    inputBg: '#18181B',
    overlay: 'rgba(5, 5, 9, 0.8)',
    tabBar: 'rgba(17, 17, 26, 0.9)',
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
