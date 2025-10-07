import { Theme, CardTheme } from '../types';

export interface Colors {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
  accent: string;
}

export interface AppTheme {
  colors: Colors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
}

const lightColors: Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#10B981',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2D3748',
  textSecondary: '#718096',
  border: '#E2E8F0',
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
  info: '#4299E1',
  disabled: '#A0AEC0',
  placeholder: '#CBD5E0',
  backdrop: 'rgba(0,0,0,0.5)',
  accent: '#9F7AEA',  
};

const darkColors: Colors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  secondary: '#34D399',
  background: '#1A202C',
  surface: '#2D3748',
  card: '#2D3748',
  text: '#F7FAFC',
  textSecondary: '#CBD5E0',
  border: '#4A5568',
  success: '#68D391',
  warning: '#F6AD55',
  error: '#FC8181',
  info: '#63B3ED',
  disabled: '#718096',
  placeholder: '#A0AEC0',
  backdrop: 'rgba(0,0,0,0.8)',
  accent: '#B794F6',
};

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export const lightTheme: AppTheme = {
  colors: lightColors,
  ...baseTheme,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  ...baseTheme,
};

export const getTheme = (theme: Theme, systemColorScheme: 'light' | 'dark'): AppTheme => {
  return darkTheme; // Always return dark theme
};

export const getGameTheme = (theme: Theme, systemColorScheme: 'light' | 'dark', cardTheme?: CardTheme): AppTheme => {
  const base = darkTheme; // Always use dark theme as base
  if (cardTheme === 'black_white') {
    // Convert colors to grayscale-ish palette
    const gray = {
      primary: '#4A4A4A',
      primaryDark: '#2E2E2E',
      secondary: '#5C5C5C',
      background: '#F2F2F2',
      surface: '#EAEAEA',
      card: '#FFFFFF',
      text: '#1F1F1F',
      textSecondary: '#6B6B6B',
      border: '#D2D2D2',
      success: '#4F4F4F',
      warning: '#7A7A7A',
      error: '#6D6D6D',
      info: '#808080',
      disabled: '#AFAFAF',
      placeholder: '#BEBEBE',
      backdrop: 'rgba(0,0,0,0.5)',
      accent: '#999999',
    } as Colors;
    return { ...base, colors: gray };
  }
  return base;
};