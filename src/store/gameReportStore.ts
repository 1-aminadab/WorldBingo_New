import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportApiService, GameReport } from '../api/services/report';
import { useAuthStore } from './authStore';

// Storage keys for local persistence
const CURRENT_REPORT_KEY = 'backend_game_report_current';

export interface GameReportState {
  // Current user's report data (stored locally)
  currentReport: GameReport | null;
  allReports: GameReport[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  
  // Error handling
  error: string | null;
  
  // Last update timestamp
  lastUpdated: string | null;
  
  // Actions
  fetchCurrentUserReport: () => Promise<void>;
  fetchAllReports: () => Promise<void>;
  createReport: (data: {
    numberOfGames: number;
    numberOfCards: number;
    totalPayin: number;
    totalPayout: number;
  }) => Promise<void>;
  updateReport: (data: {
    numberOfGames: number;
    numberOfCards: number;
    totalPayin: number;
    totalPayout: number;
  }) => Promise<void>;
  incrementReport: (data: {
    numberOfGames: number;
    numberOfCards: number;
    totalPayin: number;
    totalPayout: number;
  }) => Promise<void>;
  addGameResult: (gameResult: {
    numberOfCards: number;
    totalPayin: number;
    totalPayout: number;
  }) => Promise<void>;
  
  // New functions for game start/end flow
  createInitialGameReport: (data: {
    numberOfCards: number;
    totalPayin: number;
  }) => Promise<void>;
  updateGameReportOnEnd: (data: {
    totalPayout: number;
  }) => Promise<void>;
  
  // Local storage helpers
  loadFromLocalStorage: () => Promise<void>;
  saveToLocalStorage: (report: GameReport | null) => Promise<void>;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useGameReportStore = create<GameReportState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentReport: null,
      allReports: [],
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      error: null,
      lastUpdated: null,

      // Load from local storage
      loadFromLocalStorage: async () => {
        try {
          const reportData = await AsyncStorage.getItem(CURRENT_REPORT_KEY);
          if (reportData) {
            const report = JSON.parse(reportData);
            set({ currentReport: report });
            console.log('📱 Loaded report from local storage:', report);
          }
        } catch (error) {
          console.error('❌ Failed to load from local storage:', error);
        }
      },

      // Save to local storage
      saveToLocalStorage: async (report) => {
        try {
          if (report) {
            await AsyncStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(report));
            console.log('💾 Saved report to local storage:', report);
          } else {
            await AsyncStorage.removeItem(CURRENT_REPORT_KEY);
            console.log('💾 Removed report from local storage');
          }
        } catch (error) {
          console.error('❌ Failed to save to local storage:', error);
        }
      },

      // Fetch current user's report (loads from local storage, optionally syncs with backend)
      fetchCurrentUserReport: async () => {
        const { user } = useAuthStore.getState();
        if (!user?.id) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          console.log('📱 Loading current user report from local storage...');
          
          // First, load from local storage for immediate display
          await get().loadFromLocalStorage();
          
          // Then, optionally fetch from backend in the background to sync
          console.log('🔄 Syncing with backend in background...');
          const numericUserId = useAuthStore.getState().getNumericUserId();
          if (numericUserId) {
            const userId = parseInt(numericUserId, 10);
            const report = await reportApiService.getCurrentUserReport(userId);
            
            if (report) {
              // Update local storage with backend data
              await get().saveToLocalStorage(report);
              set({ 
                currentReport: report,
                lastUpdated: new Date().toISOString()
              });
              console.log('✅ Synced report from backend:', report);
            }
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          console.error('❌ Failed to sync with backend (using local data):', error);
          // Don't show error if we have local data
          const { currentReport } = get();
          if (!currentReport) {
            set({ error: error.message || 'Failed to fetch report' });
          }
          set({ isLoading: false });
        }
      },

      // Fetch all reports
      fetchAllReports: async () => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('📊 Fetching all reports...');
          
          const response = await reportApiService.getReports();
          
          set({ 
            allReports: response.data || [],
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
          
          console.log('✅ All reports fetched:', response.data?.length || 0);
        } catch (error: any) {
          console.error('❌ Failed to fetch all reports:', error);
          set({ 
            error: error.message || 'Failed to fetch reports',
            isLoading: false 
          });
        }
      },

      // Create new report (saves to local storage AND sends to backend)
      createReport: async (data) => {
        const { user } = useAuthStore.getState();
        if (!user?.id) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isCreating: true, error: null });
        
        try {
          console.log('📊 Creating new report:', data);
          
          const numericUserId = useAuthStore.getState().getNumericUserId();
          if (!numericUserId) {
            throw new Error('No numeric user ID available');
          }
          const userId = parseInt(numericUserId, 10);
          
          // Create report object for local storage
          const newReport: GameReport = {
            id: userId,
            ...data
          };
          
          // Save to local storage immediately
          await get().saveToLocalStorage(newReport);
          set({ 
            currentReport: newReport,
            isCreating: false,
            lastUpdated: new Date().toISOString()
          });
          
          // Send to backend in background (fire and forget)
          reportApiService.createReport(newReport)
            .then((response) => {
              console.log('✅ Report created on backend:', response.data);
              // Update local storage with backend response if different
              if (response.data) {
                get().saveToLocalStorage(response.data);
                set({ currentReport: response.data });
              }
            })
            .catch((error) => {
              console.error('❌ Failed to create report on backend (local saved):', error);
              // Don't show error to user since local save succeeded
            });
            
          console.log('✅ Report saved locally:', newReport);
        } catch (error: any) {
          console.error('❌ Failed to create report:', error);
          set({ 
            error: error.message || 'Failed to create report',
            isCreating: false 
          });
        }
      },

      // Update existing report (saves to local storage AND sends to backend)
      updateReport: async (data) => {
        const { user } = useAuthStore.getState();
        if (!user?.id) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isUpdating: true, error: null });
        
        try {
          console.log('📊 Updating report:', data);
          
          const numericUserId = useAuthStore.getState().getNumericUserId();
          if (!numericUserId) {
            throw new Error('No numeric user ID available');
          }
          const userId = parseInt(numericUserId, 10);
          
          // Update report object for local storage
          const updatedReport: GameReport = {
            id: userId,
            ...data
          };
          
          // Save to local storage immediately
          await get().saveToLocalStorage(updatedReport);
          set({ 
            currentReport: updatedReport,
            isUpdating: false,
            lastUpdated: new Date().toISOString()
          });
          
          // Send to backend in background
          reportApiService.updateReport(updatedReport)
            .then((response) => {
              console.log('✅ Report updated on backend:', response.data);
              if (response.data) {
                get().saveToLocalStorage(response.data);
                set({ currentReport: response.data });
              }
            })
            .catch((error) => {
              console.error('❌ Failed to update report on backend (local saved):', error);
            });
            
          console.log('✅ Report updated locally:', updatedReport);
        } catch (error: any) {
          console.error('❌ Failed to update report:', error);
          set({ 
            error: error.message || 'Failed to update report',
            isUpdating: false 
          });
        }
      },

      // Increment report values (saves to local storage AND sends to backend)
      incrementReport: async (data) => {
        const { user } = useAuthStore.getState();
        if (!user?.id) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isUpdating: true, error: null });
        
        try {
          console.log('📊 Incrementing report:', data);
          
          const numericUserId = useAuthStore.getState().getNumericUserId();
          if (!numericUserId) {
            throw new Error('No numeric user ID available');
          }
          const userId = parseInt(numericUserId, 10);
          
          // Get current report and increment values
          const currentReport = get().currentReport;
          const incrementedReport: GameReport = {
            id: userId,
            numberOfGames: (currentReport?.numberOfGames || 0) + data.numberOfGames,
            numberOfCards: (currentReport?.numberOfCards || 0) + data.numberOfCards,
            totalPayin: (currentReport?.totalPayin || 0) + data.totalPayin,
            totalPayout: (currentReport?.totalPayout || 0) + data.totalPayout,
          };
          
          // Save to local storage immediately
          await get().saveToLocalStorage(incrementedReport);
          set({ 
            currentReport: incrementedReport,
            isUpdating: false,
            lastUpdated: new Date().toISOString()
          });
          
          // Send to backend in background
          reportApiService.incrementReport({
            id: userId,
            ...data
          })
            .then((response) => {
              console.log('✅ Report incremented on backend:', response.data);
              if (response.data) {
                get().saveToLocalStorage(response.data);
                set({ currentReport: response.data });
              }
            })
            .catch((error) => {
              console.error('❌ Failed to increment report on backend (local saved):', error);
            });
            
          console.log('✅ Report incremented locally:', incrementedReport);
        } catch (error: any) {
          console.error('❌ Failed to increment report:', error);
          set({ 
            error: error.message || 'Failed to increment report',
            isUpdating: false 
          });
        }
      },

      // Add a single game result (convenience method, saves locally and syncs to backend)
      addGameResult: async (gameResult) => {
        const { user } = useAuthStore.getState();
        if (!user?.id) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isUpdating: true, error: null });
        
        try {
          console.log('🎮 Adding game result:', gameResult);
          
          // Use incrementReport to add the game result locally
          await get().incrementReport({
            numberOfGames: 1,
            numberOfCards: gameResult.numberOfCards,
            totalPayin: gameResult.totalPayin,
            totalPayout: gameResult.totalPayout,
          });
          
          console.log('✅ Game result added successfully');
        } catch (error: any) {
          console.error('❌ Failed to add game result:', error);
          set({ 
            error: error.message || 'Failed to add game result',
            isUpdating: false 
          });
        }
      },

      // Create initial game report when game starts (with numberOfGames = 1, totalPayout = 0)
      createInitialGameReport: async (data) => {
        const { user } = useAuthStore.getState();
        if (!user) {
          console.log('❌ No user found for game report creation');
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isCreating: true, error: null });
        
        try {
          console.log('🎮 Creating initial game report on game start:', data);
          console.log('🎮 Current user:', { id: user.id, userId: user.userId, isGuest: user.isGuest });
          console.log('🎮 Current report before creation:', get().currentReport);
          
          const numericUserId = useAuthStore.getState().getNumericUserId();
          console.log('🎮 Numeric user ID from auth store:', numericUserId);
          
          // For guest users, use their ID directly. For authenticated users, use numeric userId
          const userIdToUse = user.isGuest ? user.id : numericUserId;
          if (!userIdToUse) {
            throw new Error('No user ID available for report creation');
          }
          const userId = user.isGuest ? userIdToUse : parseInt(numericUserId!, 10);
          
          // Get current report to determine if we're creating new or incrementing
          const currentReport = get().currentReport;
          
          if (currentReport) {
            // Increment existing report
            const incrementedReport: GameReport = {
              id: userId,
              numberOfGames: currentReport.numberOfGames + 1,
              numberOfCards: currentReport.numberOfCards + data.numberOfCards,
              totalPayin: currentReport.totalPayin + data.totalPayin,
              totalPayout: currentReport.totalPayout // No payout yet, game just started
            };
            
            // Save to local storage immediately
            await get().saveToLocalStorage(incrementedReport);
            set({ 
              currentReport: incrementedReport,
              isCreating: false,
              lastUpdated: new Date().toISOString()
            });
            
            // Send to backend in background
            reportApiService.updateReport(incrementedReport)
              .then((response) => {
                console.log('✅ Game report incremented on backend:', response.data);
                if (response.data) {
                  get().saveToLocalStorage(response.data);
                  set({ currentReport: response.data });
                }
              })
              .catch((error) => {
                console.error('❌ Failed to increment report on backend (local saved):', error);
              });
              
            console.log('✅ Game report incremented locally on game start:', incrementedReport);
          } else {
            // Create new report
            const newReport: GameReport = {
              id: userId,
              numberOfGames: 1,
              numberOfCards: data.numberOfCards,
              totalPayin: data.totalPayin,
              totalPayout: 0 // No payout yet, game just started
            };
            
            // Save to local storage immediately
            await get().saveToLocalStorage(newReport);
            set({ 
              currentReport: newReport,
              isCreating: false,
              lastUpdated: new Date().toISOString()
            });
            
            // Send to backend in background
            reportApiService.createReport(newReport)
              .then((response) => {
                console.log('✅ Initial game report created on backend:', response.data);
                if (response.data) {
                  get().saveToLocalStorage(response.data);
                  set({ currentReport: response.data });
                }
              })
              .catch((error) => {
                console.error('❌ Failed to create initial report on backend (local saved):', error);
              });
              
            console.log('✅ Initial game report created locally on game start:', newReport);
          }
        } catch (error: any) {
          console.error('❌ Failed to create initial game report:', error);
          set({ 
            error: error.message || 'Failed to create initial game report',
            isCreating: false 
          });
        }
      },

      // Update game report when game ends (add totalPayout)
      updateGameReportOnEnd: async (data) => {
        const { user } = useAuthStore.getState();
        if (!user) {
          console.log('❌ No user found for game report update');
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isUpdating: true, error: null });
        
        try {
          console.log('🎮 Updating game report on game end:', data);
          console.log('🎮 Current user:', { id: user.id, userId: user.userId, isGuest: user.isGuest });
          
          const numericUserId = useAuthStore.getState().getNumericUserId();
          
          // Use same logic as createInitialGameReport for consistency
          const userIdToUse = user.isGuest ? user.id : numericUserId;
          if (!userIdToUse) {
            throw new Error('No user ID available for report update');
          }
          const userId = user.isGuest ? userIdToUse : parseInt(numericUserId!, 10);
          
          // Get current report and add payout
          const currentReport = get().currentReport;
          if (!currentReport) {
            throw new Error('No current game report found to update');
          }
          
          const updatedReport: GameReport = {
            id: userId,
            numberOfGames: currentReport.numberOfGames,
            numberOfCards: currentReport.numberOfCards,
            totalPayin: currentReport.totalPayin,
            totalPayout: currentReport.totalPayout + data.totalPayout
          };
          
          // Save to local storage immediately
          await get().saveToLocalStorage(updatedReport);
          set({ 
            currentReport: updatedReport,
            isUpdating: false,
            lastUpdated: new Date().toISOString()
          });
          
          // Send to backend in background
          reportApiService.updateReport(updatedReport)
            .then((response) => {
              console.log('✅ Game report updated on backend with payout:', response.data);
              if (response.data) {
                get().saveToLocalStorage(response.data);
                set({ currentReport: response.data });
              }
            })
            .catch((error) => {
              console.error('❌ Failed to update report on backend (local saved):', error);
            });
            
          console.log('✅ Game report updated locally with payout:', updatedReport);
        } catch (error: any) {
          console.error('❌ Failed to update game report on end:', error);
          set({ 
            error: error.message || 'Failed to update game report',
            isUpdating: false 
          });
        }
      },

      // Utility actions
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      reset: () => set({ 
        currentReport: null,
        allReports: [],
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        error: null,
        lastUpdated: null
      }),
    }),
    {
      name: 'game-report-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist report data locally for offline access
      partialize: (state) => ({
        currentReport: state.currentReport,
        allReports: state.allReports,
        lastUpdated: state.lastUpdated,
      }),
      // Ensure data is loaded after hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('📊 Game report store rehydrated with data:', {
            hasCurrentReport: !!state.currentReport,
            allReportsCount: state.allReports?.length || 0,
            lastUpdated: state.lastUpdated
          });
        }
      },
    }
  )
);

// Utility functions for working with reports
export const getReportSummary = (report: GameReport | null) => {
  if (!report) return null;
  
  const profit = report.totalPayout - report.totalPayin;
  const profitMargin = report.totalPayin > 0 ? (profit / report.totalPayin) * 100 : 0;
  const averagePayinPerGame = report.numberOfGames > 0 ? report.totalPayin / report.numberOfGames : 0;
  const averagePayoutPerGame = report.numberOfGames > 0 ? report.totalPayout / report.numberOfGames : 0;
  const averageCardsPerGame = report.numberOfGames > 0 ? report.numberOfCards / report.numberOfGames : 0;
  
  return {
    profit,
    profitMargin,
    averagePayinPerGame,
    averagePayoutPerGame,
    averageCardsPerGame,
    winRate: report.numberOfGames > 0 ? (profit > 0 ? 1 : 0) : 0,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB', // Ethiopian Birr
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};