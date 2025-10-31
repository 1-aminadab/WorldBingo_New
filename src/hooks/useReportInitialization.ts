import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGameReportStore } from '../store/gameReportStore';

/**
 * Hook to ensure report data is properly initialized when the app starts
 * This prevents data loss on app refresh by proactively loading persisted data
 */
export const useReportInitialization = () => {
  const { user, isAuthenticated, isGuest } = useAuthStore();
  const { fetchCurrentUserReport } = useGameReportStore();

  useEffect(() => {
    // Only initialize if we have a user (authenticated or guest)
    if ((isAuthenticated || isGuest) && user) {
      console.log('📊 Initializing reports for user:', user.userId || user.id);
      
      // Load game reports immediately
      fetchCurrentUserReport().catch((error) => {
        console.error('❌ Failed to initialize game reports:', error);
      });
      
      // Note: Transaction reports are loaded on-demand when the screen is accessed
      // via loadReports() in TransactionReport.tsx useEffect
    }
  }, [user, isAuthenticated, isGuest, fetchCurrentUserReport]);
};