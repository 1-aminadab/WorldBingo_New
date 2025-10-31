// Navigation Screen Names Enum
// This enum provides type-safe constants for all navigation screen names used throughout the app

export enum ScreenNames {
  // Root Stack Screens
  SPLASH = 'Splash',
  AUTH = 'Auth',
  MAIN = 'Main',

  // Auth Stack Screens
  LOGIN = 'Login',
  LOGIN_SIGNUP = 'LoginSignup', // Login screen with signup tab active
  SIGN_UP = 'SignUp',
  FORGOT_PASSWORD = 'ForgotPassword',
  OTP_VERIFICATION = 'OTPVerification',
  CHANGE_PASSWORD = 'ChangePassword',

  // Main Tab Screens
  HOME = 'Home',
  SETTINGS = 'Settings',
  PROFILE = 'Profile',

  // Main Stack Screens
  MAIN_TABS = 'MainTabs',
  GAME_STACK = 'GameStack',
  CARD_TYPE_EDITOR = 'CardTypeEditor',
  BINGO_CARDS = 'BingoCards',

  // Game Stack Screens
  STAKE_SETUP = 'StakeSetup',
  PLAYER_CARTELA_SELECTION = 'PlayerCartelaSelection',
  GAME_PLAY = 'GamePlay',
  SINGLE_PLAYER_GAME = 'SinglePlayerGame',
  GAME_SUMMARY = 'GameSummary',

  // Profile Stack Screens
  PROFILE_MAIN = 'ProfileMain',
  TRANSACTION_REPORT = 'TransactionReport',
  GAME_REPORT = 'GameReport',
  COMPREHENSIVE_REPORT = 'ComprehensiveReport',
  PAYMENT_WEBVIEW = 'PaymentWebView',

  // Deep Link Screens (used in deep linking configuration)
  DL_LOGIN = 'login',
  DL_SIGNUP = 'signup',
  DL_FORGOT_PASSWORD = 'forgot-password',
  DL_OTP_VERIFICATION = 'otp-verification',
  DL_HOME = 'home',
  DL_SETTINGS = 'settings',
  DL_PROFILE_MAIN = 'profile',
  DL_TRANSACTION_REPORT = 'transaction-report',
  DL_GAME_REPORT = 'game-report',
  DL_COMPREHENSIVE_REPORT = 'comprehensive-report',
  DL_PAYMENT = 'payment',
}

// Type-safe navigation route names
export type RootStackScreenName = 
  | ScreenNames.SPLASH
  | ScreenNames.AUTH
  | ScreenNames.MAIN;

export type AuthStackScreenName = 
  | ScreenNames.LOGIN
  | ScreenNames.LOGIN_SIGNUP
  | ScreenNames.SIGN_UP
  | ScreenNames.FORGOT_PASSWORD
  | ScreenNames.OTP_VERIFICATION
  | ScreenNames.CHANGE_PASSWORD;

export type MainTabScreenName = 
  | ScreenNames.HOME
  | ScreenNames.SETTINGS
  | ScreenNames.PROFILE;

export type MainStackScreenName = 
  | ScreenNames.MAIN_TABS
  | ScreenNames.GAME_STACK
  | ScreenNames.CARD_TYPE_EDITOR
  | ScreenNames.BINGO_CARDS;

export type GameStackScreenName = 
  | ScreenNames.HOME
  | ScreenNames.STAKE_SETUP
  | ScreenNames.PLAYER_CARTELA_SELECTION
  | ScreenNames.GAME_PLAY
  | ScreenNames.SINGLE_PLAYER_GAME
  | ScreenNames.GAME_SUMMARY;

export type ProfileStackScreenName = 
  | ScreenNames.PROFILE_MAIN
  | ScreenNames.TRANSACTION_REPORT
  | ScreenNames.GAME_REPORT
  | ScreenNames.COMPREHENSIVE_REPORT
  | ScreenNames.PAYMENT_WEBVIEW;

export type DeepLinkScreenName = 
  | ScreenNames.DL_LOGIN
  | ScreenNames.DL_SIGNUP
  | ScreenNames.DL_FORGOT_PASSWORD
  | ScreenNames.DL_OTP_VERIFICATION
  | ScreenNames.DL_HOME
  | ScreenNames.DL_SETTINGS
  | ScreenNames.DL_PROFILE_MAIN
  | ScreenNames.DL_TRANSACTION_REPORT
  | ScreenNames.DL_GAME_REPORT
  | ScreenNames.DL_COMPREHENSIVE_REPORT
  | ScreenNames.DL_PAYMENT;