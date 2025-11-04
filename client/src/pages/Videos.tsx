import { useState } from "react";
import { useLocation } from "wouter";
import { RingVideoModal } from "../components/RingVideoModal";

export default function Videos() {
  const [, setLocation] = useLocation();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  const handlePlayVideo = (winner: boolean) => {
    setIsWinner(winner);
    setShowVideoModal(true);
  };

  const handleVideoComplete = () => {
    setShowVideoModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setLocation("/")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold">Video Test Page</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Video Thumbnails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Winner Video */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Winner Video</h2>
            <div className="relative mb-4">
              <video
                className="w-full rounded-lg"
                poster="/attached_assets/ring_winner.mp4"
                muted
                playsInline
              >
                <source src="/attached_assets/ring_winner.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <svg
                  className="w-20 h-20 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => handlePlayVideo(true)}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              Play Winner Video
            </button>
            <p className="mt-3 text-sm text-gray-400">
              Plays when user's score beats the bot bar
            </p>
          </div>

          {/* Loser Video */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Loser Video</h2>
            <div className="relative mb-4">
              <video
                className="w-full rounded-lg"
                poster="/attached_assets/ring_loser.mp4"
                muted
                playsInline
              >
                <source src="/attached_assets/ring_loser.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <svg
                  className="w-20 h-20 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => handlePlayVideo(false)}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              Play Loser Video
            </button>
            <p className="mt-3 text-sm text-gray-400">
              Plays when user's score doesn't beat the bot bar
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">About This Test Page</h3>
          <p className="text-gray-300 mb-2">
            This page allows you to test the video playback experience on mobile devices.
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>Videos play in the same modal used after ring submissions</li>
            <li>Fullscreen mode with decorative frame matching site branding</li>
            <li>Skip button appears after 2 seconds</li>
            <li>Videos are optimized for mobile with Web Audio API volume control</li>
          </ul>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <RingVideoModal
          isWinner={isWinner}
          onComplete={handleVideoComplete}
        />
      )}
    </div>
  );
}
