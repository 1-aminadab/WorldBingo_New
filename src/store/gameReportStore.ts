import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple local game report interface
export interface LocalGameReport {
  id: string;
  numberOfGames: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
  createdAt: string;
  updatedAt: string;
}

// Storage key for local persistence
const LOCAL_REPORTS_KEY = 'local_game_reports';

export interface GameReportState {
  // Local reports (no backend sync)
  localReports: LocalGameReport[];
  
  // Loading states
  isLoading: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  loadLocalReports: () => Promise<void>;
  addLocalReport: (data: {
    numberOfCards: number;
    totalPayin: number;
    totalPayout: number;
  }) => Promise<void>;
  
  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useGameReportStore = create<GameReportState>()((set, get) => ({
  // Initial state
  localReports: [],
  isLoading: false,
  error: null,

  // Load local reports from storage
  loadLocalReports: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await AsyncStorage.getItem(LOCAL_REPORTS_KEY);
      const reports = data ? JSON.parse(data) : [];
      set({ localReports: reports, isLoading: false });
    } catch (error: any) {
      console.error('❌ Failed to load local reports:', error);
      set({ 
        error: error.message || 'Failed to load reports',
        isLoading: false 
      });
    }
  },

  // Add a new local report
  addLocalReport: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const newReport: LocalGameReport = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        numberOfGames: 1,
        numberOfCards: data.numberOfCards,
        totalPayin: data.totalPayin,
        totalPayout: data.totalPayout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const currentReports = get().localReports;
      const updatedReports = [...currentReports, newReport];
      
      await AsyncStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(updatedReports));
      set({ localReports: updatedReports, isLoading: false });
      
      console.log('✅ Local game report added successfully:', newReport);
    } catch (error: any) {
      console.error('❌ Failed to add local report:', error);
      set({ 
        error: error.message || 'Failed to add report',
        isLoading: false 
      });
    }
  },

  // Utility actions
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  reset: () => set({ 
    localReports: [],
    isLoading: false,
    error: null
  }),
}));

// Utility functions for working with reports
export const getReportSummary = (reports: LocalGameReport[]) => {
  if (!reports.length) return null;
  
  const totalGames = reports.reduce((sum, r) => sum + r.numberOfGames, 0);
  const totalCards = reports.reduce((sum, r) => sum + r.numberOfCards, 0);
  const totalPayin = reports.reduce((sum, r) => sum + r.totalPayin, 0);
  const totalPayout = reports.reduce((sum, r) => sum + r.totalPayout, 0);
  const profit = totalPayout - totalPayin;
  const profitMargin = totalPayin > 0 ? (profit / totalPayin) * 100 : 0;
  const averagePayinPerGame = totalGames > 0 ? totalPayin / totalGames : 0;
  const averagePayoutPerGame = totalGames > 0 ? totalPayout / totalGames : 0;
  const averageCardsPerGame = totalGames > 0 ? totalCards / totalGames : 0;
  
  return {
    totalGames,
    totalCards,
    totalPayin,
    totalPayout,
    profit,
    profitMargin,
    averagePayinPerGame,
    averagePayoutPerGame,
    averageCardsPerGame,
    winRate: totalGames > 0 ? (profit > 0 ? 1 : 0) : 0,
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