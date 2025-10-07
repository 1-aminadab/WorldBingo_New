// Simple test to verify audio files can be loaded
import { audioManager } from './src/utils/audioManager';

// Test function to verify audio implementation
function testAudioImplementation() {
  console.log('=== AUDIO IMPLEMENTATION TEST ===');
  
  try {
    // Test background music
    console.log('Testing background music...');
    audioManager.playBackgroundMusic();
    
    setTimeout(() => {
      // Test click sound
      console.log('Testing click sound...');
      audioManager.playButtonClick();
      
      setTimeout(() => {
        // Stop background music
        console.log('Stopping background music...');
        audioManager.stopBackgroundMusic();
        
        console.log('Audio test completed successfully!');
      }, 1000);
    }, 2000);
    
  } catch (error) {
    console.error('Audio test failed:', error);
  }
}

export { testAudioImplementation };