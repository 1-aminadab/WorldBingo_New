import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { AppTheme, getTheme, getGameTheme } from '../../utils/theme';

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() || 'light';
  const themeMode = useSettingsStore(state => state.theme);
  
  const theme = getTheme(themeMode, systemColorScheme);
  const isDark = true; // Always dark theme

  const value: ThemeContextValue = {
    theme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useGameTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useGameTheme must be used within a ThemeProvider');
  }
  
  const systemColorScheme = useColorScheme() || 'light';
  const themeMode = useSettingsStore(state => state.theme);
  const cardTheme = useSettingsStore(state => state.cardTheme);
  
  const gameTheme = getGameTheme(themeMode, systemColorScheme, cardTheme);
  const isDark = true; // Always dark theme
  
  return {
    theme: gameTheme,
    isDark,
  };
};