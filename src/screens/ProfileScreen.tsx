import React, { useState, useEffect } from 'react';
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
  Image,
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
import { Dropdown } from '../components/ui/Dropdown';

import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatTime } from '../utils/gameHelpers';
import { ReportStorageManager } from '../utils/reportStorage';

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
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user, isAuthenticated, isGuest, logout, convertGuestToUser, isLoading } = useAuthStore();
  const { appLanguage, setAppLanguage } = useSettingsStore();

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
  const [userCoins] = useState(1000); // Default coin balance from transaction system
  const [referralCode] = useState('WB' + (user?.id || 'GUEST').slice(-6).toUpperCase());
  const [todaysGameStats, setTodaysGameStats] = useState({
    totalGames: 0,
    totalCards: 0,
    averageRTP: 0,
    totalTime: 0,
  });

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

  // Load today's game statistics
  const loadTodaysGameStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysReport = await ReportStorageManager.getGameReportByDate(today);
      
      if (todaysReport) {
        const totalTime = todaysReport.games.reduce((sum, game) => sum + game.gameDurationMinutes, 0);
        const totalRTP = todaysReport.games.reduce((sum, game) => sum + game.rtpPercentage, 0);
        const averageRTP = todaysReport.games.length > 0 ? totalRTP / todaysReport.games.length : 0;
        
        setTodaysGameStats({
          totalGames: todaysReport.totalGames,
          totalCards: todaysReport.totalCardsSold,
          averageRTP: averageRTP,
          totalTime: totalTime,
        });
      }
    } catch (error) {
      console.error('Error loading today\'s game stats:', error);
    }
  };

  useEffect(() => {
    loadTodaysGameStats();
  }, []);

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
    navigation.navigate('TransactionReport' as never);
  };

  const handleCoinPurchase = () => {
    navigation.navigate('TransactionReport' as never);
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

  const handleLanguageChange = (language: string) => {
    const newLang = language as 'en' | 'am';
    setAppLanguage(newLang);
    i18n.changeLanguage(newLang);
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

  const renderProfileHeader = () => (
    <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
      <View style={styles.newProfileHeader}>
        <View style={styles.newAvatarContainer}>
          <View style={[styles.newAvatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.newAvatarText, { color: '#fff' }]}>
              {user?.name?.charAt(0).toUpperCase() || 'D'}
            </Text>
          </View>
        </View>
        
        <View style={styles.newUserInfo}>
          <Text style={[styles.newUserName, { color: theme.colors.text }]}>{user?.name || 'Dage Tadese'}</Text>
          <Text style={[styles.newUserPhone, { color: theme.colors.textSecondary }]}>{user?.phone || '09 12 34 56 78'}</Text>
        </View>
        
        <TouchableOpacity style={[styles.editButton, { borderColor: theme.colors.border }]}>
          <Text style={[styles.editButtonText, { color: theme.colors.textSecondary }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCoinSection = () => (
    <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
      <View style={styles.coinRow}>
        <Text style={[styles.coinText, { color: theme.colors.text }]}>120 coine</Text>
        <TouchableOpacity style={[styles.buyCoinBtn, { backgroundColor: theme.colors.surface }]} onPress={handleCoinPurchase}>
          <Text style={[styles.buyCoinBtnText, { color: theme.colors.text }]}>Buy coin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInvitationCard = () => (
    <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
      <View style={styles.invitationHeader}>
        <Text style={[styles.invitationTitle, { color: theme.colors.text }]}>Invite friend and get up</Text>
        <Text style={[styles.invitationTitle, { color: theme.colors.text }]}>
          to <Text style={styles.cashbackHighlight}>10% cash back</Text> on
        </Text>
        <Text style={[styles.invitationTitle, { color: theme.colors.text }]}>there coin purchases.</Text>
        <View style={styles.invitationIcon}>
          <Text style={styles.iconText}>🤝💰</Text>
        </View>
      </View>
      
      <View style={styles.invitationCodeSection}>
        <Text style={[styles.codeLabel, { color: theme.colors.textSecondary }]}>Your invitation code</Text>
        <View style={[styles.codeRow, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Text style={styles.invitationCode}>123424</Text>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.colors.surface }]} onPress={handleCopyInviteLink}>
            <Text style={[styles.shareButtonText, { color: theme.colors.text }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[styles.friendCashback, { color: theme.colors.text }]}>Frend you invit will get 5% cash back</Text>
    </View>
  );

  const renderCoinsCard = () => (
    <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
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


  const renderReportSections = () => (
    <View style={styles.reportsContainer}>
      <View style={styles.reportsRow}>
        <View style={[styles.reportCardHalf, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity 
            style={styles.reportCardContent}
            onPress={showTransactionHistory}
          >
            <View style={styles.reportIcon}>
              <Text style={styles.reportIconText}>💰</Text>
            </View>
            <Text style={[styles.reportTitle, { color: theme.colors.text }]}>Transaction Report</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.reportCardHalf, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity 
            style={styles.reportCardContent}
            onPress={showGameHistory}
          >
            <View style={styles.reportIcon}>
              <Text style={styles.reportIconText}>🎮</Text>
            </View>
            <Text style={[styles.reportTitle, { color: theme.colors.text }]}>Game Report</Text>
            <View style={styles.reportSubRow}>
              <Text style={[styles.reportSubTitle, { color: theme.colors.textSecondary }]}>Date</Text>
              <Text style={[styles.reportSubTitle, { color: theme.colors.textSecondary }]}>Coins you make</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
    </View>
  );

  const renderLanguageCard = () => (
    <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>🌐 Language</Text>
      </View>
      
      <View style={styles.settingItem}>
        <Dropdown
          value={appLanguage as any}
          options={["am","en","ar","fr"] as any}
          onChange={(v: any) => handleLanguageChange(v)}
          getLabel={(v: any) => v === 'am' ? 'Amharic' : v === 'en' ? 'English' : v === 'ar' ? 'Arabic' : 'French'}
        />
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
    <SafeAreaView style={[styles.newContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor={theme.colors.background} 
        barStyle={theme.theme === 'dark' ? 'light-content' : 'dark-content'} 
      />
      
      <ScrollView style={[styles.newScrollView, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.newContent}>
          {renderProfileHeader()}
          {renderCoinSection()}
          {renderInvitationCard()}
          {renderReportSections()}
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
  // New clean UI styles
  newContainer: {
    flex: 1,
  },
  newScrollView: {
    flex: 1,
  },
  newContent: {
    padding: 16,
    gap: 12,
  },
  
  // Profile Header Card
  newProfileCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  newProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newAvatarContainer: {
    marginRight: 16,
  },
  newAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  newUserInfo: {
    flex: 1,
  },
  newUserName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newUserPhone: {
    fontSize: 16,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
  },
  
  // Coin Section Card
  newCoinCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buyCoinBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buyCoinBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Invitation Card
  newInvitationCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  invitationHeader: {
    marginBottom: 20,
    position: 'relative',
  },
  invitationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  cashbackHighlight: {
    color: '#E91E63',
  },
  invitationIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  iconText: {
    fontSize: 24,
  },
  invitationCodeSection: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  invitationCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
    letterSpacing: 1,
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareButtonText: {
    fontSize: 14,
  },
  friendCashback: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Report Cards
  reportsContainer: {
    gap: 12,
  },
  reportsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reportCardHalf: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportCardFull: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportCardContent: {
    alignItems: 'center',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reportIconText: {
    fontSize: 24,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  reportSubRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  reportSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Legacy styles (keeping for compatibility)
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
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
    paddingBottom: 5,
  },
  coinSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  coinBalance: {
    flex: 1,
  },
  coinLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyCoinButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyCoinText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsSubtitle: {
    fontSize: 12,
    fontWeight: '500',
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
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
  languageCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
  settingItem: {
    marginBottom: 20,
  },
  // Invitation Card Styles
  invitationContent: {
    gap: 16,
  },
  referralSection: {
    gap: 6,
  },
  referralLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 6,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  copyIcon: {
    fontSize: 16,
  },
  cashbackSection: {
    gap: 6,
  },
  cashbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  cashbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inviteButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Report Navigation Styles
  reportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  reportNavButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  reportNavIcon: {
    fontSize: 20,
  },
  reportNavText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});