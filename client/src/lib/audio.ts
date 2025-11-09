import newChallengerSound from "@assets/new_challenger_1757850442377.mp3";
import flashSound from "@assets/flash_1757855169590.mp3";
import raffleWinnerSound from "@assets/raffle_winner.mp3";
import homeSoundFile from "@assets/home_sound.mp3";
import buzzSoundFile from "@assets/buzz.mp3";
import clickSoundFile from "@assets/click.mp3";
import triviaEnterSoundFile from "@assets/enter_ring.mp3";
import pitchEnterSoundFile from "@assets/project_pitch.mp3";

export const MUSIC_VOLUME_CHANGE_EVENT = "data3:music-volume-change";

// Audio manager for playing sound effects
export class AudioManager {
  private static instance: AudioManager;
  private challengerAudio: HTMLAudioElement | null = null;
  private flashAudio: HTMLAudioElement | null = null;
  private raffleWinnerAudio: HTMLAudioElement | null = null;
  private homeAudio: HTMLAudioElement | null = null;
  private buzzAudio: HTMLAudioElement | null = null;
  private clickAudio: HTMLAudioElement | null = null;
  private triviaEnterAudio: HTMLAudioElement | null = null;
  private pitchEnterAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private clickAudioBuffer: AudioBuffer | null = null;
  private homeAudioGainNode: GainNode | null = null;
  private homeAudioSourceNode: MediaElementAudioSourceNode | null = null;
  private isAudioSupported: boolean;
  private isMuted: boolean = true; // Default to muted (OFF)
  private isImmersive: boolean = false; // Will be loaded from localStorage
  private musicEnabled: boolean = true; // Music on/off
  private soundsEnabled: boolean = true; // Sound effects on/off
  private musicVolume: number = 1.0; // Music/video volume relative to sound effects (0.0 to 1.0, default 100%)
  private volumeControlSupported: boolean = true; // Whether programmatic volume control is supported
  private useWebAudioForVolume: boolean = false; // Whether to use Web Audio API for volume control on mobile
  private dispatchMusicVolumeChange(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(MUSIC_VOLUME_CHANGE_EVENT, {
        detail: this.musicVolume,
      })
    );
  }

  private constructor() {
    this.isAudioSupported = typeof window !== "undefined" && typeof Audio !== "undefined";

    if (!this.isAudioSupported) {
      return;
    }

    // Load immersive mode state from localStorage
    this.loadImmersiveState();

    // IMPORTANT: Initialize Web Audio and detect volume control support BEFORE initializing audio elements
    // This ensures that on mobile devices, we know to use Web Audio API before creating the audio elements
    this.initializeWebAudio();
    this.detectVolumeControlSupport();

    // Now initialize audio elements with the correct volume control method
    this.initializeAudioElements();
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

      // Load music volume (relative to sound effects)
      const volumeState = localStorage.getItem('musicVolume');
      if (volumeState !== null) {
        this.musicVolume = parseFloat(volumeState);
        if (isNaN(this.musicVolume) || this.musicVolume < 0 || this.musicVolume > 1) {
          this.musicVolume = 1.0;
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
      localStorage.setItem('musicVolume', String(this.musicVolume));
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
      this.challengerAudio.volume = 0.2; // Reduced by 50% to 0.2
      this.challengerAudio.muted = this.isMuted;
    }

    if (!this.flashAudio) {
      this.flashAudio = new Audio(flashSound);
      this.flashAudio.preload = "auto";
      this.flashAudio.volume = 0.45; // Reduced by 50% from 0.9
      this.flashAudio.muted = this.isMuted;
    }

    if (!this.raffleWinnerAudio) {
      this.raffleWinnerAudio = new Audio(raffleWinnerSound);
      this.raffleWinnerAudio.preload = "auto";
      this.raffleWinnerAudio.volume = 0.9; // Doubled from 0.45 for extra impact
      this.raffleWinnerAudio.muted = this.isMuted;
    }

    if (!this.homeAudio) {
      this.homeAudio = new Audio(homeSoundFile);
      this.homeAudio.preload = "auto";
      this.homeAudio.volume = this.useWebAudioForVolume ? 1.0 : 0.075 * this.musicVolume; // Use full volume if Web Audio API will control it
      this.homeAudio.loop = true; // Loop continuously
      this.homeAudio.muted = this.isMuted;

      // Set up Web Audio API routing for volume control on mobile
      if (this.useWebAudioForVolume && this.audioContext) {
        try {
          // Create a MediaElementSourceNode from the audio element
          this.homeAudioSourceNode = this.audioContext.createMediaElementSource(this.homeAudio);

          // Create a GainNode for volume control
          this.homeAudioGainNode = this.audioContext.createGain();
          this.homeAudioGainNode.gain.value = 0.075 * this.musicVolume; // 7.5% volume with music volume applied

          // Connect: source -> gain -> destination
          this.homeAudioSourceNode.connect(this.homeAudioGainNode);
          this.homeAudioGainNode.connect(this.audioContext.destination);

          console.log('[AudioManager] Home audio routed through Web Audio API for volume control');
        } catch (error) {
          console.warn('[AudioManager] Failed to set up Web Audio API routing for home audio:', error);
          // Fall back to direct volume control
          this.homeAudio.volume = 0.075 * this.musicVolume;
        }
      }
    }

    if (!this.buzzAudio) {
      this.buzzAudio = new Audio(buzzSoundFile);
      this.buzzAudio.preload = "auto";
      this.buzzAudio.volume = 0.7; // 70% volume (reduced by 30% from 1.0)
      this.buzzAudio.muted = this.isMuted;
    }

    if (!this.clickAudio) {
      this.clickAudio = new Audio(clickSoundFile);
      this.clickAudio.preload = "auto";
      this.clickAudio.volume = 0.6; // 60% volume - crisp but not overwhelming
      this.clickAudio.muted = this.isMuted;
    }

    if (!this.triviaEnterAudio) {
      this.triviaEnterAudio = new Audio(triviaEnterSoundFile);
      this.triviaEnterAudio.preload = "auto";
      this.triviaEnterAudio.volume = 0.2; // Same as challenger sound
      this.triviaEnterAudio.muted = this.isMuted;
    }

    if (!this.pitchEnterAudio) {
      this.pitchEnterAudio = new Audio(pitchEnterSoundFile);
      this.pitchEnterAudio.preload = "auto";
      this.pitchEnterAudio.volume = 0.2; // Same as challenger sound
      this.pitchEnterAudio.muted = this.isMuted;
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

  private detectVolumeControlSupport(): void {
    // Test if programmatic volume control is supported
    // On iOS and some mobile browsers, the volume property accepts values but doesn't actually control playback
    // However, we can use Web Audio API with GainNode as a workaround on mobile devices
    try {
      const userAgent = navigator.userAgent;

      // Check for iOS devices (iPhone, iPad, iPod)
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);

      // Check for Android devices
      const isAndroid = /Android/.test(userAgent);

      // Check for mobile browsers in general
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      // On mobile devices, use Web Audio API with GainNode for volume control
      // This works on iOS, Android, and other mobile browsers
      if (isIOS || isAndroid || isMobile) {
        this.useWebAudioForVolume = true;
        this.volumeControlSupported = true; // We can control volume via Web Audio API
        console.log('[AudioManager] Using Web Audio API for volume control on mobile device');
        return;
      }

      // For desktop browsers, test if volume property can actually be changed
      const testAudio = new Audio();
      const originalVolume = testAudio.volume;
      testAudio.volume = 0.5;

      // Check if the volume actually changed
      if (Math.abs(testAudio.volume - 0.5) > 0.01) {
        // Volume didn't change, programmatic control is not supported
        this.volumeControlSupported = false;
        console.log('[AudioManager] Programmatic volume control not supported on this device');
      } else {
        this.volumeControlSupported = true;
        console.log('[AudioManager] Programmatic volume control is supported');
      }

      // Restore original volume
      testAudio.volume = originalVolume;
    } catch (error) {
      console.warn('[AudioManager] Error detecting volume control support:', error);
      this.volumeControlSupported = false;
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

    if (!this.challengerAudio || !this.flashAudio || !this.raffleWinnerAudio || !this.homeAudio || !this.buzzAudio || !this.clickAudio) {
      this.initializeAudioElements();
    }

    return Boolean(this.challengerAudio && this.flashAudio && this.raffleWinnerAudio && this.homeAudio && this.buzzAudio && this.clickAudio);
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

      // Sound effects are NOT affected by music volume - stay at full volume
      this.flashAudio.volume = 0.45;

      // Play the flash sound immediately
      await this.flashAudio.play();
    } catch (error) {
      console.warn('Could not play flash sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public async playRaffleWinnerSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.raffleWinnerAudio || this.isMuted) return;

    // Don't play if sounds are disabled
    if (!this.soundsEnabled) {
      console.log('[AudioManager] Raffle winner sound skipped - sound effects are disabled');
      return;
    }

    try {
      // Reset to beginning if already playing
      this.raffleWinnerAudio.currentTime = 0;

      // Sound effects are NOT affected by music volume - stay at full volume
      this.raffleWinnerAudio.volume = 0.9;

      // Play the raffle winner sound immediately
      await this.raffleWinnerAudio.play();
    } catch (error) {
      console.warn('Could not play raffle winner sound:', error);
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

      // Sound effects are NOT affected by music volume - stay at full volume
      this.challengerAudio.volume = 0.2;

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

      // Apply music volume
      if (this.useWebAudioForVolume && this.homeAudioGainNode) {
        // Use Web Audio API GainNode for volume control (mobile)
        this.homeAudioGainNode.gain.value = 0.075 * this.musicVolume;
      } else {
        // Use direct volume property (desktop)
        this.homeAudio.volume = 0.075 * this.musicVolume;
      }

      // Resume AudioContext if suspended (required for mobile)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

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

      // Apply music volume before playing
      if (this.useWebAudioForVolume && this.homeAudioGainNode) {
        // Use Web Audio API GainNode for volume control (mobile)
        this.homeAudioGainNode.gain.value = 0.075 * this.musicVolume;
      } else {
        // Use direct volume property (desktop)
        this.homeAudio.volume = 0.075 * this.musicVolume;
      }

      // Resume AudioContext if suspended (required for mobile)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('Could not resume AudioContext:', err);
        });
      }

      this.homeAudio.play().catch(err => {
        console.warn('Could not restart home sound:', err);
      });
    }
  }

  /**
   * Pause background music temporarily (e.g., for video playback)
   * This only pauses the music, does not change immersive mode or muted state
   */
  public pauseBackgroundMusic(): void {
    if (!this.homeAudio) return;

    if (!this.homeAudio.paused) {
      console.log('[AudioManager] Pausing background music for video playback');
      this.homeAudio.pause();
    }
  }

  /**
   * Resume background music after temporary pause (e.g., after video playback)
   * This will only resume if immersive mode is on and music is enabled
   */
  public resumeBackgroundMusic(): void {
    if (!this.ensureAudioReady() || !this.homeAudio) return;

    // Only resume if immersive mode is on and not muted and music is enabled
    if (!this.isImmersive || this.isMuted || !this.musicEnabled) {
      console.log('[AudioManager] Not resuming background music - immersive mode off or music disabled');
      return;
    }

    if (this.homeAudio.paused) {
      console.log('[AudioManager] Resuming background music after video playback');

      // Apply music volume before playing
      if (this.useWebAudioForVolume && this.homeAudioGainNode) {
        // Use Web Audio API GainNode for volume control (mobile)
        this.homeAudioGainNode.gain.value = 0.075 * this.musicVolume;
      } else {
        // Use direct volume property (desktop)
        this.homeAudio.volume = 0.075 * this.musicVolume;
      }

      // Resume AudioContext if suspended (required for mobile)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('Could not resume AudioContext:', err);
        });
      }

      this.homeAudio.play().catch(err => {
        console.warn('Could not resume background music:', err);
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
      // If the audio element has an error, reload it to reset the state
      if (this.buzzAudio.error) {
        console.log('[AudioManager] Buzz audio in error state, reloading...');
        this.buzzAudio.load();
      }

      // Reset to beginning if already playing
      this.buzzAudio.currentTime = 0;

      // Sound effects are NOT affected by music volume - stay at full volume
      this.buzzAudio.volume = 0.7;

      // Play the buzz sound
      await this.buzzAudio.play();
      console.log('[AudioManager] Playing buzz sound');
    } catch (error) {
      console.warn('Could not play buzz sound:', error);
      // Try to recover by reloading the audio element for next time
      try {
        this.buzzAudio.load();
      } catch (loadError) {
        console.warn('Could not reload buzz audio:', loadError);
      }
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
        gainNode.gain.value = 0.6; // Sound effects are NOT affected by music volume

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

    // Sound effects are NOT affected by music volume - stay at full volume
    this.clickAudio.volume = 0.6;

    // Play the click sound immediately (non-blocking)
    console.log('[AudioManager] Playing click sound via HTMLAudioElement (fallback)');
    this.clickAudio.play().catch(error => {
      console.warn('Could not play click sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    });
  }

  public async playTriviaEnterSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.triviaEnterAudio || this.isMuted) return;

    // Don't play if sounds are disabled
    if (!this.soundsEnabled) {
      console.log('[AudioManager] Trivia enter sound skipped - sound effects are disabled');
      return;
    }

    try {
      // Reset to beginning if already playing
      this.triviaEnterAudio.currentTime = 0;

      // Sound effects are NOT affected by music volume - stay at full volume
      this.triviaEnterAudio.volume = 0.2;

      // Play the trivia enter sound
      await this.triviaEnterAudio.play();
    } catch (error) {
      console.warn('Could not play trivia enter sound:', error);
      // Don't throw error - audio failure shouldn't break the app
    }
  }

  public async playPitchEnterSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.pitchEnterAudio || this.isMuted) return;

    // Don't play if sounds are disabled
    if (!this.soundsEnabled) {
      console.log('[AudioManager] Pitch enter sound skipped - sound effects are disabled');
      return;
    }

    try {
      // Reset to beginning if already playing
      this.pitchEnterAudio.currentTime = 0;

      // Sound effects are NOT affected by music volume - stay at full volume
      this.pitchEnterAudio.volume = 0.2;

      // Play the pitch enter sound
      await this.pitchEnterAudio.play();
    } catch (error) {
      console.warn('Could not play pitch enter sound:', error);
      // Don't throw error - audio failure shouldn't break the app
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
    if (this.raffleWinnerAudio) {
      this.raffleWinnerAudio.muted = this.isMuted;
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
    if (this.triviaEnterAudio) {
      this.triviaEnterAudio.muted = this.isMuted;
    }
    if (this.pitchEnterAudio) {
      this.pitchEnterAudio.muted = this.isMuted;
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
    if (this.raffleWinnerAudio) {
      this.raffleWinnerAudio.pause();
      this.raffleWinnerAudio.currentTime = 0;
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
    if (this.triviaEnterAudio) {
      this.triviaEnterAudio.pause();
      this.triviaEnterAudio.currentTime = 0;
    }
    if (this.pitchEnterAudio) {
      this.pitchEnterAudio.pause();
      this.pitchEnterAudio.currentTime = 0;
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
    if (this.raffleWinnerAudio) {
      this.raffleWinnerAudio.load();
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
    if (this.triviaEnterAudio) {
      this.triviaEnterAudio.load();
    }
    if (this.pitchEnterAudio) {
      this.pitchEnterAudio.load();
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

  // Music/video volume control methods (relative to sound effects)
  public setMusicVolume(volume: number): void {
    // Clamp volume between 0 and 1
    this.musicVolume = Math.max(0, Math.min(1, volume));
    console.log('[AudioManager] Music/video volume set to:', this.musicVolume);

    // Ensure audio elements are ready before updating volume
    this.ensureAudioReady();

    // Update volume using Web Audio API GainNode on mobile, or direct volume property on desktop
    if (this.useWebAudioForVolume) {
      // Use Web Audio API GainNode for volume control (works on mobile)
      if (this.homeAudioGainNode) {
        const newVolume = 0.075 * this.musicVolume;
        this.homeAudioGainNode.gain.value = newVolume;
        console.log('[AudioManager] Home audio gain updated to:', this.homeAudioGainNode.gain.value,
          'via Web Audio API');
      }
    } else {
      // Use direct volume property control (desktop browsers)
      if (this.homeAudio) {
        const newVolume = 0.075 * this.musicVolume;
        this.homeAudio.volume = newVolume;
        console.log('[AudioManager] Home audio volume updated to:', this.homeAudio.volume,
          'playing:', !this.homeAudio.paused, 'muted:', this.homeAudio.muted);
      }
    }

    // If home audio should be playing but isn't, restart it
    if (this.homeAudio && this.isImmersive && !this.isMuted && this.musicEnabled && this.homeAudio.paused) {
      console.log('[AudioManager] Home audio was paused during volume change, restarting...');
      this.homeAudio.play().catch(err => {
        console.warn('Could not restart home sound after volume change:', err);
      });
    }

    // Dispatch event to update video and other audio elements
    this.dispatchMusicVolumeChange();

    // Save settings to localStorage
    this.saveAudioSettings();
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getMusicVolumePercent(): number {
    return Math.round(this.musicVolume * 100);
  }

  public isVolumeControlSupported(): boolean {
    return this.volumeControlSupported;
  }

  public isUsingWebAudioForVolume(): boolean {
    return this.useWebAudioForVolume;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Creates a GainNode-based volume control for an audio or video element
   * This is useful for components that need to control volume on mobile devices
   *
   * @param element The HTMLAudioElement or HTMLVideoElement to control
   * @param baseVolume The base volume level (0.0 to 1.0)
   * @returns An object with the GainNode and a cleanup function, or null if not using Web Audio
   */
  public createGainNodeForElement(
    element: HTMLAudioElement | HTMLVideoElement,
    baseVolume: number = 1.0
  ): { gainNode: GainNode; cleanup: () => void } | null {
    if (!this.useWebAudioForVolume || !this.audioContext) {
      return null;
    }

    try {
      // Create a MediaElementSourceNode from the element
      const sourceNode = this.audioContext.createMediaElementSource(element);

      // Create a GainNode for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = baseVolume * this.musicVolume;

      // Connect: source -> gain -> destination
      sourceNode.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      console.log('[AudioManager] Created GainNode for element, initial volume:', gainNode.gain.value);

      // Listen for volume changes and update the gain
      const handleVolumeChange = (event: Event) => {
        const customEvent = event as CustomEvent<number>;
        gainNode.gain.value = baseVolume * customEvent.detail;
        console.log('[AudioManager] GainNode volume updated to:', gainNode.gain.value);
      };

      window.addEventListener(MUSIC_VOLUME_CHANGE_EVENT, handleVolumeChange);

      // Return cleanup function
      const cleanup = () => {
        window.removeEventListener(MUSIC_VOLUME_CHANGE_EVENT, handleVolumeChange);
        sourceNode.disconnect();
        gainNode.disconnect();
      };

      return { gainNode, cleanup };
    } catch (error) {
      console.warn('[AudioManager] Failed to create GainNode for element:', error);
      return null;
    }
  }

  /**
   * Force play flash sound - bypasses immersive mode and muted state
   * This is used for critical announcements like the leaderboard
   */
  public async forcePlayFlashSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.flashAudio) return;

    try {
      // Temporarily unmute for this sound
      const wasMuted = this.flashAudio.muted;
      this.flashAudio.muted = false;

      // Reset to beginning if already playing
      this.flashAudio.currentTime = 0;

      // Set volume
      this.flashAudio.volume = 0.45;

      // Play the flash sound immediately
      await this.flashAudio.play();

      // Restore muted state after a delay (flash sound is short)
      setTimeout(() => {
        if (this.flashAudio) {
          this.flashAudio.muted = wasMuted;
        }
      }, 1000);

      console.log('[AudioManager] Force played flash sound (bypassed immersive filter)');
    } catch (error) {
      console.warn('Could not force play flash sound:', error);
      // Restore muted state even on error
      if (this.flashAudio) {
        this.flashAudio.muted = this.isMuted;
      }
    }
  }

  /**
   * Force play new challenger sound - bypasses immersive mode and muted state
   * This is used for critical announcements like the leaderboard
   */
  public async forcePlayNewChallengerSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.challengerAudio) return;

    try {
      // Temporarily unmute for this sound
      const wasMuted = this.challengerAudio.muted;
      this.challengerAudio.muted = false;

      // Reset to beginning if already playing
      this.challengerAudio.currentTime = 0;

      // Set volume
      this.challengerAudio.volume = 0.2;

      // Play the challenger sound
      await this.challengerAudio.play();

      // Restore muted state after sound duration (approximately 2 seconds)
      setTimeout(() => {
        if (this.challengerAudio) {
          this.challengerAudio.muted = wasMuted;
        }
      }, 2500);

      console.log('[AudioManager] Force played challenger sound (bypassed immersive filter)');
    } catch (error) {
      console.warn('Could not force play challenger sound:', error);
      // Restore muted state even on error
      if (this.challengerAudio) {
        this.challengerAudio.muted = this.isMuted;
      }
    }
  }

  /**
   * Force play trivia enter sound - bypasses immersive mode and muted state
   * This is used for critical announcements like the leaderboard
   */
  public async forcePlayTriviaEnterSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.triviaEnterAudio) return;

    try {
      // Temporarily unmute for this sound
      const wasMuted = this.triviaEnterAudio.muted;
      this.triviaEnterAudio.muted = false;

      // Reset to beginning if already playing
      this.triviaEnterAudio.currentTime = 0;

      // Set volume
      this.triviaEnterAudio.volume = 0.2;

      // Play the trivia enter sound
      await this.triviaEnterAudio.play();

      // Restore muted state after sound duration (approximately 2 seconds)
      setTimeout(() => {
        if (this.triviaEnterAudio) {
          this.triviaEnterAudio.muted = wasMuted;
        }
      }, 2500);

      console.log('[AudioManager] Force played trivia enter sound (bypassed immersive filter)');
    } catch (error) {
      console.warn('Could not force play trivia enter sound:', error);
      // Restore muted state even on error
      if (this.triviaEnterAudio) {
        this.triviaEnterAudio.muted = this.isMuted;
      }
    }
  }

  /**
   * Force play pitch enter sound - bypasses immersive mode and muted state
   * This is used for critical announcements like the leaderboard
   */
  public async forcePlayPitchEnterSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.pitchEnterAudio) return;

    try {
      // Temporarily unmute for this sound
      const wasMuted = this.pitchEnterAudio.muted;
      this.pitchEnterAudio.muted = false;

      // Reset to beginning if already playing
      this.pitchEnterAudio.currentTime = 0;

      // Set volume
      this.pitchEnterAudio.volume = 0.2;

      // Play the pitch enter sound
      await this.pitchEnterAudio.play();

      // Restore muted state after sound duration (approximately 2 seconds)
      setTimeout(() => {
        if (this.pitchEnterAudio) {
          this.pitchEnterAudio.muted = wasMuted;
        }
      }, 2500);

      console.log('[AudioManager] Force played pitch enter sound (bypassed immersive filter)');
    } catch (error) {
      console.warn('Could not force play pitch enter sound:', error);
      // Restore muted state even on error
      if (this.pitchEnterAudio) {
        this.pitchEnterAudio.muted = this.isMuted;
      }
    }
  }

  /**
   * Force play raffle winner sound - bypasses immersive mode and muted state
   * This is used for critical announcements like the leaderboard
   */
  public async forcePlayRaffleWinnerSound(): Promise<void> {
    if (!this.ensureAudioReady() || !this.raffleWinnerAudio) return;

    try {
      // Temporarily unmute for this sound
      const wasMuted = this.raffleWinnerAudio.muted;
      this.raffleWinnerAudio.muted = false;

      // Reset to beginning if already playing
      this.raffleWinnerAudio.currentTime = 0;

      // Set volume - doubled for extra impact
      this.raffleWinnerAudio.volume = 0.9;

      // Play the raffle winner sound
      await this.raffleWinnerAudio.play();

      // Restore muted state after sound duration (approximately 2 seconds)
      setTimeout(() => {
        if (this.raffleWinnerAudio) {
          this.raffleWinnerAudio.muted = wasMuted;
        }
      }, 2500);

      console.log('[AudioManager] Force played raffle winner sound (bypassed immersive filter)');
    } catch (error) {
      console.warn('Could not force play raffle winner sound:', error);
      // Restore muted state even on error
      if (this.raffleWinnerAudio) {
        this.raffleWinnerAudio.muted = this.isMuted;
      }
    }
  }
}

// Lazy-initialized singleton wrapper to avoid module load-time initialization issues
// This ensures AudioManager is only created when first accessed, preventing potential
// circular dependency and timing issues during module loading

// Use a class-based wrapper instead of object literal to avoid TDZ errors during bundling
// The object literal pattern with arrow functions can cause "Cannot access before initialization"
// errors when Vite/Rollup minifies and reorders the code
class AudioManagerWrapper {
  private instance: AudioManager | null = null;

  private getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = AudioManager.getInstance();
    }
    return this.instance;
  }

  playFlashSound() {
    return this.getInstance().playFlashSound();
  }

  playRaffleWinnerSound() {
    return this.getInstance().playRaffleWinnerSound();
  }

  playNewChallengerSound() {
    return this.getInstance().playNewChallengerSound();
  }

  playHomeSound() {
    return this.getInstance().playHomeSound();
  }

  ensureHomeSoundPlaying() {
    return this.getInstance().ensureHomeSoundPlaying();
  }

  pauseBackgroundMusic() {
    return this.getInstance().pauseBackgroundMusic();
  }

  resumeBackgroundMusic() {
    return this.getInstance().resumeBackgroundMusic();
  }

  playBuzzSound() {
    return this.getInstance().playBuzzSound();
  }

  playClickSound() {
    return this.getInstance().playClickSound();
  }

  setMute(muted: boolean) {
    return this.getInstance().setMute(muted);
  }

  isMutedState() {
    return this.getInstance().isMutedState();
  }

  toggleMute() {
    return this.getInstance().toggleMute();
  }

  setImmersive(enabled: boolean) {
    return this.getInstance().setImmersive(enabled);
  }

  isImmersiveMode() {
    return this.getInstance().isImmersiveMode();
  }

  toggleImmersive() {
    return this.getInstance().toggleImmersive();
  }

  setMusic(enabled: boolean) {
    return this.getInstance().setMusic(enabled);
  }

  isMusicEnabled() {
    return this.getInstance().isMusicEnabled();
  }

  toggleMusic() {
    return this.getInstance().toggleMusic();
  }

  setSounds(enabled: boolean) {
    return this.getInstance().setSounds(enabled);
  }

  isSoundsEnabled() {
    return this.getInstance().isSoundsEnabled();
  }

  toggleSounds() {
    return this.getInstance().toggleSounds();
  }

  setMusicVolume(volume: number) {
    return this.getInstance().setMusicVolume(volume);
  }

  getMusicVolume() {
    return this.getInstance().getMusicVolume();
  }

  getMusicVolumePercent() {
    return this.getInstance().getMusicVolumePercent();
  }

  isVolumeControlSupported() {
    return this.getInstance().isVolumeControlSupported();
  }

  isUsingWebAudioForVolume() {
    return this.getInstance().isUsingWebAudioForVolume();
  }

  getAudioContext() {
    return this.getInstance().getAudioContext();
  }

  createGainNodeForElement(element: HTMLAudioElement | HTMLVideoElement, baseVolume?: number) {
    return this.getInstance().createGainNodeForElement(element, baseVolume);
  }

  stopAll() {
    return this.getInstance().stopAll();
  }

  preload() {
    return this.getInstance().preload();
  }

  forcePlayFlashSound() {
    return this.getInstance().forcePlayFlashSound();
  }

  forcePlayNewChallengerSound() {
    return this.getInstance().forcePlayNewChallengerSound();
  }

  playTriviaEnterSound() {
    return this.getInstance().playTriviaEnterSound();
  }

  playPitchEnterSound() {
    return this.getInstance().playPitchEnterSound();
  }

  forcePlayTriviaEnterSound() {
    return this.getInstance().forcePlayTriviaEnterSound();
  }

  forcePlayPitchEnterSound() {
    return this.getInstance().forcePlayPitchEnterSound();
  }

  forcePlayRaffleWinnerSound() {
    return this.getInstance().forcePlayRaffleWinnerSound();
  }
}

// Export a single instance that will be shared across all imports
export const audioManager = new AudioManagerWrapper();