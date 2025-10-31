import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatbotWidget } from "@/components/ChatbotWidget";
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ChatbotWidget />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
