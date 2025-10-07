import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from './ThemeProvider';

// Helper function to create gradient colors with darker blue
const createGradientFromTheme = (primary: string, surface: string, card: string, border: string): string[] => {
  // Use darker colors: border -> surface -> border (no light blue)
  return [border, surface, border];
};

// Fallback gradient for backwards compatibility
export const PLAYFUL_CARD_GRADIENT = ['#F4E6B7', '#E8D5A3', '#DCC792'];

interface PlayfulCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  width?: number;
  height?: number;
  backgroundColor?: string;
  gradientColors?: string[];
}

export const PlayfulCard: React.FC<PlayfulCardProps> = ({
  children,
  style,
  width = 300,
  height = 120,
  backgroundColor = '#F4E6B7',
  gradientColors
}) => {
  const { theme } = useTheme();
  
  // Use theme-based gradient if no custom gradient is provided
  const finalGradientColors = gradientColors || createGradientFromTheme(
    theme.colors.primary, 
    theme.colors.surface, 
    theme.colors.card,
    theme.colors.border
  );
  const createOrganicPath = (w: number, h: number): string => {
    const cornerRadius = 20;
    const waveDepth = 8;
    
    return `
      M ${cornerRadius + waveDepth} 0
      Q ${w * 0.3} ${waveDepth} ${w * 0.7} ${waveDepth * 0.3}
      Q ${w - cornerRadius - waveDepth} 0 ${w - cornerRadius} ${cornerRadius}
      Q ${w} ${h * 0.2} ${w - waveDepth * 0.5} ${h * 0.5}
      Q ${w} ${h * 0.8} ${w - cornerRadius} ${h - cornerRadius}
      Q ${w * 0.8} ${h} ${w * 0.2} ${h - waveDepth * 0.5}
      Q ${cornerRadius + waveDepth} ${h} ${cornerRadius} ${h - cornerRadius}
      Q 0 ${h * 0.7} ${waveDepth * 0.8} ${h * 0.3}
      Q 0 ${cornerRadius + waveDepth} ${cornerRadius} ${cornerRadius + waveDepth}
      Q ${waveDepth} ${cornerRadius} ${cornerRadius + waveDepth} 0
      Z
    `;
  };

  return (
    <View style={[styles.container, { width, }, style]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          <LinearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={finalGradientColors[0]} />
            <Stop offset="50%" stopColor={finalGradientColors[1]} />
            <Stop offset="100%" stopColor={finalGradientColors[2]} />
          </LinearGradient>
        </Defs>
        
        {/* Main card shape */}
        <Path
          d={createOrganicPath(width, height)}
          fill="url(#cardGradient)"
          stroke={theme.colors.border}
          strokeWidth="2"
        />
        
        {/* Inner highlight */}
        <Path
          d={createOrganicPath(width - 4, height - 4)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="1"
          transform="translate(2, 2)"
        />
      </Svg>
      
      {/* Content container */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginVertical: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    zIndex: 1,
  },
});