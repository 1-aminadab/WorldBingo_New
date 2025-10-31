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
      console.log('🔊 Attempting to load sound file:', fileName);
      const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('❌ Failed to load sound:', fileName, 'Error:', error);
          reject(error);
          return;
        }
        
        console.log('✅ Sound loaded successfully:', fileName);
        sound.setVolume(1.0);
        sound.play((success) => {
          if (success) {
            console.log('✅ Successfully played sound:', fileName);
          } else {
            console.log('❌ Failed to play sound:', fileName);
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
    
    if (number < 1 || number > 999) {
      console.warn('Number out of supported range (1-999):', number);
      return fileNames;
    }

    // For winner cartela numbers, use the specific directory structure that matches the actual file paths
    let folder = '';
    let prefix = '';
    
    // For English and Spanish, we can only use bingo numbers (1-75)
    // For higher numbers, we fall back to Amharic winner voices
    if ((voiceOption.language === 'english' || voiceOption.language === 'spanish') && number <= 75) {
      prefix = voiceOption.language === 'english' ? 'english_general_' : 'spanish_general_';
      folder = '';
    } else {
      // For Amharic winner cartela or fallback for English/Spanish > 75, use the winner directories
      folder = voiceOption.gender === 'male' 
        ? 'men_game_sound/winner-cartela' 
        : 'woman_game_sound/winner-cartela';
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
      console.log('🎯 NumberAnnouncementService: Announcing winner cartela', cartelaNumber, 'with voice option:', voiceOption);
      
      const winnerFileName = this.getWinnerCartelaFileName(voiceOption);
      console.log('🎯 Playing winner file:', winnerFileName);
      await this.playSound(winnerFileName);
      console.log('✅ Winner announcement played successfully');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get cartela number audio files using the enhanced breakdown system
      console.log('🎯 Getting cartela number files for:', cartelaNumber);
      const numberFileNames = this.getCartelaNumberFileNames(cartelaNumber, voiceOption);
      console.log('🎯 Generated cartela number file names for', cartelaNumber, ':', numberFileNames);
      
      if (numberFileNames.length > 0) {
        console.log('🎯 Starting to play cartela number sequence...');
        await this.playCartelaNumberSequentially(numberFileNames);
        console.log('✅ Finished playing cartela number sequence');
      } else {
        console.warn('⚠️ No cartela number files generated for', cartelaNumber);
      }
    } catch (error) {
      console.error('❌ Error announcing winner cartela:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      // Don't let the error stop the game - but make sure we know what happened
    }
  }

  // Enhanced cartela number announcement system
  private static getCartelaNumberFileNames(cartelaNumber: number, voiceOption: VoiceOption): string[] {
    console.log('🎯 getCartelaNumberFileNames called with:', { cartelaNumber, voiceOption });
    
    if (cartelaNumber < 1 || cartelaNumber > 999) {
      console.warn('⚠️ Cartela number out of supported range (1-999):', cartelaNumber);
      return [];
    }

    // Use the correct folder paths for winner cartela numbers
    let folder = '';
    
    if (voiceOption.language === 'english') {
      // English not yet implemented - use Amharic male as fallback
      folder = 'men_game_sound_winner_cartela';
      console.log('🎯 English winner cartela not implemented, using Amharic male fallback');
    } else if (voiceOption.language === 'spanish') {
      // Spanish not yet implemented - use Amharic female as fallback  
      folder = 'woman_game_sound_winner_cartela';
      console.log('🎯 Spanish winner cartela not implemented, using Amharic female fallback');
    } else {
      // Amharic - use appropriate gender folder (flattened names)
      folder = voiceOption.gender === 'male' 
        ? 'men_game_sound_winner_cartela' 
        : 'woman_game_sound_winner_cartela';
      console.log('🎯 Using Amharic folder:', folder);
    }

    // Use the enhanced winner cartela number breakdown logic
    console.log('🎯 Calling getWinnerCartelaNumberBreakdown with folder:', folder);
    const result = this.getWinnerCartelaNumberBreakdown(cartelaNumber, folder);
    console.log('🎯 getWinnerCartelaNumberBreakdown returned:', result);
    
    // Additional logging to debug the issue
    if (result.length === 0) {
      console.error('🚨 No audio files generated for cartela number:', cartelaNumber, 'folder:', folder);
    } else {
      console.log('✅ Generated', result.length, 'audio files for cartela', cartelaNumber);
      result.forEach((fileName, index) => {
        console.log(`  ${index + 1}. ${fileName}`);
      });
    }
    
    return result;
  }

  // Enhanced breakdown logic specifically for winner cartela numbers
  // Available files: 1-20, 30, 40, 50, 60, 70, 80, 90, 100
  private static getWinnerCartelaNumberBreakdown(number: number, folder: string): string[] {
    const fileNames: string[] = [];

    // Helper function to generate the correct file name based on platform
    // Files are now flattened to: men_game_sound_winner_cartela_X.mp3 and woman_game_sound_winner_cartela_X.mp3
    const generateFileName = (num: number): string => {
      const extension = Platform.OS === 'ios' ? '.mp3' : '';
      return `${folder}_${num}${extension}`;
    };

    // Check if we have a direct file for this number
    const availableFiles = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      30, 40, 50, 60, 70, 80, 90, 100
    ];

    if (availableFiles.includes(number)) {
      // Direct file available
      fileNames.push(generateFileName(number));
      console.log(`🎯 Direct file available for ${number}`);
    } else if (number <= 99) {
      // For numbers 21-99 (excluding direct files), combine tens + ones
      const tens = Math.floor(number / 10) * 10;
      const ones = number % 10;
      
      if (tens > 0 && availableFiles.includes(tens)) {
        fileNames.push(generateFileName(tens));
      }
      
      if (ones > 0 && availableFiles.includes(ones)) {
        fileNames.push(generateFileName(ones));
      }
      
      console.log(`🎯 Combining for ${number}: ${tens} + ${ones}`);
    } else if (number === 100) {
      // Exactly 100 - direct file available
      fileNames.push(generateFileName(100));
      console.log(`🎯 Direct file available for 100`);
    } else {
      // For numbers 101-999, combine hundreds + remainder
      const hundreds = Math.floor(number / 100);
      const remainder = number % 100;
      
      // Add hundreds digit (1-9)
      if (availableFiles.includes(hundreds)) {
        fileNames.push(generateFileName(hundreds));
      }
      
      // Add "hundred" (100)
      fileNames.push(generateFileName(100));
      
      // Handle remainder (0-99)
      if (remainder > 0) {
        if (availableFiles.includes(remainder)) {
          // Direct file for remainder
          fileNames.push(generateFileName(remainder));
        } else {
          // Break down remainder into tens + ones
          const tens = Math.floor(remainder / 10) * 10;
          const ones = remainder % 10;
          
          if (tens > 0 && availableFiles.includes(tens)) {
            fileNames.push(generateFileName(tens));
          }
          
          if (ones > 0 && availableFiles.includes(ones)) {
            fileNames.push(generateFileName(ones));
          }
        }
      }
      
      console.log(`🎯 Combining for ${number}: ${hundreds} + 100 + remainder(${remainder})`);
    }
    
    console.log(`🎯 Final breakdown for ${number}:`, fileNames);
    return fileNames;
  }

  private static async playCartelaNumberSequentially(fileNames: string[]): Promise<void> {
    console.log('🔊 Starting cartela number sequence with files:', fileNames);
    
    if (fileNames.length === 0) {
      console.warn('⚠️ No files to play in cartela number sequence');
      return;
    }
    
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      try {
        console.log(`🔊 Playing cartela number sound ${i + 1}/${fileNames.length}:`, fileName);
        await this.playSound(fileName);
        console.log(`✅ Successfully played cartela sound: ${fileName}`);
        
        // Add a pause between number components
        const pauseDuration = fileName.includes('100') ? 300 : 200; // Longer pause after "hundred"
        console.log(`⏱️ Pausing for ${pauseDuration}ms before next sound`);
        await new Promise(resolve => setTimeout(resolve, pauseDuration));
      } catch (error) {
        console.error('❌ Error playing cartela number sound:', fileName, error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message);
        }
        // Continue with next sound even if one fails (graceful degradation)
      }
    }
    
    console.log('🔊 Finished cartela number sequence');
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
      // Direct files (1-20)
      1, 5, 11, 15, 20,
      // Combined numbers (21-29, 31-39, etc.)  
      21, 25, 34, 39,
      // Multiples of 10 (direct files)
      30, 40, 50, 60, 70, 80, 90, 100,
      // Three-digit numbers requiring combination
      101, 150, 234, 290, 321, 345, 456, 789, 999
    ];
    
    console.log('=== ENHANCED CARTELA NUMBER BREAKDOWN TEST ===');
    console.log('Available direct files: 1-20, 30, 40, 50, 60, 70, 80, 90, 100');
    console.log('Other numbers are combined from available files\n');
    
    testVoices.forEach(voice => {
      console.log(`--- ${voice.displayName} (${voice.id}) ---`);
      testCartelaNumbers.forEach(cartelaNumber => {
        const fileNames = this.getCartelaNumberFileNames(cartelaNumber, voice);
        console.log(`${cartelaNumber.toString().padStart(3)}: [${fileNames.join(', ')}]`);
      });
      console.log('');
    });
    
    console.log('=== BREAKDOWN EXAMPLES ===');
    console.log('21 → 20 + 1');
    console.log('34 → 30 + 4'); 
    console.log('234 → 2 + 100 + 30 + 4');
    console.log('321 → 3 + 100 + 20 + 1');
    console.log('456 → 4 + 100 + 50 + 6');
    console.log('=== END CARTELA TEST ===');
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