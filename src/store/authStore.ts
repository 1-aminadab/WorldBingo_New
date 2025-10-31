import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';
import { authApiService } from '../api';
import { errorHandler } from '../api/utils/errorHandler';
import type { ApiUser } from '../api/types';
import { CoinStorageManager } from '../utils/coinStorage';

// Import toast context
let toastContext: { showSuccess: (message: string, title?: string) => void; showError: (message: string, title?: string) => void; } | null = null;

// Function to set toast context from component tree
export const setToastContext = (context: typeof toastContext) => {
  toastContext = context;
};

interface AuthStore extends AuthState {
  // Phone-based authentication methods
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; requiresOtp?: boolean; message?: string }>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  register: (fullName: string, phoneNumber: string, password: string, confirmPassword: string, promoCode?: string) => Promise<{ success: boolean; requiresOtp?: boolean; message?: string; statusCode?: number; status?: string }>;
  forgotPassword: (phoneNumber: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (phoneNumber: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  
  // Common methods
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  logoutSilent: () => Promise<void>;
  
  // Navigation helper
  pendingAuthScreen: 'Login' | 'SignUp' | null;
  setPendingAuthScreen: (screen: 'Login' | 'SignUp' | null) => void;
  convertGuestToUser: (fullName: string, phoneNumber: string, password: string, confirmPassword: string, promoCode?: string) => Promise<boolean>;
  updateUserStats: (gamesPlayed: number, gamesWon: number, playTime: number) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  
  // Coins management
  userCoins: number;
  setCoins: (coins: number) => void;
  deductCoins: (amount: number) => boolean;
  addCoins: (amount: number) => void;
  loadCoins: () => Promise<void>;
  
  // Helper methods
  convertApiUserToAppUser: (apiUser: ApiUser) => User;
  getUserId: () => string | null;
  getNumericUserId: () => string | null;
  
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      error: null,
      userCoins: 0,
      pendingAuthScreen: null, // Will be loaded from storage

      // Helper function to convert API user to app user
      convertApiUserToAppUser: (apiUser: ApiUser): User => {
        console.log('Converting API user to app user:', apiUser);
        const user = {
          id: apiUser.id,
          userId: apiUser.userId,
          phoneNumber: apiUser.phoneNumber,
          email: apiUser.email || '',
          name: apiUser.fullName || apiUser.name || 'User',
          avatar: apiUser.avatar,
          createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
          isGuest: false,
          gamesPlayed: 0,
          gamesWon: 0,
          totalPlayTime: 0,
        };
        console.log('Converted user with ID:', user.id, 'and userId:', user.userId);
        return user;
      },

      login: async (phoneNumber: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApiService.login({ phoneNumber, password });
          console.log('=== Auth Store Login Response ===');
          console.log('Success:', result.success);
          console.log('Status Code:', result.statusCode);
          console.log('Message:', result.message);
          console.log('Has User Data:', !!result.data?.user);
          console.log('Has Token:', !!result.data?.token);
          console.log('Requires OTP:', result.data?.requiresOtp);
          console.log('================================');
          
          if (result.success) {
            if (result.data?.requiresOtp) {
              set({ isLoading: false });
              toastContext?.showSuccess('OTP sent to your phone', 'Check Messages');
              return { success: true, requiresOtp: true, message: result.message };
            } else if (result.data?.user) {
              const appUser = get().convertApiUserToAppUser(result.data.user);
            set({ 
              user: appUser, 
              isAuthenticated: true, 
              isGuest: false,
              isLoading: false,
              error: null
            });
            // Load coins for this user
            await get().loadCoins();
            console.log('🔐 Persistent login: Session will remain until manual logout');
            toastContext?.showSuccess(`Welcome back, ${appUser.name}!`, 'Login Successful');
            return { success: true, message: result.message };
            }
          }
          
          const errorMsg = result.message || 'Login failed';
          set({ isLoading: false, error: errorMsg });
          toastContext?.showError(errorMsg, 'Login Failed');
          return { success: false, message: errorMsg };
        } catch (error) {
          const handledError = errorHandler.handleError(error);
          set({ isLoading: false, error: handledError.message });
          toastContext?.showError(handledError.message, 'Login Error');
          return { success: false, message: handledError.message };
        }
      },

      verifyOtp: async (phoneNumber: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApiService.verifyOtp({ phoneNumber, otp });
          
          if (result.success && result.data?.user) {
            const appUser = get().convertApiUserToAppUser(result.data.user);
          set({ 
            user: appUser, 
            isAuthenticated: true, 
            isGuest: false,
            isLoading: false,
            error: null
          });
          // Load coins for this user
          await get().loadCoins();
          console.log('🔐 Persistent login: Session will remain until manual logout');
          toastContext?.showSuccess(`Welcome, ${appUser.name}!`, 'Verification Successful');
          return { success: true, message: result.message };
          }
          
          const errorMsg = result.message || 'OTP verification failed';
          set({ isLoading: false, error: errorMsg });
          toastContext?.showError(errorMsg, 'Verification Failed');
          return { success: false, message: errorMsg };
        } catch (error) {
          const handledError = errorHandler.handleError(error);
          set({ isLoading: false, error: handledError.message });
          toastContext?.showError(handledError.message, 'Verification Error');
          return { success: false, message: handledError.message };
        }
      },

      register: async (fullName: string, phoneNumber: string, password: string, confirmPassword: string, promoCode?: string) => {
        set({ isLoading: true, error: null });
        try {
          const registerData: any = { fullName, phoneNumber, password, confirmPassword };
          if (promoCode && promoCode.trim()) {
            registerData.promoCode = promoCode.trim();
          }
          const result = await authApiService.register(registerData);
          
          if (result.success) {
            if (result.data?.user) {
              const appUser = get().convertApiUserToAppUser(result.data.user);
            set({ 
              user: appUser, 
              isAuthenticated: true, 
              isGuest: false,
              isLoading: false,
              error: null
            });
            // Load coins for this user
            await get().loadCoins();
            console.log('🔐 Persistent login: Session will remain until manual logout');
            toastContext?.showSuccess(`Welcome to World Bingo, ${appUser.name}!`, 'Account Created');
            return { success: true, message: result.message };
            }
            set({ isLoading: false });
            toastContext?.showSuccess('OTP sent to your phone', 'Registration Successful');
            return { success: true, requiresOtp: true, message: result.message };
          }
          
          const errorMsg = result.message || 'Registration failed';
          set({ isLoading: false, error: errorMsg });
          toastContext?.showError(errorMsg, 'Registration Failed');
          return { success: false, message: errorMsg };
        } catch (error) {
          const handledError = errorHandler.handleError(error);
          set({ isLoading: false, error: handledError.message });
          toastContext?.showError(handledError.message, 'Registration Error');
          return { success: false, message: handledError.message };
        }
      },

      forgotPassword: async (phoneNumber: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApiService.forgotPassword({ phoneNumber });
          set({ isLoading: false });
          
          if (result.success) {
            toastContext?.showSuccess('Password reset OTP sent to your phone', 'Check Messages');
          } else {
            set({ error: result.message });
            toastContext?.showError(result.message || 'Failed to send reset code', 'Password Reset Failed');
          }
          
          return { success: result.success, message: result.message };
        } catch (error) {
          const handledError = errorHandler.handleError(error);
          set({ isLoading: false, error: handledError.message });
          toastContext?.showError(handledError.message, 'Password Reset Error');
          return { success: false, message: handledError.message };
        }
      },

      resetPassword: async (phoneNumber: string, otp: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApiService.resetPassword({ phoneNumber, otp, newPassword });
          set({ isLoading: false });
          
          if (result.success) {
            toastContext?.showSuccess('Password reset successfully! You can now login with your new password', 'Password Updated');
          } else {
            set({ error: result.message });
            toastContext?.showError(result.message || 'Failed to reset password', 'Password Reset Failed');
          }
          
          return { success: result.success, message: result.message };
        } catch (error) {
          const handledError = errorHandler.handleError(error);
          set({ isLoading: false, error: handledError.message });
          toastContext?.showError(handledError.message, 'Password Reset Error');
          return { success: false, message: handledError.message };
        }
      },

      

      loginAsGuest: async () => {
        console.log('Creating guest user...');
        const guestUser: User = {
          id: 'guest-' + Date.now(),
          email: '',
          name: 'Guest Host',
          isGuest: true,
          gamesPlayed: 0,
          gamesWon: 0,
          totalPlayTime: 0,
          createdAt: new Date(),
        };
        
        console.log('Setting guest state:', guestUser);
        set({ 
          user: guestUser, 
          isAuthenticated: false,
          isGuest: true,
          isLoading: false 
        });
        // Load coins for guest
        await get().loadCoins();
        console.log('Guest state set successfully. New state:', get());
      },

      logout: async () => {
      set({ isLoading: true });
      try {
        await authApiService.logout();
        set({ 
          user: null, 
          isAuthenticated: false,
          isGuest: false,
          isLoading: false,
          error: null
        });
        toastContext?.showSuccess('You have been logged out successfully', 'Goodbye!');
      } catch (error) {
        console.error('Logout error:', error);
        // Clear state even if logout API fails
        set({ 
          user: null, 
          isAuthenticated: false,
          isGuest: false,
          isLoading: false,
          error: null
        });
        toastContext?.showSuccess('You have been logged out', 'Goodbye!');
      }
      },

      logoutSilent: async () => {
        set({ isLoading: true });
        try {
          await authApiService.logout();
          set({ 
            user: null, 
            isAuthenticated: false,
            isGuest: false,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Clear state even if logout API fails
          set({ 
            user: null, 
            isAuthenticated: false,
            isGuest: false,
            isLoading: false,
            error: null
          });
        }
      },

      convertGuestToUser: async (fullName: string, phoneNumber: string, password: string, confirmPassword: string, promoCode?: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user: currentUser } = get();
          
          // Register with API and preserve guest user stats
          const registerData: any = { fullName, phoneNumber, password, confirmPassword };
          if (promoCode && promoCode.trim()) {
            registerData.promoCode = promoCode.trim();
          }
          const result = await authApiService.register(registerData);
          
          if (result.success && result.data?.user) {
            // Convert API user and preserve guest stats
            const appUser = get().convertApiUserToAppUser(result.data.user);
            const updatedUser: User = {
              ...appUser,
              gamesPlayed: currentUser?.gamesPlayed || 0,
              gamesWon: currentUser?.gamesWon || 0,
              totalPlayTime: currentUser?.totalPlayTime || 0,
              isGuest: false,
            };
            
          set({ 
            user: updatedUser, 
            isAuthenticated: true,
            isGuest: false,
            isLoading: false,
            error: null
          });
          // Load coins for converted user
          await get().loadCoins();
          console.log('🔐 Persistent login: Session will remain until manual logout');
          toastContext?.showSuccess(`Account created! Your game progress has been saved, ${updatedUser.name}`, 'Guest Converted');
          return true;
          } else {
            const errorMsg = result.message || 'Failed to convert guest user';
            set({ isLoading: false, error: errorMsg });
            toastContext?.showError(errorMsg, 'Account Creation Failed');
            return false;
          }
        } catch (error) {
          const handledError = errorHandler.handleError(error);
          set({ isLoading: false, error: handledError.message });
          toastContext?.showError(handledError.message, 'Account Creation Error');
          return false;
        }
      },

      updateUserStats: (gamesPlayed: number, gamesWon: number, playTime: number) => {
        const { user } = get();
        if (user) {
          const updatedUser: User = {
            ...user,
            gamesPlayed: (user.gamesPlayed || 0) + gamesPlayed,
            gamesWon: (user.gamesWon || 0) + gamesWon,
            totalPlayTime: (user.totalPlayTime || 0) + playTime,
          };
          set({ user: updatedUser });
        }
      },

      setUser: (user: User) => set({ user }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setPendingAuthScreen: (screen: 'Login' | 'SignUp' | null) => set({ pendingAuthScreen: screen }),
      
      getUserId: () => {
        const { user } = get();
        console.log('🔍 getUserId called, user object:', user);
        // Try userId first, then fall back to id for compatibility
        const userId = user?.userId || user?.id;
        console.log('🔍 getUserId returning:', userId);
        return userId || null;
      },
      
      getNumericUserId: () => {
        const { user } = get();
        console.log('🔍 Getting numeric user ID...');
        console.log('Current user:', JSON.stringify(user, null, 2));
        console.log('User ID (phone):', user?.id);
        console.log('Numeric User ID:', user?.userId);
        return user?.userId || null;
      },
      // Coins management methods
      loadCoins: async () => {
        const userId = get().getUserId();
        const coins = await CoinStorageManager.getCoins(userId || undefined);
        set({ userCoins: coins });
        console.log(`💰 Loaded coins from storage: ${coins} (User: ${userId || 'GUEST'})`);
      },

      setCoins: (coins: number) => {
        const userId = get().getUserId();
        const finalCoins = Math.max(0, coins); // Ensure non-negative
        console.log('💰 Setting coins:', finalCoins);
        set({ userCoins: finalCoins });
        // Save to storage asynchronously
        CoinStorageManager.setCoins(finalCoins, userId || undefined);
      },

      deductCoins: (amount: number): boolean => {
        const currentCoins = get().userCoins;
        if (currentCoins >= amount) {
          const newBalance = currentCoins - amount;
          const userId = get().getUserId();
          console.log(`💰 Deducting ${amount} coins: ${currentCoins} → ${newBalance}`);
          set({ userCoins: newBalance });
          // Save to storage asynchronously
          CoinStorageManager.setCoins(newBalance, userId || undefined);
          return true;
        }
        console.log(`❌ Insufficient coins: ${currentCoins} < ${amount}`);
        return false;
      },

      addCoins: (amount: number) => {
        const currentCoins = get().userCoins;
        const newBalance = currentCoins + amount;
        const userId = get().getUserId();
        console.log(`💰 Adding ${amount} coins: ${currentCoins} → ${newBalance}`);
        set({ userCoins: newBalance });
        // Save to storage asynchronously
        CoinStorageManager.setCoins(newBalance, userId || undefined);
      },

      initializeAuth: async () => {
        const { user, isAuthenticated, isGuest, loadCoins } = get();
        
        // Load coins from storage
        await loadCoins();
        
        // If already authenticated (from persisted storage), keep the user logged in and load reports
        if (isAuthenticated && user) {
          console.log('🔐 User session restored from storage:', user.name);
          console.log('🔐 Persistent login enabled - user stays logged in until manual logout');
          
          // Load game reports after authentication restoration
          console.log('📊 Loading game reports for restored user session...');
          try {
            const { useGameReportStore } = await import('./gameReportStore');
            const gameReportStore = useGameReportStore.getState();
            await gameReportStore.fetchCurrentUserReport();
            console.log('✅ Game reports loaded successfully');
          } catch (error) {
            console.error('❌ Failed to load game reports on auth init:', error);
          }
          
          return; // Keep existing state
        }
        
        // If guest, keep guest session and load guest reports
        if (isGuest) {
          console.log('👤 Guest session restored');
          
          // Load game reports for guest user
          console.log('📊 Loading game reports for guest user...');
          try {
            const { useGameReportStore } = await import('./gameReportStore');
            const gameReportStore = useGameReportStore.getState();
            await gameReportStore.fetchCurrentUserReport();
            console.log('✅ Guest game reports loaded successfully');
          } catch (error) {
            console.error('❌ Failed to load guest game reports on auth init:', error);
          }
          
          return; // Keep guest state
        }
        
        console.log('No active session found');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        userCoins: state.userCoins,
      }),
    }
  )
);