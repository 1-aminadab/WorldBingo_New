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
  private static playSound(fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load sound:', fileName, 'Error:', error);
          reject(error);
          return;
        }
        
        sound.setVolume(1.0);
        sound.play((success) => {
          if (success) {
            console.log('Successfully played sound:', fileName);
          } else {
            console.log('Failed to play sound:', fileName);
          }
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
        console.log(`Playing sound ${i + 1}/${fileNames.length}:`, fileName);
        await this.playSound(fileName);
        
        // Add a small gap between sounds, longer pause before "hundred"
        const isHundredSound = fileName.includes('100');
        const pauseDuration = isHundredSound ? 200 : 150;
        await new Promise(resolve => setTimeout(resolve, pauseDuration));
      } catch (error) {
        console.log('Error playing sound in sequence:', fileName, error);
        // Continue with next sound even if one fails
      }
    }
  }

  static getWinnerCartelaFileName(voiceOption: VoiceOption): string {
    const voiceConfig = voiceOptionToConfig(voiceOption);
    const extension = Platform.OS === 'ios' ? '.mp3' : '';
    
    if (voiceConfig.language === 'english') {
      return `english_general_other_winner_cartela${extension}`;
    } else if (voiceConfig.language === 'spanish') {
      return `spanish_general_other_winner_cartela${extension}`;
    } else {
      return voiceConfig.gender === 'male' 
        ? `men_game_sound_winner_cartela${extension}`
        : `woman_game_sound_winer_card${extension}`;
    }
  }

  static getNoWinnerFileName(voiceOption: VoiceOption): string {
    const voiceConfig = voiceOptionToConfig(voiceOption);
    const extension = Platform.OS === 'ios' ? '.mp3' : '';
    
    if (voiceConfig.language === 'english') {
      return `english_general_other_no_winner_game_continue${extension}`;
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
    const extension = Platform.OS === 'ios' ? '.mp3' : '';
    
    if (number < 1 || number > 999) {
      console.warn('Number out of supported range (1-999):', number);
      return fileNames;
    }

    // Get prefix based on the voice option and number range
    let prefix = '';
    
    // For English and Spanish, we can only use bingo numbers (1-75)
    // For higher numbers, we fall back to Amharic winner voices
    if ((voiceOption.language === 'english' || voiceOption.language === 'spanish') && number <= 75) {
      prefix = voiceOption.language === 'english' ? 'english_general_' : 'spanish_general_';
    } else if (voiceOption.language === 'amharic') {
      // Use the specific voice ID for Amharic voices
      // voiceOption.id will be like 'amharic_men_aradaw' or 'amharic_women_amalaya'
      prefix = `${voiceOption.id}_`;
    } else {
      // Fallback to winner voice files for numbers > 75 or if no specific voice found
      // This handles English/Spanish numbers > 75 and any other edge cases
      prefix = voiceOption.gender === 'male' ? 'men_winner_cartela_' : 'woman_winner_';
    }
    
    // Special handling for English/Spanish numbers > 75
    if ((voiceOption.language === 'english' || voiceOption.language === 'spanish') && number > 75) {
      // For numbers > 75, we need to use the winner voice system since English/Spanish
      // only have bingo numbers 1-75. Use fallback prefix for these cases.
      const fallbackPrefix = voiceOption.gender === 'male' ? 'men_winner_cartela_' : 'woman_winner_';
      return this.getNumberBreakdown(number, fallbackPrefix, extension);
    }

    // Handle numbers 1-999 with the appropriate voice prefix
    return this.getNumberBreakdown(number, prefix, extension);
  }

  // Helper method to break down numbers into voice components
  private static getNumberBreakdown(number: number, prefix: string, extension: string): string[] {
    const fileNames: string[] = [];

    if (number <= 11) {
      // Numbers 1-11 have direct voice files
      fileNames.push(`${prefix}${number}${extension}`);
    } else if (number <= 99) {
      // Numbers 12-99: break into tens and ones
      const tens = Math.floor(number / 10) * 10;
      const ones = number % 10;
      
      fileNames.push(`${prefix}${tens}${extension}`);
      
      if (ones > 0) {
        fileNames.push(`${prefix}${ones}${extension}`);
      }
    } else if (number === 100) {
      // Exactly 100
      fileNames.push(`${prefix}100${extension}`);
    } else {
      // Numbers 101-999: break into hundreds, tens, and ones
      const hundreds = Math.floor(number / 100);
      const remainder = number % 100;
      
      // Say the hundreds digit (1-9)
      fileNames.push(`${prefix}${hundreds}${extension}`);
      
      // Say "hundred" (100)
      fileNames.push(`${prefix}100${extension}`);
      
      // Handle the remainder (0-99)
      if (remainder > 0) {
        if (remainder <= 11) {
          // Direct voice file for 1-11
          fileNames.push(`${prefix}${remainder}${extension}`);
        } else {
          // Break remainder into tens and ones
          const tens = Math.floor(remainder / 10) * 10;
          const ones = remainder % 10;
          
          fileNames.push(`${prefix}${tens}${extension}`);
          
          if (ones > 0) {
            fileNames.push(`${prefix}${ones}${extension}`);
          }
        }
      }
    }
    
    return fileNames;
  }

  static async announceWinnerCartela(cartelaNumber: number, voiceOption: VoiceOption): Promise<void> {
    try {
      console.log('NumberAnnouncementService: Announcing winner cartela', cartelaNumber, 'with voice option:', voiceOption);
      
      const winnerFileName = this.getWinnerCartelaFileName(voiceOption);
      console.log('NumberAnnouncementService: Playing winner file:', winnerFileName);
      await this.playSound(winnerFileName);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const numberFileNames = this.getNumberFileNames(cartelaNumber, voiceOption);
      console.log('NumberAnnouncementService: Playing number files:', numberFileNames);
      if (numberFileNames.length > 0) {
        await this.playSoundsSequentially(numberFileNames);
      }
    } catch (error) {
      console.log('Error announcing winner cartela:', error);
    }
  }

  static async announceNoWinner(voiceOption: VoiceOption): Promise<void> {
    try {
      console.log('NumberAnnouncementService: Announcing no winner with voice option:', voiceOption);
      
      const noWinnerFileName = this.getNoWinnerFileName(voiceOption);
      console.log('NumberAnnouncementService: Playing no-winner file:', noWinnerFileName);
      await this.playSound(noWinnerFileName);
    } catch (error) {
      console.log('Error announcing no winner:', error);
    }
  }

  // Test function to demonstrate number breakdown (for debugging)
  static testNumberBreakdown() {
    const testVoices: VoiceOption[] = [
      {
        id: 'english_general',
        name: 'General',
        language: 'english',
        gender: 'male',
        displayName: 'English (General)'
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
    
    console.log('=== VOICE FILE PATH TEST ===');
    testVoices.forEach(voice => {
      console.log(`\n--- ${voice.displayName} (${voice.id}) ---`);
      testNumbers.forEach(number => {
        const fileNames = this.getNumberFileNames(number, voice);
        console.log(`${number}: [${fileNames.join(', ')}]`);
      });
    });
    
    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log('English/Spanish 1-75: Use language-specific files (english_general_X, spanish_general_X)');
    console.log('English/Spanish 76-999: Fall back to men_winner_cartela_X or woman_winner_X');
    console.log('Amharic: Use specific voice files (amharic_men_aradaw_X, amharic_women_amalaya_X)');
    console.log('Card 290 examples:');
    console.log('  - English: men_winner_cartela_2, men_winner_cartela_100, men_winner_cartela_90');
    console.log('  - Amharic Male: amharic_men_aradaw_2, amharic_men_aradaw_100, amharic_men_aradaw_90');
    console.log('  - Amharic Female: amharic_women_amalaya_2, amharic_women_amalaya_100, amharic_women_amalaya_90');
    console.log('\n=== END TEST ===');
  }
}