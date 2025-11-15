import { create } from 'zustand';

interface CoinSyncState {
  isLoading: boolean;
  message: string;
  syncStatus: 'idle' | 'success' | 'error' | null;
  setLoading: (loading: boolean, message?: string) => void;
  setSyncStatus: (status: 'success' | 'error', message: string) => void;
  clearStatus: () => void;
}

export const useCoinSyncStore = create<CoinSyncState>((set) => ({
  isLoading: false,
  message: '',
  syncStatus: null,
  
  setLoading: (loading: boolean, message: string = '') =>
    set({ isLoading: loading, message, syncStatus: null }),
  
  setSyncStatus: (status: 'success' | 'error', message: string) =>
    set({ isLoading: false, syncStatus: status, message }),
  
  clearStatus: () =>
    set({ isLoading: false, message: '', syncStatus: null }),
}));