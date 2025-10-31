import React, { useState, useRef } from 'react';
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
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
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
import { audioService } from '../services/audioService';
import { TouchableWithSound } from '../components/ui/TouchableWithSound';
import { ScreenNames } from '../constants/ScreenNames';

const { width } = Dimensions.get('window');

export const StarterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, isGuest, logout, setPendingAuthScreen, logoutSilent } = useAuthStore();
  const { isGameReadyToStart, isMusicEnabled, setMusicEnabled, isFirstTimeStartup, setFirstTimeStartup } = useSettingsStore();

  // Card floating animation
  const cardRotate = useSharedValue(0);
  
  // Auth toggle state
  const [activeAuthTab, setActiveAuthTab] = useState<'login' | 'signup'>('login');
  const authTabAnimation = useRef(new Animated.Value(0)).current;

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
  }, []);

  // Handle first-time music startup
  React.useEffect(() => {
    const initializeMusic = async () => {
      try {
        if (isFirstTimeStartup) {
          console.log('🎵 First time startup detected - starting background music');
          // Start music on first time if music is enabled
          if (isMusicEnabled) {
            await audioService.startBackgroundMusic();
          }
          // Mark as no longer first time
          setFirstTimeStartup(false);
        } else {
          console.log('🎵 Not first time startup - checking music state');
          // On subsequent startups, check if music should be playing
          if (isMusicEnabled) {
            await audioService.startBackgroundMusic();
          }
        }
      } catch (error) {
        console.log('🎵 Error initializing music:', error);
      }
    };

    initializeMusic();
  }, [isFirstTimeStartup, isMusicEnabled, setFirstTimeStartup]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${cardRotate.value}deg` }],
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
            onPress: () => navigation.getParent()?.navigate(ScreenNames.SETTINGS as never),
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
    navigation.getParent()?.navigate(ScreenNames.GAME_STACK as never);
    setTimeout(() => {
      navigation.navigate(ScreenNames.PLAYER_CARTELA_SELECTION as never);
    }, 100);
  };

  const handleBingoCard = () => {
    navigation.getParent()?.navigate(ScreenNames.BINGO_CARDS as never);
  };

  const handleSettings = () => {
    navigation.getParent()?.navigate(ScreenNames.SETTINGS as never);
  };

  const handleProfile = () => {
    navigation.getParent()?.navigate(ScreenNames.PROFILE as never);
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
    Linking.openURL('https://help.myworldbingo.com');
  };

  const handleMusicToggle = () => {
    audioService.toggleMusic();
  };

  const handleShare = () => {
    const userId = user?.userId || user?.id;
    const shareMessage = `I'm using World Bingo App! 🎯
This Bingo app is awesome — you should try it!
Use my invite code ${userId} for 5% cashback on your first coin purchase.

Download now 👉

https://myworldbingo.com/app`;
    
    Share.share({
      message: shareMessage,
      title: 'World Bingo - Join me!',
    });
  };

  const switchAuthTab = (tab: 'login' | 'signup') => {
    setActiveAuthTab(tab);
    Animated.timing(authTabAnimation, {
      toValue: tab === 'login' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleAuthNavigation = () => {
    if (activeAuthTab === 'login') {
      navigation.navigate(ScreenNames.LOGIN as never);
    } else {
      navigation.navigate(ScreenNames.LOGIN_SIGNUP as never);
    }
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
            <TouchableOpacity style={styles.iconCircle} onPress={handleYouTube}>
              <Image 
                source={require('../assets/images/youtubeHelp.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={handleMusicToggle}>
              <Image 
                source={isMusicEnabled 
                  ? require('../assets/images/unmute.png')
                  : require('../assets/images/mute.png')
                }
                style={styles.iconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={handleShare}>
              <Image 
                source={require('../assets/images/share.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/world-Bingo-Logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
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

          {/* Auth buttons for guest users */}
          {isGuest && (
            <View style={styles.authContainer}>
              <View style={styles.authTabContainer}>
                <TouchableOpacity 
                  style={[styles.authTabButton, styles.loginTab, { backgroundColor: 'rgb(224, 171, 0)', borderWidth: 0, borderColor: 'rgb(201, 181, 1)' }]}
                  onPress={async () => {
                    setPendingAuthScreen('Login'); // Set desired screen for login
                    await logoutSilent(); // Exit guest mode silently
                  }}
                >
                  <Text style={[styles.authTabButtonText, { color: 'white', fontWeight: 'bold' }]}>Sign In</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.authTabButton, styles.signUpTab, { backgroundColor: '#1e3a8a' }]}
                  onPress={async () => {
                    setPendingAuthScreen('SignUp'); // Set desired screen for signup
                    await logoutSilent(); // Exit guest mode silently
                  }}
                >
                  <Text style={[styles.authTabButtonText, { color: 'white', fontWeight: '600' }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    paddingTop: 40,
    paddingBottom: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    position: 'relative',
  },
  iconsColumn: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -120,  }, {translateX: -40}],
    flexDirection: 'column',
    gap: 12,
    zIndex: 1000,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    
  },
  logoImage: {
    width: 380,
    height: 260,
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
  authContainer: {
    width: '100%',
    marginTop: 20,
  },
  authTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(170, 176, 255, 0.24)',
    borderRadius: 28,
    padding: 4,
    height: 56,
  },
  authTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
  },
  loginTab: {
    marginRight: 2,
  },
  signUpTab: {
    marginLeft: 2,
  },
  authTabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
});