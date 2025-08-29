import { VoiceGender, VoiceLanguage, BingoLetter } from '../types';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable playback in silence mode and allow mixing with other audio
Sound.setCategory('Playback', true);

class AudioManager {
  private sounds: Map<string, Sound> = new Map();
  private currentVoiceGender: VoiceGender = 'female';
  private currentVoiceLanguage: VoiceLanguage = 'english';

  constructor() {
    this.initializeSounds();
    console.log('AudioManager initialized');
  }

  private initializeSounds() {
    // Initialize background music and sound effects
    const soundFiles = [
      'background_music.mp3',
      'button_click.mp3',
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

  setVoiceSettings(gender: VoiceGender, language: VoiceLanguage) {
    this.currentVoiceGender = gender;
    this.currentVoiceLanguage = language;
    console.log('Voice settings updated:', { gender, language });
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
    this.playSound('background_music.mp3', 0.3);
    const music = this.sounds.get('background_music.mp3');
    if (music) {
      music.setNumberOfLoops(-1);
    }
  }

  stopBackgroundMusic() {
    this.stopSound('background_music.mp3');
  }

  playButtonClick() {
    this.playSound('button_click.mp3', 0.5);
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

  // Play audio for a specific number (1-75)
  playNumberAudio(number: number) {
    console.log('Playing audio for number:', number);
    
    // For iOS, use filename with extension
    // For Android, use filename without extension
    const fileName = Platform.OS === 'ios' ? `${number}.mp3` : `${number}`;
    
    const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load number audio:', fileName, 'Error:', error);
        return;
      }
      
      console.log('Successfully loaded number audio:', fileName);
      sound.setVolume(1.0);
      sound.play((success) => {
        if (success) {
          console.log('Successfully played number audio:', number);
        } else {
          console.log('Failed to play number audio:', number);
        }
        // Release the sound after playing
        sound.release();
      });
    });
  }

  callBingo() {
    this.playWinCelebration();
    this.speakText('Bingo!');
  }

  private speakText(text: string) {
    console.log(`Speaking: ${text} (${this.currentVoiceGender}, ${this.currentVoiceLanguage})`);
  }

  // Preview voice - always plays 1.mp3
  previewVoice(text: string = 'This is a voice preview') {
    console.log('Preview voice called - playing 1.mp3');
    
    // Always play 1.mp3 for preview
    this.playNumberAudio(1);
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