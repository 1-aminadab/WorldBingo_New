// Game Types
export type BingoPattern = 
  // Legacy classic presets (kept for backward compatibility in other parts of the app)
  | 'one_line' 
  | 'two_lines' 
  | 'three_lines' 
  | 'full_house'
  // Modern patterns
  | 't_shape'
  | 'u_shape'
  | 'x_shape'
  | 'plus_sign'
  | 'diamond';

// Classic line types for the new classic configuration model
export type ClassicLineType = 
  | 'horizontal'
  | 'vertical'
  | 'diagonal'
  | 'four_corners'
  | 'small_corners'
  | 'plus'
  | 'x';

export type PatternCategory = 'classic' | 'modern';

export type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

export type DrawnNumber = {
  letter: BingoLetter;
  number: number;
  timestamp: Date;
};

export type BingoCard = {
  B: number[];
  I: number[];
  N: number[];
  G: number[];
  O: number[];
};

export type GameState = 'idle' | 'playing' | 'paused' | 'completed';

// Settings Types
export type VoiceGender = 'male' | 'female';
export type VoiceLanguage = 'english' | 'amharic' | 'arabic' | 'french';
export type AppLanguage = 'en' | 'am' | 'ar' | 'fr';
export type Theme = 'light' | 'dark' | 'system';

// Card visual theme
export type CardTheme = 'default' | 'black_white';

export interface GameSettings {
  selectedPattern: BingoPattern | null;
  patternCategory: PatternCategory;
  voiceGender: VoiceGender;
  voiceLanguage: VoiceLanguage;
  appLanguage: AppLanguage;
  rtpPercentage: number;
  theme: Theme;
  // New optional settings (kept optional to avoid breaking other codepaths)
  classicLinesTarget?: number; // how many lines must be completed for classic mode
  classicSelectedLineTypes?: ClassicLineType[]; // which line orientations are valid
  cardTheme?: CardTheme; // visual theme for cards
  selectedCardTypeName?: string; // which cartela set is currently selected
}

// Custom cartela/card type structure
export interface CustomCardType {
  name: string; // unique name
  // Each card must include 24 numbers (center free cell is assumed)
  cards: number[][]; // array of 24-number arrays
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  isGuest?: boolean;
  gamesPlayed?: number;
  gamesWon?: number;
  totalPlayTime?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
}

// Game Data Types
export interface GameSession {
  id: string;
  card: BingoCard;
  drawnNumbers: DrawnNumber[];
  currentState: GameState;
  settings: GameSettings;
  startTime: Date;
  endTime?: Date;
  isWin: boolean;
  winningPattern?: BingoPattern;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email: string };
  ChangePassword: { token: string };
};

export type MainTabParamList = {
  Home: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  GameStack: undefined;
  CardTypeEditor?: { mode?: 'create' | 'manage'; name?: string };
};

export type GameStackParamList = {
  Home: undefined;
  StakeSetup: undefined;
  PlayerCartelaSelection: undefined;
  GamePlay?: {
    playerCartelaNumbers?: number[];
    numPlayers?: number;
  };
  GameSummary?: {
    totalDrawn: number;
    derashShownBirr: number;
    medebBirr: number;
    durationSeconds: number;
    history: DrawnNumber[];
  };
};

// Animation Types
export interface SlotMachineResult {
  letter: BingoLetter;
  number: number;
}