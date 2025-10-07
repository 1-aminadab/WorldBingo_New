import { audioManager } from '../utils/audioManager';
import { useSettingsStore } from '../store/settingsStore';

class AudioService {
  private isInitialized = false;
  private backgroundMusicStarted = false;

  /**
   * Initialize the audio service - should be called on app startup
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🎵 AudioService: Initializing...');
    
    // Get the current music state from persistent storage
    const { isMusicEnabled } = useSettingsStore.getState();
    
    console.log('🎵 AudioService: Music enabled from storage:', isMusicEnabled);
    
    // Start background music if enabled
    if (isMusicEnabled && !this.backgroundMusicStarted) {
      this.startBackgroundMusic();
    }
    
    // Subscribe to music state changes
    let previousMusicState = isMusicEnabled;
    useSettingsStore.subscribe((state) => {
      if (state.isMusicEnabled !== previousMusicState) {
        console.log('🎵 AudioService: Music state changed to:', state.isMusicEnabled);
        if (state.isMusicEnabled) {
          this.startBackgroundMusic();
        } else {
          this.stopBackgroundMusic();
        }
        previousMusicState = state.isMusicEnabled;
      }
    });
    
    this.isInitialized = true;
    console.log('🎵 AudioService: Initialization complete');
  }

  /**
   * Start background music
   */
  startBackgroundMusic() {
    if (this.backgroundMusicStarted) return;
    
    console.log('🎵 AudioService: Starting background music');
    audioManager.playBackgroundMusic();
    this.backgroundMusicStarted = true;
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    if (!this.backgroundMusicStarted) return;
    
    console.log('🎵 AudioService: Stopping background music');
    audioManager.stopBackgroundMusic();
    this.backgroundMusicStarted = false;
  }

  /**
   * Play click sound - centralized method for all UI interactions
   */
  playClickSound() {
    const { isMusicEnabled } = useSettingsStore.getState();
    if (isMusicEnabled) {
      audioManager.playButtonClick();
    }
  }

  /**
   * Toggle music state and persist it
   */
  toggleMusic() {
    const { isMusicEnabled, setMusicEnabled } = useSettingsStore.getState();
    const newState = !isMusicEnabled;
    
    console.log('🎵 AudioService: Toggling music from', isMusicEnabled, 'to', newState);
    setMusicEnabled(newState);
    
    // Note: The state change will be automatically handled by the subscriber
    return newState;
  }

  /**
   * Get current music state
   */
  isMusicEnabled(): boolean {
    return useSettingsStore.getState().isMusicEnabled;
  }

  /**
   * Force enable music (for initial app launch)
   */
  enableMusic() {
    const { setMusicEnabled } = useSettingsStore.getState();
    setMusicEnabled(true);
  }

  /**
   * Force disable music
   */
  disableMusic() {
    const { setMusicEnabled } = useSettingsStore.getState();
    setMusicEnabled(false);
  }
}

// Export a singleton instance
export const audioService = new AudioService();