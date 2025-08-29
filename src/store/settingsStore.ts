import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSettings, BingoPattern, PatternCategory, VoiceGender, VoiceLanguage, AppLanguage, Theme, ClassicLineType, CustomCardType, CardTheme } from '../types';

interface SettingsStore extends GameSettings {
  // Host Settings
  rewardAmount: number;
  playerBinding: string;
  // Game stake amounts entered before each game
  derashAmount?: number; // total pot entered by host for display (RTP applied when shown)
  medebAmount?: number;  // fee amount

  // Classic configuration
  setClassicLinesTarget: (count: number) => void;
  incrementClassicLinesTarget: () => void;
  decrementClassicLinesTarget: () => void;
  toggleClassicLineType: (line: ClassicLineType) => void;
  clearClassicLineTypes: () => void;
  
  // Voice Selection
  selectedVoiceName: string;
  maleVoiceNames: string[];
  femaleVoiceNames: string[];

  // Card theme
  setCardTheme: (theme: CardTheme) => void;
  
  // Pattern Selection
  setPattern: (pattern: BingoPattern) => void;
  setPatternCategory: (category: PatternCategory) => void;
  clearPattern: () => void;
  
  // Voice Settings
  setVoiceGender: (gender: VoiceGender) => void;
  setVoiceLanguage: (language: VoiceLanguage) => void;
  setSelectedVoiceName: (name: string) => void;
  
  // App Settings
  setAppLanguage: (language: AppLanguage) => void;
  setTheme: (theme: Theme) => void;
  
  // RTP Settings
  setRtpPercentage: (percentage: number) => void;
  increaseRtp: () => void;
  decreaseRtp: () => void;
  
  // Host Settings
  setRewardAmount: (amount: number) => void;
  setPlayerBinding: (binding: string) => void;
  setDerashAmount: (amount: number) => void;
  setMedebAmount: (amount: number) => void;

  // Custom card types (cartelas)
  customCardTypes: CustomCardType[];
  addCustomCardType: (cartela: CustomCardType) => void;
  updateCustomCardType: (cartela: CustomCardType) => void;
  removeCustomCardType: (name: string) => void;
  selectCardTypeByName: (name: string) => void;
  
  // Validation
  isGameReadyToStart: () => boolean;
  
  // Reset
  resetSettings: () => void;
}

// Helper function to generate random unique numbers from 1-75
const generateRandomCard = (): number[] => {
  const numbers: number[] = [];
  const used = new Set<number>();
  
  while (numbers.length < 25) {
    const num = Math.floor(Math.random() * 75) + 1;
    if (!used.has(num)) {
      used.add(num);
      numbers.push(num);
    }
  }
  
  return numbers.sort((a, b) => a - b);
};

// Generate 5 default cards
const generateDefaultCards = (): number[][] => {
  return Array.from({ length: 5 }, () => generateRandomCard());
};

const defaultSettings: GameSettings = {
  selectedPattern: null,
  patternCategory: 'classic',
  voiceGender: 'female',
  voiceLanguage: 'english',
  appLanguage: 'en',
  rtpPercentage: 60,
  theme: 'light',
  classicLinesTarget: 1,
  classicSelectedLineTypes: ['horizontal', 'vertical', 'diagonal'],
  cardTheme: 'default',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      rewardAmount: 100,
      playerBinding: '',
      derashAmount: 100,
      medebAmount: 20,
      selectedCardTypeName: 'default',
      customCardTypes: [
        {
          name: 'default',
          cards: generateDefaultCards()
        }
      ],
      // Classic configuration controls
      setClassicLinesTarget: (count: number) => {
        const lines = Math.max(1, Math.floor(count));
        set({ classicLinesTarget: lines });
      },
      incrementClassicLinesTarget: () => {
        const { classicLinesTarget = 1 } = get();
        set({ classicLinesTarget: (classicLinesTarget || 1) + 1 });
      },
      decrementClassicLinesTarget: () => {
        const { classicLinesTarget = 1 } = get();
        set({ classicLinesTarget: Math.max(1, (classicLinesTarget || 1) - 1) });
      },
      toggleClassicLineType: (line: ClassicLineType) => {
        const current = get().classicSelectedLineTypes || [];
        const exists = current.includes(line);
        const next = exists ? current.filter(l => l !== line) : [...current, line];
        set({ classicSelectedLineTypes: next });
      },
      clearClassicLineTypes: () => set({ classicSelectedLineTypes: [] }),
      
      // Voice Selection
      selectedVoiceName: 'Sarah',
      maleVoiceNames: ['John', 'Michael', 'David', 'Robert', 'James', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher'],
      femaleVoiceNames: ['Sarah', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper'],

      setPattern: (pattern: BingoPattern) => {
        set({ selectedPattern: pattern });
      },

      setPatternCategory: (category: PatternCategory) => {
        set({ 
          patternCategory: category,
          selectedPattern: null // Clear pattern when switching categories
        });
      },

      clearPattern: () => {
        set({ selectedPattern: null });
      },

      setVoiceGender: (gender: VoiceGender) => {
        set({ voiceGender: gender });
      },

      setVoiceLanguage: (language: VoiceLanguage) => {
        set({ voiceLanguage: language });
      },

      setSelectedVoiceName: (name: string) => {
        set({ selectedVoiceName: name });
      },

      setAppLanguage: (language: AppLanguage) => {
        set({ appLanguage: language });
      },

      setTheme: (theme: Theme) => {
        set({ theme });
      },

      setCardTheme: (cardTheme: CardTheme) => {
        set({ cardTheme });
      },

      setRtpPercentage: (percentage: number) => {
        const clampedPercentage = Math.min(85, Math.max(35, percentage));
        set({ rtpPercentage: clampedPercentage });
      },

      increaseRtp: () => {
        const { rtpPercentage } = get();
        const newPercentage = Math.min(85, rtpPercentage + 1);
        set({ rtpPercentage: newPercentage });
      },

      decreaseRtp: () => {
        const { rtpPercentage } = get();
        const newPercentage = Math.max(35, rtpPercentage - 1);
        set({ rtpPercentage: newPercentage });
      },

      setRewardAmount: (amount: number) => {
        set({ rewardAmount: Math.max(0, amount) });
      },

      setPlayerBinding: (binding: string) => {
        set({ playerBinding: binding });
      },

      setDerashAmount: (amount: number) => {
        set({ derashAmount: Math.max(0, Math.floor(amount)) });
      },

      setMedebAmount: (amount: number) => {
        set({ medebAmount: Math.max(0, Math.floor(amount)) });
      },

      // Custom card type management
      addCustomCardType: (cartela: CustomCardType) => {
        set((state) => {
          const exists = state.customCardTypes.some(c => c.name.trim().toLowerCase() === cartela.name.trim().toLowerCase());
          if (exists) return state; // ignore duplicates by name
          return { customCardTypes: [...state.customCardTypes, cartela] } as any;
        });
      },
      updateCustomCardType: (cartela: CustomCardType) => {
        set((state) => {
          const index = state.customCardTypes.findIndex(c => c.name.trim().toLowerCase() === cartela.name.trim().toLowerCase());
          if (index === -1) {
            return { customCardTypes: [...state.customCardTypes, cartela] } as any;
          }
          const next = [...state.customCardTypes];
          next[index] = cartela;
          return { customCardTypes: next } as any;
        });
      },
      removeCustomCardType: (name: string) => {
        set((state) => ({ customCardTypes: state.customCardTypes.filter(c => c.name !== name) }) as any);
      },
      selectCardTypeByName: (name: string) => {
        set({ selectedCardTypeName: name });
      },

      isGameReadyToStart: () => {
        const { selectedPattern, patternCategory, classicLinesTarget, classicSelectedLineTypes } = get();
        if (patternCategory === 'classic') {
          // In the new classic mode, we require at least 1 allowed line type and a target number.
          return Boolean(classicLinesTarget && (classicSelectedLineTypes && classicSelectedLineTypes.length > 0));
        }
        return selectedPattern !== null; // modern requires selecting a preset
      },

      resetSettings: () => {
        set({ 
          ...defaultSettings, 
          rewardAmount: 100, 
          playerBinding: '',
          selectedCardTypeName: 'default',
          customCardTypes: [
            {
              name: 'default',
              cards: generateDefaultCards()
            }
          ]
        });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist only settings and user-created data
        selectedPattern: state.selectedPattern,
        patternCategory: state.patternCategory,
        voiceGender: state.voiceGender,
        voiceLanguage: state.voiceLanguage,
        appLanguage: state.appLanguage,
        rtpPercentage: state.rtpPercentage,
        theme: state.theme,
        classicLinesTarget: state.classicLinesTarget,
        classicSelectedLineTypes: state.classicSelectedLineTypes,
        cardTheme: state.cardTheme,
        selectedCardTypeName: state.selectedCardTypeName,
        customCardTypes: state.customCardTypes,
        rewardAmount: state.rewardAmount,
        playerBinding: state.playerBinding,
        selectedVoiceName: state.selectedVoiceName,
        derashAmount: state.derashAmount,
        medebAmount: state.medebAmount,
      }),
    }
  )
);

// Pattern definitions for UI display
export const CLASSIC_PATTERNS: Array<{key: BingoPattern, name: string, description: string}> = [
  {
    key: 'one_line',
    name: '1 Line',
    description: 'Complete any horizontal, vertical, or diagonal line'
  },
  {
    key: 'two_lines',
    name: '2 Lines',
    description: 'Complete any two horizontal lines'
  },
  {
    key: 'three_lines',
    name: '3 Lines',
    description: 'Complete any three horizontal lines'
  },
  {
    key: 'full_house',
    name: 'Full House',
    description: 'Fill the entire bingo card'
  },
];

export const MODERN_PATTERNS: Array<{key: BingoPattern, name: string, description: string}> = [
  {
    key: 't_shape',
    name: 'T Shape',
    description: 'Complete the top row and middle column'
  },
  {
    key: 'u_shape',
    name: 'U Shape',
    description: 'Complete left column, right column, and bottom row'
  },
  {
    key: 'x_shape',
    name: 'X Shape',
    description: 'Complete both diagonal lines'
  },
  {
    key: 'plus_sign',
    name: 'Plus Sign',
    description: 'Complete middle row and middle column'
  },
  {
    key: 'diamond',
    name: 'Diamond',
    description: 'Complete diamond pattern in the center'
  },
];
