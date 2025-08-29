import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Dimensions,
  Platform,
  Modal,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../components/ui/ThemeProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { formatTime } from '../utils/gameHelpers';

const { width } = Dimensions.get('window');

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();

  const getGradientColors = () => {
    switch (type) {
      case 'success': return ['#10B981', '#059669'];
      case 'error': return ['#EF4444', '#DC2626'];
      case 'warning': return ['#F59E0B', '#D97706'];
      case 'confirm': return ['#8B5CF6', '#7C3AED'];
      default: return ['#3B82F6', '#2563EB'];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'confirm': return '❓';
      default: return 'ℹ️';
    }
  };

  const safeVibrate = () => {
    if (Platform.OS === 'android') {
      try {
        setTimeout(() => {}, 50);
      } catch (error) {
        console.log('Vibration not supported');
      }
    }
  };

  const handleAction = (action: string) => {
    safeVibrate();
    if (action === 'confirm' && onConfirm) {
      onConfirm();
    } else if (action === 'cancel' && onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.customModalContainer, { backgroundColor: theme.colors.card }]}>
          <LinearGradient
            colors={getGradientColors()}
            style={styles.customModalHeader}
          >
            <Text style={styles.customModalIcon}>{getIcon()}</Text>
            <Text style={styles.customModalTitle}>{title}</Text>
          </LinearGradient>
          
          <View style={[styles.customModalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.customModalMessage, { color: theme.colors.text }]}>
              {message}
            </Text>
          </View>

          {type === 'confirm' ? (
            <View style={[styles.customModalActions, { backgroundColor: theme.colors.card }]}>
              <TouchableOpacity
                onPress={() => handleAction('cancel')}
                style={[styles.customModalActionButton, { backgroundColor: theme.colors.textSecondary }]}
              >
                <Text style={styles.customModalButtonText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAction('confirm')}
                style={[styles.customModalActionButton, { backgroundColor: getGradientColors()[0] }]}
              >
                <Text style={styles.customModalButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleAction('close')}
              style={[styles.customModalButton, { backgroundColor: getGradientColors()[0] }]}
            >
              <Text style={styles.customModalButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, isAuthenticated, isGuest, logout, convertGuestToUser, isLoading } = useAuthStore();

  // Form states
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Data states
  const [userCoins] = useState(1250); // Reference-only balance

  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showModal = (config: Omit<typeof modalConfig, 'visible'>) => {
    setModalConfig({ ...config, visible: true });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const handleLogout = () => {
    showModal({
      title: 'Logout',
      message: isGuest ? 'Exit guest session?' : 'Are you sure you want to logout?',
      type: 'confirm',
      confirmText: isGuest ? 'Exit' : 'Logout',
      cancelText: 'Cancel',
      onConfirm: logout,
    });
  };

  const validateAccountForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!accountForm.name.trim()) newErrors.name = 'Name is required';
    if (!accountForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(accountForm.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!accountForm.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (accountForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (accountForm.password !== accountForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateAccountForm()) return;

    try {
      const success = await convertGuestToUser(
        accountForm.email,
        accountForm.password,
        accountForm.name
      );
      
      if (success) {
        showModal({
          title: 'Success',
          message: 'Account created successfully! Your game progress has been saved.',
          type: 'success',
        });
        setShowCreateAccount(false);
      } else {
        showModal({
          title: 'Error',
          message: 'Failed to create account',
          type: 'error',
        });
      }
    } catch (error) {
      showModal({
        title: 'Error',
        message: 'An error occurred while creating account',
        type: 'error',
      });
    }
  };

  const updateAccountForm = (key: string, value: string) => {
    setAccountForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleViewCoins = () => {
    showModal({
      title: '💰 Coin Balance',
      message: `Current Balance: ${userCoins.toLocaleString()} Birr\n\nNote: Coins are managed by reference only. Contact your administrator for balance updates.`,
      type: 'info',
    });
  };

  const handleCoinPurchase = () => {
    showModal({
      title: '💰 Buy Coins',
      message: 'Choose a coin package:',
      type: 'confirm',
      confirmText: '100 Coins - 50 Birr',
      cancelText: 'Cancel',
      onConfirm: () => {
        showModal({
          title: '🎉 Purchase Successful!',
          message: `✅ Transaction completed successfully!\n\n💰 Amount: 100 coins\n💸 Cost: 50 Birr\n📊 New Balance: ${(userCoins + 100).toLocaleString()} coins\n\nThank you for your purchase!`,
          type: 'success',
        });
      },
    });
  };

  const handleInviteFriends = async () => {
    try {
      const inviteLink = 'https://worldbingo.app/invite?ref=' + (user?.id || 'guest');
      await Share.share({
        message: `Join me on Bingo Caller! 🎯\n\nI'm hosting epic bingo games with voice calling and amazing prizes!\n\n🎰 Professional hosting\n🎙️ Voice announcements\n💰 Real prizes\n\nDownload now: ${inviteLink}`,
        title: 'Join me on Bingo Caller!',
      });
    } catch (error) {
      showModal({
        title: 'Error',
        message: 'Failed to share invite link.',
        type: 'error',
      });
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = 'https://worldbingo.app/invite?ref=' + (user?.id || 'guest');
    // In a real app, you'd use Clipboard API
    showModal({
      title: '🔗 Invitation Link',
      message: `Your personal invite link:\n\n${inviteLink}\n\n✅ Link copied to clipboard!\n\nShare this link to earn rewards!`,
      type: 'success',
    });
  };

  const handleGetFreeCoins = () => {
    showModal({
      title: '🎁 Free Coins Available',
      message: 'Choose how to earn free coins:',
      type: 'confirm',
      confirmText: '📺 Watch Ad (+50 coins)',
      cancelText: 'Cancel',
      onConfirm: () => {
        showModal({
          title: '🎉 Ad Complete!',
          message: 'You earned 50 coins!\n\nKeep earning more with daily activities!',
          type: 'success',
        });
      },
    });
  };

  const showTransactionHistory = () => {
    navigation.navigate('TransactionReport' as never);
  };

  const showGameHistory = () => {
    navigation.navigate('GameReport' as never);
  };

  const getWinRate = (): string => {
    if (!user?.gamesPlayed || user.gamesPlayed === 0) return '0';
    return Math.round((user.gamesWon || 0) / user.gamesPlayed * 100).toString();
  };

  const renderProfileHeader = () => {
    const avatarScale = useSharedValue(1);
    
    const animatedAvatarStyle = useAnimatedStyle(() => ({
      transform: [{ scale: avatarScale.value }],
    }));

    const handleAvatarPress = () => {
      avatarScale.value = withSequence(
        withSpring(0.95),
        withSpring(1.1),
        withSpring(1)
      );
    };

    return (
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark, theme.colors.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
            <Animated.View style={[styles.avatar, { backgroundColor: theme.colors.card }, animatedAvatarStyle]}>
              <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                {user?.name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Guest Host'}</Text>
            {isGuest ? (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>👤 Guest Account</Text>
              </View>
            ) : (
              <Text style={styles.userEmail}>{user?.email}</Text>
            )}
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>🎯 Bingo Host</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderStatsCard = () => (
    <View style={[styles.card, styles.statsCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>📊 Host Statistics</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {user?.gamesPlayed || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Games Hosted
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {user?.gamesWon || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Winners Called
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {getWinRate()}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Success Rate
          </Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
            {formatTime(user?.totalPlayTime || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total Time
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCoinsCard = () => (
    <View style={[styles.card, styles.coinsCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>💰 Coin Management</Text>
        <Text style={[styles.coinBalance, { color: theme.colors.primary }]}>
          {userCoins.toLocaleString()} Birr
        </Text>
      </View>
      
      <View style={styles.coinActions}>
        <TouchableOpacity
          style={[styles.coinButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleViewCoins}
        >
          <Text style={styles.coinButtonText}>💰 View Balance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.coinButton, { backgroundColor: '#4CAF50' }]}
          onPress={handleCoinPurchase}
        >
          <Text style={styles.coinButtonText}>🛒 Purchase</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.coinButton, { backgroundColor: '#FF9800' }]}
          onPress={handleGetFreeCoins}
        >
          <Text style={styles.coinButtonText}>🎁 Earn Free</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSocialCard = () => (
    <View style={[styles.card, styles.socialCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>👥 Social Features</Text>
      </View>
      
      <View style={styles.socialActions}>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: '#2196F3' }]}
          onPress={handleInviteFriends}
        >
          <Text style={styles.socialButtonIcon}>📤</Text>
          <Text style={styles.socialButtonText}>Invite Friends</Text>
          <Text style={styles.socialButtonSubtext}>Earn 100 coins per invite</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: '#4CAF50' }]}
          onPress={handleCopyInviteLink}
        >
          <Text style={styles.socialButtonIcon}>🔗</Text>
          <Text style={styles.socialButtonText}>Copy Invite Link</Text>
          <Text style={styles.socialButtonSubtext}>Share your referral code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportsCard = () => (
    <View style={[styles.card, styles.reportsCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>📋 Reports & History</Text>
      </View>
      
      <View style={styles.reportActions}>
        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: theme.colors.surface }]}
          onPress={showTransactionHistory}
        >
          <Text style={[styles.reportButtonIcon, { color: theme.colors.primary }]}>💸</Text>
          <Text style={[styles.reportButtonText, { color: theme.colors.text }]}>Transaction Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: theme.colors.surface }]}
          onPress={showGameHistory}
        >
          <Text style={[styles.reportButtonIcon, { color: theme.colors.primary }]}>🎯</Text>
          <Text style={[styles.reportButtonText, { color: theme.colors.text }]}>Game Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGuestUpgrade = () => {
    if (!isGuest) return null;

    return (
      <View style={[styles.card, styles.upgradeCard, { backgroundColor: theme.colors.warning }]}>
        <View style={styles.upgradeContent}>
          <Text style={styles.upgradeIcon}>🚀</Text>
          <Text style={styles.upgradeTitle}>Upgrade Your Account</Text>
          <Text style={styles.upgradeSubtitle}>
            Create an account to save progress, compete with friends, and unlock features!
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: 'white' }]}
            onPress={() => setShowCreateAccount(true)}
          >
            <Text style={[styles.upgradeButtonText, { color: theme.colors.warning }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCreateAccountModal = () => (
    <Modal
      visible={showCreateAccount}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateAccount(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.accountModalContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.accountModalHeader}>
            <Text style={[styles.accountModalTitle, { color: theme.colors.text }]}>
              Create Your Account
            </Text>
            <TouchableOpacity onPress={() => setShowCreateAccount(false)}>
              <Text style={[styles.closeButton, { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.accountModalContent} showsVerticalScrollIndicator={false}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={accountForm.name}
              onChangeText={(value) => updateAccountForm('name', value)}
              error={errors.name}
              leftIcon={<Text>👤</Text>}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={accountForm.email}
              onChangeText={(value) => updateAccountForm('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Text>📧</Text>}
            />

            <Input
              label="Password"
              placeholder="Create password"
              value={accountForm.password}
              onChangeText={(value) => updateAccountForm('password', value)}
              secureTextEntry
              error={errors.password}
              leftIcon={<Text>🔒</Text>}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm password"
              value={accountForm.confirmPassword}
              onChangeText={(value) => updateAccountForm('confirmPassword', value)}
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon={<Text>🔒</Text>}
            />

            <Button
              title="Create Account"
              onPress={handleCreateAccount}
              loading={isLoading}
              style={styles.createAccountButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        
        <View style={styles.content}>
          {renderGuestUpgrade()}
          {renderStatsCard()}
          {renderCoinsCard()}
          {renderSocialCard()}
          {renderReportsCard()}
          
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#FF5722' }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>
              {isGuest ? '🚪 Exit Session' : '🔓 Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderCreateAccountModal()}
      
      <CustomModal
        visible={modalConfig.visible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  guestBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  guestBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  hostBadge: {
    backgroundColor: 'rgba(255,215,0,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  hostBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinBalance: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  coinActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coinButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  coinButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  socialActions: {
    gap: 12,
  },
  socialButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  socialButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  socialButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  reportButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  upgradeCard: {
    marginBottom: 20,
  },
  upgradeContent: {
    alignItems: 'center',
  },
  upgradeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    minWidth: width * 0.8,
    maxWidth: width * 0.9,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 20,
  },
  customModalHeader: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  customModalIcon: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  customModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  customModalContent: {
    padding: 32,
    backgroundColor: 'white',
  },
  customModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    color: '#374151',
  },
  customModalButton: {
    paddingVertical: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  customModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  customModalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  customModalActionButton: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
  },
  // Account Modal Styles
  accountModalContainer: {
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
    width: width * 0.9,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 15,
  },
  accountModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  accountModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 8,
  },
  accountModalContent: {
    flex: 1,
  },
  createAccountButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  // Card Type Styles
  statsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  coinsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  socialCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  reportsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#607D8B',
  },
  cardGradientHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10
  },
  cardGradientTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  cardGradientSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
});