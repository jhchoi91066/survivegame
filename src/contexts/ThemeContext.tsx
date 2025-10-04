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
  };
  gradients: {
    background: [string, string, string];
    flipMatch: [string, string];
    sequence: [string, string];
    mathRush: [string, string];
    mergePuzzle: [string, string];
  };
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#f8fafc',
    backgroundSecondary: '#e2e8f0',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    text: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    shadow: '#000000',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    overlay: 'rgba(15, 23, 42, 0.7)',
  },
  gradients: {
    background: ['#f8fafc', '#e0e7ff', '#f8fafc'],
    flipMatch: ['#6366f1', '#8b5cf6'],
    sequence: ['#06b6d4', '#3b82f6'],
    mathRush: ['#f59e0b', '#ef4444'],
    mergePuzzle: ['#10b981', '#06b6d4'],
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    border: '#334155',
    shadow: '#000000',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  gradients: {
    background: ['#0f172a', '#1e1b4b', '#0f172a'],
    flipMatch: ['#6366f1', '#8b5cf6'],
    sequence: ['#06b6d4', '#3b82f6'],
    mathRush: ['#f59e0b', '#ef4444'],
    mergePuzzle: ['#10b981', '#06b6d4'],
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
