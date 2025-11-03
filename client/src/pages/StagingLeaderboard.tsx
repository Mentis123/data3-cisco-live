import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";
import { animateScoreCountUp } from "@/lib/anim";
import { audioManager } from "@/lib/audio";
import { formatNameToInitials } from "@/lib/utils";
import leaderboardFullImage from "@assets/leaderboardfull.jpg";
import { Data3Logo } from "@/components/Data3Logo";

interface LeaderboardEntry {
  id: string;
  name: string;
  category: string;
  totalScore: number;
  createdAt: string;
}

interface ActiveChallengerPayload {
  attemptId: string;
  initials: string;
  category: string;
  startedAt: string;
}

interface DashboardData {
  leaderboard: LeaderboardEntry[];
  wordCloud: { text: string; value: number }[];
  categoryStats: { [key: string]: number };
  recentSubmission: any;
  data3Stats: any[];
  topCategoryStats: any[];
  topCategory: string;
  activeChallengers?: ActiveChallengerPayload[];
}

interface ActiveChallenger {
  attemptId: string;
  initials: string;
  category: string;
  timestamp: number;
  fading: boolean;
  lastSeenInApi?: number; // Track when we last saw this in API response for cleanup
}

// Consistent color scheme for all categories
const CATEGORY_COLORS = {
  SECURE_CONNECTIVITY: "#00BCF2",  // Cyan
  HYBRID_DC: "#6CC04A",            // Green
  COLLAB_CX: "#FF6B35",            // Orange
  OBSERVABILITY: "#9B59B6",        // Purple
  EDGE_IOT: "#F39C12"              // Yellow
};

const CATEGORY_NAMES = {
  SECURE_CONNECTIVITY: "Zero Trust & Secure Connectivity",
  HYBRID_DC: "Data Centre & Hybrid Cloud",
  COLLAB_CX: "Collaboration & Contact Centre",
  OBSERVABILITY: "Observability & Performance",
  EDGE_IOT: "Edge & IoT Solutions"
};

// Tailwind class equivalents for badges
const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  SECURE_CONNECTIVITY: "bg-[#00BCF2]",  // Cyan
  HYBRID_DC: "bg-[#6CC04A]",            // Green
  COLLAB_CX: "bg-[#FF6B35]",            // Orange
  OBSERVABILITY: "bg-[#9B59B6]",        // Purple
  EDGE_IOT: "bg-[#F39C12]"              // Yellow
};

export default function StagingLeaderboard() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Preload audio on component mount
  useEffect(() => {
    console.log('[StagingLeaderboard] Preloading audio...');
    audioManager.preload();
  }, []);

  const websocketsDisabled = import.meta.env.VITE_ENABLE_WEBSOCKETS === 'false';

  const [displayData, setDisplayData] = useState<DashboardData | null>(null);
  const [activeChallengers, setActiveChallengers] = useState<ActiveChallenger[]>([]);
  const [showRaffleAnnouncement, setShowRaffleAnnouncement] = useState(false);
  const [raffleCategory, setRaffleCategory] = useState<string | null>(null);

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dashboard-data");
      return response.json();
    },
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const triggerScoreAnimation = (entryId: string, score?: number | null) => {
    if (score === undefined || score === null) {
      return;
    }

    setTimeout(() => {
      const element = document.querySelector(`[data-entry-id="${entryId}"] .score-value`);
      if (element) {
        animateScoreCountUp(element as HTMLElement, score);
      }
    }, 100);
  };

  // Handle ring entry
  const handleRingEntry = (entry: { attemptId: string; initials: string; category: string }) => {
    console.log('🥊 RING ENTRY:', entry);

    // Play entry sounds (flash + announce) - with better error handling
    console.log('[StagingLeaderboard] Playing flash sound...');
    audioManager.playFlashSound()
      .then(() => console.log('[StagingLeaderboard] Flash sound played successfully'))
      .catch(err => console.warn('[StagingLeaderboard] Flash sound failed:', err));

    setTimeout(() => {
      console.log('[StagingLeaderboard] Playing challenger sound...');
      audioManager.playNewChallengerSound()
        .then(() => console.log('[StagingLeaderboard] Challenger sound played successfully'))
        .catch(err => console.warn('[StagingLeaderboard] Challenger sound failed:', err));
    }, 750);

    // Add to active challengers list
    setActiveChallengers(prev => {
      // Check if already exists
      if (prev.some(c => c.attemptId === entry.attemptId)) {
        console.log('[StagingLeaderboard] Challenger already in list:', entry.attemptId);
        return prev;
      }
      // Add new challenger at the top
      console.log('[StagingLeaderboard] Adding new challenger to list:', entry);
      const now = Date.now();
      return [{
        ...entry,
        timestamp: now,
        fading: false,
        lastSeenInApi: now
      }, ...prev];
    });
  };

  // Handle ring exit
  const handleRingExit = (data: { attemptId: string; qualified: boolean }) => {
    console.log('🚪 RING EXIT:', data);

    // Mark challenger as fading
    setActiveChallengers(prev =>
      prev.map(challenger =>
        challenger.attemptId === data.attemptId
          ? { ...challenger, fading: true }
          : challenger
      )
    );

    // Remove after fade animation (2 seconds)
    setTimeout(() => {
      setActiveChallengers(prev =>
        prev.filter(c => c.attemptId !== data.attemptId)
      );
    }, 2000);
  };

  // Handle raffle qualification
  const handleRaffleQualified = (data: { category: string }) => {
    console.log('🎟️ RAFFLE QUALIFIED:', data);

    // Play announce sound only
    audioManager.playNewChallengerSound().catch(err => console.warn('Announce sound failed:', err));

    // Show raffle announcement
    setRaffleCategory(data.category);
    setShowRaffleAnnouncement(true);

    // Hide after 4 seconds
    setTimeout(() => {
      setShowRaffleAnnouncement(false);
    }, 4000);
  };

  // WebSocket for real-time updates
  useWebSocket((message) => {
    console.log('[StagingLeaderboard] WebSocket message received:', message);

    if (message.type === "ringEntry") {
      console.log('[StagingLeaderboard] Processing ringEntry event:', message.data);
      handleRingEntry(message.data);
    }

    if (message.type === "ringExit") {
      console.log('[StagingLeaderboard] Processing ringExit event:', message.data);
      handleRingExit(message.data);
    }

    if (message.type === "raffleQualified") {
      console.log('[StagingLeaderboard] Processing raffleQualified event:', message.data);
      handleRaffleQualified(message.data);
    }

    if (message.type === "scoreUpdate") {
      console.log('[StagingLeaderboard] Processing scoreUpdate event:', message.data);
      // Handle score updates for leaderboard
      triggerScoreAnimation(message.data.id, message.data.finalScore ?? message.data.totalScore);
      refetch();
    }
  });

  // Update display data
  useEffect(() => {
    if (data) {
      setDisplayData(data);
    }
  }, [data]);

  useEffect(() => {
    if (!data) {
      if (websocketsDisabled) {
        console.log('[StagingLeaderboard] No data - clearing active challengers');
        setActiveChallengers([]);
      }
      return;
    }

    const activeEntries = data.activeChallengers ?? [];
    console.log('[StagingLeaderboard] Processing API data - active challengers:', activeEntries);

    if (activeEntries.length === 0) {
      if (websocketsDisabled) {
        console.log('[StagingLeaderboard] No active challengers from API');
        setActiveChallengers([]);
      } else {
        // Even with WebSockets enabled, clear stale challengers
        setActiveChallengers((prev) => {
          const now = Date.now();
          const STALE_THRESHOLD = 15000; // 15 seconds (3 polling cycles at 5s each)
          const filtered = prev.filter((entry) => {
            const timeSinceLastSeen = now - (entry.lastSeenInApi ?? now);
            if (timeSinceLastSeen > STALE_THRESHOLD) {
              console.log(`[StagingLeaderboard] Removing stale challenger ${entry.attemptId} - not seen in API for ${timeSinceLastSeen}ms`);
              return false;
            }
            return true;
          });
          if (filtered.length !== prev.length) {
            console.log('[StagingLeaderboard] Cleared stale challengers, remaining:', filtered);
          }
          return filtered;
        });
      }
      return;
    }

    setActiveChallengers((prev) => {
      const now = Date.now();
      const STALE_THRESHOLD = 15000; // 15 seconds (3 polling cycles)

      const toTimestamp = (iso: string) => {
        const value = new Date(iso).getTime();
        return Number.isFinite(value) ? value : Date.now();
      };

      const previousById = new Map(prev.map((entry) => [entry.attemptId, entry]));
      const nextIds = new Set(activeEntries.map((entry) => entry.attemptId));

      const nextFromApi = activeEntries.map((entry) => {
        const existing = previousById.get(entry.attemptId);
        const timestamp = toTimestamp(entry.startedAt);

        if (existing) {
          return {
            ...existing,
            initials: entry.initials,
            category: entry.category,
            timestamp,
            fading: websocketsDisabled ? false : existing.fading,
            lastSeenInApi: now, // Update last seen timestamp
          };
        }

        // New challenger from API - if WebSockets are disabled, play sounds here
        if (websocketsDisabled && !previousById.has(entry.attemptId)) {
          console.log('[StagingLeaderboard] New challenger detected from API (WebSockets disabled):', entry);
          // Play sounds for new challengers when WebSockets are disabled
          audioManager.playFlashSound().catch(err => console.warn('Flash sound failed:', err));
          setTimeout(() => {
            audioManager.playNewChallengerSound().catch(err => console.warn('Challenger sound failed:', err));
          }, 750);
        }

        return {
          attemptId: entry.attemptId,
          initials: entry.initials,
          category: entry.category,
          timestamp,
          fading: false,
          lastSeenInApi: now, // Set initial last seen timestamp
        };
      });

      if (websocketsDisabled) {
        const sorted = nextFromApi.sort((a, b) => b.timestamp - a.timestamp);
        console.log('[StagingLeaderboard] Updating challengers (WebSockets disabled):', sorted);
        return sorted;
      }

      // When WebSockets are enabled, keep challengers not in API ONLY if seen recently
      const remaining = prev.filter((entry) => {
        if (nextIds.has(entry.attemptId)) {
          return false; // Already in nextFromApi
        }

        const timeSinceLastSeen = now - (entry.lastSeenInApi ?? now);
        if (timeSinceLastSeen > STALE_THRESHOLD) {
          console.log(`[StagingLeaderboard] Removing stale challenger ${entry.attemptId} - not in API for ${timeSinceLastSeen}ms`);
          return false;
        }

        // Keep for now, but it's not in the latest API response
        console.log(`[StagingLeaderboard] Keeping challenger ${entry.attemptId} - not in API but seen ${timeSinceLastSeen}ms ago`);
        return true;
      });

      const combined = [...nextFromApi, ...remaining];
      console.log('[StagingLeaderboard] Updating challengers (WebSockets enabled):', combined);
      return combined;
    });
  }, [data, websocketsDisabled]);

  // Handle error state
  if (error && !displayData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          <p className="text-xl font-semibold mb-2">Failed to load staging leaderboard</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-red-400/40 hover:bg-red-500/20"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !displayData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading Staging Leaderboard...</p>
        </div>
      </div>
    );
  }

  const renderLeaderboard = () => {
    const leaderboardEntries = displayData.leaderboard.slice(0, 10);
    const rows = Array.from({ length: 10 }, (_, index) => leaderboardEntries[index] || null);

    const getRowClasses = (index: number, hasEntry: boolean) => {
      if (!hasEntry) {
        return 'bg-white/5 border-white/10 opacity-50';
      }

      if (index === 0) {
        return 'bg-gradient-to-r from-[#007BC3]/30 via-[#00AEFF]/25 to-[#7300FF]/30 border-[#00AEFF]/60 shadow-2xl shadow-[#007BC3]/30';
      }

      if (index === 1) {
        return 'bg-white/10 border-white/40 shadow-xl shadow-[#007BC3]/20';
      }

      if (index === 2) {
        return 'bg-white/10 border-white/30 shadow-xl shadow-[#7300FF]/20';
      }

      return 'bg-white/5 border-white/20 hover:bg-white/10';
    };

    const getRankClasses = (index: number, hasEntry: boolean) => {
      if (!hasEntry) {
        return 'bg-white/10 text-[#78DCFF]/50';
      }

      if (index === 0) {
        return 'bg-gradient-to-br from-yellow-300 via-amber-200 to-amber-400 text-gray-900 shadow-lg shadow-yellow-400/40';
      }

      if (index === 1) {
        return 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 text-gray-900 shadow-lg shadow-slate-400/30';
      }

      if (index === 2) {
        return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/40';
      }

      return 'bg-white/10 text-[#78DCFF] border border-white/20 shadow-inner';
    };

    return (
      <div className="flex flex-col space-y-3">
        {rows.map((entry, index) => {
          const hasEntry = Boolean(entry);
          const categoryColor = entry
            ? CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || '#1cc8e4'
            : undefined;

          return (
            <div
              key={entry ? entry.id : `placeholder-${index}`}
              data-entry-id={entry ? entry.id : undefined}
              className={`grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 py-2 px-4 ${getRowClasses(index, hasEntry)} ${hasEntry ? 'hover:-translate-y-1' : ''}`}
            >
              <div
                className={`flex items-center justify-center rounded-full font-black tracking-tight h-8 w-8 text-sm ${getRankClasses(index, hasEntry)}`}
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 text-left">
                <p className={`text-base font-semibold tracking-tight truncate ${hasEntry ? 'text-white' : 'text-[#78DCFF]/60'}`}>
                  {entry ? formatNameToInitials(entry.name) : 'Awaiting Challenger'}
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-start gap-1 text-[#78DCFF]/80">
                  {entry ? (
                    <span
                      className="inline-flex items-center justify-start rounded-full px-2 py-0.5 font-medium uppercase tracking-wider text-[0.6rem]"
                      style={{
                        backgroundColor: `${categoryColor}1A`,
                        color: categoryColor,
                        border: `1px solid ${categoryColor}4D`
                      }}
                    >
                      {CATEGORY_NAMES[entry.category as keyof typeof CATEGORY_NAMES]}
                    </span>
                  ) : (
                    <span className="uppercase tracking-wider text-[0.6rem] text-[#78DCFF]/60">
                      Open Slot
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`score-value font-black tabular-nums tracking-tight text-xl ${hasEntry ? 'text-white drop-shadow-[0_10px_25px_rgba(0,174,255,0.35)]' : 'text-white/40'}`}>
                  {entry ? entry.totalScore.toString().padStart(2, '0') : '--'}
                </p>
                <p className="uppercase tracking-[0.25em] text-[#78DCFF]/60 mt-0.5 text-[0.55rem]">
                  pts
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderActiveChallengers = () => {
    if (activeChallengers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <i className="fas fa-users text-4xl text-[#78DCFF]/50 mb-4"></i>
          <p className="text-lg font-semibold text-white/70">No Active Challengers</p>
          <p className="text-sm text-[#78DCFF]/60 mt-2">
            When someone enters the ring, they'll appear here
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activeChallengers.map((challenger) => {
          const categoryColor = CATEGORY_COLORS[challenger.category as keyof typeof CATEGORY_COLORS] || '#00BCF2';
          const categoryName = CATEGORY_NAMES[challenger.category as keyof typeof CATEGORY_NAMES];

          return (
            <div
              key={challenger.attemptId}
              className={`p-4 rounded-xl border-2 backdrop-blur-xl transition-all duration-1000 ${
                challenger.fading
                  ? 'opacity-0 translate-y-4'
                  : 'opacity-100 translate-y-0'
              }`}
              style={{
                borderColor: `${categoryColor}60`,
                backgroundColor: `${categoryColor}15`
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white"
                  style={{ backgroundColor: categoryColor }}
                >
                  {challenger.initials}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">In The Ring</p>
                  <Badge
                    className="text-xs mt-1"
                    style={{ backgroundColor: `${categoryColor}40`, color: categoryColor }}
                  >
                    {categoryName}
                  </Badge>
                </div>
                <div className="text-[#78DCFF]/60">
                  <i className="fas fa-fist-raised text-2xl"></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {/* Raffle Qualification Announcement Overlay */}
      {showRaffleAnnouncement && raffleCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="announcement-pulse">
            <Card
              className="border-4 max-w-2xl mx-4"
              style={{
                borderColor: CATEGORY_COLORS[raffleCategory as keyof typeof CATEGORY_COLORS],
                backgroundColor: `${CATEGORY_COLORS[raffleCategory as keyof typeof CATEGORY_COLORS]}20`
              }}
            >
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <i className="fas fa-ticket-alt text-6xl text-yellow-400"></i>
                </div>
                <h2 className="text-5xl font-black text-white mb-4">
                  RAFFLE ENTRY!
                </h2>
                <p className="text-2xl text-white/90 mb-4">
                  A challenger has qualified!
                </p>
                <Badge
                  className="text-xl px-6 py-2"
                  style={{ backgroundColor: CATEGORY_COLORS[raffleCategory as keyof typeof CATEGORY_COLORS] }}
                >
                  {CATEGORY_NAMES[raffleCategory as keyof typeof CATEGORY_NAMES]}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={leaderboardFullImage}
              alt="Leaderboard"
              className="h-16 w-16 rounded-xl object-cover shadow-xl shadow-[#007BC3]/30 ring-2 ring-[#00AEFF]/40"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Staging Leaderboard
              </h1>
              <p className="text-sm text-[#78DCFF]/80">
                Real-time challenge tracking
              </p>
            </div>
          </div>
          <Link href="/leaderboard">
            <Button variant="outline" size="sm">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Main
            </Button>
          </Link>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Leaderboard (wider) */}
          <div className="lg:col-span-7">
            <Card className="relative overflow-hidden border-none bg-gradient-to-b from-[#000025] via-[#000045] to-[#007BC3]/20 text-white shadow-2xl">
              <div className="absolute -top-40 -left-32 h-72 w-72 rounded-full bg-[#00AEFF]/30 blur-3xl"></div>
              <div className="absolute -bottom-48 -right-24 h-80 w-80 rounded-full bg-[#7300FF]/20 blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#007BC3]/10 blur-[160px]"></div>

              <CardHeader className="relative z-10 pt-8 pb-6 text-center">
                <p className="uppercase tracking-[0.5em] text-[#78DCFF]/60 text-[0.65rem]">
                  Live Rankings
                </p>
                <CardTitle className="text-3xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,123,195,0.55)]">
                  Top 10
                </CardTitle>
                <p className="mt-2 text-sm text-[#78DCFF]/80">
                  {displayData.leaderboard.length > 0
                    ? `${displayData.leaderboard.length} Active ${displayData.leaderboard.length === 1 ? 'Solution' : 'Solutions'}`
                    : 'Waiting for first submission'}
                </p>
              </CardHeader>

              <CardContent className="relative z-10 pb-8">
                {renderLeaderboard()}
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Active Challengers */}
          <div className="lg:col-span-5">
            <Card className="relative overflow-hidden border-none bg-gradient-to-b from-[#000025] via-[#000045] to-[#7300FF]/15 text-white shadow-2xl h-full">
              <div className="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-[#FF00FF]/20 blur-3xl"></div>
              <div className="absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-[#7300FF]/20 blur-3xl"></div>

              <CardHeader className="relative z-10 pt-8 pb-6 text-center border-b border-white/10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <i className="fas fa-fist-raised text-[#FF00FF]"></i>
                  <p className="uppercase tracking-[0.4em] text-[#9B9BFF]/80 text-[0.65rem]">
                    Active Now
                  </p>
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(115,0,255,0.4)]">
                  In The Ring
                </CardTitle>
                <p className="mt-2 text-sm text-[#9B9BFF]/70">
                  {activeChallengers.length} {activeChallengers.length === 1 ? 'Challenger' : 'Challengers'}
                </p>
              </CardHeader>

              <CardContent className="relative z-10 py-6">
                {renderActiveChallengers()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Staging environment for testing ring announcements</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Live Updates
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              Active Tracking
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
