import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useFirebaseAuth = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Initialize Firebase auth state listener when hook is first used
    const initAuth = async () => {
      await initializeAuth();
    };
    initAuth();
  }, [initializeAuth]);
};