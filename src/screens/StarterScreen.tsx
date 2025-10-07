import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Linking,
  Image,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../components/ui/ThemeProvider';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { Youtube, Volume2, VolumeX, Share as ShareIcon } from 'lucide-react-native';
import { audioService } from '../services/audioService';
import { TouchableWithSound } from '../components/ui/TouchableWithSound';

const { width } = Dimensions.get('window');

export const StarterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, isGuest, logout } = useAuthStore();
  const { isGameReadyToStart, isMusicEnabled, setMusicEnabled } = useSettingsStore();

  // Card floating animation and shine effect
  const cardRotate = useSharedValue(0);
  const shinePosition = useSharedValue(-100);

  React.useEffect(() => {
    // Card floating animation
    cardRotate.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 3000 }),
        withTiming(-2, { duration: 3000 })
      ),
      -1,
      true
    );

    // Shine effect animation with pause
    shinePosition.value = withRepeat(
      withSequence(
        withTiming(-80, { duration: 0 }), // Start position (off screen left)
        withTiming(320, { duration: 1200 }), // Shine passes across logo width + buffer
        withTiming(320, { duration: 4000 }) // Pause before next shine (4s)
      ),
      -1,
      false
    );
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${cardRotate.value}deg` }],
    };
  });

  const shineAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shinePosition.value }],
    };
  });

  const handlePlayBingo = () => {
    if (!isGameReadyToStart()) {
      Alert.alert(
        'Settings Required',
        'Please configure your game settings before playing.',
        [
          {
            text: 'Go to Settings',
            onPress: () => navigation.getParent()?.navigate('Settings' as never),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }
    // Navigate to GameStack first, then to PlayerCartelaSelection
    navigation.getParent()?.navigate('GameStack' as never);
    setTimeout(() => {
      navigation.navigate('PlayerCartelaSelection' as never);
    }, 100);
  };

  const handleBingoCard = () => {
    navigation.getParent()?.navigate('BingoCards' as never);
  };

  const handleSettings = () => {
    navigation.getParent()?.navigate('Settings' as never);
  };

  const handleProfile = () => {
    navigation.getParent()?.navigate('Profile' as never);
  };

  const handleLogout = () => {
    Alert.alert(
      isGuest ? 'Exit Guest Session' : 'Logout',
      isGuest ? 'Are you sure you want to exit guest session?' : 'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: isGuest ? 'Exit' : 'Logout',
          onPress: logout,
          style: 'destructive',
        },
      ]
    );
  };

  const handleYouTube = () => {
    Linking.openURL('https://youtube.com');
  };

  const handleMusicToggle = () => {
    audioService.toggleMusic();
  };

  const handleShare = () => {
    Share.share({
      message: 'Check out World Bingo - the ultimate bingo game experience!',
      title: 'World Bingo',
    });
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/app-bgaround.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Main Logo */}
        <View style={styles.logoSection}>
          <View style={styles.iconsColumn}>
            <TouchableWithSound style={styles.iconCircle} onPress={handleYouTube}>
              <Youtube size={24} color="#FF0000" />
            </TouchableWithSound>
            <TouchableWithSound style={styles.iconCircle} onPress={handleMusicToggle}>
              {isMusicEnabled ? (
                <Volume2 size={24} color="#1e3a8a" />
              ) : (
                <VolumeX size={24} color="#666" />
              )}
            </TouchableWithSound>
            <TouchableWithSound style={styles.iconCircle} onPress={handleShare}>
              <ShareIcon size={24} color="#1e3a8a" />
            </TouchableWithSound>
          </View>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../assets/images/world-Bingo-Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Animated.View style={[styles.shineOverlay, shineAnimatedStyle]}>
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0)', 
                    'rgba(255, 255, 255, 0.2)', 
                    'rgba(255, 255, 255, 0.6)', 
                    'rgba(255, 255, 255, 0.2)', 
                    'rgba(255, 255, 255, 0)'
                  ]}
                  style={styles.shineGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableWithSound
            style={styles.playButton}
            onPress={handlePlayBingo}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Play Bingo 75</Text>
          </TouchableWithSound>

          <TouchableWithSound
            style={styles.cardButton}
            onPress={handleBingoCard}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Bingo Card</Text>
          </TouchableWithSound>
        </View>

        {/* Quick Stats */}
        {/* <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            Quick Stats
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {user?.gamesPlayed || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {user?.gamesWon || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                {user?.gamesPlayed ? Math.round((user.gamesWon || 0) / user.gamesPlayed * 100) : 0}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Win Rate</Text>
            </View>
          </View>
        </View> */}

        {/* Logout Button */}
        <Button
          title={isGuest ? 'Exit Guest Session' : t('auth.logout')}
          onPress={handleLogout}
          variant="ghost"
          style={[
            styles.logoutButton,
            ...(isGuest ? [{ backgroundColor: 'rgba(220, 53, 69, 0.9)' }] : [])
          ]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 80,
    width: '100%',
    position: 'relative',
  },
  iconsColumn: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -85,  }, {translateX: -40}],
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'relative',
    width: 300,
    height: 200,
    overflow: 'hidden',
  },
  logoImage: {
    width: 300,
    height: 200,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 200,
    zIndex: 1,
    pointerEvents: 'none',
    transform: [{ skewX: '-20deg' }],
  },
  shineGradient: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
    mixBlendMode: 'soft-light',
  },
  actionsContainer: {
    width: '100%',
    gap: 20,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(80, 80, 80, 0.8)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(100, 100, 100, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  cardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(80, 80, 80, 0.8)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(100, 100, 100, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statsContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 20,
  },
});