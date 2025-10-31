import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../components/ui/ThemeProvider';
import { useAuthStore } from '../store/authStore';
import { ScreenNames } from '../constants/ScreenNames';

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isAuthenticated, isGuest, user } = useAuthStore();
  const [navigationReady, setNavigationReady] = React.useState(false);

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const shimmerTranslateX = useSharedValue(-width);

  useEffect(() => {
    // Mark navigation as ready after component mounts
    setNavigationReady(true);
    startAnimations();
  }, []);


  const startAnimations = () => {
    // Logo entrance animation
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withTiming(1, { duration: 300 })
    );
    
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Text fade in
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

    // Shimmer effect
    shimmerTranslateX.value = withDelay(
      800,
      withSequence(
        withTiming(width + 100, { duration: 1500 }),
        withTiming(-width, { duration: 0 }),
        withTiming(width + 100, { duration: 1500 })
      )
    );

    // Navigate to next screen
    setTimeout(() => {
      runOnJS(navigateToNextScreen)();
    }, 1500); // Reduced time to 1.5 seconds
  };

  const navigateToNextScreen = () => {
    if (!navigationReady || !navigation) {
      console.warn('Navigation not ready yet');
      return;
    }

    console.log('Splash Navigation Check:', {
      isAuthenticated,
      isGuest,
      user: user ? { name: user.name, isGuest: user.isGuest } : null,
    });
    
    try {
      // Navigate to Auth screen (login/signup)
      console.log('Navigating to Auth screen');
      navigation.navigate(ScreenNames.AUTH as never);
    } catch (error) {
      console.error('Navigation error in navigateToNextScreen:', error);
    }
  };

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      opacity: logoOpacity.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslateX.value }],
    };
  });

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark, theme.colors.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={[styles.logo, { backgroundColor: theme.colors.surface }]}>
            <Image 
              source={require('../assets/images/world-Bingo-Logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, textAnimatedStyle]}>
          {t('splash.welcome')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, textAnimatedStyle]}>
          {t('splash.loading')}
        </Animated.Text>

        {/* Shimmer effect */}
        <Animated.View style={styles.shimmerContainer}>
          <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]} />
        </Animated.View>
      </View>

      {/* Bottom decoration */}
      <View style={styles.bottomDecoration}>
        <View style={[styles.decorationCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[styles.decorationCircle, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    fontSize: 60,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 40,
  },
  shimmerContainer: {
    width: '70%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 20,
  },
  shimmer: {
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 2,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: -50,
    right: -50,
  },
  decorationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
  },
});