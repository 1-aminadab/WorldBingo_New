import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
  Image,
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

const { width } = Dimensions.get('window');

export const StarterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, isGuest, logout } = useAuthStore();
  const { isGameReadyToStart } = useSettingsStore();

  // Animations
  const logoScale = useSharedValue(1);
  const cardRotate = useSharedValue(0);

  React.useEffect(() => {
    // Subtle breathing animation for logo
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

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

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

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
    // Navigate to Play Store
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.worldbingo';
    // For iOS, you might want to use: https://apps.apple.com/app/world-bingo/id123456789
    
    Linking.openURL(playStoreUrl).catch(() => {
      Alert.alert('Error', 'Could not open Play Store');
    });
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

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
            <View style={styles.welcomeText}>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                {isGuest ? 'Playing as Guest' : t('home.welcomeBack')}
              </Text>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user?.name || 'Player'}
              </Text>
              {isGuest && (
                <TouchableOpacity onPress={handleProfile}>
                  <Text style={[styles.upgradePrompt, { color: theme.colors.primary }]}>
                    Tap to create account →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Main Logo */}
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.logo}
            >
              <Image 
                source={require('../assets/images/world-Bingo-Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('home.readyToPlay')}
          </Text>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <View style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
              onPress={handlePlayBingo}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.playButtonGradient}
              >
                <Text style={styles.playIcon}>🎯</Text>
                <Text style={styles.playButtonText}>{t('home.playBingo')}</Text>
                <Text style={styles.playButtonSubtext}>Start a new game</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.cardButton, { backgroundColor: theme.colors.card }]}
              onPress={handleBingoCard}
              activeOpacity={0.8}
            >
              <Animated.View style={cardAnimatedStyle}>
                <Text style={styles.cardIcon}>🎴</Text>
              </Animated.View>
              <Text style={[styles.cardButtonText, { color: theme.colors.text }]}>
                {t('home.bingoCard')}
              </Text>
              <Text style={[styles.cardButtonSubtext, { color: theme.colors.textSecondary }]}>
                View your card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: theme.colors.card }]}
              onPress={handleProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.profileIcon}>👤</Text>
              <Text style={[styles.profileButtonText, { color: theme.colors.text }]}>
                {t('home.profile')}
              </Text>
              <Text style={[styles.profileButtonSubtext, { color: theme.colors.textSecondary }]}>
                Your stats
              </Text>
            </TouchableOpacity>
          </View>
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
          style={styles.logoutButton}
        />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    paddingRight: 30
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  upgradePrompt: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 50,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  playButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  playButtonGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playButtonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardButtonSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  profileButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileButtonSubtext: {
    fontSize: 12,
    textAlign: 'center',
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