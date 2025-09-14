import newChallengerSound from "@assets/new_challenger_1757850442377.mp3";

// Audio manager for playing sound effects
export class AudioManager {
  private static instance: AudioManager;
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    // Initialize audio element
    this.audio = new Audio(newChallengerSound);
    this.audio.preload = 'auto';
    this.audio.volume = 0.8; // Loud but not overwhelming
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async playNewChallengerSound(): Promise<void> {
    if (!this.audio) return;

    try {
      // Reset to beginning if already playing
      this.audio.currentTime = 0;
      
      // Play the sound
      await this.audio.play();
    } catch (error) {
      console.warn('Could not play sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public preload(): void {
    if (this.audio) {
      this.audio.load();
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();