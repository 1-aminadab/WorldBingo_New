import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { AppTheme, getTheme } from '../../utils/theme';

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
  const cardTheme = useSettingsStore(state => state.cardTheme);
  
  const theme = getTheme(themeMode, systemColorScheme, cardTheme);
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

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