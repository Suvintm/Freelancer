import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors as StaticColors } from '../constants/Colors';

const THEME_KEY = 'suvix_theme_preference';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
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
  primary: '#FFFFFF',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  notification: '#F87171',
  tabBar: '#FFFFFF',
  accent: StaticColors.accent,
};

const darkTheme: ThemeColors = {
  primary: '#000000',
  background: '#0F0F14',
  card: '#16161D',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#27272E',
  notification: '#F87171',
  tabBar: '#000000',
  accent: StaticColors.accent,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
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

  const isDarkMode = themeMode === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await SecureStore.setItemAsync(THEME_KEY, mode);
  };

  const toggleTheme = () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, themeMode, toggleTheme, setThemeMode, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
