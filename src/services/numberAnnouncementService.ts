import Sound from 'react-native-sound';
import { Platform } from 'react-native';
import { VoiceOption } from '../types';

export interface VoiceConfig {
  language: string;
  gender: 'male' | 'female';
}

// Convert VoiceOption to VoiceConfig
function voiceOptionToConfig(voiceOption: VoiceOption): VoiceConfig {
  return {
    language: voiceOption.language,
    gender: voiceOption.gender
  };
}

export class NumberAnnouncementService {
  
  // Quick test method to verify the new direct file logic
  static testDirectFiles() {
    const testNumbers = [1, 21, 34, 100, 234, 321, 456, 789, 999];
    const voice = { language: 'amharic', gender: 'male' as const };
    
    testNumbers.forEach(num => {
      const files = this.getWinnerCartelaNumberBreakdown(num, 'men game sound/winner-cartela');
    });
  }
  private static playSound(fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          reject(error);
          return;
        }
        
        sound.setVolume(1.0);
        sound.play((success) => {
          sound.release();
          resolve();
        });
      });
    });
  }

  private static async playSoundsSequentially(fileNames: string[]): Promise<void> {
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      try {
        await this.playSound(fileName);
        
        // Add a small gap between sounds, longer pause before "hundred"
        const isHundredSound = fileName.includes('100');
        const pauseDuration = isHundredSound ? 200 : 150;
        await new Promise(resolve => setTimeout(resolve, pauseDuration));
      } catch (error) {
        // Continue with next sound even if one fails
      }
    }
  }

  static getWinnerCartelaFileName(voiceOption: VoiceOption): string {
    const voiceConfig = voiceOptionToConfig(voiceOption);
    const extension = Platform.OS === 'ios' ? '.mp3' : '';
    
    if (voiceConfig.language === 'english') {
      const genderPrefix = voiceConfig.gender === 'male' ? 'english_men' : 'english_woman';
      return `${genderPrefix}_other_winner_cartela${extension}`;
    } else if (voiceConfig.language === 'spanish') {
      return `spanish_general_other_winner_cartela${extension}`;
    } else {
      // Use flattened file names that were copied by the script
      return voiceConfig.gender === 'male' 
        ? `men_game_sound_winner_cartela${extension}`
        : `woman_game_sound_winer_card${extension}`;
    }
  }

  static getNoWinnerFileName(voiceOption: VoiceOption): string {
    const voiceConfig = voiceOptionToConfig(voiceOption);
    const extension = Platform.OS === 'ios' ? '.mp3' : '';
    
    if (voiceConfig.language === 'english') {
      const genderPrefix = voiceConfig.gender === 'male' ? 'english_men' : 'english_woman';
      return `${genderPrefix}_other_no_winner_game_continue${extension}`;
    } else if (voiceConfig.language === 'spanish') {
      return `spanish_general_other_no_winner_game_continue${extension}`;
    } else {
      return voiceConfig.gender === 'male' 
        ? `men_game_sound_no_winner_game_continue${extension}`
        : `woman_game_sound_no_winner_game_continue${extension}`;
    }
  }

  private static getNumberFileNames(number: number, voiceOption: VoiceOption): string[] {
    const fileNames: string[] = [];
    
    if (number < 1 || number > 999) {
      return fileNames;
    }

    // For winner cartela numbers, use the specific directory structure that matches the actual file paths
    let folder = '';
    let prefix = '';
    
    // For English and Spanish, we can only use bingo numbers (1-75)
    // For higher numbers, we fall back to Amharic winner voices
    if ((voiceOption.language === 'english' || voiceOption.language === 'spanish') && number <= 75) {
      if (voiceOption.language === 'english') {
        prefix = voiceOption.gender === 'male' ? 'english_men_' : 'english_woman_';
      } else {
        prefix = 'spanish_general_';
      }
      folder = '';
    } else {
      // For Amharic winner cartela or fallback for English/Spanish > 75, use the winner directories
      folder = voiceOption.gender === 'male' 
        ? 'men game sound/winner-cartela' 
        : 'woman game sound/winner-cartela';
      prefix = '';
    }

    // Handle numbers 1-999 with the appropriate voice prefix
    return this.getNumberBreakdown(number, folder, prefix);
  }

  // Helper method to break down numbers into voice components
  private static getNumberBreakdown(number: number, folder: string, prefix: string): string[] {
    const fileNames: string[] = [];

    // Helper function to generate the correct file name based on platform
    const generateFileName = (num: number): string => {
      if (folder) {
        // Using folder structure (for winner cartela numbers)
        return Platform.OS === 'ios' 
          ? `${folder}/${num}.mp3`
          : `${folder.replace('/', '_')}_${num}`;
      } else {
        // Using prefix structure (for regular numbers)
        const extension = Platform.OS === 'ios' ? '.mp3' : '';
        return `${prefix}${num}${extension}`;
      }
    };

    if (number <= 11) {
      // Numbers 1-11 have direct voice files
      fileNames.push(generateFileName(number));
    } else if (number <= 99) {
      // Numbers 12-99: break into tens and ones
      const tens = Math.floor(number / 10) * 10;
      const ones = number % 10;
      
      fileNames.push(generateFileName(tens));
      
      if (ones > 0) {
        fileNames.push(generateFileName(ones));
      }
    } else if (number === 100) {
      // Exactly 100
      fileNames.push(generateFileName(100));
    } else {
      // Numbers 101-999: break into hundreds, tens, and ones
      const hundreds = Math.floor(number / 100);
      const remainder = number % 100;
      
      // Say the hundreds digit (1-9)
      fileNames.push(generateFileName(hundreds));
      
      // Say "hundred" (100)
      fileNames.push(generateFileName(100));
      
      // Handle the remainder (0-99)
      if (remainder > 0) {
        if (remainder <= 11) {
          // Direct voice file for 1-11
          fileNames.push(generateFileName(remainder));
        } else {
          // Break remainder into tens and ones
          const tens = Math.floor(remainder / 10) * 10;
          const ones = remainder % 10;
          
          fileNames.push(generateFileName(tens));
          
          if (ones > 0) {
            fileNames.push(generateFileName(ones));
          }
        }
      }
    }
    
    return fileNames;
  }

  static async announceWinnerCartela(cartelaNumber: number, voiceOption: VoiceOption): Promise<void> {
    try {
      const winnerFileName = this.getWinnerCartelaFileName(voiceOption);
      await this.playSound(winnerFileName);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get cartela number audio files using the enhanced breakdown system
      const numberFileNames = this.getCartelaNumberFileNames(cartelaNumber, voiceOption);
      
      if (numberFileNames.length > 0) {
        await this.playCartelaNumberSequentially(numberFileNames);
      }
    } catch (error) {
      // Don't let the error stop the game
    }
  }

  // Enhanced cartela number announcement system
  private static getCartelaNumberFileNames(cartelaNumber: number, voiceOption: VoiceOption): string[] {
    if (cartelaNumber < 1 || cartelaNumber > 999) {
      return [];
    }

    // Use the correct folder paths for winner cartela numbers
    let folder = '';
    
    // IMPORTANT: For winner cartela numbers 1-999, we can only use men game sound/winner-cartela/ 
    // because it's the ONLY directory that contains all numbers 1-999
    // Individual voice folders (amharic men aradaw, etc.) only go up to 75
    folder = 'men game sound/winner-cartela';

    // Use the enhanced winner cartela number breakdown logic
    const result = this.getWinnerCartelaNumberBreakdown(cartelaNumber, folder);
    
    return result;
  }

  // Enhanced breakdown logic specifically for winner cartela numbers
  // Now using direct audio files for all numbers 1-999 (no more combining needed!)
  private static getWinnerCartelaNumberBreakdown(number: number, folder: string): string[] {
    const fileNames: string[] = [];

    // Helper function to generate the correct file name based on platform
    // Files are in folder structure: men game sound/winner-cartela/321.mp3
    const generateFileName = (num: number): string => {
      const extension = Platform.OS === 'ios' ? '.mp3' : '';
      let fileName: string;
      
      if (Platform.OS === 'ios') {
        // iOS: use full path with folder structure
        fileName = `${folder}/${num}${extension}`;
      } else {
        // Android: For React Native Android resources, we need to flatten the path properly
        // The actual path is "men game sound/winner-cartela" which should become:
        // "men_game_sound_winner_cartela_494" (all spaces and hyphens become underscores)
        
        // First, let's construct the full path including the number
        const fullPath = `${folder}/${num}`;
        // Now replace all spaces, hyphens, and slashes with underscores
        fileName = fullPath.replace(/[\s\/-]/g, '_');
      }
      
      return fileName;
    };

    // Since we now have direct audio files for all numbers 1-999, 
    // we just need to use the direct file for the exact number
    if (number >= 1 && number <= 999) {
      const fileName = generateFileName(number);
      fileNames.push(fileName);
    }
    
    return fileNames;
  }

  private static async playCartelaNumberSequentially(fileNames: string[]): Promise<void> {
    if (fileNames.length === 0) {
      return;
    }
    
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      
      try {
        await this.playSound(fileName);
        
        // Add a pause between number components
        const pauseDuration = fileName.includes('100') ? 300 : 200; // Longer pause after "hundred"
        await new Promise(resolve => setTimeout(resolve, pauseDuration));
      } catch (error) {
        // Continue with next sound even if one fails (graceful degradation)
      }
    }
  }

  static async announceNoWinner(voiceOption: VoiceOption): Promise<void> {
    try {
      const noWinnerFileName = this.getNoWinnerFileName(voiceOption);
      await this.playSound(noWinnerFileName);
    } catch (error) {
      // Error handling without logging
    }
  }

  // Test function to demonstrate cartela number breakdown (for debugging)
  static testCartelaNumberBreakdown() {
    const testVoices: VoiceOption[] = [
      {
        id: 'amharic_men_aradaw',
        name: 'Aradaw',
        language: 'amharic',
        gender: 'male',
        displayName: 'አማርኛ - Aradaw (ወንድ)'
      },
      {
        id: 'amharic_women_amalaya',
        name: 'Amalaya',
        language: 'amharic',
        gender: 'female',
        displayName: 'አማርኛ - Amalaya (ሴት)'
      }
    ];

    const testCartelaNumbers = [
      // All numbers now have direct audio files (1-999)
      1, 5, 11, 15, 20,
      // Two-digit numbers (direct files)
      21, 25, 34, 39,
      // Multiples of 10 (direct files)
      30, 40, 50, 60, 70, 80, 90, 100,
      // Three-digit numbers (direct files)
      101, 150, 234, 290, 321, 345, 456, 789, 999
    ];
    
    testVoices.forEach(voice => {
      testCartelaNumbers.forEach(cartelaNumber => {
        const fileNames = this.getCartelaNumberFileNames(cartelaNumber, voice);
      });
    });
  }

  // Test function to demonstrate number breakdown (for debugging)
  static testNumberBreakdown() {
    const testVoices: VoiceOption[] = [
      {
        id: 'english_men',
        name: 'Men',
        language: 'english',
        gender: 'male',
        displayName: 'English (Men)'
      },
      {
        id: 'spanish_general',
        name: 'General',
        language: 'spanish',
        gender: 'male',
        displayName: 'Español (General)'
      },
      {
        id: 'amharic_men_aradaw',
        name: 'Aradaw',
        language: 'amharic',
        gender: 'male',
        displayName: 'አማርኛ - Aradaw (ወንድ)'
      },
      {
        id: 'amharic_women_amalaya',
        name: 'Amalaya',
        language: 'amharic',
        gender: 'female',
        displayName: 'አማርኛ - Amalaya (ሴት)'
      }
    ];

    const testNumbers = [1, 5, 11, 15, 20, 35, 50, 75, 76, 100, 101, 150, 290, 345, 456, 789, 999];
    
    testVoices.forEach(voice => {
      testNumbers.forEach(number => {
        const fileNames = this.getNumberFileNames(number, voice);
      });
    });
  }
}