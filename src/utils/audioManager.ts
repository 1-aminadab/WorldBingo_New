import { VoiceGender, VoiceLanguage, BingoLetter, VoiceOption, GameSoundType } from '../types';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';
import { VOICE_FILE_MAPPING, GAME_SOUND_FOLDERS, getVoiceById } from './voiceConfig';
import { getNumberAudioFile, getTestAudioFile } from './audioFiles';

// Enable playback in silence mode and allow mixing with other audio
Sound.setCategory('Playback', true);

class AudioManager {
  private sounds: Map<string, Sound> = new Map();
  private currentVoice: VoiceOption | null = null;
  private previewSound: Sound | null = null;

  constructor() {
    this.initializeSounds();
    console.log('AudioManager initialized');
  }

  private initializeSounds() {
    // Initialize background music and sound effects
    const soundFiles = [
      'baground.mp3',
      'computer_mouse_click_02_383961.mp3',
      'number_draw.mp3',
      'spin_sound.mp3',
      'win_celebration.mp3',
      'bingo_call.mp3',
    ];

    soundFiles.forEach(file => {
      const sound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load sound', file, error);
          return;
        }
      });
      this.sounds.set(file, sound);
    });
  }

  setVoice(voice: VoiceOption) {
    this.currentVoice = voice;
    console.log('Voice updated:', voice);
  }

  setVoiceById(voiceId: string) {
    const voice = getVoiceById(voiceId);
    if (voice) {
      this.setVoice(voice);
    } else {
      console.warn('Voice not found:', voiceId);
    }
  }

  playSound(soundName: string, volume: number = 1.0) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.setVolume(volume);
      sound.play((success) => {
        if (!success) {
          console.log('Playback failed for', soundName);
        }
      });
    }
  }

  stopSound(soundName: string) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.stop();
    }
  }

  playBackgroundMusic() {
    this.playSound('baground.mp3', 0.3);
    const music = this.sounds.get('baground.mp3');
    if (music) {
      music.setNumberOfLoops(-1);
    }
  }

  stopBackgroundMusic() {
    this.stopSound('baground.mp3');
  }

  playButtonClick() {
    this.playSound('computer_mouse_click_02_383961.mp3', 0.5);
  }

  playNumberDraw() {
    this.playSound('number_draw.mp3', 0.8);
  }

  playSpinSound() {
    this.playSound('spin_sound.mp3', 0.6);
  }

  playWinCelebration() {
    this.playSound('win_celebration.mp3', 1.0);
  }

  // Voice calling functionality - plays the specific number audio file
  callNumber(letter: BingoLetter, number: number) {
    console.log('callNumber called with:', { letter, number });
    
    // Play the number draw sound effect first
    this.playNumberDraw();

    // Play the specific number audio file
    this.playNumberAudio(number);
  }

  // Play audio for a specific number (1-75) using current voice
  playNumberAudio(number: number) {
    console.log('Playing audio for number:', number, 'with voice:', this.currentVoice?.name);
    
    if (!this.currentVoice) {
      console.warn('No voice selected, using default audio');
      this.playDefaultNumberAudio(number);
      return;
    }

    // Get voice folder identifier for file naming
    const voiceFolder = VOICE_FILE_MAPPING[this.currentVoice.id];
    
    if (!voiceFolder) {
      console.warn('Voice folder not found for voice:', this.currentVoice.id);
      this.playDefaultNumberAudio(number);
      return;
    }
    
    // Create file name based on voice and number
    // Format: voicefolder_number (spaces replaced with underscores)
    const voicePrefix = voiceFolder.replace(/ /g, '_').toLowerCase();
    const fileName = Platform.OS === 'ios' 
      ? `${voicePrefix}_${number}.mp3` 
      : `${voicePrefix}_${number}`;
    
    console.log('Attempting to play voice audio file:', fileName);
    
    const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load voice number audio:', fileName, 'Error:', error);
        // Fallback to default audio
        this.playDefaultNumberAudio(number);
        return;
      }
      
      console.log('Successfully loaded voice number audio:', fileName);
      sound.setVolume(1.0);
      sound.play((success) => {
        if (success) {
          console.log('Successfully played voice number audio:', number);
        } else {
          console.log('Failed to play voice number audio:', number);
        }
        // Release the sound after playing
        sound.release();
      });
    });
  }

  // Fallback to default number audio (existing audio_X files)
  private playDefaultNumberAudio(number: number) {
    console.log('Playing default audio for number:', number);
    
    const fileName = Platform.OS === 'ios' ? `${number}.mp3` : `audio_${number}`;
    
    const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load default number audio:', fileName, 'Error:', error);
        return;
      }
      
      console.log('Successfully loaded default number audio:', fileName);
      sound.setVolume(1.0);
      sound.play((success) => {
        if (success) {
          console.log('Successfully played default number audio:', number);
        } else {
          console.log('Failed to play default number audio:', number);
        }
        sound.release();
      });
    });
  }

  // Play game sounds based on current voice gender
  playGameSound(soundType: GameSoundType) {
    if (!this.currentVoice) {
      console.warn('No voice selected, cannot play game sound');
      return;
    }

    // Get appropriate folder based on gender
    const folder = GAME_SOUND_FOLDERS[this.currentVoice.gender];
    
    // Map sound types to filenames
    const soundFiles: Record<GameSoundType, string> = {
      'game_start': 'game-start.mp3',
      'check_winner': 'check-winner.mp3', 
      'winner_found': 'winner-found.mp3',
      'no_winner_continue': 'no-winner-game-continue.mp3',
      'game_end': 'game-end.mp3'
    };

    const soundFile = soundFiles[soundType];
    const fileName = Platform.OS === 'ios' 
      ? `${folder}/${soundFile}` 
      : `${folder}_${soundFile.replace('.mp3', '')}`;

    console.log('Playing game sound:', soundType, 'File:', fileName);

    const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load game sound:', fileName, 'Error:', error);
        return;
      }
      
      sound.setVolume(1.0);
      sound.play((success) => {
        if (success) {
          console.log('Successfully played game sound:', soundType);
        } else {
          console.log('Failed to play game sound:', soundType);
        }
        sound.release();
      });
    });
  }

  callBingo() {
    this.playGameSound('winner_found');
    this.playWinCelebration();
  }

  announceGameStart() {
    this.playGameSound('game_start');
  }

  announceCheckWinner() {
    this.playGameSound('check_winner');
  }

  announceNoWinner() {
    this.playGameSound('no_winner_continue');
  }

  announceGameEnd() {
    this.playGameSound('game_end');
  }

  private speakText(text: string) {
    console.log(`Speaking: ${text} with voice: ${this.currentVoice?.displayName || 'Unknown'}`);
  }

  // Preview voice - plays test.mp3 with current voice
  previewVoice() {
    console.log('Preview voice called - playing test.mp3 with current voice');
    
    if (!this.currentVoice) {
      console.warn('No voice selected for preview');
      return;
    }

    // Get voice folder identifier for file naming
    const voiceFolder = VOICE_FILE_MAPPING[this.currentVoice.id];
    
    if (!voiceFolder) {
      console.warn('Voice folder not found for voice:', this.currentVoice.id);
      return;
    }
    
    // Create test file name based on voice
    // Format: voicefolder_test (spaces replaced with underscores)
    const voicePrefix = voiceFolder.replace(/ /g, '_').toLowerCase();
    const fileName = Platform.OS === 'ios' 
      ? `${voicePrefix}_test.mp3` 
      : `${voicePrefix}_test`;
    
    console.log('Attempting to play test audio file:', fileName);
    
    // Stop any currently playing preview
    this.stopPreview();
    
    const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load test audio:', fileName, 'Error:', error);
        // Fallback to playing number 1
        this.playNumberAudio(1);
        return;
      }
      
      console.log('Successfully loaded test audio:', fileName);
      sound.setVolume(1.0);
      
      // Store the sound reference for potential stopping
      this.previewSound = sound;
      
      sound.play((success) => {
        if (success) {
          console.log('Successfully played test audio');
        } else {
          console.log('Failed to play test audio');
        }
        // Clear the preview sound reference when done
        if (this.previewSound === sound) {
          this.previewSound = null;
        }
        sound.release();
      });
    });
  }

  // Stop any currently playing preview
  stopPreview() {
    if (this.previewSound) {
      this.previewSound.stop();
      this.previewSound.release();
      this.previewSound = null;
      console.log('Stopped preview sound');
    }
  }

  // Preview specific voice by ID
  previewVoiceById(voiceId: string) {
    const originalVoice = this.currentVoice;
    
    // Temporarily set the voice for preview
    this.setVoiceById(voiceId);
    this.previewVoice();
    
    // Restore original voice
    if (originalVoice) {
      this.setVoice(originalVoice);
    }
  }

  // Play game start sound based on current voice settings
  playGameStartSound() {
    console.log('Playing game start sound with current voice:', this.currentVoice?.name);
    
    if (!this.currentVoice) {
      console.warn('No voice selected, using default game start sound');
      return;
    }

    let soundPath = '';
    
    // Determine sound path based on voice language and gender
    // Based on actual file structure in assets/audio/World Bingo App Audio/
    switch (this.currentVoice.language) {
      case 'amharic':
        if (this.currentVoice.gender === 'male') {
          soundPath = 'men_game_sound_game_start';
        } else {
          soundPath = 'woman_game_sound_game_start';
        }
        break;
      case 'spanish':
        soundPath = 'spanish_general_other_game_start';
        break;
      case 'english':
        soundPath = 'english_general_other_game_start';
        break;
      default:
        console.warn('Unknown language, using default game start sound');
        return;
    }

    const fileName = Platform.OS === 'ios' 
      ? `${soundPath}.mp3` 
      : soundPath;
    
    console.log('Attempting to play game start sound file:', fileName);
    
    const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load game start sound:', fileName, 'Error:', error);
        return;
      }
      
      console.log('Successfully loaded game start sound:', fileName);
      sound.setVolume(1.0);
      sound.play((success) => {
        if (success) {
          console.log('Successfully played game start sound');
        } else {
          console.log('Failed to play game start sound');
        }
        sound.release();
      });
    });
  }

  // Test method to verify audio loading
  testAudioFiles() {
    console.log('=== TESTING AUDIO FILES ===');
    
    // Test 1.mp3 (preview)
    this.playNumberAudio(1);
    
    // Test 10.mp3 after a delay
    setTimeout(() => {
      this.playNumberAudio(10);
    }, 2000);
    
    // Test 25.mp3 after another delay
    setTimeout(() => {
      this.playNumberAudio(25);
    }, 4000);
  }

  dispose() {
    this.sounds.forEach(sound => {
      sound.release();
    });
    this.sounds.clear();
  }
}

export const audioManager = new AudioManager();