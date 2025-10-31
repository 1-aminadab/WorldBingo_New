import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

let BlurView: any = null;
try {
  // Optional dependency: @react-native-community/blur
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BlurView = require('@react-native-community/blur').BlurView;
} catch (e) {
  BlurView = null;
}

interface BlurBackgroundProps {
  intensity?: number; // iOS/Android blur radius/intensity
}

export const BlurBackground: React.FC<BlurBackgroundProps> = ({ intensity = 8 }) => {
  if (BlurView) {
    return (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={Platform.OS === 'ios' ? 'dark' : 'dark'}
        blurAmount={intensity}
        reducedTransparencyFallbackColor="rgba(0,0,0,0.4)"
      />
    );
  }

  // Fallback soft overlay if BlurView is not installed
  return <View style={styles.overlay} />;
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  }
});

export default BlurBackground;

