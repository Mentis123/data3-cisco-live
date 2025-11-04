import { useEffect, useRef, useState } from "react";

import { audioManager, MUSIC_VOLUME_CHANGE_EVENT } from "@/lib/audio";

interface RingVideoModalProps {
  isWinner: boolean;
  onComplete: () => void;
}

export function RingVideoModal({ isWinner, onComplete }: RingVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldStartMuted, setShouldStartMuted] = useState(true);
  const gainNodeCleanupRef = useRef<(() => void) | null>(null);

  console.log('[RingVideoModal] Component mounted - isWinner:', isWinner);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      console.error('[RingVideoModal] Video ref is null!');
      return;
    }

    console.log('[RingVideoModal] Setting up video element. Current src:', video.src);

    // Add detailed loading event listeners for debugging
    const handleLoadStart = () => {
      console.log('[RingVideoModal] Video load started');
    };

    const handleLoadedMetadata = () => {
      console.log('[RingVideoModal] Video metadata loaded - duration:', video.duration);
    };

    const handleLoadedData = () => {
      console.log('[RingVideoModal] Video data loaded');
    };

    // Explicitly load the video to trigger loading
    console.log('[RingVideoModal] Calling video.load()');
    video.load();

    const handleCanPlay = () => {
      console.log('[RingVideoModal] Video can play - loading complete');
      setIsLoaded(true);

      // Pause background music so video audio is prioritized
      audioManager.pauseBackgroundMusic();

      // Set up Web Audio API for mobile or direct volume for desktop
      if (audioManager.isUsingWebAudioForVolume()) {
        // Use Web Audio API with GainNode for mobile volume control
        // IMPORTANT: Unmute the video so audio flows through Web Audio API graph
        video.muted = false;
        const result = audioManager.createGainNodeForElement(video, 1.0);
        if (result) {
          gainNodeCleanupRef.current = result.cleanup;
          console.log('[RingVideoModal] Using Web Audio API for video volume control');
        }
      } else {
        // Use direct volume property for desktop
        // Unmute the video so we can hear it through the video element
        video.muted = false;
        video.volume = audioManager.getMusicVolume();
        console.log('[RingVideoModal] Using direct volume control:', audioManager.getMusicVolume());
      }

      console.log('[RingVideoModal] Starting video playback...');
      // Ensure React doesn't immediately re-apply the muted attribute
      setShouldStartMuted(false);
      video.play().catch(err => {
        console.error('[RingVideoModal] Failed to play video:', err);
        // Resume background music and proceed anyway after a short delay
        audioManager.resumeBackgroundMusic();
        setTimeout(() => {
          console.log('[RingVideoModal] Completing due to playback error');
          onComplete();
        }, 1000);
      });
    };

    const handleEnded = () => {
      console.log('[RingVideoModal] Video playback ended - completing');
      audioManager.resumeBackgroundMusic();
      onComplete();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const error = target.error;
      console.error('[RingVideoModal] Video error:', {
        code: error?.code,
        message: error?.message,
        src: target.src
      });
      // Resume background music and proceed anyway after a short delay
      audioManager.resumeBackgroundMusic();
      setTimeout(() => {
        console.log('[RingVideoModal] Completing due to video load error');
        onComplete();
      }, 1000);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      if (gainNodeCleanupRef.current) {
        gainNodeCleanupRef.current();
        gainNodeCleanupRef.current = null;
      }
      // Resume background music when component unmounts (e.g., skip button clicked)
      audioManager.resumeBackgroundMusic();
    };
  }, [onComplete, isWinner]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only set up volume change listener if NOT using Web Audio API
    // (Web Audio API handles volume changes internally)
    if (audioManager.isUsingWebAudioForVolume()) {
      return;
    }

    const applyVolume = (volume: number) => {
      video.volume = Math.max(0, Math.min(1, volume));
    };

    applyVolume(audioManager.getMusicVolume());

    const handleVolumeChange = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      applyVolume(customEvent.detail);
    };

    window.addEventListener(MUSIC_VOLUME_CHANGE_EVENT, handleVolumeChange);

    return () => {
      window.removeEventListener(MUSIC_VOLUME_CHANGE_EVENT, handleVolumeChange);
    };
  }, []);

  const videoSrc = isWinner
    ? "/attached_assets/ring_winner.mp4"
    : "/attached_assets/ring_loser.mp4";

  console.log('[RingVideoModal] Rendering modal - src:', videoSrc, 'isLoaded:', isLoaded);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-data3-blue-black">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#00AEFF] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white text-xl">Loading video...</p>
            <p className="text-white text-sm opacity-70">Result: {isWinner ? 'Winner!' : 'Thanks for playing!'}</p>
          </div>
        </div>
      )}

      {/* Video container - 16:9 aspect ratio, fit to width, centered vertically */}
      <div className="w-full flex items-center justify-center px-4" style={{ height: '100vh' }}>
        <div className="relative w-full max-w-[90vw] mx-auto" style={{ aspectRatio: '16/9' }}>
          {/* Decorative frame matching site branding */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#00AEFF]/20 via-[#00AEFF]/40 to-[#00AEFF]/20 rounded-lg blur-xl"></div>
          <div className="absolute -inset-2 bg-gradient-to-r from-data3-blue-black via-[#00AEFF]/30 to-data3-blue-black rounded-lg"></div>

          {/* Video element - start muted to ensure autoplay works */}
          <video
            ref={videoRef}
            src={videoSrc}
            className="relative w-full h-full rounded-lg shadow-2xl object-contain bg-black"
            playsInline
            preload="auto"
            muted={shouldStartMuted}
          />
        </div>
      </div>

      {/* Skip button (appears after 2 seconds) */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 px-6 py-3 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg backdrop-blur-sm transition-all duration-200 opacity-0 animate-fade-in border border-gray-600"
        style={{ animationDelay: '2s', animationFillMode: 'forwards' }}
      >
        Skip <span className="ml-2">→</span>
      </button>
    </div>
  );
}
