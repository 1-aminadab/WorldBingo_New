// Report Store - State management for comprehensive reporting
// Based on the web implementation's global variables and state management

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShopReport, ReportSummary, CompanyBalance } from '../services/reportService';

interface ReportState {
  // Current report data (similar to web global variables)
  shopReports: ShopReport[];
  reportSummary: ReportSummary | null;
  companyBalances: CompanyBalance | null;
  
  // Current filters and settings
  selectedDateRange: string;
  isLoading: boolean;
  lastUpdated: string | null;
  
  // Cached data for performance (similar to web caching)
  cachedReports: Record<string, {
    shops: ShopReport[];
    summary: ReportSummary;
    timestamp: number;
  }>;
  
  // Actions
  setShopReports: (reports: ShopReport[]) => void;
  setReportSummary: (summary: ReportSummary) => void;
  setCompanyBalances: (balances: CompanyBalance) => void;
  setSelectedDateRange: (range: string) => void;
  setLoading: (loading: boolean) => void;
  updateLastUpdated: () => void;
  
  // Cache management
  cacheReportData: (dateRange: string, shops: ShopReport[], summary: ReportSummary) => void;
  getCachedReport: (dateRange: string) => { shops: ShopReport[]; summary: ReportSummary } | null;
  clearCache: () => void;
  
  // Reset functions
  resetReportData: () => void;
  clearAll: () => void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      // Initial state
      shopReports: [],
      reportSummary: null,
      companyBalances: null,
      selectedDateRange: 'Last 7 Days',
      isLoading: false,
      lastUpdated: null,
      cachedReports: {},

      // Basic setters
      setShopReports: (reports) => 
        set({ shopReports: reports }),

      setReportSummary: (summary) => 
        set({ reportSummary: summary }),

      setCompanyBalances: (balances) => 
        set({ companyBalances: balances }),

      setSelectedDateRange: (range) => 
        set({ selectedDateRange: range }),

      setLoading: (loading) => 
        set({ isLoading: loading }),

      updateLastUpdated: () => 
        set({ lastUpdated: new Date().toISOString() }),

      // Cache management (similar to web implementation's caching strategy)
      cacheReportData: (dateRange, shops, summary) => {
        const { cachedReports } = get();
        const newCache = {
          ...cachedReports,
          [dateRange]: {
            shops,
            summary,
            timestamp: Date.now()
          }
        };
        
        // Clean old cache entries (keep only last 10)
        const cacheKeys = Object.keys(newCache);
        if (cacheKeys.length > 10) {
          const sortedKeys = cacheKeys.sort((a, b) => 
            newCache[b].timestamp - newCache[a].timestamp
          );
          const keysToKeep = sortedKeys.slice(0, 10);
          const cleanedCache: typeof newCache = {};
          keysToKeep.forEach(key => {
            cleanedCache[key] = newCache[key];
          });
          set({ cachedReports: cleanedCache });
        } else {
          set({ cachedReports: newCache });
        }
      },

      getCachedReport: (dateRange) => {
        const { cachedReports } = get();
        const cached = cachedReports[dateRange];
        
        if (!cached) return null;
        
        // Check if cache is still valid (24 hours)
        const isValid = (Date.now() - cached.timestamp) < (24 * 60 * 60 * 1000);
        
        if (!isValid) {
          // Remove expired cache
          const { [dateRange]: removed, ...remaining } = cachedReports;
          set({ cachedReports: remaining });
          return null;
        }
        
        return {
          shops: cached.shops,
          summary: cached.summary
        };
      },

      clearCache: () => 
        set({ cachedReports: {} }),

      // Reset functions
      resetReportData: () => 
        set({ 
          shopReports: [], 
          reportSummary: null,
          isLoading: false 
        }),

      clearAll: () => 
        set({ 
          shopReports: [],
          reportSummary: null,
          companyBalances: null,
          selectedDateRange: 'Last 7 Days',
          isLoading: false,
          lastUpdated: null,
          cachedReports: {}
        }),
    }),
    {
      name: 'report-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive data
      partialize: (state) => ({
        selectedDateRange: state.selectedDateRange,
        lastUpdated: state.lastUpdated,
        // Don't persist actual report data for security/freshness
      }),
    }
  )
);

// Utility functions (similar to web helper functions)
export const getReportStats = () => {
  const state = useReportStore.getState();
  if (!state.reportSummary || !state.shopReports.length) {
    return null;
  }

  return {
    totalShops: state.shopReports.length,
    averageShopProfit: state.shopReports.reduce((sum, shop) => sum + shop.shopProfit, 0) / state.shopReports.length,
    totalRevenue: state.reportSummary.totalPayin,
    profitMargin: (state.reportSummary.netProfit / state.reportSummary.totalPayin) * 100,
    rtpEfficiency: state.reportSummary.rtpMargin,
  };
};

// Format utilities (from web version)
export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Birr`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Date utilities (from web version)
export const getDateRangeText = (dateRange: string): string => {
  const today = new Date();
  
  switch (dateRange) {
    case 'Today':
      return today.toLocaleDateString();
    case 'Yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleDateString();
    case 'Last 7 Days':
      const week = new Date(today);
      week.setDate(week.getDate() - 6);
      return `${week.toLocaleDateString()} - ${today.toLocaleDateString()}`;
    case 'Last 30 Days':
      const month = new Date(today);
      month.setDate(month.getDate() - 29);
      return `${month.toLocaleDateString()} - ${today.toLocaleDateString()}`;
    default:
      return dateRange;
  }
};