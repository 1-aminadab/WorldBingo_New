import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthState, User } from '../types';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  changePassword: (token: string, newPassword: string) => Promise<boolean>;
  convertGuestToUser: (email: string, password: string, name: string) => Promise<boolean>;
  updateUserStats: (gamesPlayed: number, gamesWon: number, playTime: number) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Mock successful login
          const user: User = {
            id: '1',
            email,
            name: email.split('@')[0],
            createdAt: new Date(),
          };
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const user: User = {
            id: Date.now().toString(),
            email,
            name,
            createdAt: new Date(),
          };
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error) {
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

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          isGuest: false,
          isLoading: false 
        });
      },

      forgotPassword: async (email: string) => {
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
          // Simulate API call to convert guest to real user
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { user: currentUser } = get();
          const newUser: User = {
            id: Date.now().toString(),
            email,
            name,
            gamesPlayed: currentUser?.gamesPlayed || 0,
            gamesWon: currentUser?.gamesWon || 0,
            totalPlayTime: currentUser?.totalPlayTime || 0,
            isGuest: false,
            createdAt: new Date(),
          };
          
          set({ 
            user: newUser, 
            isAuthenticated: true,
            isGuest: false,
            isLoading: false 
          });
          return true;
        } catch (error) {
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
    }),
    {
      name: 'auth-storage',
      // Temporarily disable persistence for debugging
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          console.log('Auth storage getItem:', name);
          return Promise.resolve(null);
        },
        setItem: (name: string, value: string) => {
          console.log('Auth storage setItem:', name, value);
          return Promise.resolve();
        },
        removeItem: (name: string) => {
          console.log('Auth storage removeItem:', name);
          return Promise.resolve();
        },
      })),
    }
  )
);