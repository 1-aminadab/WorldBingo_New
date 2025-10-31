import React from 'react';
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';

interface GameLoadingOverlayProps {
  visible: boolean;
  message?: string;
  type?: 'game_start' | 'game_end' | 'loading' | 'confetti';
  size?: 'small' | 'medium' | 'large';
}

const { width, height } = Dimensions.get('window');

export const GameLoadingOverlay: React.FC<GameLoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  type = 'loading',
  size = 'medium',
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
    switch (type) {
      case 'confetti':
        return require('../../assets/animations/Confetti.json');
      case 'game_start':
        return require('../../assets/animations/Loading.json');
      case 'game_end':
        return require('../../assets/animations/Loading.json');
      default:
        return require('../../assets/animations/Loading.json');
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'confetti':
        return 'Congratulations!';
      default:
        return '';
    }
  };

  const animationSize = getSize();
  const finalMessage = message || getDefaultMessage();

  const renderAnimation = () => (
    <View style={[styles.animationContainer, animationSize]}>
      <LottieView
        source={getAnimationSource()}
        autoPlay
        loop={type !== 'confetti' && type !== 'game_end'}
        style={animationSize}
        resizeMode="contain"
      />
    </View>
  );

  const renderContent = () => (
    <View style={styles.content}>
      {renderAnimation()}
      {finalMessage && (
        <Text style={styles.messageText}>
          {finalMessage}
        </Text>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.85)']}
          style={styles.gradientBackground}
        >
          {renderContent()}
        </LinearGradient>
      </View>
    </Modal>
  );
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
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 10,
  },
});
