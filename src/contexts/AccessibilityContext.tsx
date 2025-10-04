import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type ContrastMode = 'normal' | 'high';

interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
  setFontSize: (size: FontSize) => void;
  toggleHighContrast: () => void;
  toggleReduceMotion: () => void;
  getFontScale: () => number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const ACCESSIBILITY_STORAGE_KEY = '@brain_games_accessibility';

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
};

// 폰트 크기에 따른 스케일 팩터
export const fontScales: Record<FontSize, number> = {
  'small': 0.85,
  'medium': 1.0,
  'large': 1.15,
  'extra-large': 1.3,
};

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  };

  const saveSettings = async (newSettings: AccessibilitySettings) => {
    try {
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  };

  const setFontSize = (size: FontSize) => {
    saveSettings({ ...settings, fontSize: size });
  };

  const toggleHighContrast = () => {
    saveSettings({ ...settings, highContrast: !settings.highContrast });
  };

  const toggleReduceMotion = () => {
    saveSettings({ ...settings, reduceMotion: !settings.reduceMotion });
  };

  const getFontScale = () => {
    return fontScales[settings.fontSize];
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        fontSize: settings.fontSize,
        highContrast: settings.highContrast,
        reduceMotion: settings.reduceMotion,
        setFontSize,
        toggleHighContrast,
        toggleReduceMotion,
        getFontScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

/**
 * 폰트 크기를 스케일링하는 헬퍼 함수
 */
export const scaleFontSize = (baseSize: number, scale: number): number => {
  return Math.round(baseSize * scale);
};

/**
 * 고대비 색상을 반환하는 헬퍼 함수
 */
export const getContrastColor = (
  normalColor: string,
  highContrastColor: string,
  isHighContrast: boolean
): string => {
  return isHighContrast ? highContrastColor : normalColor;
};
