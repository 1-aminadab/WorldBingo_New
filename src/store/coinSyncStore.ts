import { create } from 'zustand';

interface CoinSyncState {
  isLoading: boolean;
  message: string;
  setLoading: (loading: boolean, message?: string) => void;
  clearStatus: () => void;
}

export const useCoinSyncStore = create<CoinSyncState>((set) => ({
  isLoading: false,
  message: '',
  
  setLoading: (loading: boolean, message: string = '') =>
    set({ isLoading: loading, message }),
  
  clearStatus: () =>
    set({ isLoading: false, message: '' }),
}));