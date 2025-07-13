import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  light: string;
  dark: string;
  success: string;
  warning: string;
}

export const lightColors: ThemeColors = {
  primary: '#4F8EF7',
  accent: '#FFB300',
  background: '#F7F8FA',
  card: '#FFFFFF',
  text: '#222B45',
  muted: '#8F9BB3',
  border: '#E4E9F2',
  danger: '#FF3D71',
  light: '#FFFFFF',
  dark: '#222B45',
  success: '#00D68F',
  warning: '#FFAA00',
};

export const darkColors: ThemeColors = {
  primary: '#4F8EF7',
  accent: '#FFB300',
  background: '#1A1A1A',
  card: '#2D2D2D',
  text: '#FFFFFF',
  muted: '#8F9BB3',
  border: '#404040',
  danger: '#FF3D71',
  light: '#FFFFFF',
  dark: '#222B45',
  success: '#00D68F',
  warning: '#FFAA00',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSizes = {
  small: 14,
  medium: 16,
  large: 20,
  xlarge: 28,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
};

// Simple theme hook using Appearance API
export const useAppTheme = () => {
  const colorScheme = Appearance.getColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    theme: isDark ? 'dark' : 'light' as ThemeMode,
  };
};

// Legacy exports for backward compatibility
export let colors: ThemeColors = lightColors;
export let currentTheme: ThemeMode = 'light';

export const setTheme = (theme: ThemeMode) => {
  currentTheme = theme;
  colors = theme === 'dark' ? darkColors : lightColors;
};

export const getTheme = () => currentTheme; 