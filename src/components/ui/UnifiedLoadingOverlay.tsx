import React from 'react';
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';

interface UnifiedLoadingOverlayProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  backgroundColor?: string;
  textColor?: string;
  animationType?: 'loading' | 'confetti';
}

const { width, height } = Dimensions.get('window');

export const UnifiedLoadingOverlay: React.FC<UnifiedLoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  size = 'medium',
  overlay = true,
  backgroundColor = 'rgba(0, 0, 0, 0.7)',
  textColor = '#FFFFFF',
  animationType = 'loading',
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 120 };
      case 'large':
        return { width: 240, height: 240 };
      default:
        return { width: 160, height: 160 };
    }
  };

  const getAnimationSource = () => {
    switch (animationType) {
      case 'confetti':
        return require('../../assets/animations/Confetti.json');
      default:
        return require('../../assets/animations/Loading.json');
    }
  };

  const animationSize = getSize();

  const renderAnimation = () => (
    <View style={[styles.animationContainer, animationSize]}>
      <LottieView
        source={getAnimationSource()}
        autoPlay
        loop
        style={animationSize}
        resizeMode="contain"
      />
    </View>
  );

  const renderContent = () => (
    <View style={styles.content}>
      {renderAnimation()}
      {message && (
        <Text style={[styles.messageText, { color: textColor }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (!visible) return null;

  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={[styles.overlay, { backgroundColor }]}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.85)']}
            style={styles.gradientBackground}
          >
            {renderContent()}
          </LinearGradient>
        </View>
      </Modal>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 10,
  },
});
