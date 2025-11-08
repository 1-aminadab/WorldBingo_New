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
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronDown, Edit3, LogOut, X, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../components/ui/ThemeProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import AuthField from '../components/ui/AuthField';
import PhoneField from '../components/ui/PhoneField';
import BlueButton from '../components/ui/BlueButton';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import StatusModal from '../components/ui/StatusModal';

import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { CoinSyncService } from '../services/coinSyncService';
import { formatTime } from '../utils/gameHelpers';
import { ReportStorageManager } from '../utils/reportStorage';
import { apiClient } from '../api/client/base';
import { API_ENDPOINTS } from '../api/config';
import { ScreenNames } from '../constants/ScreenNames';
import { restoreTabBar } from '../utils/tabBarStyles';
import { transactionApiService } from '../api/services/transaction';

const { width } = Dimensions.get('window');

type ProfileScreenRouteProp = RouteProp<{
  ProfileMain: {
    paymentStatus?: 'success' | 'cancelled' | 'failed';
    paymentMessage?: string;
    amount?: string;
    transactionId?: string;
  };
}, 'ProfileMain'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ProfileScreenRouteProp>();
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const { user, isAuthenticated, isGuest, logout, logoutSilent, convertGuestToUser, isLoading, userCoins, setPendingAuthScreen } = useAuthStore();
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
  const [todaysGameStats, setTodaysGameStats] = useState({
    totalGames: 0,
    totalCards: 0,
    averageRTP: 0,
    totalTime: 0,
  });
  const [todaysReportStats, setTodaysReportStats] = useState({
    totalPayin: 0,
    totalPayout: 0,
    totalProfit: 0,
  });
  const [currentDate, setCurrentDate] = useState('');

  // Modal states
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    variant: 'success' | 'error';
    title?: string;
    message?: string;
    showPhoneSupport?: boolean;
  }>({
    visible: false,
    variant: 'success',
  });

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isRefreshingCoins, setIsRefreshingCoins] = useState(false);
  
  // Animation for refresh button rotation
  const refreshRotation = useSharedValue(0);
  
  const refreshAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${refreshRotation.value}deg` }],
    };
  });
  
  // Control rotation animation based on refresh state
  useEffect(() => {
    if (isRefreshingCoins) {
      refreshRotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1, // infinite repeat
        false // don't reverse
      );
    } else {
      refreshRotation.value = withTiming(0, { duration: 200 });
    }
  }, [isRefreshingCoins]);
  const [editProfileForm, setEditProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [countryCode, setCountryCode] = useState('+251');
  const [editProfileErrors, setEditProfileErrors] = useState<{[key: string]: string}>({});
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const showStatusModal = (variant: 'success' | 'error', title?: string, message?: string, showPhoneSupport?: boolean) => {
    setStatusModal({ visible: true, variant, title, message, showPhoneSupport });
  };

  const hideStatusModal = () => {
    setStatusModal(prev => ({ ...prev, visible: false }));
  };

  // Handle payment deep link result
  useFocusEffect(
    React.useCallback(() => {
      const { paymentStatus, paymentMessage, amount, transactionId } = route.params || {};
      
      if (paymentStatus) {
        console.log('💳 Payment Result Received:', { paymentStatus, paymentMessage, amount, transactionId });
        
        setTimeout(() => {
          if (paymentStatus === 'success') {
            showStatusModal(
              'success',
              'Payment Successful! 🎉',
              paymentMessage || `Your payment has been processed successfully.${amount ? `\n\nAmount: ${amount} coins` : ''}${transactionId ? `\nTransaction ID: ${transactionId}` : ''}`,
              false // No phone support needed for successful payments
            );
          } else if (paymentStatus === 'cancelled') {
            showStatusModal(
              'error',
              'Payment Cancelled',
              paymentMessage || 'You have cancelled the payment. No charges were made.',
              true // Show phone support for payment issues
            );
          } else if (paymentStatus === 'failed') {
            showStatusModal(
              'error',
              'Payment Failed',
              paymentMessage || 'Payment could not be processed. Please try again.',
              true // Show phone support for payment failures
            );
          }
        }, 300);

        // Clear the params to prevent showing the modal again
        navigation.setParams({
          paymentStatus: undefined,
          paymentMessage: undefined,
          amount: undefined,
          transactionId: undefined,
        } as any);
      }
    }, [route.params])
  );

  // Ensure tab bar is visible when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      restoreTabBar(navigation);
    }, [navigation])
  );

  // Format current date for display
  const formatCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load today's game statistics
  const loadTodaysGameStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userId = user?.userId; // Get userId from auth store
      setCurrentDate(formatCurrentDate()); // Update current date display
      const todaysReport = await ReportStorageManager.getGameReportByDate(today, userId);
      
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

  // Load today's report statistics
  const loadTodaysReportStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userId = user?.userId;
      const todaysReport = await ReportStorageManager.getGameReportByDate(today, userId);
      
      if (todaysReport) {
        // Payin is the total collected amount from players
        const totalPayin = todaysReport.totalCollectedAmount;
        // Payout is calculated as total collected amount minus profit
        const totalPayout = todaysReport.totalCollectedAmount - todaysReport.totalProfit;
        // Profit is the house profit from the games
        const totalProfit = todaysReport.totalProfit;
        
        setTodaysReportStats({
          totalPayin: totalPayin,
          totalPayout: totalPayout,
          totalProfit: totalProfit,
        });
      }
    } catch (error) {
      console.error('Error loading today\'s report stats:', error);
    }
  };

  // Load stats on component mount and when screen is focused for real-time updates
  useEffect(() => {
    loadTodaysGameStats();
    loadTodaysReportStats();
  }, []);

  // Refresh stats every time the screen is focused for real-time updates
  useFocusEffect(
    React.useCallback(() => {
      loadTodaysGameStats();
      loadTodaysReportStats();
    }, [user?.userId]) // Reload when user changes
  );

  // Refresh stats when user coins change (after games, transactions, etc.)
  useEffect(() => {
    if (user) {
      loadTodaysGameStats();
      loadTodaysReportStats();
    }
  }, [userCoins, user?.userId]); // Trigger when coins or user changes

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      isGuest ? 'Exit guest session?' : 'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: isGuest ? 'Exit' : 'Logout', style: 'destructive', onPress: logout },
      ]
    );
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
        accountForm.name,
        accountForm.email,
        accountForm.password,
        accountForm.confirmPassword
      );
      
      if (success) {
        showStatusModal('success', 'Success', 'Account created successfully! Your game progress has been saved.');
        setShowCreateAccount(false);
      } else {
        showStatusModal('error', 'Error', 'Failed to create account');
      }
    } catch (error) {
      showStatusModal('error', 'Error', 'An error occurred while creating account');
    }
  };

  const updateAccountForm = (key: string, value: string) => {
    setAccountForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleViewCoins = () => {
    navigation.navigate(ScreenNames.TRANSACTION_REPORT as never);
  };

  const handleCoinPurchase = () => {
    const userId = useAuthStore.getState().getUserId();
    console.log('💳 Navigating to payment page with user ID:', userId);
    navigation.navigate(ScreenNames.PAYMENT_WEBVIEW as never);
  };

  const handleRefreshCoins = async () => {
    const debugId = Math.random().toString(36).substr(2, 9);
    console.log(`🔄 [${debugId}] ===== REFRESH COINS BUTTON PRESSED =====`);
    console.log(`🔄 [${debugId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔄 [${debugId}] Current refresh state: ${isRefreshingCoins}`);
    
    if (isRefreshingCoins) {
      console.log(`⚠️ [${debugId}] Refresh already in progress, ignoring click`);
      return; // Prevent multiple simultaneous refreshes
    }
    
    // Get current user state for debugging
    const authStore = useAuthStore.getState();
    const currentUserCoins = authStore.userCoins;
    const userId = authStore.getUserId();
    const isAuthenticated = authStore.isAuthenticated;
    
    console.log(`👤 [${debugId}] User state:`, {
      userId,
      isAuthenticated,
      currentUserCoins,
      isGuest: authStore.isGuest
    });
    
    setIsRefreshingCoins(true);
    console.log(`🔄 [${debugId}] Set refresh state to true`);
    
    try {
      console.log(`🔄 [${debugId}] Starting coin sync service...`);
      const result = await CoinSyncService.syncCoins();
      console.log(`🔄 [${debugId}] Coin sync completed with result:`, result);
      
      if (result.success) {
        console.log(`✅ [${debugId}] Sync successful, refreshing user coins in store...`);
        
        // Refresh user coins in the store
        await useAuthStore.getState().loadCoins();
        console.log(`💰 [${debugId}] Coins refreshed from local storage`);
        
        // Get updated coins for comparison
        const newUserCoins = useAuthStore.getState().userCoins;
        console.log(`💰 [${debugId}] Coins updated: ${currentUserCoins} → ${newUserCoins}`);
        
        // Check if coins increased and create transaction report
        const coinIncrease = newUserCoins - currentUserCoins;
        console.log(`💰 [${debugId}] Coin difference: ${coinIncrease}`);
        
        if (coinIncrease > 0) {
          console.log(`📈 [${debugId}] Creating positive transaction report for coin increase: +${coinIncrease}`);
          try {
            await transactionApiService.createTransaction({
              userId: userId,
              type: 'payout', // Positive transaction (coins added to user's balance)
              amount: coinIncrease,
              description: `Coins retrieved from sync (+${coinIncrease.toFixed(2)} coins)`
            });
            console.log(`✅ [${debugId}] Transaction report created for +${coinIncrease} coins`);
          } catch (transactionError) {
            console.error(`❌ [${debugId}] Failed to create transaction report:`, transactionError);
            // Don't show error to user, just log it since sync was successful
          }
        }
        
        showStatusModal(
          'success',
          '🪙 Coins Synced!',
          result.message
        );
        
        console.log(`✅ [${debugId}] Success modal shown`);
      } else {
        console.error(`❌ [${debugId}] Sync failed with result:`, result);
        
        // Check if login is required
        if (result.requiresLogin) {
          console.log(`🔐 [${debugId}] Login required, showing login alert...`);
          Alert.alert(
            '🔐 Login Required',
            result.message || 'Please log in to sync your coins with the backend.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Login', 
                onPress: () => {
                  console.log(`🔐 [${debugId}] User chose to login from sync error`);
                  setPendingAuthScreen('Login');
                  logoutSilent(); // This will navigate to auth
                }
              },
            ]
          );
        } else {
          showStatusModal(
            'error',
            '❌ Sync Failed',
            result.error || 'Failed to sync coins with backend'
          );
        }
        
        console.log(`❌ [${debugId}] Error handling completed`);
      }
    } catch (error: any) {
      console.error(`❌ [${debugId}] Exception during refresh:`, {
        type: error.constructor?.name,
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      
      // Check if this is an authentication error
      const isAuthError = error.statusCode === 401 || 
                         error.message?.includes('No token provided') ||
                         error.message?.includes('Unauthorized');
      
      if (isAuthError) {
        console.log(`🔐 [${debugId}] Auth error in exception, showing login alert...`);
        Alert.alert(
          '🔐 Login Required',
          'Your session has expired. Please log in to sync your coins.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => {
                console.log(`🔐 [${debugId}] User chose to login from exception`);
                setPendingAuthScreen('Login');
                logoutSilent();
              }
            },
          ]
        );
      } else {
        showStatusModal(
          'error',
          '❌ Sync Error',
          'Unable to connect to server. Please check your internet connection.'
        );
      }
      
      console.log(`❌ [${debugId}] Exception handling completed`);
    } finally {
      setIsRefreshingCoins(false);
      console.log(`🔄 [${debugId}] Set refresh state to false`);
      console.log(`🔄 [${debugId}] ===== REFRESH COINS COMPLETED =====`);
    }
  };

  const handleInviteFriends = async () => {
    // If user is guest, exit guest mode to allow login/signup
    if (isGuest) {
      Alert.alert(
        'Sign Up Required',
        'To share your invitation code and earn rewards, please create an account or sign in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Up', 
            onPress: async () => {
              setPendingAuthScreen('SignUp');
              await logoutSilent();
            }
          },
        ]
      );
      return;
    }
    
    try {
      const userId = user?.userId || user?.id;
      const shareMessage = `I'm using World Bingo App! 🎯\nThis Bingo app is awesome — you should try it!\n\n\nDownload now 👉\n\nhttps://myworldbingo.com/app`;
      
      await Share.share({
        message: shareMessage,
        title: 'Join me on World Bingo!',
      });
    } catch (error) {
      showStatusModal('error', 'Error', 'Failed to share invite link.');
    }
  };

  const handleLanguageChange = (language: string) => {
    const newLang = language as 'en' | 'am';
    setAppLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleEditProfile = () => {
    // Split user's name into firstName and lastName
    const nameParts = (user?.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Remove country code from phone number if present
    const phoneNumber = user?.phoneNumber || '';
    const cleanPhone = phoneNumber.startsWith('+251') 
      ? phoneNumber.substring(4) 
      : phoneNumber.startsWith('251')
      ? phoneNumber.substring(3)
      : phoneNumber;
    
    setEditProfileForm({
      firstName,
      lastName,
      phoneNumber: cleanPhone,
    });
    setCountryCode('+251');
    setEditProfileErrors({});
    setShowEditProfileModal(true);
  };

  const validateEditProfileForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!editProfileForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (editProfileForm.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!editProfileForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (editProfileForm.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!editProfileForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    
    setEditProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateEditProfileForm()) return;

    setIsUpdatingProfile(true);
    try {
      const fullName = `${editProfileForm.firstName.trim()} ${editProfileForm.lastName.trim()}`.trim();
      const fullPhoneNumber = `${countryCode}${editProfileForm.phoneNumber}`;
      
      // Get userId from user object
      const userId = user?.userId || user?.id;
      
      if (!userId) {
        showStatusModal('error', 'Error', 'User ID not found');
        setIsUpdatingProfile(false);
        return;
      }

      console.log('Updating user profile:', { userId, fullName, phoneNumber: fullPhoneNumber });
      
      // Use the correct endpoint: PUT /api/v1/users/:userId
      const response = await apiClient.put(`/api/v1/users/${userId}`, {
        fullName,
        phoneNumber: fullPhoneNumber,
      });

      console.log('Update profile response:', response);

      if (response.success) {
        // Update local user state
        const updatedUser = {
          ...user,
          name: fullName,
          phoneNumber: fullPhoneNumber,
        };
        useAuthStore.getState().setUser(updatedUser as any);
        
        showStatusModal('success', 'Success', 'Profile updated successfully!');
        setShowEditProfileModal(false);
      } else {
        showStatusModal('error', 'Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showStatusModal('error', 'Error', error.message || 'An error occurred while updating profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updateEditProfileForm = (key: string, value: string) => {
    setEditProfileForm(prev => ({ ...prev, [key]: value }));
    if (editProfileErrors[key]) {
      setEditProfileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };


  const handleGetFreeCoins = () => {
    Alert.alert(
      '🎁 Free Coins Available',
      'Choose how to earn free coins:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '📺 Watch Ad (+50 coins)', 
          onPress: () => {
            showStatusModal('success', '🎉 Ad Complete!', 'You earned 50 coins!\n\nKeep earning more with daily activities!');
          }
        },
      ]
    );
  };

  const showTransactionHistory = () => {
    navigation.navigate(ScreenNames.TRANSACTION_REPORT as never);
  };

  const showGameHistory = () => {
    navigation.navigate(ScreenNames.GAME_REPORT as never);
  };

  const getWinRate = (): string => {
    if (!user?.gamesPlayed || user.gamesPlayed === 0) return '0';
    return Math.round((user.gamesWon || 0) / user.gamesPlayed * 100).toString();
  };

  const renderProfileHeader = () => {
    // For guest users, show simplified header with signup/signin buttons and coin display
    if (isGuest) {
      return (
        <View style={[{ backgroundColor: 'rgb(28, 42, 89)', borderRadius: 8, padding: 16 }]}>
          <View style={styles.guestHeader}>
            <View style={styles.guestButtons}>
              <TouchableOpacity 
                style={[styles.guestButton, { backgroundColor: theme.colors.primary }]}
                onPress={async () => {
                  setPendingAuthScreen('SignUp'); // Set desired screen for signup
                  await logoutSilent(); // Exit guest mode silently
                }}
              >
                <Text style={[styles.guestButtonText, { color: '#fff' }]}>Sign Up</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.guestButton, styles.guestButtonSecondary, { borderColor: theme.colors.primary, borderWidth: 1 }]}
                onPress={async () => {
                  setPendingAuthScreen('Login'); // Set desired screen  
                  await logoutSilent(); // Exit guest mode silently
                }}
              >
                <Text style={[styles.guestButtonText, { color: theme.colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 2px border separator */}
          <View style={[styles.borderSeparator, { backgroundColor: theme.colors.border }]} />
          
          {/* Coin section for guest */}
          <View style={styles.coinRow}>
            <View style={styles.coinDisplay}>
              <Image 
                source={require('../assets/images/coin-2159.svg')}
                style={styles.coinIcon}
              />
              <Text style={[styles.coinText, { color: theme.colors.text }]}>0 coins</Text>
            </View>
            <View style={styles.coinButtons}>
              <TouchableOpacity 
                style={[styles.buyCoinBtn, { backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.border }]} 
                onPress={async () => {
                  Alert.alert(
                    'Sign Up Required',
                    'To purchase coins and manage your balance, please create an account or sign in.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Sign Up', 
                        onPress: async () => {
                          setPendingAuthScreen('SignUp');
                          await logoutSilent();
                        }
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.buyCoinBtnText, { color: '#fff' }]}>Buy coin</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.refreshBtn, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]} 
                onPress={() => {
                  console.log('🔄 Refresh button pressed by guest user - showing signup alert');
                  Alert.alert(
                    'Sign Up Required',
                    'To sync coins with the backend, please create an account or sign in.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Sign Up', 
                        onPress: async () => {
                          console.log('🔄 Guest user chose to sign up from refresh button');
                          setPendingAuthScreen('SignUp');
                          await logoutSilent();
                        }
                      },
                    ]
                  );
                }}
              >
                <Animated.View style={refreshAnimatedStyle}>
                  <RefreshCw size={16} color={theme.colors.text} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // For authenticated users, show full profile header
    const firstName = user?.name?.split(' ')[0] || 'Dage';
    const lastName = user?.name?.split(' ').slice(1).join(' ') || 'Tadese';
    const fullName = `${firstName} ${lastName}`;
    const phoneNumber = user?.phoneNumber || '09 12 34 56 78';
    const userId = user?.userId || 'GUEST123';

    return (
      <View style={[{ backgroundColor: 'rgb(28, 42, 89)', borderRadius: 8, padding: 16 }]}>
        <View style={styles.newProfileHeader}>
          <View style={styles.newAvatarContainer}>
            <View style={[styles.newAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.newAvatarText, { color: '#fff' }]}>
                {firstName?.charAt(0).toUpperCase() || 'D'}
              </Text>
            </View>
          </View>
          
          <View style={styles.newUserInfo}>
            <Text style={[styles.newUserNameSmall, { color: theme.colors.text }]}>{fullName}</Text>
            <Text style={[styles.newUserPhoneSmall, { color: theme.colors.textSecondary }]}>{phoneNumber}</Text>
            <Text style={[styles.newUserPhoneSmall, { color: theme.colors.textSecondary }]}>ID: {userId}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.optionsButton, { borderColor: theme.colors.border }]}
            onPress={() => setShowOptionsModal(true)}
          >
            <ChevronDown size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* 2px border separator */}
        <View style={[styles.borderSeparator, { backgroundColor: theme.colors.border }]} />
        
        {/* Coin section merged */}
        <View style={styles.coinRow}>
          <View style={styles.coinDisplay}>
            <Image 
              source={require('../assets/images/coin-2159.svg')}
              style={styles.coinIcon}
            />
            <Text style={[styles.coinText, { color: theme.colors.text }]}>{userCoins.toFixed(0)} coins</Text>
          </View>
          <View style={styles.coinButtons}>
            <TouchableOpacity style={[styles.buyCoinBtn, { backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.border }]} onPress={handleCoinPurchase}>
              <Text style={[styles.buyCoinBtnText, { color: '#fff' }]}>Buy coin</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.refreshBtn, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]} 
              onPress={() => {
                console.log('🔄 Refresh button pressed by authenticated user');
                console.log('🔄 Current refresh state:', isRefreshingCoins);
                console.log('🔄 Current user coins:', userCoins);
                handleRefreshCoins();
              }}
              disabled={isRefreshingCoins}
            >
              <Animated.View style={refreshAnimatedStyle}>
                <RefreshCw 
                  size={16} 
                  color={isRefreshingCoins ? theme.colors.textSecondary : theme.colors.text} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Coin section is now merged with profile header

  const renderInvitationCard = () => (
    <View style={[{ backgroundColor: 'rgb(28, 42, 89)', borderRadius: 8, padding: 16 }]}>
      <View style={styles.invitationHeader}>
        <Text style={[styles.invitationTitle, { color: theme.colors.text }]}>Invite friend and get up</Text>
        <Text style={[styles.invitationTitle, { color: theme.colors.text }]}>
          to <Text style={styles.cashbackHighlight}>10% cash back</Text> on
        </Text>
        <Text style={[styles.invitationTitle, { color: theme.colors.text }]}>there coin purchases.</Text>
        <View style={styles.invitationIcon}>
          <Image 
            source={require('../assets/images/werer.png')}
            style={styles.invitationImage}
            resizeMode="contain"
          />
        </View>
      </View>
      
      <View style={styles.invitationCodeSection}>
        <Text style={[styles.codeLabel, { color: theme.colors.textSecondary }]}>Your invitation code</Text>
        <View style={[styles.codeRow, { backgroundColor: 'rgb(0, 12, 53)', borderColor: theme.colors.border }]}>
          <Text style={styles.invitationCode}>{isGuest ? 'Login Required' : (user?.userId || user?.id || 'N/A')}</Text>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: 'rgb(28, 42, 89)' }]} onPress={handleInviteFriends}>
            <Text style={[styles.shareButtonText, { color: theme.colors.text }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[styles.friendCashback, { color: theme.colors.text }]}>Frend you invit will get 5% cash back</Text>
    </View>
  );

  const renderCoinsCard = () => (
    <View style={[{ backgroundColor: 'rgb(28, 42, 89)', borderRadius: 8, padding: 16 }]}>
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
        <View style={[styles.reportCardHalfSmall, { backgroundColor: 'rgb(28, 42, 89)' }]}>
          <TouchableOpacity 
            style={styles.reportCardContentSmall}
            onPress={showTransactionHistory}
          >
            <View style={styles.reportIconSmall}>
              <Text style={styles.reportIconTextSmall}>💰</Text>
            </View>
            <Text style={[styles.reportTitleSmall, { color: theme.colors.text }]}>Transaction Report</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.reportCardHalfSmall, { backgroundColor: 'rgb(28, 42, 89)' }]}>
          <TouchableOpacity 
            style={styles.reportCardContentSmall}
            onPress={showGameHistory}
          >
            <View style={styles.reportIconSmall}>
              <Text style={styles.reportIconTextSmall}>🎮</Text>
            </View>
            <Text style={[styles.reportTitleSmall, { color: theme.colors.text }]}>Game Report</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Today's Statistics */}
      <View style={[styles.todayStatsCard, { backgroundColor: 'rgb(28, 42, 89)' }]}>
        <View style={styles.statsHeaderContainer}>
          <Text style={[styles.todayStatsTitle, { color: theme.colors.text }]}>Daily Statistics</Text>
          <Text style={[styles.currentDateText, { color: theme.colors.textSecondary }]}>{currentDate}</Text>
        </View>
        
        {/* First Row - 3 Items */}
        <View style={styles.statsRowThree}>
          <View style={[styles.statCardSmall, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.statNumberSmall, { color: theme.colors.primary }]}>{todaysGameStats.totalGames}</Text>
            <Text style={[styles.statLabelSmall, { color: theme.colors.text }]}>Games</Text>
          </View>
          <View style={[styles.statCardSmall, { backgroundColor: '#4299E1' + '15' }]}>
            <Text style={[styles.statNumberSmall, { color: '#4299E1' }]}>{todaysGameStats.totalCards}</Text>
            <Text style={[styles.statLabelSmall, { color: theme.colors.text }]}>Cards</Text>
          </View>
          <View style={[styles.statCardSmall, { backgroundColor: '#48BB78' + '15' }]}>
            <Text style={[styles.statNumberSmall, { color: '#48BB78' }]}>{todaysReportStats.totalPayin.toFixed(2)}</Text>
            <Text style={[styles.statLabelSmall, { color: theme.colors.text }]}>Pay-in</Text>
          </View>
        </View>

        {/* Second Row - 2 Items */}
        <View style={styles.statsRowTwo}>
          <View style={[styles.statCardMedium, { backgroundColor: '#E53E3E' + '15' }]}>
            <Text style={[styles.statNumberMedium, { color: '#E53E3E' }]}>{todaysReportStats.totalPayout.toFixed(2)}</Text>
            <Text style={[styles.statLabelMedium, { color: theme.colors.text }]}>Pay-out (Birr)</Text>
          </View>
          <View style={[styles.statCardMedium, { backgroundColor: todaysReportStats.totalProfit >= 0 ? '#48BB78' + '15' : '#E53E3E' + '15' }]}>
            <Text style={[styles.statNumberMedium, { color: todaysReportStats.totalProfit >= 0 ? '#48BB78' : '#E53E3E' }]}>
              {todaysReportStats.totalProfit >= 0 ? '+' : ''}{todaysReportStats.totalProfit.toFixed(2)}
            </Text>
            <Text style={[styles.statLabelMedium, { color: theme.colors.text }]}>Profit (Birr)</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderLanguageCard = () => (
    <View style={[{ backgroundColor: 'rgb(28, 42, 89)', borderRadius: 8, padding: 16 }]}>
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

  const renderOptionsModal = () => (
    <Modal
      visible={showOptionsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowOptionsModal(false)}
    >
      <View style={styles.bottomModalOverlay}>
        <TouchableOpacity 
          style={styles.bottomModalBackdrop}
          onPress={() => setShowOptionsModal(false)}
        />
        <View style={[styles.bottomModalContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.bottomModalHandle} />
          
          <View style={styles.bottomModalContent}>
            <TouchableOpacity 
              style={[styles.modernModalButton, { backgroundColor: '#FFFFFF' }]}
              onPress={() => {
                setShowOptionsModal(false);
                handleEditProfile();
              }}
            >
              <View style={styles.buttonContent}>
                <Edit3 size={20} color="#000000" />
                <Text style={[styles.modalButtonText, { color: '#000000' }]}>Edit Profile</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernModalButton, { backgroundColor: '#EF4444' }]}
              onPress={() => {
                setShowOptionsModal(false);
                handleLogout();
              }}
            >
              <View style={styles.buttonContent}>
                <LogOut size={20} color="#FFFFFF" />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditProfileModal = () => (
    <Modal
      visible={showEditProfileModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEditProfileModal(false)}
    >
      <View style={styles.editProfileModalOverlay}>
        <TouchableOpacity 
          style={styles.editProfileModalBackdrop}
          onPress={() => setShowEditProfileModal(false)}
          activeOpacity={1}
        />
        <View style={[styles.editProfileModalContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.editProfileModalHandle} />
          
          <View style={styles.editProfileModalHeader}>
            <Text style={[styles.editProfileModalTitle, { color: theme.colors.text }]}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editProfileModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.editProfileRow}>
              <AuthField
                label="First Name*"
                placeholder="First name"
                value={editProfileForm.firstName}
                onChangeText={(value) => updateEditProfileForm('firstName', value)}
                containerStyle={{ flex: 1, marginRight: 8 }}
                error={editProfileErrors.firstName}
              />
              <AuthField
                label="Last Name*"
                placeholder="Last name"
                value={editProfileForm.lastName}
                onChangeText={(value) => updateEditProfileForm('lastName', value)}
                containerStyle={{ flex: 1, marginLeft: 8 }}
                error={editProfileErrors.lastName}
              />
            </View>

            <PhoneField
              label="Phone Number*"
              placeholder="Enter your phone number"
              value={editProfileForm.phoneNumber}
              onChangeText={(value) => updateEditProfileForm('phoneNumber', value)}
              onChangeCountryCode={setCountryCode}
              error={editProfileErrors.phoneNumber}
            />

            <BlueButton
              title={isUpdatingProfile ? 'Updating...' : 'Save Changes'}
              onPress={handleSaveProfile}
              disabled={isUpdatingProfile}
              style={styles.saveProfileButton}
            />
          </ScrollView>
        </View>
      </View>
      {isUpdatingProfile && (
        <LoadingOverlay
          visible={true}
          message="Updating profile..."
        />
      )}
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/app-bgaround.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <SafeAreaView style={[styles.newContainer, { backgroundColor: 'transparent' }]}>
        <StatusBar 
          backgroundColor={theme.colors.background} 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
        />
        
        <ScrollView style={[styles.newScrollView, { backgroundColor: 'transparent' }]} showsVerticalScrollIndicator={false}>
          <View style={styles.newContent}>
            {renderProfileHeader()}
            {renderInvitationCard()}
            {renderReportSections()}
          </View>
        </ScrollView>
      </SafeAreaView>

      {renderCreateAccountModal()}
      {renderOptionsModal()}
      {renderEditProfileModal()}
      
      <StatusModal
        visible={statusModal.visible}
        variant={statusModal.variant}
        title={statusModal.title}
        message={statusModal.message}
        showPhoneSupport={statusModal.showPhoneSupport}
        onDismiss={hideStatusModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Container and background styles
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  // New clean UI styles
  newContainer: {
    flex: 1,
  },
  newScrollView: {
    flex: 1,
  },
  newContent: {
    padding: 16,
    paddingBottom: 16,
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
  newUserNameSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  newUserPhoneSmall: {
    fontSize: 14,
    marginBottom: 1,
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
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  borderSeparator: {
    height: 2,
    marginVertical: 16,
    borderRadius: 1,
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
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  coinText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buyCoinBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyCoinBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  coinButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationImage: {
    width: 130,
    height: 130,
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
  reportCardHalfSmall: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    minHeight: 70,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportCardContentSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  reportIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reportIconTextSmall: {
    fontSize: 16,
  },
  reportTitleSmall: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 13,
  },
  todayStatsCard: {
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 12,
  },
  statsHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  todayStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  currentDateText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsRowThree: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  statsRowTwo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statCardMedium: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statNumberSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statNumberMedium: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabelSmall: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  statLabelMedium: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
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
  coinBalanceContainer: {
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
  // Bottom Modal Styles
  bottomModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  bottomModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  bottomModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  modernModalButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Edit Profile Modal Styles
  editProfileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editProfileModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  editProfileModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  editProfileModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  editProfileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  editProfileModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editProfileModalContent: {
    maxHeight: '100%',
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  saveProfileButton: {
    marginTop: 20,
    marginBottom: 10,
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
  
  // Guest Profile Styles
  guestHeader: {
    alignItems: 'center',
  },
  guestButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  guestButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestButtonSecondary: {
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});