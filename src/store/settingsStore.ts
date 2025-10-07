import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSettings, BingoPattern, PatternCategory, VoiceLanguage, AppLanguage, Theme, ClassicLineType, CustomCardType, CardTheme, NumberCallingMode, VoiceOption, VoiceGender } from '../types';
import { WORLD_BINGO_CARDS } from '../data/worldbingodata';
import { AVAILABLE_VOICES, getDefaultVoiceForLanguage, getVoiceById } from '../utils/voiceConfig';

interface SettingsStore extends GameSettings {
  // Host Settings
  rewardAmount: number;
  playerBinding: string;
  // Game stake amounts entered before each game
  derashAmount?: number; // total pot entered by host for display (RTP applied when shown)
  medebAmount?: number;  // fee amount
  lastEnteredAmount?: number; // last amount entered by user
  
  // World Bingo Cards Limit
  worldBingoCardsLimit: number;
  setWorldBingoCardsLimit: (limit: number) => void;
  getMaxCardsForSelectedType: () => number;
  resetLimitToMax: () => void;
  forceRefreshWorldBingoCards: () => void;
  
  // Audio Settings
  isMusicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;

  // Classic configuration
  setClassicLinesTarget: (count: number) => void;
  incrementClassicLinesTarget: () => void;
  decrementClassicLinesTarget: () => void;
  toggleClassicLineType: (line: ClassicLineType) => void;
  clearClassicLineTypes: () => void;
  
  // Voice Selection
  selectedVoiceId: string;
  selectedVoice: VoiceOption;

  // Card theme
  setCardTheme: (theme: CardTheme) => void;
  
  // Number calling mode
  setNumberCallingMode: (mode: NumberCallingMode) => void;
  
  // Game duration
  setGameDuration: (seconds: number) => void;
  
  // Pattern Selection
  setPattern: (pattern: BingoPattern) => void;
  setPatternCategory: (category: PatternCategory) => void;
  clearPattern: () => void;
  
  // Voice Settings
  setVoiceLanguage: (language: VoiceLanguage) => void;
  setSelectedVoice: (voiceId: string) => void;
  getAvailableVoices: () => VoiceOption[];
  getCurrentVoiceGender: () => VoiceGender;
  
  // App Settings
  setAppLanguage: (language: AppLanguage) => void;
  setTheme: (theme: Theme) => void;
  
  // RTP Settings
  setRtpPercentage: (percentage: number) => void;
  increaseRtp: () => void;
  decreaseRtp: () => void;
  
  // Bingo Call Timing Settings
  setAllowedLateCalls: (value: number | 'off') => void;
  
  // Host Settings
  setRewardAmount: (amount: number) => void;
  setPlayerBinding: (binding: string) => void;
  setDerashAmount: (amount: number) => void;
  setMedebAmount: (amount: number) => void;
  setLastEnteredAmount: (amount: number) => void;

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

// Use the World Bingo default cards (999 cards available)
const generateDefaultCards = (): number[][] => {
  console.log('🎲 generateDefaultCards called - WORLD_BINGO_CARDS.length:', WORLD_BINGO_CARDS.length);
  return WORLD_BINGO_CARDS;
};

const defaultSettings: GameSettings = {
  selectedPattern: null,
  patternCategory: 'classic',
  voiceLanguage: 'english',
  appLanguage: 'en',
  rtpPercentage: 60,
  theme: 'dark',
  classicLinesTarget: 1,
  classicSelectedLineTypes: ['horizontal', 'vertical', 'diagonal'],
  cardTheme: 'default',
  numberCallingMode: 'automatic',
  gameDuration: 10,
  allowedLateCalls: 'off',
};

const getDefaultVoice = (): VoiceOption => {
  return getDefaultVoiceForLanguage('english');
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      rewardAmount: 100,
      playerBinding: '',
      derashAmount: 100,
      medebAmount: 20,
      lastEnteredAmount: 0,
      worldBingoCardsLimit: 1000,
      isMusicEnabled: true,
      selectedCardTypeName: 'default',
      selectedVoiceId: getDefaultVoice().id,
      selectedVoice: getDefaultVoice(),
      customCardTypes: (() => {
        const defaultCards = generateDefaultCards();
        console.log('🎯 Store initialization - default cards length:', defaultCards.length);
        return [
          {
            name: 'default',
            cards: defaultCards
          }
        ];
      })(),
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
      selectedVoiceName: 'Default Voice',

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


      setVoiceLanguage: (language: VoiceLanguage) => {
        // When language changes, automatically set default voice for that language
        const defaultVoice = getDefaultVoiceForLanguage(language);
        set({ 
          voiceLanguage: language,
          selectedVoiceId: defaultVoice.id,
          selectedVoice: defaultVoice
        });
      },
      
      setSelectedVoice: (voiceId: string) => {
        const voice = getVoiceById(voiceId);
        if (voice) {
          set({ 
            selectedVoiceId: voiceId,
            selectedVoice: voice,
            voiceLanguage: voice.language 
          });
        }
      },
      
      getAvailableVoices: () => {
        return AVAILABLE_VOICES;
      },
      
      getCurrentVoiceGender: () => {
        const { selectedVoice } = get();
        return selectedVoice.gender;
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

      setNumberCallingMode: (mode: NumberCallingMode) => {
        set({ numberCallingMode: mode });
      },

      setGameDuration: (seconds: number) => {
        const clampedDuration = Math.min(60, Math.max(3, seconds));
        set({ gameDuration: clampedDuration });
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

      setAllowedLateCalls: (value: number | 'off') => {
        set({ allowedLateCalls: value });
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

      setLastEnteredAmount: (amount: number) => {
        set({ lastEnteredAmount: Math.max(0, Math.floor(amount)) });
      },

      setMusicEnabled: (enabled: boolean) => {
        set({ isMusicEnabled: enabled });
      },

      setWorldBingoCardsLimit: (limit: number) => {
        const clampedLimit = Math.min(1000, Math.max(1, limit));
        set({ worldBingoCardsLimit: clampedLimit });
      },

      getMaxCardsForSelectedType: () => {
        const { customCardTypes, selectedCardTypeName } = get();
        const selectedCardType = customCardTypes.find(c => c.name === selectedCardTypeName);
        if (selectedCardType) {
          // For World Bingo (default), allow up to 1000 cards (16 predefined + 984 generated)
          if (selectedCardType.name === 'default') {
            return 1000;
          }
          return selectedCardType.cards.length;
        }
        // If the selected card type doesn't exist yet, return 0 for custom types
        if (selectedCardTypeName && selectedCardTypeName !== 'default') {
          return 0;
        }
        return 1000; // fallback to allow 1000 World Bingo cards for default
      },

      resetLimitToMax: () => {
        const maxCards = get().getMaxCardsForSelectedType();
        console.log('Resetting limit to max:', maxCards);
        set({ worldBingoCardsLimit: maxCards });
      },
      
      forceRefreshWorldBingoCards: () => {
        // Force refresh the default World Bingo cards to ensure we have the full 1000 cards
        const { customCardTypes, selectedCardTypeName } = get();
        const defaultCards = generateDefaultCards();
        console.log('Force refreshing World Bingo cards, total available:', defaultCards.length);
        
        const updatedCardTypes = customCardTypes.map(cardType => {
          if (cardType.name === 'default') {
            return { ...cardType, cards: defaultCards };
          }
          return cardType;
        });
        
        // If no default card type exists, create it
        if (!updatedCardTypes.find(ct => ct.name === 'default')) {
          updatedCardTypes.push({
            name: 'default',
            cards: defaultCards
          });
        }
        
        set({ 
          customCardTypes: updatedCardTypes,
          worldBingoCardsLimit: Math.min(1000, defaultCards.length), // Set to full available
          selectedCardTypeName: selectedCardTypeName || 'default'
        });
      },

      // Custom card type management
      addCustomCardType: (cartela: CustomCardType) => {
        set((state) => {
          const index = state.customCardTypes.findIndex(c => c.name === cartela.name);
          if (index !== -1) {
            // If it exists, update it instead of ignoring
            const next = [...state.customCardTypes];
            next[index] = cartela;
            return { customCardTypes: next } as any;
          }
          return { customCardTypes: [...state.customCardTypes, cartela] } as any;
        });
      },
      updateCustomCardType: (cartela: CustomCardType) => {
        set((state) => {
          const index = state.customCardTypes.findIndex(c => c.name === cartela.name);
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
        // Auto-adjust the limit when card type changes
        const { customCardTypes } = get();
        const selectedCardType = customCardTypes.find(c => c.name === name);
        if (selectedCardType) {
          // For World Bingo (default), allow up to 1000 cards (generated + predefined)
          if (selectedCardType.name === 'default') {
            const currentLimit = get().worldBingoCardsLimit;
            // Keep current limit if it's reasonable, otherwise allow up to 1000 cards
            set({ worldBingoCardsLimit: Math.max(currentLimit, 1000) });
          } else {
            // For custom card types, set to their exact count
            set({ worldBingoCardsLimit: selectedCardType.cards.length });
          }
        } else {
          // If card type doesn't exist yet (like selecting 'custom' before creating any custom cards)
          if (name !== 'default') {
            set({ worldBingoCardsLimit: 0 });
          }
        }
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
        const defaultCards = generateDefaultCards();
        console.log('Resetting settings with', defaultCards.length, 'cards');
        set({ 
          ...defaultSettings, 
          rewardAmount: 100, 
          playerBinding: '',
          selectedCardTypeName: 'default',
          worldBingoCardsLimit: Math.min(1000, defaultCards.length), // Allow up to 1000 cards
          customCardTypes: [
            {
              name: 'default',
              cards: defaultCards
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
        selectedVoice: state.selectedVoice,
        derashAmount: state.derashAmount,
        medebAmount: state.medebAmount,
        lastEnteredAmount: state.lastEnteredAmount,
        numberCallingMode: state.numberCallingMode,
        gameDuration: state.gameDuration,
        isMusicEnabled: state.isMusicEnabled,
        worldBingoCardsLimit: state.worldBingoCardsLimit,
        allowedLateCalls: state.allowedLateCalls,
      }),
      // Ensure proper hydration of the state
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure default card type exists if no custom card types are persisted
          if (!state.customCardTypes || state.customCardTypes.length === 0) {
            state.customCardTypes = [
              {
                name: 'default',
                cards: generateDefaultCards()
              }
            ];
          }
          
          // Ensure selectedCardTypeName is valid
          if (!state.selectedCardTypeName || !state.customCardTypes.find(c => c.name === state.selectedCardTypeName)) {
            state.selectedCardTypeName = 'default';
          }
          
          // Ensure worldBingoCardsLimit is reasonable for selected card type
          const selectedCardType = state.customCardTypes.find(c => c.name === state.selectedCardTypeName);
          if (selectedCardType) {
            if (selectedCardType.name === 'default') {
              // For default (World Bingo) cards, ensure limit allows access to all 1000 cards
              const maxAvailable = Math.min(1000, selectedCardType.cards.length);
              state.worldBingoCardsLimit = Math.max(state.worldBingoCardsLimit || 16, maxAvailable);
            } else {
              // For custom card types, set to their exact count
              state.worldBingoCardsLimit = selectedCardType.cards.length;
            }
          }
        }
      },
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
