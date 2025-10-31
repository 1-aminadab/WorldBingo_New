import React from 'react';
import { TouchableOpacity, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useGameTheme } from './ThemeProvider';

interface CheckButtonProps {
  onPress: () => void;
  text?: string;
  style?: any;
  textStyle?: any;
  isLandscape?: boolean;
}

export const CheckButton: React.FC<CheckButtonProps> = ({
  onPress,
  text = 'Check',
  style,
  textStyle,
  isLandscape = false}) => {
  const { theme } = useGameTheme();
  const { width, height } = useWindowDimensions();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          minWidth: isLandscape ? 300 : 80,
          height: isLandscape ? 50 : 40,
          shadowColor: '#000',
          shadowOpacity: isLandscape ? 0.3 : 0.2,
          shadowRadius: isLandscape ? 6 : 4,
          shadowOffset: { width: 0, height: isLandscape ? 3 : 2 },
          elevation: isLandscape ? 6 : 4,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: '#fff', fontSize: isLandscape ? 20 : 16, fontWeight: isLandscape ? '900' : '700' }, textStyle]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    fontSize: 16,
  },
});
