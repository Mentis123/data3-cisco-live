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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/play" component={Play} />
      <Route path="/admin-leaderboard" component={AdminLeaderboard} />
      <Route path="/admin" component={AdminLeaderboard} />
      <Route path="/how-to-play" component={HowToPlay} />
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
