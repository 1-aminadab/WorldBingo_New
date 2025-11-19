import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Report interface as specified
export interface Report {
  id: string;
  numberOfGames: number;
  numberOfCards: number;
  totalPayin: number;
  totalPayout: number;
  balance: number;
  date: Date;
}

// Store state interface
interface ReportSyncState {
  reports: Report[];
  addReport: (report: Report) => void;
  removeReport: (index: number) => void;
  clearReports: () => void;
  getReportsCount: () => number;
  logCurrentState: () => void;
}

// Zustand store with persistence
export const useReportSyncStore = create<ReportSyncState>()(
  persist(
    (set, get) => ({
      // Initial state
      reports: [],

      // Add a new report to the queue (always append, never overwrite)
      addReport: (report: Report) => {
        console.log('='.repeat(80));
        console.log('🚨🚨🚨 REPORT CREATED 🚨🚨🚨');
        console.log(`🆔 REPORT ID: ${report.id}`);
        console.log(`📊 GAME REPORT: ${report.numberOfCards} cards | ${report.totalPayin} Birr payin | ${report.totalPayout} Birr payout`);
        console.log(`💰 BALANCE: ${report.balance} Birr | RTP: ${report.totalPayin > 0 ? ((report.totalPayout / report.totalPayin) * 100).toFixed(1) : 0}%`);
        console.log('🔄 ADDED TO SYNC QUEUE');
        console.log('='.repeat(80));
        
        set((state) => {
          const newReports = [...state.reports, report];
          console.log(`📈 QUEUE SIZE: ${newReports.length} reports pending sync`);
          return { reports: newReports };
        });
      },

      // Remove report by index (used after successful sync)
      removeReport: (index: number) => {
        const currentState = get();
        const reportToRemove = currentState.reports[index];
        console.log(`🔥 [ReportSyncStore] Removing report at index ${index}, ID: ${reportToRemove?.id || 'unknown'}`);
        
        set((state) => {
          if (index < 0 || index >= state.reports.length) {
            console.error(`🔥 [ReportSyncStore] Invalid index ${index}, queue has ${state.reports.length} reports`);
            return state;
          }

          const removedReport = state.reports[index];
          const newReports = state.reports.filter((_, i) => i !== index);
          
          console.log(`🔥 [ReportSyncStore] Removed report ID: ${removedReport.id}`);
          console.log(`🔥 [ReportSyncStore] Queue now has ${newReports.length} reports`);
          
          return { reports: newReports };
        });
      },

      // Clear all reports (emergency use only)
      clearReports: () => {
        console.log('🔥 [ReportSyncStore] Clearing all reports from queue');
        set({ reports: [] });
      },

      // Get current number of reports
      getReportsCount: () => {
        return get().reports.length;
      },

      // Debug helper to log current sync store state
      logCurrentState: () => {
        const state = get();
        console.log(`🔥 [ReportSyncStore] Current state: ${state.reports.length} reports`);
        
        if (state.reports.length > 0) {
          console.log('🔥 [ReportSyncStore] Current reports:', state.reports);
          
          // Log detailed breakdown of each report
          state.reports.forEach((report, index) => {
            console.log(`🔥 [ReportSyncStore] Report ${index + 1} (ID: ${report.id}):`, {
              games: report.numberOfGames,
              cards: report.numberOfCards,
              payin: `${report.totalPayin} Birr`,
              payout: `${report.totalPayout} Birr`,
              profit: `${report.balance} Birr`,
              rtpPercentage: report.totalPayin > 0 ? `${((report.totalPayout / report.totalPayin) * 100).toFixed(1)}%` : '0%'
            });
          });
          
          // Log aggregate totals
          const totalGames = state.reports.reduce((sum, r) => sum + r.numberOfGames, 0);
          const totalCards = state.reports.reduce((sum, r) => sum + r.numberOfCards, 0);
          const totalPayin = state.reports.reduce((sum, r) => sum + r.totalPayin, 0);
          const totalPayout = state.reports.reduce((sum, r) => sum + r.totalPayout, 0);
          const totalProfit = state.reports.reduce((sum, r) => sum + r.balance, 0);
          
          console.log('🔥 [ReportSyncStore] Current totals:', {
            totalGames,
            totalCards,
            totalPayin: `${totalPayin} Birr`,
            totalPayout: `${totalPayout} Birr`,
            totalProfit: `${totalProfit} Birr`,
            avgRTP: totalPayin > 0 ? `${((totalPayout / totalPayin) * 100).toFixed(1)}%` : '0%'
          });
        } else {
          console.log('🔥 [ReportSyncStore] No reports in sync queue');
        }
      }
    }),
    {
      name: '@syncReports', // Storage key as specified
      storage: createJSONStorage(() => AsyncStorage),
      
      // Only persist the reports array
      partialize: (state) => ({
        reports: state.reports
      }),
      
      // Debug persistence
      onRehydrateStorage: () => (state) => {
        if (state && state.reports.length > 0) {
          console.log(`📱 App loaded with ${state.reports.length} pending game reports`);
        }
      },
    }
  )
);