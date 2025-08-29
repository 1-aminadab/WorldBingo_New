import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuthState = () => {
  const { isAuthenticated, isGuest, user } = useAuthStore();

  useEffect(() => {
    console.log('Auth State Changed:', {
      isAuthenticated,
      isGuest,
      user: user ? { name: user.name, isGuest: user.isGuest } : null,
    });
  }, [isAuthenticated, isGuest, user]);

  return {
    isAuthenticated,
    isGuest,
    user,
    canAccessMainApp: isAuthenticated || isGuest,
  };
};