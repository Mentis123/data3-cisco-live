import { Link } from "wouter";
import { useEffect, useRef } from "react";

import { Data3Logo } from "@/components/Data3Logo";
import ringImage from "@assets/ringfull.jpg";
import dojoImage from "@assets/dojofull.jpg";
import leaderboardImage from "@assets/leaderboardfull.jpg";
import howitworksImage from "@assets/howitworksfull.jpg";

// Claude: Removed unused data constants (categories, howItWorks, scoringTiers, quickRules, microFaq)
// These sections have been moved to the HowToPlay ("Learn") page as per UX refactor brief

export default function Home() {
  const autoScrollTimeoutRef = useRef<number | null>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);
  const userHasScrolledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioReadyRef = useRef(false);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sliding_stone.mp3');
    audioRef.current.volume = 0.8;
    audioRef.current.playbackRate = 0.9; // Play at 90% speed

    // For mobile browsers, we need to prime the audio on user interaction
    const enableAudio = () => {
      if (audioRef.current && !audioReadyRef.current) {
        // Load the audio to prepare it for playback
        audioRef.current.load();
        audioReadyRef.current = true;
      }
    };

    // Listen for first user interaction to enable audio (required for mobile)
    document.addEventListener('touchstart', enableAudio, { once: true });
    document.addEventListener('click', enableAudio, { once: true });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('touchstart', enableAudio);
      document.removeEventListener('click', enableAudio);
    };
  }, []);

  // Smooth half-speed scrolling effect
  useEffect(() => {
    let isScrolling = false;
    let targetScrollY = window.scrollY;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Reduce scroll speed to half
      const delta = e.deltaY * 0.5;
      targetScrollY += delta;
      targetScrollY = Math.max(0, Math.min(targetScrollY, document.documentElement.scrollHeight - window.innerHeight));

      if (!isScrolling) {
        isScrolling = true;
        smoothScrollTo(targetScrollY);
      }
    };

    const smoothScrollTo = (target: number) => {
      const start = window.scrollY;
      const distance = target - start;
      const duration = 300; // milliseconds for smooth animation
      let startTime: number | null = null;

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        window.scrollTo(0, start + distance * easeProgress);

        if (progress < 1) {
          requestAnimationFrame(animation);
        } else {
          isScrolling = false;
          // Check if we need to continue scrolling
          if (Math.abs(window.scrollY - targetScrollY) > 1) {
            isScrolling = true;
            smoothScrollTo(targetScrollY);
          }
        }
      };

      requestAnimationFrame(animation);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    // Check if this is the first visit to the page (during this session)
    const hasAutoScrolled = sessionStorage.getItem('hasAutoScrolled');

    if (hasAutoScrolled) {
      return; // Don't auto-scroll if we've already done it this session
    }

    // Detect if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);

    const startAutoScroll = () => {
      if (!userHasScrolledRef.current) {
        // Play audio 350ms after autoscroll starts
        setTimeout(() => {
          if (audioRef.current && !userHasScrolledRef.current) {
            audioRef.current.play().catch(err => {
              console.log('Audio playback prevented by browser:', err);
            });
          }
        }, 350);

        // Slow scroll down
        let scrollAmount = 0;
        autoScrollIntervalRef.current = window.setInterval(() => {
          if (!userHasScrolledRef.current) {
            scrollAmount += 1;
            window.scrollBy(0, 1);

            // Stop after scrolling ~300px or reaching bottom
            if (scrollAmount >= 300 || (window.innerHeight + window.scrollY) >= document.body.scrollHeight) {
              if (autoScrollIntervalRef.current) {
                clearInterval(autoScrollIntervalRef.current);
              }
            }
          } else {
            if (autoScrollIntervalRef.current) {
              clearInterval(autoScrollIntervalRef.current);
            }
          }
        }, 20); // Scroll 1px every 20ms = 50px per second (slow scroll)
      }
    };

    // Listen for user scroll
    const handleUserScroll = () => {
      userHasScrolledRef.current = true;

      // Clear any ongoing auto-scroll
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      // Mark that we've shown the auto-scroll feature
      sessionStorage.setItem('hasAutoScrolled', 'true');

      // Remove the listener since we don't need it anymore
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
      window.removeEventListener('keydown', handleUserScroll);
    };

    window.addEventListener('wheel', handleUserScroll, { passive: true });
    window.addEventListener('touchmove', handleUserScroll, { passive: true });
    window.addEventListener('keydown', handleUserScroll);

    if (isMobile) {
      // On mobile, wait for user interaction before auto-scrolling
      const startOnInteraction = () => {
        setTimeout(startAutoScroll, 300); // Brief delay after interaction
      };

      document.addEventListener('touchstart', startOnInteraction, { once: true });

      // Cleanup
      return () => {
        document.removeEventListener('touchstart', startOnInteraction);
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
        }
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
        window.removeEventListener('wheel', handleUserScroll);
        window.removeEventListener('touchmove', handleUserScroll);
        window.removeEventListener('keydown', handleUserScroll);
      };
    } else {
      // On desktop, start auto-scroll after 2 seconds as normal
      autoScrollTimeoutRef.current = window.setTimeout(startAutoScroll, 2000);

      // Cleanup
      return () => {
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
        }
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
        window.removeEventListener('wheel', handleUserScroll);
        window.removeEventListener('touchmove', handleUserScroll);
        window.removeEventListener('keydown', handleUserScroll);
      };
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-32 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        {/* Hero Section: Data3 Logo (left) + Tagline (center) + Cisco Live Logo (right) */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          <img
            src="/Data3_Logo_Blue_Blue_Boxed-01.png"
            alt="Data#3"
            className="h-12 w-auto sm:h-16 md:h-20 lg:h-24 flex-shrink-0"
            style={{ minWidth: "50px" }}
          />
          <h1 className="text-center text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-data3-white font-light tracking-wide flex-1 min-w-0 px-2 sm:px-4 leading-snug">
            Delivering the Digital Future
          </h1>
          <img
            src="/cisco_live.png"
            alt="Cisco Live"
            className="h-12 w-auto sm:h-16 md:h-20 lg:h-24 flex-shrink-0"
            style={{ minWidth: "50px" }}
          />
        </div>

        {/* "Beat the Bot" Section */}
        <section className="space-y-6 text-center">
          <p className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-data3-pale-blue">
            Beat the Bot
          </p>
          <div className="space-y-2">
            <p className="text-lg sm:text-xl text-data3-white/90">Practice in the Dojo.</p>
            <p className="text-lg sm:text-xl text-data3-white/90">Hit the Ring when you're ready.</p>
            <p className="text-lg sm:text-xl text-data3-white/90">Every win is a raffle entry.</p>
          </div>
        </section>

        {/* Hero Tiles Grid - Claude: Keep the 4 main navigation tiles */}
        <section className="space-y-8">
          <div className="mx-auto grid w-full max-w-2xl gap-4 sm:gap-5 sm:grid-cols-2">
            <Link href="/dojo" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-cool-purple/5 via-data3-cool-purple/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-cool-purple/40 group-hover:shadow-[0_0_30px_rgba(115,0,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={dojoImage} alt="Training Dojo" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-white drop-shadow-lg">Training Dojo</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-blue/5 via-data3-blue/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-light-blue/40 group-hover:shadow-[0_0_30px_rgba(0,174,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={ringImage} alt="Enter the Ring" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-blue-black drop-shadow-md">Enter the Ring</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/how-to-play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-light-blue/5 via-data3-light-blue/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-aqua/40 group-hover:shadow-[0_0_30px_rgba(0,255,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={howitworksImage} alt="How it works" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-white drop-shadow-lg">How to Play</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/leaderboard" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-magenta/5 via-data3-magenta/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-magenta/40 group-hover:shadow-[0_0_30px_rgba(255,0,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={leaderboardImage} alt="View Leaderboard" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-blue-black drop-shadow-lg">View Leaderboard</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
        {/* Steps Section */}
        <section className="space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-data3-white">
            Three Moves to Enter
          </h2>
          <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl border border-data3-pale-blue/20 bg-white/5 backdrop-blur">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-2xl font-bold">
                1
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-data3-white">Answer five trivia</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl border border-data3-pale-blue/20 bg-white/5 backdrop-blur">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-bold">
                2
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-data3-white">Pitch your project</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl border border-data3-pale-blue/20 bg-white/5 backdrop-blur">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white text-2xl font-bold">
                3
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-data3-white">Beat the bot<br />Earn a raffle entry</p>
            </div>
          </div>
        </section>

        {/* Data#3 Branded Footer */}
        <footer className="border-t border-data3-pale-blue/20 pt-12 mt-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/Data3_Logo_Blue_Blue_Boxed-01.png"
                  alt="Data#3"
                  className="h-12 w-auto"
                />
                <Link href="/admin">
                  <button
                    className="px-2 py-1 text-transparent transition-colors hover:text-muted-foreground/10"
                    aria-label="Admin"
                    data-testid="button-secret-admin"
                  >
                    •
                  </button>
                </Link>
              </div>
              <p className="text-sm text-data3-pale-blue">
                <Data3Logo className="font-semibold" /> - Delivering the Digital Future
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-data3-light-blue font-bold text-sm uppercase tracking-wider">
                About <Data3Logo />
              </h4>
              <p className="text-sm text-data3-white/80 leading-relaxed">
                With 45+ years of experience, <Data3Logo className="font-semibold" /> is a leading Australian IT services provider focused on helping customers harness the power of people and technology for a better future.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-data3-light-blue font-bold text-sm uppercase tracking-wider">
                Learn More
              </h4>
              <a
                href="https://www.data3.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-data3-pale-blue hover:text-data3-light-blue transition-colors underline underline-offset-4"
              >
                www.data3.com
              </a>
              <p className="text-xs text-data3-grey mt-4">
                Grounded in Experience • Ever-Evolving • Human First
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-data3-pale-blue/10 text-center">
            <p className="text-sm text-data3-grey">
              © 2025 Data#3. Experience vibe coded by our resident{" "}
              <a
                href="https://www.linkedin.com/in/adam-aka-mentis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-data3-light-blue hover:text-data3-aqua underline underline-offset-4"
              >
                Tech Wizard
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
