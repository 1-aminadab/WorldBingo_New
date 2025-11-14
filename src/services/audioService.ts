import { audioManager } from '../utils/audioManager';
import { useSettingsStore } from '../store/settingsStore';

class AudioService {
  private isInitialized = false;
  private backgroundMusicStarted = false;
  private rehydrationCheckAttempts = 0;
  private maxRehydrationAttempts = 20; // Max 2 seconds (20 * 100ms)

  /**
   * Initialize the audio service - should be called on app startup
   */
  async initialize() {
    if (this.isInitialized) return;
    
    
    // Wait for store rehydration to complete before starting music
    this.waitForRehydrationAndStart();
    
    // Subscribe to music state changes
    let previousMusicState = useSettingsStore.getState().isMusicEnabled;
    useSettingsStore.subscribe((state) => {
      if (state.isMusicEnabled !== previousMusicState) {
        if (state.isMusicEnabled) {
          this.startBackgroundMusic();
        } else {
          this.stopBackgroundMusic();
        }
        previousMusicState = state.isMusicEnabled;
      }
    });
    
    this.isInitialized = true;
  }

  /**
   * Wait for store rehydration and start music if enabled
   * This prevents starting music before persisted state is loaded
   */
  private waitForRehydrationAndStart() {
    const checkAndStart = () => {
      this.rehydrationCheckAttempts++;
      
      const { isMusicEnabled } = useSettingsStore.getState();
      
      
      // Start music if enabled
      if (isMusicEnabled && !this.backgroundMusicStarted) {
        this.startBackgroundMusic();
      } else if (!isMusicEnabled) {
      }
    };
    
    // Wait for rehydration to complete (500ms should be enough for AsyncStorage to load)
    setTimeout(checkAndStart, 500);
  }

  /**
   * Start background music
   */
  startBackgroundMusic() {
    if (this.backgroundMusicStarted) return;
    
    audioManager.playBackgroundMusic();
    this.backgroundMusicStarted = true;
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    if (!this.backgroundMusicStarted) return;
    
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

  /**
   * Temporarily pause music without changing the persisted state
   * Used when entering game screens where other audio plays
   */
  pauseMusic() {
    if (this.backgroundMusicStarted) {
      audioManager.stopBackgroundMusic();
      this.backgroundMusicStarted = false; // Update flag so music can be resumed
    }
  }

  /**
   * Resume music if it was enabled before pausing
   * Restores music based on the persisted state
   */
  resumeMusic() {
    const { isMusicEnabled } = useSettingsStore.getState();
    if (isMusicEnabled) {
      this.startBackgroundMusic();
    }
  }
}

// Export a singleton instance
export const audioService = new AudioService();