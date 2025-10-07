import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';
import firebaseAuthService from '../services/firebaseAuthService';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  changePassword: (token: string, newPassword: string) => Promise<boolean>;
  convertGuestToUser: (email: string, password: string, name: string) => Promise<boolean>;
  updateUserStats: (gamesPlayed: number, gamesWon: number, playTime: number) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await firebaseAuthService.signInWithEmailAndPassword(email, password);
          
          if (result.success && result.user) {
            set({ 
              user: result.user, 
              isAuthenticated: true, 
              isGuest: false,
              isLoading: false 
            });
            return true;
          } else {
            console.error('Login failed:', result.error);
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const result = await firebaseAuthService.signUpWithEmailAndPassword(
            email, 
            password, 
            name
          );
          
          if (result.success && result.user) {
            set({ 
              user: result.user, 
              isAuthenticated: true, 
              isGuest: false,
              isLoading: false 
            });
            return true;
          } else {
            console.error('Signup failed:', result.error);
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Signup error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      loginAsGuest: () => {
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
        console.log('Guest state set successfully. New state:', get());
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await firebaseAuthService.signOut();
          set({ 
            user: null, 
            isAuthenticated: false,
            isGuest: false,
            isLoading: false 
          });
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          const result = await firebaseAuthService.sendPasswordResetEmail(email);
          set({ isLoading: false });
          return result.success;
        } catch (error) {
          console.error('Password reset error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      verifyOTP: async (email: string, otp: string) => {
        set({ isLoading: true });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          set({ isLoading: false });
          return otp === '1234'; // Mock OTP verification
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      changePassword: async (token: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      convertGuestToUser: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const { user: currentUser } = get();
          
          // Create Firebase account with guest user stats
          const result = await firebaseAuthService.signUpWithEmailAndPassword(
            email, 
            password, 
            name
          );
          
          if (result.success && result.user) {
            // Preserve guest user stats
            const updatedUser: User = {
              ...result.user,
              gamesPlayed: currentUser?.gamesPlayed || 0,
              gamesWon: currentUser?.gamesWon || 0,
              totalPlayTime: currentUser?.totalPlayTime || 0,
              isGuest: false,
            };
            
            set({ 
              user: updatedUser, 
              isAuthenticated: true,
              isGuest: false,
              isLoading: false 
            });
            return true;
          } else {
            console.error('Convert guest failed:', result.error);
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Convert guest error:', error);
          set({ isLoading: false });
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
      
      initializeAuth: () => {
        // Set up Firebase auth state listener
        firebaseAuthService.onAuthStateChanged((user) => {
          if (user) {
            set({ 
              user, 
              isAuthenticated: true, 
              isGuest: false,
              isLoading: false 
            });
          } else {
            // Only clear state if not already a guest
            const { isGuest } = get();
            if (!isGuest) {
              set({ 
                user: null, 
                isAuthenticated: false, 
                isGuest: false,
                isLoading: false 
              });
            }
          }
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    }
  )
);