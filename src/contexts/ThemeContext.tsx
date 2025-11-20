import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceSecondary: string;
    primary: string;
    primaryDark: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    shadow: string;
    success: string;
    warning: string;
    error: string;
    overlay: string;
    glassBorder: string;
  };
  gradients: {
    background: [string, string, string];
    flipMatch: [string, string];
    sequence: [string, string];
    spatialMemory: [string, string];
    mathRush: [string, string];
    mergePuzzle: [string, string];
    stroop: [string, string];
    glass: [string, string];
    primary: [string, string];
    success: [string, string];
    error: [string, string];
  };
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#f8fafc',
    backgroundSecondary: '#f1f5f9',
    surface: '#ffffff',
    surfaceSecondary: '#e2e8f0',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    text: '#0f172a',
    textSecondary: '#334155', // Darkened from #475569 for better readability
    textTertiary: '#64748b', // Darkened from #94a3b8
    border: '#cbd5e1', // Darkened from #e2e8f0
    shadow: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    overlay: 'rgba(15, 23, 42, 0.7)',
    glassBorder: 'rgba(0, 0, 0, 0.1)', // Changed from white to dark transparent for visibility
  },
  gradients: {
    background: ['#f8fafc', '#f1f5f9', '#f8fafc'], // More subtle gradient
    flipMatch: ['#6366f1', '#8b5cf6'],
    sequence: ['#06b6d4', '#3b82f6'],
    spatialMemory: ['#8b5cf6', '#6366f1'],
    mathRush: ['#f59e0b', '#ef4444'],
    mergePuzzle: ['#10b981', '#06b6d4'],
    stroop: ['#ec4899', '#d946ef'],
    glass: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
    primary: ['#6366f1', '#8b5cf6'],
    success: ['#10b981', '#34d399'],
    error: ['#ef4444', '#f87171'],
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#020617', // Deeper, richer background
    backgroundSecondary: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    primary: '#818cf8', // Slightly lighter primary for better contrast
    primaryDark: '#6366f1',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#64748b',
    border: '#1e293b',
    shadow: '#000000',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    overlay: 'rgba(0, 0, 0, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
  },
  gradients: {
    background: ['#020617', '#0f172a', '#1e1b4b'], // Deep space gradient
    flipMatch: ['#6366f1', '#a855f7'], // Vibrant purple-indigo
    sequence: ['#06b6d4', '#3b82f6'], // Cyan-blue
    spatialMemory: ['#8b5cf6', '#6366f1'], // Violet-indigo
    mathRush: ['#f59e0b', '#ef4444'], // Amber-red
    mergePuzzle: ['#10b981', '#06b6d4'], // Emerald-cyan
    stroop: ['#ec4899', '#d946ef'], // Pink-fuchsia
    glass: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'],
    primary: ['#818cf8', '#6366f1'],
    success: ['#34d399', '#10b981'],
    error: ['#f87171', '#ef4444'],
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@brain_games_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [theme, setTheme] = useState<Theme>(darkTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    setTheme(themeMode === 'light' ? lightTheme : darkTheme);
  }, [themeMode]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const saveTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveTheme(mode);
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
