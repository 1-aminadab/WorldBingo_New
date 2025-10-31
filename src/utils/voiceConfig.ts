import { VoiceOption, VoiceLanguage, VoiceGender } from '../types';

// Available voice options based on actual folder structure
export const AVAILABLE_VOICES: VoiceOption[] = [
  // English voices - only general
  {
    id: 'english_general',
    name: 'General',
    language: 'english',
    gender: 'male', // Default to male for consistency
    displayName: 'English (General)'
  },
  
  // Spanish voices - only general
  {
    id: 'spanish_general',
    name: 'General',
    language: 'spanish',
    gender: 'male', // Default to male for consistency
    displayName: 'Español (General)'
  },
  
  // Amharic voices - 4 men, 1 woman (based on actual folder names)
  {
    id: 'amharic_men_aradaw',
    name: 'Aradaw',
    language: 'amharic',
    gender: 'male',
    displayName: 'አማርኛ - Aradaw (ወንድ)'
  },
  {
    id: 'amharic_men_duryew',
    name: 'Duryew',
    language: 'amharic',
    gender: 'male',
    displayName: 'አማርኛ - Duryew (ወንድ)'
  },
  {
    id: 'amharic_men_shebaw',
    name: 'Shebaw',
    language: 'amharic',
    gender: 'male',
    displayName: 'አማርኛ - Shebaw (ወንድ)'
  },
  {
    id: 'amharic_men_shebelaw',
    name: 'Shebelaw',
    language: 'amharic',
    gender: 'male',
    displayName: 'አማርኛ - Shebelaw (ወንድ)'
  },
  {
    id: 'amharic_women_amalaya',
    name: 'Amalaya',
    language: 'amharic',
    gender: 'female',
    displayName: 'አማርኛ - Amalaya (ሴት)'
  }
];

// Helper functions
export const getVoicesByLanguage = (language: VoiceLanguage): VoiceOption[] => {
  return AVAILABLE_VOICES.filter(voice => voice.language === language);
};

export const getVoicesByGender = (gender: VoiceGender): VoiceOption[] => {
  return AVAILABLE_VOICES.filter(voice => voice.gender === gender);
};

export const getVoiceById = (id: string): VoiceOption | undefined => {
  return AVAILABLE_VOICES.find(voice => voice.id === id);
};

export const getDefaultVoiceForLanguage = (language: VoiceLanguage): VoiceOption => {
  const voices = getVoicesByLanguage(language);
  
  // Default to Aradaw for Amharic
  if (language === 'amharic') {
    return voices.find(v => v.id === 'amharic_men_aradaw') || voices[0];
  }
  
  // Default to first available voice for other languages
  return voices[0];
};

// Global default voice - defaults to Amharic Aradaw
export const getDefaultVoice = (): VoiceOption => {
  return AVAILABLE_VOICES.find(v => v.id === 'amharic_men_aradaw') || AVAILABLE_VOICES[0];
};

// Voice file mapping - maps voice IDs to their actual folder names with spaces
export const VOICE_FILE_MAPPING: Record<string, string> = {
  // English - folder: "english general"
  'english_general': 'english general',
  
  // Spanish - folder: "spanish general"  
  'spanish_general': 'spanish general',
  
  // Amharic - folders: "amharic men/women Name"
  'amharic_men_aradaw': 'amharic men Aradaw',
  'amharic_men_duryew': 'amharic men Duryew', 
  'amharic_men_shebaw': 'amharic men Shebaw',
  'amharic_men_shebelaw': 'amharic men Shebelaw',
  'amharic_women_amalaya': 'amharic women amalaya'
};

// Game sound folder mapping based on gender
export const GAME_SOUND_FOLDERS: Record<VoiceGender, string> = {
  'male': 'men_game_sound',
  'female': 'woman_game_sound'
};

// Language display names
export const LANGUAGE_DISPLAY_NAMES: Record<VoiceLanguage, string> = {
  'english': 'English',
  'spanish': 'Español',
  'amharic': 'አማርኛ'
};