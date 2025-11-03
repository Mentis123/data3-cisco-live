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
  private audioContext: AudioContext | null = null;
  private clickAudioBuffer: AudioBuffer | null = null;
  private isAudioSupported: boolean;
  private isMuted: boolean = true; // Default to muted (OFF)
  private isImmersive: boolean = false; // Will be loaded from localStorage
  private musicEnabled: boolean = true; // Music on/off
  private soundsEnabled: boolean = true; // Sound effects on/off
  private masterVolume: number = 1.0; // Master volume (0.0 to 1.0, default 100%)

  private constructor() {
    this.isAudioSupported = typeof window !== "undefined" && typeof Audio !== "undefined";

    if (!this.isAudioSupported) {
      return;
    }

    // Load immersive mode state from localStorage
    this.loadImmersiveState();

    this.initializeAudioElements();
    this.initializeWebAudio();
  }

  private loadImmersiveState(): void {
    try {
      const savedState = localStorage.getItem('immersiveMode');
      if (savedState !== null) {
        this.isImmersive = savedState === 'true';
        // If immersive mode was on, unmute audio
        if (this.isImmersive) {
          this.isMuted = false;
        }
        console.log('[AudioManager] Loaded immersive state from localStorage:', this.isImmersive);
      }

      // Load music enabled state
      const musicState = localStorage.getItem('musicEnabled');
      if (musicState !== null) {
        this.musicEnabled = musicState === 'true';
      }

      // Load sounds enabled state
      const soundsState = localStorage.getItem('soundsEnabled');
      if (soundsState !== null) {
        this.soundsEnabled = soundsState === 'true';
      }

      // Load master volume
      const volumeState = localStorage.getItem('masterVolume');
      if (volumeState !== null) {
        this.masterVolume = parseFloat(volumeState);
        if (isNaN(this.masterVolume) || this.masterVolume < 0 || this.masterVolume > 1) {
          this.masterVolume = 1.0;
        }
      }
    } catch (error) {
      console.warn('[AudioManager] Failed to load immersive state from localStorage:', error);
    }
  }

  private saveImmersiveState(): void {
    try {
      localStorage.setItem('immersiveMode', String(this.isImmersive));
      console.log('[AudioManager] Saved immersive state to localStorage:', this.isImmersive);
    } catch (error) {
      console.warn('[AudioManager] Failed to save immersive state to localStorage:', error);
    }
  }

  private saveAudioSettings(): void {
    try {
      localStorage.setItem('musicEnabled', String(this.musicEnabled));
      localStorage.setItem('soundsEnabled', String(this.soundsEnabled));
      localStorage.setItem('masterVolume', String(this.masterVolume));
      console.log('[AudioManager] Saved audio settings to localStorage');
    } catch (error) {
      console.warn('[AudioManager] Failed to save audio settings to localStorage:', error);
    }
  }

  private initializeAudioElements() {
    if (!this.isAudioSupported) {
      return;
    }

    if (!this.challengerAudio) {
      this.challengerAudio = new Audio(newChallengerSound);
      this.challengerAudio.preload = "auto";
      this.challengerAudio.volume = 0.4; // Reduced by 50% from 0.8
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
      this.homeAudio.volume = 0.075 * this.masterVolume; // 7.5% volume with master volume applied
      this.homeAudio.loop = true; // Loop continuously
      this.homeAudio.muted = this.isMuted;
    }

    if (!this.buzzAudio) {
      this.buzzAudio = new Audio(buzzSoundFile);
      this.buzzAudio.preload = "auto";
      this.buzzAudio.volume = 1.0; // 100% volume (increased by 50% from 0.75)
      this.buzzAudio.muted = this.isMuted;
    }

    if (!this.clickAudio) {
      this.clickAudio = new Audio(clickSoundFile);
      this.clickAudio.preload = "auto";
      this.clickAudio.volume = 0.6; // 60% volume - crisp but not overwhelming
      this.clickAudio.muted = this.isMuted;
    }
  }

  private initializeWebAudio() {
    if (!this.isAudioSupported) {
      return;
    }

    try {
      // Create AudioContext for Web Audio API
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();

        // Load click sound as AudioBuffer for instant playback
        this.loadClickAudioBuffer();
      }
    } catch (error) {
      console.warn('Web Audio API not supported, falling back to HTMLAudioElement:', error);
    }
  }

  private async loadClickAudioBuffer() {
    if (!this.audioContext) {
      return;
    }

    try {
      // Fetch the click sound file
      const response = await fetch(clickSoundFile);
      const arrayBuffer = await response.arrayBuffer();

      // Decode the audio data into an AudioBuffer
      this.clickAudioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('[AudioManager] Click sound AudioBuffer loaded and ready');
    } catch (error) {
      console.warn('Failed to load click AudioBuffer, falling back to HTMLAudioElement:', error);
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

    // Don't play if sounds are disabled
    if (!this.soundsEnabled) {
      console.log('[AudioManager] Flash sound skipped - sound effects are disabled');
      return;
    }

    try {
      // Reset to beginning if already playing
      this.flashAudio.currentTime = 0;

      // Apply master volume
      this.flashAudio.volume = 0.9 * this.masterVolume;

      // Play the flash sound immediately
      await this.flashAudio.play();
    } catch (error) {
      console.warn('Could not play flash sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public async playNewChallengerSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.challengerAudio || this.isMuted) return;

    // Don't play if sounds are disabled
    if (!this.soundsEnabled) {
      console.log('[AudioManager] Challenger sound skipped - sound effects are disabled');
      return;
    }

    try {
      // Reset to beginning if already playing
      this.challengerAudio.currentTime = 0;

      // Apply master volume
      this.challengerAudio.volume = 0.4 * this.masterVolume;

      // Play the challenger sound
      await this.challengerAudio.play();
    } catch (error) {
      console.warn('Could not play challenger sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public async playHomeSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.homeAudio) return;

    // Don't play if music is disabled
    if (!this.musicEnabled) {
      console.log('[AudioManager] Home sound skipped - music is disabled');
      return;
    }

    try {
      // Reset to beginning if already playing
      this.homeAudio.currentTime = 0;

      // Apply master volume
      this.homeAudio.volume = 0.075 * this.masterVolume;

      // Play the home sound (will loop continuously, respects muted property)
      await this.homeAudio.play();
    } catch (error) {
      console.warn('Could not play home sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public ensureHomeSoundPlaying(): void {
    if (!this.ensureAudioReady() || !this.homeAudio) return;

    // Only ensure playing if immersive mode is on and not muted and music is enabled
    if (!this.isImmersive || this.isMuted || !this.musicEnabled) return;

    // Check if the home sound is not playing
    if (this.homeAudio.paused) {
      console.log('[AudioManager] Home sound was paused, restarting...');
      // Apply master volume before playing
      this.homeAudio.volume = 0.075 * this.masterVolume;
      this.homeAudio.play().catch(err => {
        console.warn('Could not restart home sound:', err);
      });
    }
  }

  public async playBuzzSound(): Promise<void> {
    // Buzz sound should only play when immersive mode is enabled
    if (!this.isImmersive) {
      console.log('[AudioManager] Buzz sound skipped - immersive mode is off');
      return;
    }

    // Respect the muted state
    if (this.isMuted) {
      console.log('[AudioManager] Buzz sound skipped - audio is muted');
      return;
    }

    // Don't play if sounds are disabled
    if (!this.soundsEnabled) {
      console.log('[AudioManager] Buzz sound skipped - sound effects are disabled');
      return;
    }

    if (!this.ensureAudioReady() || !this.buzzAudio) return;

    try {
      // Reset to beginning if already playing
      this.buzzAudio.currentTime = 0;

      // Apply master volume
      this.buzzAudio.volume = 1.0 * this.masterVolume;

      // Play the buzz sound
      await this.buzzAudio.play();
      console.log('[AudioManager] Playing buzz sound');
    } catch (error) {
      console.warn('Could not play buzz sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public playClickSound(): void {
    // Click sounds should only play when immersive mode is enabled
    if (!this.isImmersive) {
      console.log('[AudioManager] Click sound skipped - immersive mode is off');
      return;
    }

    // Respect the muted state
    if (this.isMuted) {
      console.log('[AudioManager] Click sound skipped - audio is muted');
      return;
    }

    // Don't play if sounds are disabled
    if (!this.soundsEnabled) {
      console.log('[AudioManager] Click sound skipped - sound effects are disabled');
      return;
    }

    // Try Web Audio API first (much faster playback)
    if (this.audioContext && this.clickAudioBuffer) {
      try {
        // Resume AudioContext if it's suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        // Create a new buffer source node (they're single-use)
        const source = this.audioContext.createBufferSource();
        source.buffer = this.clickAudioBuffer;

        // Create a gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.6 * this.masterVolume; // Apply master volume

        // Connect: source -> gain -> destination
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Play immediately
        source.start(0);
        console.log('[AudioManager] Playing click sound via Web Audio API');
        return;
      } catch (error) {
        console.warn('Web Audio API playback failed, falling back to HTMLAudioElement:', error);
      }
    }

    // Fallback to HTMLAudioElement if Web Audio API is not available
    if (!this.ensureAudioReady() || !this.clickAudio) {
      console.log('[AudioManager] Click sound not ready');
      return;
    }

    // Reset to beginning if already playing
    this.clickAudio.currentTime = 0;

    // Apply master volume
    this.clickAudio.volume = 0.6 * this.masterVolume;

    // Play the click sound immediately (non-blocking)
    console.log('[AudioManager] Playing click sound via HTMLAudioElement (fallback)');
    this.clickAudio.play().catch(error => {
      console.warn('Could not play click sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    });
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
      this.homeAudio.volume = normalizedVolume * 0.075; // Keep home at 7.5% (increased by 50% from 5%)
    }
    if (this.buzzAudio) {
      this.buzzAudio.volume = normalizedVolume * 0.75; // Keep buzz at 75% (increased by 50% from 0.5)
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
      console.log('[AudioManager] Immersive mode ON - unmuting audio and restarting home sound');
      // When turning on immersive mode, automatically unmute
      if (this.isMuted) {
        this.setMute(false);
      }
      // Restart the background hum
      this.playHomeSound().catch(err => {
        console.log('Home sound playback prevented by browser:', err);
      });
    } else {
      console.log('[AudioManager] Immersive mode OFF - muting and stopping all sounds');
      // When turning off immersive mode, mute and stop all sounds
      this.setMute(true);
      this.stopAll();
    }

    // Save state to localStorage
    this.saveImmersiveState();

    return this.isImmersive;
  }

  public setImmersive(immersive: boolean): void {
    this.isImmersive = immersive;

    if (this.isImmersive) {
      // When turning on immersive mode, automatically unmute
      if (this.isMuted) {
        this.setMute(false);
      }
      // Restart the background hum
      this.playHomeSound().catch(err => {
        console.log('Home sound playback prevented by browser:', err);
      });
    } else {
      // When turning off immersive mode, mute and stop all sounds
      this.setMute(true);
      this.stopAll();
    }

    // Save state to localStorage
    this.saveImmersiveState();
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

  // Music control methods
  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    console.log('[AudioManager] Music toggled:', this.musicEnabled);

    // If music is disabled, stop the home sound
    if (!this.musicEnabled && this.homeAudio) {
      this.homeAudio.pause();
    } else if (this.musicEnabled && this.isImmersive && !this.isMuted) {
      // If music is enabled and immersive mode is on, restart home sound
      this.ensureHomeSoundPlaying();
    }

    this.saveAudioSettings();
    return this.musicEnabled;
  }

  public setMusic(enabled: boolean): void {
    this.musicEnabled = enabled;
    console.log('[AudioManager] Music set to:', this.musicEnabled);

    // If music is disabled, stop the home sound
    if (!this.musicEnabled && this.homeAudio) {
      this.homeAudio.pause();
    } else if (this.musicEnabled && this.isImmersive && !this.isMuted) {
      // If music is enabled and immersive mode is on, restart home sound
      this.ensureHomeSoundPlaying();
    }

    this.saveAudioSettings();
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  // Sound effects control methods
  public toggleSounds(): boolean {
    this.soundsEnabled = !this.soundsEnabled;
    console.log('[AudioManager] Sound effects toggled:', this.soundsEnabled);
    this.saveAudioSettings();
    return this.soundsEnabled;
  }

  public setSounds(enabled: boolean): void {
    this.soundsEnabled = enabled;
    console.log('[AudioManager] Sound effects set to:', this.soundsEnabled);
    this.saveAudioSettings();
  }

  public isSoundsEnabled(): boolean {
    return this.soundsEnabled;
  }

  // Master volume control methods
  public setMasterVolume(volume: number): void {
    // Clamp volume between 0 and 1
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log('[AudioManager] Master volume set to:', this.masterVolume);

    // Update all audio elements with new volume
    if (this.homeAudio) {
      this.homeAudio.volume = 0.075 * this.masterVolume;
    }
    if (this.flashAudio) {
      this.flashAudio.volume = 0.9 * this.masterVolume;
    }
    if (this.challengerAudio) {
      this.challengerAudio.volume = 0.4 * this.masterVolume;
    }
    if (this.buzzAudio) {
      this.buzzAudio.volume = 1.0 * this.masterVolume;
    }
    if (this.clickAudio) {
      this.clickAudio.volume = 0.6 * this.masterVolume;
    }

    this.saveAudioSettings();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public getMasterVolumePercent(): number {
    return Math.round(this.masterVolume * 100);
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();