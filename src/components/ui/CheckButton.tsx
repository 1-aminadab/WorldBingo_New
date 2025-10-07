import React from 'react';
import { TouchableOpacity, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useGameTheme } from './ThemeProvider';

interface CheckButtonProps {
  onPress: () => void;
  text?: string;
  style?: any;
  textStyle?: any;
}

export const CheckButton: React.FC<CheckButtonProps> = ({
  onPress,
  text = 'Check',
  style,
  textStyle,
}) => {
  const { theme } = useGameTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          minWidth: isLandscape ? 120 : 80,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: '#fff' }, textStyle]}>
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
