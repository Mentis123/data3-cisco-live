import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Leaderboard from "@/pages/Leaderboard";
import Play from "@/pages/Play";
import AdminLeaderboard from "@/pages/AdminLeaderboard";
import HowToPlay from "@/pages/HowToPlay";
import { NewSubmissionAnnouncementPage } from "@/pages/NewSubmissionAnnouncement";
import StandMessaging from "@/pages/StandMessaging";
import NotFound from "@/pages/not-found";
import Beta from "@/pages/Beta";
import BetaPlay from "@/pages/BetaPlay";
import Dojo from "@/pages/Dojo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/play" component={Play} />
      <Route path="/admin-leaderboard" component={AdminLeaderboard} />
      <Route path="/admin" component={AdminLeaderboard} />
      <Route path="/stand" component={StandMessaging} />
      <Route path="/how-to-play" component={HowToPlay} />
      <Route path="/announcement" component={NewSubmissionAnnouncementPage} />
      <Route path="/beta" component={Beta} />
      <Route path="/beta/play" component={BetaPlay} />
      <Route path="/beta/ring" component={BetaPlay} />
      <Route path="/dojo/:mode" component={Dojo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
