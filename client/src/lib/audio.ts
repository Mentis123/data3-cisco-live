import newChallengerSound from "@assets/new_challenger_1757850442377.mp3";
import flashSound from "@assets/flash_1757855169590.mp3";

// Audio manager for playing sound effects
export class AudioManager {
  private static instance: AudioManager;
  private challengerAudio: HTMLAudioElement | null = null;
  private flashAudio: HTMLAudioElement | null = null;

  private constructor() {
    // Initialize audio elements
    this.challengerAudio = new Audio(newChallengerSound);
    this.challengerAudio.preload = 'auto';
    this.challengerAudio.volume = 0.8; // Loud but not overwhelming

    this.flashAudio = new Audio(flashSound);
    this.flashAudio.preload = 'auto';
    this.flashAudio.volume = 0.9; // Slightly louder for immediate impact
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async playFlashSound(): Promise<void> {
    if (!this.flashAudio) return;

    try {
      // Reset to beginning if already playing
      this.flashAudio.currentTime = 0;
      
      // Play the flash sound immediately
      await this.flashAudio.play();
    } catch (error) {
      console.warn('Could not play flash sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public async playNewChallengerSound(): Promise<void> {
    if (!this.challengerAudio) return;

    try {
      // Reset to beginning if already playing
      this.challengerAudio.currentTime = 0;
      
      // Play the challenger sound
      await this.challengerAudio.play();
    } catch (error) {
      console.warn('Could not play challenger sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public setVolume(volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    if (this.challengerAudio) {
      this.challengerAudio.volume = normalizedVolume;
    }
    if (this.flashAudio) {
      this.flashAudio.volume = normalizedVolume;
    }
  }

  public preload(): void {
    if (this.challengerAudio) {
      this.challengerAudio.load();
    }
    if (this.flashAudio) {
      this.flashAudio.load();
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();