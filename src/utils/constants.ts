// App Configuration
export const APP_CONFIG = {
  name: 'World Bingo',
  version: '1.0.0',
  supportEmail: 'support@worldbingo.com',
  websiteUrl: 'https://worldbingo.com',
};

// Game Configuration
export const GAME_CONFIG = {
  maxDrawnNumbers: 75,
  autoDrawInterval: 3000, // 3 seconds
  celebrationDuration: 2000, // 2 seconds
  minRTP: 60,
  maxRTP: 85,
  defaultRTP: 60,
};

// Animation Durations
export const ANIMATION_DURATIONS = {
  splash: 3000,
  slideTransition: 300,
  fadeTransition: 200,
  springAnimation: 500,
  slotMachineSpin: 3500,
  numberReveal: 800,
  celebration: 2000,
};

// Color Themes
export const BINGO_COLORS = {
  B: '#2563EB', // Blue
  I: '#3B82F6', // Light Blue
  N: '#1D4ED8', // Dark Blue
  G: '#10B981', // Green
  O: '#F59E0B', // Amber
};

// Sound Files
export const SOUND_FILES = {
  backgroundMusic: 'background_music.mp3',
  buttonClick: 'button_click.mp3',
  numberDraw: 'number_draw.mp3',
  winCelebration: 'win_celebration.mp3',
  bingoCall: 'bingo_call.mp3',
};

// Voice Settings
export const VOICE_SETTINGS = {
  defaultGender: 'male' as const,
  defaultLanguage: 'amharic' as const,
  supportedLanguages: ['english', 'amharic'] as const,
  supportedGenders: ['male', 'female'] as const,
};

// Pattern Descriptions
export const PATTERN_INFO = {
  classic: {
    description: 'Traditional bingo patterns',
    patterns: ['one_line', 'two_lines', 'three_lines', 'full_house'],
  },
  modern: {
    description: 'Creative pattern variations',
    patterns: ['t_shape', 'u_shape', 'x_shape', 'plus_sign', 'diamond'],
  },
};

// API Endpoints (for future use)
export const API_CONFIG = {
  baseUrl: 'https://world-bingo-mobile-app-backend-230041233104.us-central1.run.app',
  timeout: 10000,
  retryAttempts: 3,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  auth: 'auth-storage',
  settings: 'settings-storage',
  gameHistory: 'game-history',
  userPreferences: 'user-preferences',
};