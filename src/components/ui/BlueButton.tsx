import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BlueButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const BlueButton: React.FC<BlueButtonProps> = ({ title, onPress, disabled, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, disabled && styles.disabled, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7BC4FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7BC4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  } as ViewStyle,
  disabled: {
    opacity: 0.7,
  } as ViewStyle,
  text: {
    color: '#0C1224',
    fontSize: 17,
    fontWeight: '700',
  } as TextStyle,
});

export default BlueButton;

