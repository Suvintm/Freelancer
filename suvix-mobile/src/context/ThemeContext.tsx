import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Colors as StaticColors } from '../constants/Colors';

const THEME_KEY = 'suvix_theme_preference';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  tabBar: string;
  accent: string;
}

interface ThemeContextType {
  theme: ThemeColors;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isLoaded: boolean;
}

const lightTheme: ThemeColors = {
  primary: StaticColors.light.primary,
  secondary: StaticColors.light.secondary,
  background: StaticColors.light.primary,
  card: StaticColors.white,
  text: StaticColors.light.text,
  textSecondary: StaticColors.light.textSecondary,
  border: StaticColors.light.border,
  notification: StaticColors.error,
  tabBar: StaticColors.light.tabBar,
  accent: StaticColors.light.accent,
};

const darkTheme: ThemeColors = {
  primary: StaticColors.dark.primary,
  secondary: StaticColors.dark.secondary,
  background: StaticColors.dark.primary, // Pure Black OLED
  card: StaticColors.dark.secondary, // Material Elevation
  text: StaticColors.dark.text,
  textSecondary: StaticColors.dark.textSecondary,
  border: StaticColors.dark.border,
  notification: StaticColors.error,
  tabBar: StaticColors.dark.tabBar,
  accent: StaticColors.dark.accent,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (e) {
        console.error('❌ [THEME] Error loading theme:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadTheme();
  }, []);

  const effectiveTheme: 'light' | 'dark' = 
    themeMode === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light') 
      : themeMode;

  const isDarkMode = effectiveTheme === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await SecureStore.setItemAsync(THEME_KEY, mode);
  };

  const toggleTheme = () => {
    const nextMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, themeMode, toggleTheme, setThemeMode, isLoaded }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent={true} />
      {children}
    </ThemeContext.Provider>
  );
};
ThemeProvider.displayName = 'ThemeProvider';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
