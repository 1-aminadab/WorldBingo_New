import { BingoLetter } from '../types';
import { audioManager } from './audioManager';

interface AudioQueueItem {
  letter: BingoLetter;
  number: number;
  timestamp: number;
}

class AudioQueue {
  private queue: AudioQueueItem[] = [];
  private isProcessing: boolean = false;

  // Add an audio call to the queue
  enqueue(letter: BingoLetter, number: number) {
    const item: AudioQueueItem = {
      letter,
      number,
      timestamp: Date.now()
    };

    this.queue.push(item);

    // Start processing if not already doing so
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process the queue sequentially
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      
      try {
        // Call the audio manager to play the number
        audioManager.callNumber(item.letter, item.number);
        
        // Wait for the audio to finish playing
        // Estimate based on typical number audio duration (2-3 seconds)
        await this.waitForAudio();
        
      } catch (error) {
      }
    }

    this.isProcessing = false;
  }

  // Wait for audio to finish (estimated duration)
  private waitForAudio(): Promise<void> {
    return new Promise(resolve => {
      // Wait 2.5 seconds for most number audio to complete
      // This ensures audio doesn't overlap
      setTimeout(resolve, 2500);
    });
  }

  // Clear the queue (useful for game end or reset)
  clear() {
    this.queue = [];
    this.isProcessing = false;
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Export singleton instance
export const audioQueue = new AudioQueue();