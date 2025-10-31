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
    
    console.log('🎵 AudioService: Initializing...');
    
    // Wait for store rehydration to complete before starting music
    this.waitForRehydrationAndStart();
    
    // Subscribe to music state changes
    let previousMusicState = useSettingsStore.getState().isMusicEnabled;
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
   * Wait for store rehydration and start music if enabled
   * This prevents starting music before persisted state is loaded
   */
  private waitForRehydrationAndStart() {
    const checkAndStart = () => {
      this.rehydrationCheckAttempts++;
      
      const { isMusicEnabled } = useSettingsStore.getState();
      
      console.log(`🎵 AudioService: Check attempt ${this.rehydrationCheckAttempts}, isMusicEnabled:`, isMusicEnabled);
      
      // Start music if enabled
      if (isMusicEnabled && !this.backgroundMusicStarted) {
        console.log('🎵 AudioService: Starting background music (rehydration complete)');
        this.startBackgroundMusic();
      } else if (!isMusicEnabled) {
        console.log('🎵 AudioService: Music is disabled, not starting');
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

  /**
   * Temporarily pause music without changing the persisted state
   * Used when entering game screens where other audio plays
   */
  pauseMusic() {
    if (this.backgroundMusicStarted) {
      console.log('🎵 AudioService: Temporarily pausing music for game');
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
      console.log('🎵 AudioService: Resuming music after game');
      this.startBackgroundMusic();
    }
  }
}

// Export a singleton instance
export const audioService = new AudioService();