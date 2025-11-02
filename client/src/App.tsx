import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { ImmersiveToggle } from "@/components/VolumeToggle";
import { audioManager } from "@/lib/audio";
import { useEffect, useRef } from "react";
import Home from "@/pages/Home";
import Leaderboard from "@/pages/Leaderboard";
import StagingLeaderboard from "@/pages/StagingLeaderboard";
import RingPlay from "@/pages/RingPlay";
import AdminLeaderboard from "@/pages/AdminLeaderboard";
import HowToPlay from "@/pages/HowToPlay";
import { NewSubmissionAnnouncementPage } from "@/pages/NewSubmissionAnnouncement";
import StandMessaging from "@/pages/StandMessaging";
import NotFound from "@/pages/not-found";
import Admin from "@/pages/Admin";
import Dojo from "@/pages/Dojo";
import TileShowcase from "@/pages/TileShowcase";
import Old from "@/pages/Old";
import OldPlay from "@/pages/OldPlay";
import LeaderboardIdeas from "@/pages/LeaderboardIdeas";

function Router() {
  return (
    <Switch>
      {/* Main App (was /beta) */}
      <Route path="/" component={Home} />
      <Route path="/play" component={RingPlay} />
      <Route path="/ring" component={RingPlay} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/leaderboard/staging" component={StagingLeaderboard} />
      <Route path="/leaderboard/ideas" component={LeaderboardIdeas} />
      <Route path="/admin" component={Admin} />
      <Route path="/dojo" component={Dojo} />
      <Route path="/dojo/:mode" component={Dojo} />
      <Route path="/tile" component={TileShowcase} />
      <Route path="/how-to-play" component={HowToPlay} />

      {/* Classic App (moved to /old) */}
      <Route path="/old" component={Old} />
      <Route path="/old/play" component={OldPlay} />
      <Route path="/old/leaderboard" component={Leaderboard} />
      <Route path="/old/admin" component={AdminLeaderboard} />

      {/* Legacy Admin Routes */}
      <Route path="/admin-leaderboard" component={AdminLeaderboard} />

      {/* Utility Routes */}
      <Route path="/stand" component={StandMessaging} />
      <Route path="/announcement" component={NewSubmissionAnnouncementPage} />

      {/* Backward compatibility - redirect /beta routes to root */}
      <Route path="/beta" component={Home} />
      <Route path="/beta/play" component={RingPlay} />
      <Route path="/beta/ring" component={RingPlay} />
      <Route path="/beta/leaderboard" component={Leaderboard} />
      <Route path="/beta/admin" component={Admin} />
      <Route path="/beta/dojo" component={Dojo} />
      <Route path="/beta/dojo/:mode" component={Dojo} />
      <Route path="/beta/how-to-play" component={HowToPlay} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

  // Global click sound handler for all buttons and links
  // This persists across page navigations and plays the full sound
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the clicked element or any of its parents is a button or link
      const clickableElement = target.closest('button, a, [role="button"], [role="link"]');

      if (clickableElement) {
        // Play the click sound
        audioManager.playClickSound();

        // For links, add a small delay before navigation to ensure sound starts
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

            // Get the href before any async operations
            const href = anchor.href;

            // Wait 100ms for the full beep to play, then navigate
            setTimeout(() => {
              window.location.href = href;
            }, 100);
          }
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
        <ChatbotWidget />
        <ImmersiveToggle />
        {/* Flash overlay for animations */}
        <div id="flashOverlay" className="flash-overlay" />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
