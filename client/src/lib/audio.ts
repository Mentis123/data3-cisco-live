import newChallengerSound from "@assets/new_challenger_1757850442377.mp3";
import flashSound from "@assets/flash_1757855169590.mp3";
import homeSoundFile from "@assets/home_sound.mp3";
import buzzSoundFile from "@assets/buzz.mp3";

// Audio manager for playing sound effects
export class AudioManager {
  private static instance: AudioManager;
  private challengerAudio: HTMLAudioElement | null = null;
  private flashAudio: HTMLAudioElement | null = null;
  private homeAudio: HTMLAudioElement | null = null;
  private buzzAudio: HTMLAudioElement | null = null;
  private isAudioSupported: boolean;
  private isMuted: boolean = false;

  private constructor() {
    this.isAudioSupported = typeof window !== "undefined" && typeof Audio !== "undefined";

    if (!this.isAudioSupported) {
      return;
    }

    this.initializeAudioElements();
  }

  private initializeAudioElements() {
    if (!this.isAudioSupported) {
      return;
    }

    if (!this.challengerAudio) {
      this.challengerAudio = new Audio(newChallengerSound);
      this.challengerAudio.preload = "auto";
      this.challengerAudio.volume = 0.8; // Loud but not overwhelming
    }

    if (!this.flashAudio) {
      this.flashAudio = new Audio(flashSound);
      this.flashAudio.preload = "auto";
      this.flashAudio.volume = 0.9; // Slightly louder for immediate impact
    }

    if (!this.homeAudio) {
      this.homeAudio = new Audio(homeSoundFile);
      this.homeAudio.preload = "auto";
      this.homeAudio.volume = 0.5; // 50% volume as requested
    }

    if (!this.buzzAudio) {
      this.buzzAudio = new Audio(buzzSoundFile);
      this.buzzAudio.preload = "auto";
      this.buzzAudio.volume = 0.5; // 50% volume as requested
    }
  }

  private ensureAudioReady(): boolean {
    if (!this.isAudioSupported) {
      return false;
    }

    if (!this.challengerAudio || !this.flashAudio || !this.homeAudio || !this.buzzAudio) {
      this.initializeAudioElements();
    }

    return Boolean(this.challengerAudio && this.flashAudio && this.homeAudio && this.buzzAudio);
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async playFlashSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.flashAudio || this.isMuted) return;

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
    if (!this.ensureAudioReady() || !this.challengerAudio || this.isMuted) return;

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

  public async playHomeSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.homeAudio || this.isMuted) return;

    try {
      // Reset to beginning if already playing
      this.homeAudio.currentTime = 0;

      // Play the home sound
      await this.homeAudio.play();
    } catch (error) {
      console.warn('Could not play home sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public async playBuzzSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.buzzAudio || this.isMuted) return;

    try {
      // Reset to beginning if already playing
      this.buzzAudio.currentTime = 0;

      // Play the buzz sound
      await this.buzzAudio.play();
    } catch (error) {
      console.warn('Could not play buzz sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public setVolume(volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    if (!this.ensureAudioReady()) {
      return;
    }

    if (this.challengerAudio) {
      this.challengerAudio.volume = normalizedVolume;
    }
    if (this.flashAudio) {
      this.flashAudio.volume = normalizedVolume;
    }
    if (this.homeAudio) {
      this.homeAudio.volume = normalizedVolume * 0.5; // Keep home at 50%
    }
    if (this.buzzAudio) {
      this.buzzAudio.volume = normalizedVolume * 0.5; // Keep buzz at 50%
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    // Stop all currently playing audio when muting
    if (this.isMuted) {
      this.stopAll();
    }

    return this.isMuted;
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;

    // Stop all currently playing audio when muting
    if (this.isMuted) {
      this.stopAll();
    }
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  private stopAll(): void {
    if (this.challengerAudio) {
      this.challengerAudio.pause();
      this.challengerAudio.currentTime = 0;
    }
    if (this.flashAudio) {
      this.flashAudio.pause();
      this.flashAudio.currentTime = 0;
    }
    if (this.homeAudio) {
      this.homeAudio.pause();
      this.homeAudio.currentTime = 0;
    }
    if (this.buzzAudio) {
      this.buzzAudio.pause();
      this.buzzAudio.currentTime = 0;
    }
  }

  public preload(): void {
    if (!this.ensureAudioReady()) {
      return;
    }

    if (this.challengerAudio) {
      this.challengerAudio.load();
    }
    if (this.flashAudio) {
      this.flashAudio.load();
    }
    if (this.homeAudio) {
      this.homeAudio.load();
    }
    if (this.buzzAudio) {
      this.buzzAudio.load();
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();