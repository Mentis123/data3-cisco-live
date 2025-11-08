import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsMenu } from "@/components/SettingsMenu";
import { ImmersiveToggle } from "@/components/VolumeToggle";
import { audioManager } from "@/lib/audio";
import { useEffect, useRef } from "react";
import Home from "@/pages/Home";
import Leaderboard from "@/pages/Leaderboard";
import LegacyLeaderboard from "@/pages/LegacyLeaderboard";
import RingPlay from "@/pages/RingPlay";
import AdminLeaderboard from "@/pages/AdminLeaderboard";
import HowToPlay from "@/pages/HowToPlay";
import { NewSubmissionAnnouncementPage } from "@/pages/NewSubmissionAnnouncement";
import StandMessaging from "@/pages/StandMessaging";
import NotFound from "@/pages/not-found";
import Admin from "@/pages/Admin";
import Dojo from "@/pages/Dojo";
import PitchDojo from "@/pages/PitchDojo";
import TileShowcase from "@/pages/TileShowcase";
import Old from "@/pages/Old";
import OldPlay from "@/pages/OldPlay";
import LeaderboardIdeas from "@/pages/LeaderboardIdeas";
import Videos from "@/pages/Videos";
import PRStatusTracker from "@/pages/PRStatusTracker";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function LeaderboardRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/leaderboard");
  }, [setLocation]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Main App (was /beta) */}
        <Route path="/" component={Home} />
        <Route path="/play" component={RingPlay} />
        <Route path="/ring" component={RingPlay} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/leaderboard/staging" component={LeaderboardRedirect} />
        <Route path="/leaderboard/ideas" component={LeaderboardIdeas} />
        <Route path="/admin" component={Admin} />
        <Route path="/dojo" component={Dojo} />
        <Route path="/dojo/:mode" component={Dojo} />
        <Route path="/pitch" component={PitchDojo} />
        <Route path="/tile" component={TileShowcase} />
        <Route path="/how-to-play" component={HowToPlay} />

        {/* Classic App (moved to /old) */}
        <Route path="/old" component={Old} />
        <Route path="/old/play" component={OldPlay} />
        <Route path="/old/leaderboard" component={LegacyLeaderboard} />
        <Route path="/old/admin" component={AdminLeaderboard} />

        {/* Legacy Admin Routes */}
        <Route path="/admin-leaderboard" component={AdminLeaderboard} />

        {/* Utility Routes */}
        <Route path="/stand" component={StandMessaging} />
        <Route path="/announcement" component={NewSubmissionAnnouncementPage} />
        <Route path="/videos" component={Videos} />
        <Route path="/pr-status" component={PRStatusTracker} />

        {/* Backward compatibility - redirect /beta routes to root */}
        <Route path="/beta" component={Home} />
        <Route path="/beta/play" component={RingPlay} />
        <Route path="/beta/ring" component={RingPlay} />
        <Route path="/beta/leaderboard" component={LegacyLeaderboard} />
        <Route path="/beta/admin" component={Admin} />
        <Route path="/beta/dojo" component={Dojo} />
        <Route path="/beta/dojo/:mode" component={Dojo} />
        <Route path="/beta/pitch" component={PitchDojo} />
        <Route path="/beta/how-to-play" component={HowToPlay} />

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const [location, navigate] = useLocation();
  const homeSoundPlayedRef = useRef(false);

  // Play background hum on first user interaction
  // This makes the sound persist across all pages
  useEffect(() => {
    const playHomeSoundOnInteraction = () => {
      if (!homeSoundPlayedRef.current) {
        homeSoundPlayedRef.current = true;
        audioManager.playHomeSound().catch(err => {
          console.log('Home sound playback prevented by browser:', err);
        });
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', playHomeSoundOnInteraction, { once: true });
    document.addEventListener('touchstart', playHomeSoundOnInteraction, { once: true });

    return () => {
      document.removeEventListener('click', playHomeSoundOnInteraction);
      document.removeEventListener('touchstart', playHomeSoundOnInteraction);
    };
  }, []);

  // Ensure home sound persists across page changes
  // This fixes the issue where home_sound.mp3 would stop when navigating between pages
  useEffect(() => {
    // When the route changes, check if we need to resume the home sound
    if (homeSoundPlayedRef.current && audioManager.isImmersiveMode()) {
      // Small delay to ensure the page transition is complete
      const resumeTimer = setTimeout(() => {
        audioManager.ensureHomeSoundPlaying();
      }, 50);

      return () => clearTimeout(resumeTimer);
    }
  }, [location]);

  // Global click sound handler for all buttons and links
  // This persists across page navigations and plays the full sound
  useEffect(() => {
    const processedEvents = new WeakSet<Event>();

    const handleGlobalClick = (event: MouseEvent) => {
      // Skip if this event was already processed (prevents infinite loop)
      if (processedEvents.has(event)) {
        return;
      }

      const target = event.target as HTMLElement;

      // Check if the clicked element or any of its parents is a button or link
      const clickableElement = target.closest('button, a, [role="button"], [role="link"]');

      if (clickableElement) {
        // Mark this event as processed
        processedEvents.add(event);

        // Play the click sound
        audioManager.playClickSound();

        // For links, add a small delay before navigation to ensure sound plays
        const linkElement = clickableElement.closest('a[href]');
        if (linkElement) {
          const anchor = linkElement as HTMLAnchorElement;

          // Only delay navigation for internal links (not external or special links)
          const isInternalLink = anchor.href &&
                                !anchor.target &&
                                !anchor.href.startsWith('mailto:') &&
                                !anchor.href.startsWith('tel:') &&
                                !anchor.href.startsWith('javascript:') &&
                                !event.ctrlKey &&
                                !event.metaKey &&
                                !event.shiftKey;

          if (isInternalLink) {
            // Prevent default navigation
            event.preventDefault();

            // Get the pathname from the href (for client-side routing)
            const url = new URL(anchor.href);
            const targetPath = url.pathname + url.search + url.hash;

            // Wait 100ms for the full beep to play, then navigate using client-side routing
            setTimeout(() => {
              navigate(targetPath);
            }, 100);
            return;
          }
        }

        // For buttons, intercept the click and delay it slightly to ensure sound plays
        // This applies to ALL buttons, including navigation buttons
        if (clickableElement.tagName === 'BUTTON') {
          // Stop propagation to prevent immediate onClick execution
          event.stopPropagation();
          event.preventDefault();

          // Wait 100ms for the beep to play, then re-trigger the click
          setTimeout(() => {
            // Create a new click event that will trigger the original onClick handlers
            const newEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            // Mark the new event as processed to avoid re-processing
            processedEvents.add(newEvent);
            // Dispatch the new event to the button
            clickableElement.dispatchEvent(newEvent);
          }, 100);
        }
      }
    };

    // Add global click listener with capture phase to intercept before other handlers
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SettingsMenu />
        <ImmersiveToggle />
        {/* Flash overlay for animations */}
        <div id="flashOverlay" className="flash-overlay" />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
