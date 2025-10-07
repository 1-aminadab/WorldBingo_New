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
export type VoiceLanguage = 'english' | 'amharic' | 'spanish';
export type AppLanguage = 'en' | 'am' | 'es';
export type Theme = 'dark';
export type NumberCallingMode = 'automatic' | 'manual';

// Voice and Gender Types
export type VoiceGender = 'male' | 'female';

export interface VoiceOption {
  id: string;
  name: string;
  language: VoiceLanguage;
  gender: VoiceGender;
  displayName: string;
}

// Game Sound Types
export type GameSoundType = 
  | 'game_start'
  | 'check_winner'
  | 'winner_found'
  | 'no_winner_continue'
  | 'game_end';

// Card visual theme
export type CardTheme = 'default' | 'black_white';

export interface GameSettings {
  selectedPattern: BingoPattern | null;
  patternCategory: PatternCategory;
  voiceLanguage: VoiceLanguage;
  appLanguage: AppLanguage;
  rtpPercentage: number;
  theme: Theme;
  // New optional settings (kept optional to avoid breaking other codepaths)
  classicLinesTarget?: number; // how many lines must be completed for classic mode
  classicSelectedLineTypes?: ClassicLineType[]; // which line orientations are valid
  cardTheme?: CardTheme; // visual theme for cards
  allowedLateCalls?: number | 'off'; // number of balls after winning number player can still call bingo, or 'off' for unlimited
  selectedCardTypeName?: string; // which cartela set is currently selected
  numberCallingMode?: NumberCallingMode; // automatic or manual number calling
  gameDuration?: number; // duration in seconds between each number call (3-60 seconds)
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
  BingoCards: undefined;
};

export type GameStackParamList = {
  Home: undefined;
  StakeSetup: undefined;
  PlayerCartelaSelection: undefined;
  GamePlay?: {
    playerCartelaNumbers?: number[];
    numPlayers?: number;
  };
  SinglePlayerGame?: {
    selectedCardNumbers?: number[];
    singleSelectedNumbers?: number[];
    medebAmount?: number;
    derashValue?: number;
    totalSelections?: number;
    selectedCardTypeName?: string;
    customCardTypes?: any[];
  };
  GameSummary?: {
    totalDrawn: number;
    derashShownBirr: number;
    medebBirr: number;
    durationSeconds: number;
    history: DrawnNumber[];
    totalCardsSold?: number;
    totalCollectedAmount?: number;
    profitAmount?: number;
  };
};

// Animation Types
export interface SlotMachineResult {
  letter: BingoLetter;
  number: number;
}

// Report Types
export interface GameReport {
  id: string;
  date: string; // YYYY-MM-DD format
  totalGames: number;
  totalCardsSold: number;
  totalCollectedAmount: number; // 100% amount without RTP applied
  totalProfit: number; // calculated as totalCollectedAmount * (100 - RTP) / 100
  rtpPercentage: number;
  games: GameReportEntry[];
}

export interface GameReportEntry {
  id: string;
  timestamp: Date;
  gameNumber: number; // game number for the day
  cardsSold: number; // number of cards/selections in this game
  collectedAmount: number; // total amount collected for this game
  rtpPercentage: number;
  profitAmount: number; // calculated profit for this game
  gameDurationMinutes: number;
  totalNumbersCalled: number;
  pattern: string;
  winnerFound: boolean;
}

export interface CashReport {
  id: string;
  date: string; // YYYY-MM-DD format
  transactions: CashTransaction[];
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export interface CashTransaction {
  id: string;
  timestamp: Date;
  type: 'debit' | 'credit';
  amount: number;
  reason: string;
  description?: string;
}

export type CashTransactionReason = 
  | 'game_profit' // Credit from game profits
  | 'game_expense' // Debit for game expenses
  | 'withdrawal' // Debit for cash withdrawal
  | 'deposit' // Credit for cash deposit
  | 'prize_payout' // Debit for winner payouts
  | 'operational_cost' // Debit for operational expenses
  | 'bonus_payout' // Debit for bonus payments
  | 'refund' // Debit for refunds
  | 'other'; // Other reasons