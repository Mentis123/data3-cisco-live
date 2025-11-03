import { useEffect, useRef, useState } from "react";

import { audioManager, MUSIC_VOLUME_CHANGE_EVENT } from "@/lib/audio";

interface RingVideoModalProps {
  isWinner: boolean;
  onComplete: () => void;
}

export function RingVideoModal({ isWinner, onComplete }: RingVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const gainNodeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);

      // Set up Web Audio API for mobile or direct volume for desktop
      if (audioManager.isUsingWebAudioForVolume()) {
        // Use Web Audio API with GainNode for mobile volume control
        const result = audioManager.createGainNodeForElement(video, 1.0);
        if (result) {
          gainNodeCleanupRef.current = result.cleanup;
          console.log('[RingVideoModal] Using Web Audio API for video volume control');
        }
      } else {
        // Use direct volume property for desktop
        video.volume = audioManager.getMusicVolume();
      }

      video.play().catch(err => {
        console.error('Failed to play video:', err);
        // If video fails to play, proceed anyway after a short delay
        setTimeout(onComplete, 1000);
      });
    };

    const handleEnded = () => {
      onComplete();
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      // If video fails to load, proceed anyway after a short delay
      setTimeout(onComplete, 1000);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      if (gainNodeCleanupRef.current) {
        gainNodeCleanupRef.current();
        gainNodeCleanupRef.current = null;
      }
    };
  }, [onComplete]);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-data3-blue-black">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#00AEFF] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white text-xl">Loading...</p>
          </div>
        </div>
      )}

      {/* Video container - 16:9 aspect ratio, fit to width, centered vertically */}
      <div className="w-full flex items-center justify-center px-4" style={{ height: '100vh' }}>
        <div className="relative w-full max-w-[90vw] mx-auto" style={{ aspectRatio: '16/9' }}>
          {/* Decorative frame matching site branding */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#00AEFF]/20 via-[#00AEFF]/40 to-[#00AEFF]/20 rounded-lg blur-xl"></div>
          <div className="absolute -inset-2 bg-gradient-to-r from-data3-blue-black via-[#00AEFF]/30 to-data3-blue-black rounded-lg"></div>

          {/* Video element */}
          <video
            ref={videoRef}
            src={videoSrc}
            className="relative w-full h-full rounded-lg shadow-2xl object-contain bg-black"
            playsInline
            preload="auto"
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
