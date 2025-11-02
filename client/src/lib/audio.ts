import newChallengerSound from "@assets/new_challenger_1757850442377.mp3";
import flashSound from "@assets/flash_1757855169590.mp3";
import homeSoundFile from "@assets/home_sound.mp3";
import buzzSoundFile from "@assets/buzz.mp3";
import clickSoundFile from "@assets/click.mp3";

// Audio manager for playing sound effects
export class AudioManager {
  private static instance: AudioManager;
  private challengerAudio: HTMLAudioElement | null = null;
  private flashAudio: HTMLAudioElement | null = null;
  private homeAudio: HTMLAudioElement | null = null;
  private buzzAudio: HTMLAudioElement | null = null;
  private clickAudio: HTMLAudioElement | null = null;
  private isAudioSupported: boolean;
  private isMuted: boolean = true; // Default to muted (OFF)
  private isImmersive: boolean = false; // Default to immersive mode OFF

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
      this.challengerAudio.muted = this.isMuted;
    }

    if (!this.flashAudio) {
      this.flashAudio = new Audio(flashSound);
      this.flashAudio.preload = "auto";
      this.flashAudio.volume = 0.9; // Slightly louder for immediate impact
      this.flashAudio.muted = this.isMuted;
    }

    if (!this.homeAudio) {
      this.homeAudio = new Audio(homeSoundFile);
      this.homeAudio.preload = "auto";
      this.homeAudio.volume = 0.2; // 20% volume
      this.homeAudio.loop = true; // Loop continuously
      this.homeAudio.muted = this.isMuted;
    }

    if (!this.buzzAudio) {
      this.buzzAudio = new Audio(buzzSoundFile);
      this.buzzAudio.preload = "auto";
      this.buzzAudio.volume = 0.75; // 75% volume
      this.buzzAudio.muted = this.isMuted;
    }

    if (!this.clickAudio) {
      this.clickAudio = new Audio(clickSoundFile);
      this.clickAudio.preload = "auto";
      this.clickAudio.volume = 0.6; // 60% volume - crisp but not overwhelming
      this.clickAudio.muted = this.isMuted;
    }
  }

  private ensureAudioReady(): boolean {
    if (!this.isAudioSupported) {
      return false;
    }

    if (!this.challengerAudio || !this.flashAudio || !this.homeAudio || !this.buzzAudio || !this.clickAudio) {
      this.initializeAudioElements();
    }

    return Boolean(this.challengerAudio && this.flashAudio && this.homeAudio && this.buzzAudio && this.clickAudio);
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
    if (!this.ensureAudioReady() || !this.homeAudio) return;

    try {
      // Reset to beginning if already playing
      this.homeAudio.currentTime = 0;

      // Play the home sound (will loop continuously, respects muted property)
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

  public async playClickSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.clickAudio) {
      console.log('[AudioManager] Click sound not ready');
      return;
    }

    // Click sounds are UI feedback and should always play,
    // regardless of immersive mode state
    try {
      // Temporarily unmute for click sound if needed
      const wasClickMuted = this.clickAudio.muted;
      this.clickAudio.muted = false;

      // Reset to beginning if already playing
      this.clickAudio.currentTime = 0;

      // Play the click sound
      console.log('[AudioManager] Playing click sound');
      await this.clickAudio.play();

      // Restore previous muted state
      this.clickAudio.muted = wasClickMuted;
    } catch (error) {
      console.warn('Could not play click sound:', error);
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
      this.homeAudio.volume = normalizedVolume * 0.2; // Keep home at 20%
    }
    if (this.buzzAudio) {
      this.buzzAudio.volume = normalizedVolume * 0.5; // Keep buzz at 50%
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    // Update muted state on all audio elements
    this.updateMutedState();

    return this.isMuted;
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;

    // Update muted state on all audio elements
    this.updateMutedState();
  }

  private updateMutedState(): void {
    if (!this.ensureAudioReady()) {
      return;
    }

    if (this.challengerAudio) {
      this.challengerAudio.muted = this.isMuted;
    }
    if (this.flashAudio) {
      this.flashAudio.muted = this.isMuted;
    }
    if (this.homeAudio) {
      this.homeAudio.muted = this.isMuted;
    }
    if (this.buzzAudio) {
      this.buzzAudio.muted = this.isMuted;
    }
    if (this.clickAudio) {
      this.clickAudio.muted = this.isMuted;
    }
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  public toggleImmersive(): boolean {
    this.isImmersive = !this.isImmersive;

    if (this.isImmersive) {
      console.log('[AudioManager] Immersive mode ON - unmuting audio');
      // When turning on immersive mode, automatically unmute
      if (this.isMuted) {
        this.setMute(false);
      }
    } else {
      console.log('[AudioManager] Immersive mode OFF - muting and stopping all sounds');
      // When turning off immersive mode, mute and stop all sounds
      this.setMute(true);
      this.stopAll();
    }

    return this.isImmersive;
  }

  public setImmersive(immersive: boolean): void {
    this.isImmersive = immersive;

    if (this.isImmersive) {
      // When turning on immersive mode, automatically unmute
      if (this.isMuted) {
        this.setMute(false);
      }
    } else {
      // When turning off immersive mode, mute and stop all sounds
      this.setMute(true);
      this.stopAll();
    }
  }

  public isImmersiveMode(): boolean {
    return this.isImmersive;
  }

  public stopAll(): void {
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
    if (this.clickAudio) {
      this.clickAudio.pause();
      this.clickAudio.currentTime = 0;
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
    if (this.clickAudio) {
      this.clickAudio.load();
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();