import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import LottieView from 'lottie-react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  color?: string;
  useLottie?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  text,
  color,
  useLottie = true,
}) => {
  const { theme } = useTheme();

  const getAnimationSize = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60 };
      default:
        return { width: 120, height: 120 };
    }
  };

  return (
    <View style={styles.container}>
      {useLottie ? (
        <LottieView
          source={require('../../assets/animations/Loading.json')}
          autoPlay
          loop
          style={getAnimationSize()}
          resizeMode="contain"
        />
      ) : (
        <ActivityIndicator 
          size={size} 
          color={color || theme.colors.primary} 
        />
      )}
      {text && (
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});