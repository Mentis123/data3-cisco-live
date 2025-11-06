import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createConfetti, triggerFlashAndRise } from "@/lib/anim";
import { audioManager } from "@/lib/audio";

interface RaffleWinnerRevealProps {
  initials: string;
  totalScore: number;
  category: string;
  onComplete: () => void;
}

export function RaffleWinnerReveal({
  initials,
  totalScore,
  category,
  onComplete,
}: RaffleWinnerRevealProps) {
  const [phase, setPhase] = useState<"video" | "spotlight" | "reveal" | "celebrate">("video");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Pause background music during the reveal
    audioManager.pauseBackgroundMusic();

    // Play the video
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
        // If video fails, skip to spotlight phase
        setTimeout(() => setPhase("spotlight"), 500);
      });
    }

    return () => {
      // Resume background music when component unmounts
      audioManager.resumeBackgroundMusic();
    };
  }, []);

  const handleVideoEnd = () => {
    setPhase("spotlight");
    // Wait for spotlight animation, then reveal
    setTimeout(() => {
      setPhase("reveal");
      // Trigger celebration effects
      setTimeout(() => {
        setPhase("celebrate");
        triggerFlashAndRise(() => {});
        createConfetti();
        audioManager.playFlashSound();
      }, 800);
    }, 2000);
  };

  // After celebration, hold for a bit then fade out
  useEffect(() => {
    if (phase === "celebrate") {
      const timer = setTimeout(() => {
        onComplete();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Video Phase with Arcade Frame */}
        {phase === "video" && (
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Arcade Frame Border */}
            <div className="relative w-[90vw] h-[90vh] max-w-[1200px] max-h-[800px]">
              {/* Outer retro frame with multiple borders */}
              <div className="absolute inset-0 border-8 border-yellow-400 rounded-lg shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
              <div className="absolute inset-2 border-4 border-purple-500 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
              <div className="absolute inset-4 border-4 border-cyan-400 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.6)]" />

              {/* Corner decorations - arcade style */}
              <div className="absolute -top-2 -left-2 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg border-4 border-yellow-300" />
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg border-4 border-purple-300" />
              <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg border-4 border-cyan-300" />
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg border-4 border-green-300" />

              {/* Video container */}
              <div className="absolute inset-8 bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src="/videos/wheel_spin.mp4"
                  className="w-full h-full object-contain"
                  onEnded={handleVideoEnd}
                  playsInline
                  muted={false}
                />
              </div>

              {/* Pulsing glow effect */}
              <div className="absolute inset-0 rounded-lg animate-pulse pointer-events-none">
                <div className="absolute inset-0 border-4 border-yellow-300 rounded-lg opacity-50 blur-xl" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Spotlight Phase */}
        {phase === "spotlight" && (
          <motion.div
            className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Spotlight beam effect */}
            <motion.div
              className="absolute top-0 w-[600px] h-full"
              style={{
                background: "radial-gradient(ellipse 300px 100% at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 70%)",
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </motion.div>
        )}

        {/* Winner Reveal Phase */}
        {(phase === "reveal" || phase === "celebrate") && (
          <motion.div
            className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Spotlight beam (persistent) */}
            <div
              className="absolute top-0 w-[800px] h-full pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 400px 100% at 50% 0%, rgba(255,255,255,0.2) 0%, transparent 70%)",
              }}
            />

            {/* Winner Card */}
            <motion.div
              className="relative z-10"
              initial={{ y: "100vh", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                duration: 1.2,
              }}
            >
              <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl border-4 border-yellow-400 p-12 min-w-[600px]">
                {/* Glow effect behind card */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-purple-500/20 rounded-3xl blur-3xl -z-10" />

                {/* Winner Badge */}
                <motion.div
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-black font-black text-2xl px-8 py-3 rounded-full border-4 border-yellow-300 shadow-xl"
                  animate={
                    phase === "celebrate"
                      ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    repeat: phase === "celebrate" ? Infinity : 0,
                    repeatDelay: 0.5,
                  }}
                >
                  🏆 RAFFLE WINNER 🏆
                </motion.div>

                {/* Initials - Giant Display */}
                <div className="text-center mb-8 mt-8">
                  <motion.div
                    className="text-9xl font-black bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl"
                    style={{
                      textShadow: "0 0 40px rgba(250, 204, 21, 0.6)",
                      letterSpacing: "0.1em",
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      damping: 12,
                      stiffness: 100,
                      delay: 0.3,
                    }}
                  >
                    {initials}
                  </motion.div>
                </div>

                {/* Score Badge */}
                <motion.div
                  className="flex justify-center mb-8"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", damping: 10 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-60" />
                    <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-4xl px-10 py-6 rounded-full border-4 border-purple-400 shadow-xl">
                      <div className="text-sm uppercase tracking-wider opacity-80 mb-1">
                        Total Score
                      </div>
                      <div className="text-5xl font-black">
                        {totalScore.toLocaleString()}
                      </div>
                      <div className="text-sm uppercase tracking-wider opacity-80 mt-1">
                        Points
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Category Ribbon */}
                <motion.div
                  className="relative"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                >
                  <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white font-bold text-2xl px-8 py-4 text-center rounded-xl border-4 border-cyan-300 shadow-lg">
                    <div className="text-sm uppercase tracking-wider opacity-90 mb-1">
                      Category
                    </div>
                    <div className="text-3xl font-black">{category}</div>
                  </div>
                </motion.div>

                {/* Corner decorations on card */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-yellow-400 rounded-full" />
                <div className="absolute top-4 right-4 w-3 h-3 bg-yellow-400 rounded-full" />
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-yellow-400 rounded-full" />
                <div className="absolute bottom-4 right-4 w-3 h-3 bg-yellow-400 rounded-full" />
              </div>
            </motion.div>

            {/* Celebration particle effects */}
            {phase === "celebrate" && (
              <>
                {/* Sparkle effects around the card */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4 bg-yellow-400 rounded-full"
                    style={{
                      left: `${50 + (Math.random() - 0.5) * 60}%`,
                      top: `${50 + (Math.random() - 0.5) * 40}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      y: [0, -100 - Math.random() * 100],
                      x: [(Math.random() - 0.5) * 200],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
