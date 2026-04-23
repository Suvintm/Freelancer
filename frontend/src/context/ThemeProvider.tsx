import React, { useState, useEffect } from 'react';
import { ThemeContext } from './theme-context';
import type { ThemeMode } from './theme-context';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('suvix_theme_preference');
    return (saved as ThemeMode) || 'system';
  });

  const isDarkMode = themeMode === 'system' 
    ? (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)
    : themeMode === 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('suvix_theme_preference', themeMode);
  }, [themeMode, isDarkMode]);

  const toggleTheme = () => {
    setThemeModeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
