import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
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
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import leaderboardFullImage from "@assets/leaderboardfull.jpg";
import { Data3Logo } from "@/components/Data3Logo";
import { RaffleWinnerReveal } from "@/components/RaffleWinnerReveal";
import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  CATEGORY_TEXT_COLORS,
  DEFAULT_CATEGORY_COLOR,
} from "@/constants/categories";

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
  triviaChallengers?: ActiveChallengerPayload[];
  projectPitchChallengers?: ActiveChallengerPayload[];
}

interface LatestRaffleWinnerResponse {
  drawId: string;
  raffleDate: string;
  announcedAt: string;
  initials: string;
  totalScore: number;
  category: string;
}

interface ActiveChallenger {
  attemptId: string;
  initials: string;
  category: string;
  timestamp: number;
  fading: boolean;
  lastSeenInApi?: number; // Track when we last saw this in API response for cleanup
}

function normalizeCategoryStats(
  stats: DashboardData["categoryStats"],
  leaderboard: LeaderboardEntry[]
): DashboardData["categoryStats"] {
  const normalizedEntries = Object.entries(stats ?? {}).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      const numericValue = typeof value === "number" ? value : Number(value);
      if (Number.isFinite(numericValue)) {
        acc[key] = numericValue;
      }
      return acc;
    },
    {}
  );

  const totalFromStats = Object.values(normalizedEntries).reduce((sum, value) => sum + value, 0);

  if (totalFromStats > 0 || !leaderboard?.length) {
    return normalizedEntries;
  }

  const fallbackFromLeaderboard = leaderboard.reduce<Record<string, number>>((acc, entry) => {
    if (!entry?.category) {
      return acc;
    }

    const normalizedKey = entry.category.toUpperCase();
    acc[normalizedKey] = (acc[normalizedKey] ?? 0) + 1;
    return acc;
  }, {});

  return Object.keys(fallbackFromLeaderboard).length > 0
    ? fallbackFromLeaderboard
    : normalizedEntries;
}

function renderLeaderboardView(leaderboard: LeaderboardEntry[]): ReactNode {
  const leaderboardEntries = leaderboard.slice(0, 10);
  const rows = Array.from({ length: 10 }, (_, index) => leaderboardEntries[index] || null);

  const getRowClasses = (index: number, hasEntry: boolean) => {
    if (!hasEntry) {
      return "bg-white/5 border-white/10 opacity-50";
    }

    if (index === 0) {
      return "bg-gradient-to-r from-[#007BC3]/30 via-[#00AEFF]/25 to-[#7300FF]/30 border-[#00AEFF]/60 shadow-2xl shadow-[#007BC3]/30";
    }

    if (index === 1) {
      return "bg-white/10 border-white/40 shadow-xl shadow-[#007BC3]/20";
    }

    if (index === 2) {
      return "bg-white/10 border-white/30 shadow-xl shadow-[#7300FF]/20";
    }

    return "bg-white/5 border-white/20 hover:bg-white/10";
  };

  const getRankClasses = (index: number, hasEntry: boolean) => {
    if (!hasEntry) {
      return "bg-white/10 text-[#78DCFF]/50";
    }

    if (index === 0) {
      return "bg-gradient-to-br from-yellow-300 via-amber-200 to-amber-400 text-gray-900 shadow-lg shadow-yellow-400/40";
    }

    if (index === 1) {
      return "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 text-gray-900 shadow-lg shadow-slate-400/30";
    }

    if (index === 2) {
      return "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/40";
    }

    return "bg-white/10 text-[#78DCFF] border border-white/20 shadow-inner";
  };

  return (
    <div className="flex flex-col space-y-3">
      {rows.map((entry, index) => {
        const hasEntry = Boolean(entry);
        const categoryColor = entry
          ? CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || "#1cc8e4"
          : undefined;

        return (
          <div
            key={entry ? entry.id : `placeholder-${index}`}
            data-entry-id={entry ? entry.id : undefined}
            className={`flex items-center gap-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 py-3 px-4 ${getRowClasses(index, hasEntry)} ${hasEntry ? "hover:-translate-y-1" : ""}`}
          >
            {/* Rank Badge - Large */}
            <div
              className={`flex items-center justify-center rounded-full font-black tracking-tight h-14 w-14 text-2xl flex-shrink-0 ${getRankClasses(index, hasEntry)}`}
            >
              {String(index + 1).padStart(2, "0")}
            </div>

            {/* Initials - Large, same height as rank */}
            <div className="flex-shrink-0">
              <p className={`text-2xl font-black tracking-tight ${hasEntry ? "text-white" : "text-[#78DCFF]/60"}`}>
                {entry ? formatNameToInitials(entry.name) : "Awaiting Challenger"}
              </p>
            </div>

            {/* Spacer to push category badge to the right */}
            <div className="flex-1"></div>

            {/* Category Badge - Large, positioned to the right */}
            <div className="flex-shrink-0">
              {entry ? (
                <span
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 font-bold uppercase tracking-wider text-sm"
                  style={{
                    backgroundColor: `${categoryColor}1A`,
                    color: CATEGORY_TEXT_COLORS[entry.category as keyof typeof CATEGORY_TEXT_COLORS] || categoryColor,
                    border: `2px solid ${categoryColor}4D`
                  }}
                >
                  {CATEGORY_NAMES[entry.category as keyof typeof CATEGORY_NAMES]}
                </span>
              ) : (
                <span className="uppercase tracking-wider text-sm text-[#78DCFF]/60">Open Slot</span>
              )}
            </div>

            {/* Score - Far right */}
            <div className="text-right flex-shrink-0">
              <p
                className={`score-value font-black tabular-nums tracking-tight text-2xl ${hasEntry ? "text-white drop-shadow-[0_10px_25px_rgba(0,174,255,0.35)]" : "text-white/40"}`}
              >
                {entry ? entry.totalScore.toString().padStart(2, "0") : "--"}
              </p>
              <p className="uppercase tracking-[0.25em] text-[#78DCFF]/60 mt-0.5 text-[0.6rem]">pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderChallengerCard(
  challenger: ActiveChallenger,
  stageLabel: string,
  stageIcon: string
): ReactNode {
  const categoryColor =
    CATEGORY_COLORS[challenger.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.SECURE_CONNECTIVITY;
  const categoryName = CATEGORY_NAMES[challenger.category as keyof typeof CATEGORY_NAMES];

  return (
    <div
      key={challenger.attemptId}
      className={`p-4 rounded-xl border-2 backdrop-blur-xl transition-all duration-1000 ${
        challenger.fading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
      style={{
        borderColor: `${categoryColor}60`,
        backgroundColor: `${categoryColor}15`
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        >
          {challenger.initials}
        </div>
        <div
          className="h-12 rounded-full flex items-center justify-center px-4 text-sm font-bold text-white flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}`, color: 'white' }}
        >
          {categoryName}
        </div>
        <div className="text-[#78DCFF]/60 ml-auto">
          <i className={`${stageIcon} text-2xl`}></i>
        </div>
      </div>
    </div>
  );
}

function renderWordCloudView(wordCloud: DashboardData["wordCloud"]): ReactNode {
  if (wordCloud.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <i className="fas fa-cloud text-4xl text-[#78DCFF]/50 mb-4"></i>
        <p className="text-lg font-semibold text-white/70">No theme data yet!</p>
        <p className="text-sm text-[#78DCFF]/60 mt-2">
          Come back when solutions are submitted to see the most common themes
        </p>
      </div>
    );
  }

  // Intentionally kept for future scaling if we want to normalise sizes
  Math.max(...wordCloud.map((word) => word.value));

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#00AEFF] rounded-full filter blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#78DCFF] rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-[#7300FF] rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {wordCloud
          .slice(0, 8)
          .map((word, index) => {
            let size: number;
            let opacity: number;
            let zIndex: number;
            let x: number;
            let y: number;

            if (index === 0) {
              opacity = 1;
              zIndex = 30;

              return (
                <div
                  key={word.text}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex
                  }}
                >
                  <span
                    className="inline-block px-3 py-2 rounded-lg border-2 border-[#00AEFF]/40 bg-[#000045]/80 backdrop-blur-sm text-[#78DCFF] shadow-lg shadow-[#00AEFF]/20 hover:border-[#00AEFF]/60 hover:shadow-[#00AEFF]/40"
                    style={{
                      fontSize: "clamp(24px, 9vw, 56px)",
                      opacity,
                      textShadow: "0 0 10px rgba(0, 174, 255, 0.5)",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {word.text}
                    <span className="hidden sm:inline ml-1 opacity-60" style={{ fontSize: "0.4em" }}>
                      ({word.value})
                    </span>
                  </span>
                </div>
              );
            }

            if (index < 5) {
              size = 32;
              opacity = 0.95;
              zIndex = 20;

              const positions = [
                { x: -150, y: -80 },
                { x: 160, y: -60 },
                { x: -140, y: 90 },
                { x: 150, y: 70 }
              ];

              const pos = positions[index - 1];
              x = pos.x;
              y = pos.y;

              return (
                <div
                  key={word.text}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    zIndex
                  }}
                >
                  <span
                    className="inline-block px-3 py-2 rounded-lg border-2 border-[#00AEFF]/40 bg-[#000045]/80 backdrop-blur-sm text-[#78DCFF] shadow-lg shadow-[#00AEFF]/20 hover:border-[#00AEFF]/60 hover:shadow-[#00AEFF]/40 whitespace-nowrap"
                    style={{
                      fontSize: `${size}px`,
                      opacity,
                      textShadow: "0 0 10px rgba(0, 174, 255, 0.5)"
                    }}
                  >
                    {word.text}
                    <span className="hidden sm:inline ml-1 opacity-60" style={{ fontSize: "0.4em" }}>
                      ({word.value})
                    </span>
                  </span>
                </div>
              );
            }

            size = 24;
            opacity = 0.8;
            zIndex = 10;

            const outerPositions = [
              { x: -200, y: -120 },
              { x: 0, y: 150 },
              { x: 180, y: -100 }
            ];

            const pos = outerPositions[index - 5];
            x = pos.x;
            y = pos.y;

            return (
              <div
                key={word.text}
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  zIndex
                }}
              >
                <span
                  className="inline-block px-3 py-2 rounded-lg border-2 border-[#00AEFF]/40 bg-[#000045]/80 backdrop-blur-sm text-[#78DCFF] shadow-lg shadow-[#00AEFF]/20 hover:border-[#00AEFF]/60 hover:shadow-[#00AEFF]/40 whitespace-nowrap"
                  style={{
                    fontSize: `${size}px`,
                    opacity,
                    textShadow: "0 0 10px rgba(0, 174, 255, 0.5)"
                  }}
                >
                  {word.text}
                  <span className="hidden sm:inline ml-1 opacity-60" style={{ fontSize: "0.4em" }}>
                    ({word.value})
                  </span>
                </span>
              </div>
            );
          })
          .filter(Boolean)}
      </div>
    </div>
  );
}

function renderCategoryStatsView(categoryStats: DashboardData["categoryStats"]): ReactNode {
  const categoryData = Object.entries(categoryStats)
    .map(([category, count]) => ({
      name: CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category,
      value: count,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || DEFAULT_CATEGORY_COLOR
    }))
    .filter((item) => item.value > 0);

  const totalSubmissions = Object.values(categoryStats).reduce((a, b) => a + Number(b), 0);

  if (totalSubmissions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <i className="fas fa-chart-pie text-4xl text-[#78DCFF]/50 mb-4"></i>
        <p className="text-lg font-semibold text-white/70">No category data yet!</p>
        <p className="text-sm text-[#78DCFF]/60 mt-2">
          Come back when solutions are submitted to see the distribution
        </p>
      </div>
    );
  }

  const chartRadius = 100;
  const chartHeight = 300;

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full py-4">
      <div className="w-full flex justify-center">
        <PieChart width={300} height={chartHeight}>
          <Pie data={categoryData} cx="50%" cy="50%" outerRadius={chartRadius} dataKey="value">
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => {
              const percent = ((value / totalSubmissions) * 100).toFixed(1);
              return [`${value} submissions (${percent}%)`, name];
            }}
          />
        </PieChart>
      </div>

      <div className="w-full max-w-xl mx-auto px-4">
        <div className="space-y-2">
          {categoryData.map((entry) => {
            const percent = ((entry.value / totalSubmissions) * 100).toFixed(0);
            return (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm font-medium text-white truncate">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-[#78DCFF]/80 whitespace-nowrap">
                  {percent}% ({entry.value})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderActiveChallengersView(
  triviaChallengers: ActiveChallenger[],
  projectPitchChallengers: ActiveChallenger[]
): ReactNode {
  const hasTrivia = triviaChallengers.length > 0;
  const hasPitch = projectPitchChallengers.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <i className="fas fa-brain text-[#00BCF2]"></i>
          <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Trivia Challenge</h3>
          <span className="ml-auto text-xs text-[#78DCFF]/60">
            {triviaChallengers.length} {triviaChallengers.length === 1 ? "Challenger" : "Challengers"}
          </span>
        </div>
        {hasTrivia ? (
          <div className="space-y-3">
            {triviaChallengers.map((challenger) =>
              renderChallengerCard(challenger, "Category", "fas fa-brain")
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-white/50">No one in trivia right now</div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <i className="fas fa-lightbulb text-[#FFD700]"></i>
          <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Project Pitch</h3>
          <span className="ml-auto text-xs text-[#78DCFF]/60">
            {projectPitchChallengers.length} {projectPitchChallengers.length === 1 ? "Challenger" : "Challengers"}
          </span>
        </div>
        {hasPitch ? (
          <div className="space-y-3">
            {projectPitchChallengers.map((challenger) =>
              renderChallengerCard(challenger, "Category", "fas fa-lightbulb")
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-white/50">No one in pitch phase right now</div>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  // State declarations
  const [displayData, setDisplayData] = useState<DashboardData | null>(null);
  const [activeView, setActiveView] = useState<"rankings" | "wordcloud" | "categories">("rankings");
  const [activeChallengers, setActiveChallengers] = useState<ActiveChallenger[]>([]);
  const [triviaChallengers, setTriviaChallengers] = useState<ActiveChallenger[]>([]);
  const [projectPitchChallengers, setProjectPitchChallengers] = useState<ActiveChallenger[]>([]);
  const [showRaffleAnnouncement, setShowRaffleAnnouncement] = useState(false);
  const [raffleCategory, setRaffleCategory] = useState<string | null>(null);
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Raffle winner reveal state
  const [showRaffleWinner, setShowRaffleWinner] = useState(false);
  const [raffleWinnerData, setRaffleWinnerData] = useState<{
    initials: string;
    totalScore: number;
    category: string;
  } | null>(null);

  // Welcome New Challenger overlay state
  const [showChallengerOverlay, setShowChallengerOverlay] = useState(false);
  const [challengerData, setChallengerData] = useState<{
    initials: string;
    category: string;
    score: number;
    rank: number;
  } | null>(null);
  const challengerOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New submission detection state
  const [knownSubmissionIds, setKnownSubmissionIds] = useState<Set<string>>(new Set());
  const isInitialDataLoad = useRef(true);
  const sessionStartedAtRef = useRef<number>(Date.now());
  const lastSeenRaffleWinnerRef = useRef<{ drawId: string | null; announcedAt: string | null }>({
    drawId: null,
    announcedAt: null,
  });

  const persistLastSeenRaffleWinner = useCallback((drawId: string | null, announcedAt: string | null) => {
    lastSeenRaffleWinnerRef.current = { drawId, announcedAt };

    if (typeof window === 'undefined') {
      return;
    }

    try {
      sessionStorage.setItem('leaderboard:lastRaffleWinner', JSON.stringify({ drawId, announcedAt }));

      if (drawId) {
        sessionStorage.setItem('leaderboard:lastRaffleWinnerId', drawId);
      } else {
        sessionStorage.removeItem('leaderboard:lastRaffleWinnerId');
      }

      if (announcedAt) {
        sessionStorage.setItem('leaderboard:lastRaffleWinnerAnnouncedAt', announcedAt);
      } else {
        sessionStorage.removeItem('leaderboard:lastRaffleWinnerAnnouncedAt');
      }
    } catch (error) {
      console.warn('[Leaderboard] Unable to persist last raffle winner metadata:', error);
    }
  }, []);

  const websocketsDisabled = import.meta.env.VITE_ENABLE_WEBSOCKETS === 'false';

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

  const {
    data: latestRaffleWinner,
    error: latestRaffleWinnerError,
  } = useQuery<LatestRaffleWinnerResponse | null, Error, LatestRaffleWinnerResponse | null, ["latest-raffle-winner"]>({
    queryKey: ["latest-raffle-winner"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/latest-raffle-winner", {
        credentials: "include",
      });

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch latest raffle winner: ${response.statusText}`);
      }

      return (await response.json()) as LatestRaffleWinnerResponse;
    },
    enabled: websocketsDisabled,
    refetchInterval: websocketsDisabled ? 5000 : false,
    refetchOnWindowFocus: false,
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Restore last seen raffle winner metadata to prevent duplicate reveals on reloads
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedWinner = sessionStorage.getItem('leaderboard:lastRaffleWinner');
      if (storedWinner) {
        const parsed = JSON.parse(storedWinner) as { drawId?: unknown; announcedAt?: unknown } | null;
        const drawId = parsed && typeof parsed.drawId === 'string' ? parsed.drawId : null;
        const announcedAt = parsed && typeof parsed.announcedAt === 'string' ? parsed.announcedAt : null;
        lastSeenRaffleWinnerRef.current = { drawId, announcedAt };
        return;
      }

      const legacyDrawId = sessionStorage.getItem('leaderboard:lastRaffleWinnerId');
      const legacyAnnouncedAt = sessionStorage.getItem('leaderboard:lastRaffleWinnerAnnouncedAt');

      if (legacyDrawId || legacyAnnouncedAt) {
        persistLastSeenRaffleWinner(legacyDrawId ?? null, legacyAnnouncedAt ?? null);
      }
    } catch (error) {
      console.warn('[Leaderboard] Unable to restore last raffle winner id:', error);
    }
  }, [persistLastSeenRaffleWinner]);

  // Preload audio on component mount
  useEffect(() => {
    console.log('[Leaderboard] Preloading audio...');
    audioManager.preload();
  }, []);

  useEffect(() => {
    if (!websocketsDisabled || !latestRaffleWinnerError) {
      return;
    }

    console.error('[Leaderboard] Failed to poll latest raffle winner:', latestRaffleWinnerError);
  }, [websocketsDisabled, latestRaffleWinnerError]);

  useEffect(() => {
    if (!websocketsDisabled || !latestRaffleWinner) {
      return;
    }

    if (!latestRaffleWinner.drawId) {
      return;
    }

    if (!latestRaffleWinner.announcedAt) {
      return;
    }

    const announcedAtMs = Date.parse(latestRaffleWinner.announcedAt);
    if (Number.isNaN(announcedAtMs)) {
      console.warn('[Leaderboard] Ignoring raffle winner with unparsable announcedAt:', latestRaffleWinner.announcedAt);
      return;
    }

    if (announcedAtMs < sessionStartedAtRef.current) {
      console.log('[Leaderboard] Ignoring raffle winner announced before this session started');
      return;
    }

    const lastSeen = lastSeenRaffleWinnerRef.current;
    if (
      lastSeen.drawId === latestRaffleWinner.drawId &&
      lastSeen.announcedAt === latestRaffleWinner.announcedAt
    ) {
      return;
    }

    console.log('🎉 [Leaderboard] Poll detected new raffle winner:', latestRaffleWinner);
    persistLastSeenRaffleWinner(latestRaffleWinner.drawId, latestRaffleWinner.announcedAt);

    setRaffleWinnerData({
      initials: latestRaffleWinner.initials,
      totalScore: latestRaffleWinner.totalScore,
      category: latestRaffleWinner.category,
    });
    setShowRaffleWinner(true);
  }, [websocketsDisabled, latestRaffleWinner, persistLastSeenRaffleWinner]);

  // Check for WELCOME NEW CHALLENGER trigger from announcement page
  useEffect(() => {
    try {
      const triggerData = sessionStorage.getItem('triggerNewChallenger');
      if (triggerData) {
        console.log('[Leaderboard] Triggering WELCOME NEW CHALLENGER animation');

        // Clear the flag immediately
        sessionStorage.removeItem('triggerNewChallenger');

        // Also clear the old playSubmissionAudio flag to prevent double sounds
        sessionStorage.removeItem('playSubmissionAudio');

        // Play the welcome sounds (flash + challenger) - FORCE PLAY (bypass immersive filter)
        audioManager.forcePlayFlashSound()
          .then(() => console.log('[Leaderboard] Flash sound played for new challenger'))
          .catch(err => console.warn('[Leaderboard] Flash sound failed:', err));

        setTimeout(() => {
          audioManager.forcePlayNewChallengerSound()
            .then(() => console.log('[Leaderboard] Challenger sound played'))
            .catch(err => console.warn('[Leaderboard] Challenger sound failed:', err));
        }, 750);
      }
    } catch (error) {
      console.error('[Leaderboard] Error checking triggerNewChallenger:', error);
    }
  }, []);

  // Presentation mode handlers
  const enterPresentationMode = async () => {
    try {
      // Request fullscreen on the document element
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsPresentationMode(true);
      console.log('[Leaderboard] Entered presentation mode');
    } catch (error) {
      console.error('[Leaderboard] Failed to enter fullscreen:', error);
      // Still enable presentation mode even if fullscreen fails
      setIsPresentationMode(true);
    }
  };

  const exitPresentationMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('[Leaderboard] Failed to exit fullscreen:', err);
      });
    }
    setIsPresentationMode(false);
    console.log('[Leaderboard] Exited presentation mode');
  };

  // Handle Escape key and fullscreen changes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPresentationMode) {
        exitPresentationMode();
      }
    };

    const handleFullscreenChange = () => {
      // If we exit fullscreen and we're in presentation mode, exit presentation mode
      if (!document.fullscreenElement && isPresentationMode) {
        setIsPresentationMode(false);
        console.log('[Leaderboard] Fullscreen exited, leaving presentation mode');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // WebSocket for real-time updates
  useWebSocket((message) => {
    console.log('WebSocket message received:', message);
    if (message.type === "scoreUpdate") {
      // Check if this is a genuinely new submission
      const submissionId = message.data.id;
      const isNewSubmission = !knownSubmissionIds.has(submissionId);

      console.log('Score update - New submission?', isNewSubmission, 'ID:', submissionId);

      if (isNewSubmission) {
        handleNewSubmission({
          id: submissionId,
          name: message.data.name,
          category: message.data.category,
          finalScore: message.data.finalScore,
          totalScore: message.data.totalScore,
          targetRank: message.data.targetRank,
          pitchScore: message.data.pitchScore ?? null,
          triviaScore: message.data.triviaScore ?? null,
          botBar: message.data.botBar ?? null,
          isEligible: message.data.isEligible,
        });
      } else {
        triggerScoreAnimation(submissionId, message.data.finalScore ?? message.data.totalScore);
        refetch();
      }
  } else if (message.type === "raffleWinner") {
    // Handle raffle winner broadcast
    console.log('🎉🎉🎉 [Leaderboard] RAFFLE WINNER BROADCAST RECEIVED! 🎉🎉🎉');
    console.log('Winner Data:', message.data);
    console.log('Setting state: showRaffleWinner = true');

    const winnerIdFromMessage =
      typeof message.data.drawId === 'string' && message.data.drawId.length > 0
        ? message.data.drawId
        : `ws-${Date.now()}`;

    const announcedAtFromMessage =
      typeof message.data.announcedAt === 'string' && message.data.announcedAt.length > 0
        ? message.data.announcedAt
        : new Date().toISOString();

    persistLastSeenRaffleWinner(winnerIdFromMessage, announcedAtFromMessage);

    setRaffleWinnerData({
      initials: message.data.initials,
      totalScore: message.data.totalScore,
      category: message.data.category,
    });
    setShowRaffleWinner(true);
    console.log('State updated - RaffleWinnerReveal component should now render!');
  }
  });

  const triggerScoreAnimation = useCallback((entryId: string, score?: number | null) => {
    if (score === undefined || score === null) {
      return;
    }

    setTimeout(() => {
      const element = document.querySelector(`[data-entry-id="${entryId}"] .score-value`);
      if (element) {
        animateScoreCountUp(element as HTMLElement, score);
      }
    }, 100);
  }, []);

  // Handle ring entry
  const handleRingEntry = (entry: { attemptId: string; initials: string; category: string }) => {
    console.log('🥊 RING ENTRY:', entry);

    // Play trivia enter sound - FORCE PLAY (bypass immersive filter)
    console.log('[Leaderboard] Playing trivia enter sound...');
    audioManager.forcePlayTriviaEnterSound()
      .then(() => console.log('[Leaderboard] Trivia enter sound played successfully'))
      .catch(err => console.warn('[Leaderboard] Trivia enter sound failed:', err));

    const now = Date.now();
    const newChallenger = {
      ...entry,
      timestamp: now,
      fading: false,
      lastSeenInApi: now
    };

    // Add to trivia challengers list (new entries always start with trivia)
    setTriviaChallengers(prev => {
      // Check if already exists
      if (prev.some(c => c.attemptId === entry.attemptId)) {
        console.log('[Leaderboard] Challenger already in trivia list:', entry.attemptId);
        return prev;
      }
      // Add new challenger at the top
      console.log('[Leaderboard] Adding new challenger to trivia list:', entry);
      return [newChallenger, ...prev];
    });

    // Also add to active challengers list for backward compatibility
    setActiveChallengers(prev => {
      if (prev.some(c => c.attemptId === entry.attemptId)) {
        return prev;
      }
      return [newChallenger, ...prev];
    });
  };

  // Handle ring exit
  const handleRingExit = (data: { attemptId: string; qualified: boolean }) => {
    console.log('🚪 RING EXIT:', data);

    if (data.qualified) {
      // User qualified - move them from trivia to pitch
      console.log('[Leaderboard] User qualified from trivia, moving to pitch');

      // Find the challenger in trivia list
      const triviaChallenger = triviaChallengers.find(c => c.attemptId === data.attemptId);

      if (triviaChallenger) {
        // Mark as fading in trivia
        setTriviaChallengers(prev =>
          prev.map(challenger =>
            challenger.attemptId === data.attemptId
              ? { ...challenger, fading: true }
              : challenger
          )
        );

        // Remove from trivia after fade
        setTimeout(() => {
          setTriviaChallengers(prev =>
            prev.filter(c => c.attemptId !== data.attemptId)
          );
        }, 2000);

        // Add to pitch list immediately (with fresh timestamp)
        const now = Date.now();
        setProjectPitchChallengers(prev => {
          // Check if already in pitch list
          if (prev.some(c => c.attemptId === data.attemptId)) {
            return prev;
          }
          // Add to pitch list
          return [
            {
              ...triviaChallenger,
              timestamp: now,
              fading: false,
              lastSeenInApi: now
            },
            ...prev
          ];
        });

        // Play pitch enter sound
        audioManager.forcePlayPitchEnterSound()
          .then(() => console.log('[Leaderboard] Pitch enter sound played'))
          .catch(err => console.warn('[Leaderboard] Pitch enter sound failed:', err));
      }
    } else {
      // User didn't qualify - remove from all lists
      console.log('[Leaderboard] User did not qualify, removing from all lists');

      // Mark challenger as fading in all lists
      setActiveChallengers(prev =>
        prev.map(challenger =>
          challenger.attemptId === data.attemptId
            ? { ...challenger, fading: true }
            : challenger
        )
      );
      setTriviaChallengers(prev =>
        prev.map(challenger =>
          challenger.attemptId === data.attemptId
            ? { ...challenger, fading: true }
            : challenger
        )
      );
      setProjectPitchChallengers(prev =>
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
        setTriviaChallengers(prev =>
          prev.filter(c => c.attemptId !== data.attemptId)
        );
        setProjectPitchChallengers(prev =>
          prev.filter(c => c.attemptId !== data.attemptId)
        );
      }, 2000);
    }
  };

  // Handle raffle qualification
  const handleRaffleQualified = (data: { category: string }) => {
    console.log('🎟️ RAFFLE QUALIFIED:', data);

    // Play announce sound only - FORCE PLAY (bypass immersive filter for leaderboard)
    audioManager.forcePlayNewChallengerSound().catch(err => console.warn('Announce sound failed:', err));

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
    console.log('[Leaderboard] WebSocket message received:', message);

    if (message.type === "ringEntry") {
      console.log('[Leaderboard] Processing ringEntry event:', message.data);
      handleRingEntry(message.data);
    }

    if (message.type === "ringExit") {
      console.log('[Leaderboard] Processing ringExit event:', message.data);
      handleRingExit(message.data);
    }

    if (message.type === "raffleQualified") {
      console.log('[Leaderboard] Processing raffleQualified event:', message.data);
      handleRaffleQualified(message.data);
    }

    if (message.type === "scoreUpdate") {
      console.log('[Leaderboard] Processing scoreUpdate event:', message.data);
      // Handle score updates for leaderboard
      triggerScoreAnimation(message.data.id, message.data.finalScore ?? message.data.totalScore);
      refetch();
    }
  });

  // Handle new submission detected on leaderboard
  const handleNewSubmission = useCallback((submission: {
    id: string;
    name: string;
    category: string;
    totalScore?: number;
    finalScore?: number;
    targetRank?: number | null;
    pitchScore?: number | null;
    triviaScore?: number | null;
    botBar?: number | null;
    isEligible?: boolean;
  }) => {
    // Mark this submission as known
    setKnownSubmissionIds(prev => {
      if (prev.has(submission.id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(submission.id);
      return next;
    });

    // Only announce if user beat the bot (or isEligible is undefined for backward compatibility)
    if (submission.isEligible === false) {
      console.log('🤫 NEW SUBMISSION (silently added - did not beat bot bar):', submission);
      // Silently add to leaderboard without announcement
      triggerScoreAnimation(submission.id, submission.finalScore ?? submission.totalScore);
      refetch();
      return;
    }

    console.log('🚨 NEW SUBMISSION DETECTED ON LEADERBOARD! Playing sounds and showing overlay...', submission);

    audioManager.forcePlayFlashSound().catch(err => console.warn('Flash sound failed:', err));
    setTimeout(() => {
      audioManager.forcePlayNewChallengerSound().catch(err => console.warn('Challenger sound failed:', err));
    }, 750);

    const formattedInitials = formatNameToInitials(submission.name);
    const fallbackInitials = submission.name
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();

    setChallengerData({
      initials: formattedInitials || fallbackInitials || submission.name.substring(0, 2).toUpperCase(),
      category: submission.category,
      score: submission.finalScore ?? submission.totalScore ?? 0,
      rank: submission.targetRank ?? 0,
    });

    setShowChallengerOverlay(true);

    if (challengerOverlayTimeoutRef.current) {
      clearTimeout(challengerOverlayTimeoutRef.current);
    }

    challengerOverlayTimeoutRef.current = setTimeout(() => {
      setShowChallengerOverlay(false);
      setChallengerData(null);
    }, 10000);

    triggerScoreAnimation(submission.id, submission.finalScore ?? submission.totalScore);
    refetch();
  }, [refetch, triggerScoreAnimation]);

  // Update display data and detect new submissions
  useEffect(() => {
    if (!data) {
      return;
    }

    const normalizedCategoryStats = normalizeCategoryStats(data.categoryStats, data.leaderboard || []);

    setDisplayData({
      ...data,
      categoryStats: normalizedCategoryStats,
    });

    // On initial load, just record all known IDs without announcing
    if (isInitialDataLoad.current) {
      const initialIds = new Set([
        ...(data.leaderboard?.map(entry => entry.id) || []),
        ...(data.recentSubmission?.id ? [data.recentSubmission.id] : [])
      ]);
      setKnownSubmissionIds(initialIds);
      isInitialDataLoad.current = false;
      console.log('[Leaderboard] Initial load - recorded', initialIds.size, 'submissions');
      return;
    }

    const computeRank = (id?: string | null): number | undefined => {
      if (!id || !data.leaderboard) {
        return undefined;
      }

      const index = data.leaderboard.findIndex(item => item.id === id);
      if (index === -1) {
        return undefined;
      }

      return index + 1;
    };

    const leaderboardNewEntry = data.leaderboard?.find(entry => !knownSubmissionIds.has(entry.id));
    if (leaderboardNewEntry) {
      console.log('[Leaderboard] New leaderboard entry detected:', leaderboardNewEntry);
      handleNewSubmission({
        id: leaderboardNewEntry.id,
        name: leaderboardNewEntry.name,
        category: leaderboardNewEntry.category,
        totalScore: leaderboardNewEntry.totalScore,
        finalScore: leaderboardNewEntry.totalScore,
        targetRank: computeRank(leaderboardNewEntry.id) ?? undefined,
      });
      return;
    }

    if (data.recentSubmission && !knownSubmissionIds.has(data.recentSubmission.id)) {
      console.log('[Leaderboard] Recent submission detected:', data.recentSubmission);
      handleNewSubmission({
        id: data.recentSubmission.id,
        name: data.recentSubmission.name,
        category: data.recentSubmission.category,
        totalScore: data.recentSubmission.totalScore,
        finalScore: data.recentSubmission.finalScore ?? data.recentSubmission.totalScore,
        targetRank: computeRank(data.recentSubmission.id) ?? undefined,
        pitchScore: data.recentSubmission.pitchScore ?? null,
        triviaScore: data.recentSubmission.triviaScore ?? null,
        botBar: data.recentSubmission.botBar ?? null,
        isEligible: data.recentSubmission.isEligible,
      });
    }
  }, [data, knownSubmissionIds, handleNewSubmission]);

  useEffect(() => {
    return () => {
      if (challengerOverlayTimeoutRef.current) {
        clearTimeout(challengerOverlayTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!data) {
      if (websocketsDisabled) {
        console.log('[Leaderboard] No data - clearing active challengers');
        setActiveChallengers([]);
        setTriviaChallengers([]);
        setProjectPitchChallengers([]);
      }
      return;
    }

    const activeEntries = data.activeChallengers ?? [];
    const triviaEntries = data.triviaChallengers ?? [];
    const projectPitchEntries = data.projectPitchChallengers ?? [];

    console.log('[Leaderboard] Processing API data - trivia:', triviaEntries.length, 'pitch:', projectPitchEntries.length);

    // Helper function to process challenger arrays
    const processChallengers = (
      entries: ActiveChallengerPayload[],
      prev: ActiveChallenger[],
      listName: string
    ): ActiveChallenger[] => {
      if (entries.length === 0) {
        if (websocketsDisabled) {
          return [];
        } else {
          // Clear stale challengers
          const now = Date.now();
          const STALE_THRESHOLD = 15000;
          return prev.filter((entry) => {
            const timeSinceLastSeen = now - (entry.lastSeenInApi ?? now);
            return timeSinceLastSeen <= STALE_THRESHOLD;
          });
        }
      }

      const now = Date.now();
      const STALE_THRESHOLD = 15000;
      const toTimestamp = (iso: string) => {
        const value = new Date(iso).getTime();
        return Number.isFinite(value) ? value : Date.now();
      };

      const previousById = new Map(prev.map((entry) => [entry.attemptId, entry]));
      const nextIds = new Set(entries.map((entry) => entry.attemptId));

      const nextFromApi = entries.map((entry) => {
        const existing = previousById.get(entry.attemptId);
        const timestamp = toTimestamp(entry.startedAt);

        if (existing) {
          return {
            ...existing,
            initials: entry.initials,
            category: entry.category,
            timestamp,
            fading: websocketsDisabled ? false : existing.fading,
            lastSeenInApi: now,
          };
        }

        // New challenger from API
        if (websocketsDisabled && !previousById.has(entry.attemptId)) {
          console.log(`[Leaderboard] New challenger detected in ${listName} (WebSockets disabled):`, entry);
          // Use different sound based on the list type
          if (listName === 'pitch') {
            audioManager.playPitchEnterSound().catch(err => console.warn('Pitch enter sound failed:', err));
          } else {
            audioManager.playTriviaEnterSound().catch(err => console.warn('Trivia enter sound failed:', err));
          }
        }

        return {
          attemptId: entry.attemptId,
          initials: entry.initials,
          category: entry.category,
          timestamp,
          fading: false,
          lastSeenInApi: now,
        };
      });

      if (websocketsDisabled) {
        return nextFromApi.sort((a, b) => b.timestamp - a.timestamp);
      }

      // When WebSockets are enabled, keep challengers not in API ONLY if seen recently
      const remaining = prev.filter((entry) => {
        if (nextIds.has(entry.attemptId)) {
          return false;
        }
        const timeSinceLastSeen = now - (entry.lastSeenInApi ?? now);
        return timeSinceLastSeen <= STALE_THRESHOLD;
      });

      return [...nextFromApi, ...remaining];
    };

    // Update trivia challengers
    setTriviaChallengers((prev) => processChallengers(triviaEntries, prev, 'trivia'));

    // Update project pitch challengers
    setProjectPitchChallengers((prev) => processChallengers(projectPitchEntries, prev, 'pitch'));

    // Keep the old activeChallengers for backward compatibility
    if (activeEntries.length === 0) {
      if (websocketsDisabled) {
        setActiveChallengers([]);
      }
    } else {
      setActiveChallengers((prev) => {
        const now = Date.now();
        const STALE_THRESHOLD = 15000;
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
              lastSeenInApi: now,
            };
          }
          return {
            attemptId: entry.attemptId,
            initials: entry.initials,
            category: entry.category,
            timestamp,
            fading: false,
            lastSeenInApi: now,
          };
        });

        if (websocketsDisabled) {
          return nextFromApi.sort((a, b) => b.timestamp - a.timestamp);
        }

        const remaining = prev.filter((entry) => {
          if (nextIds.has(entry.attemptId)) return false;
          const timeSinceLastSeen = now - (entry.lastSeenInApi ?? now);
          return timeSinceLastSeen <= STALE_THRESHOLD;
        });

        return [...nextFromApi, ...remaining];
      });
    }
  }, [data, websocketsDisabled]);

  // Auto-rotate views on left side (rankings, wordcloud, categories)
  useEffect(() => {
    if (!displayData || !isAutoRotateEnabled) return;

    const getAvailableViews = () => {
      const views: Array<"rankings" | "wordcloud" | "categories"> = [];

      // Always include rankings
      views.push("rankings");

      // Only add other views if they have content
      if (displayData.wordCloud.length > 0) {
        views.push("wordcloud");
      }
      if (Object.keys(displayData.categoryStats).length > 0 && Object.values(displayData.categoryStats).some(v => v > 0)) {
        views.push("categories");
      }

      return views;
    };

    const availableViews = getAvailableViews();
    let currentIndex = availableViews.indexOf(activeView);

    // If current view is not available, show rankings
    if (currentIndex === -1) {
      setActiveView("rankings");
      return;
    }

    // Cycle through views every 10 seconds
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % availableViews.length;
      setActiveView(availableViews[currentIndex]);
    }, 10000);

    return () => clearInterval(interval);
  }, [displayData, activeView, isAutoRotateEnabled]);

  // Handle error state
  if (error && !displayData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          <p className="text-xl font-semibold mb-2">Failed to load leaderboard</p>
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
          <p className="text-lg">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  const viewOptions = [
    {
      key: "rankings" as const,
      icon: "fa-trophy",
      label: "Rankings",
      hasContent: true,
    },
    {
      key: "wordcloud" as const,
      icon: "fa-cloud",
      label: "Technologies",
      hasContent: displayData.wordCloud.length > 0,
    },
    {
      key: "categories" as const,
      icon: "fa-chart-pie",
      label: "Categories",
      hasContent: Object.values(displayData.categoryStats).some((value) => value > 0),
    },
  ];

  const autoRotateButtonClasses = `transition-all duration-200 ${
    isAutoRotateEnabled
      ? "bg-green-500/20 border-green-400/40 text-green-100 hover:bg-green-500/30"
      : "bg-[#000045]/60 border-[#00AEFF]/20 text-white/70 hover:bg-white/10"
  }`;
  const autoRotateIcon = isAutoRotateEnabled ? "fa-pause" : "fa-play";
  const autoRotateLabel = isAutoRotateEnabled ? "Pause" : "Play";
  const autoRotateTitle = isAutoRotateEnabled ? "Pause auto-rotation" : "Resume auto-rotation";

  return (
    <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black p-4 text-data3-white sm:p-6 lg:p-8">
      {/* Raffle Winner Reveal */}
      {showRaffleWinner && raffleWinnerData && (
        <RaffleWinnerReveal
          initials={raffleWinnerData.initials}
          totalScore={raffleWinnerData.totalScore}
          category={raffleWinnerData.category}
          onComplete={() => {
            setShowRaffleWinner(false);
            setRaffleWinnerData(null);
          }}
        />
      )}

      {/* Welcome New Challenger Overlay */}
      {showChallengerOverlay && challengerData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="announcement-pulse max-w-4xl w-full mx-4">
            <Card className="border-4 border-[#00AEFF] bg-gradient-to-br from-data3-blue-black via-[#000045] to-data3-blue-black shadow-2xl">
              <CardContent className="p-8 sm:p-12 text-center space-y-6">
                {/* Flash effect overlay */}
                <div className="announcement-strobe absolute inset-0 rounded-[inherit]"
                     style={{ backgroundColor: CATEGORY_COLORS[challengerData.category as keyof typeof CATEGORY_COLORS] || '#00AEFF' }}></div>

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  {/* NEW CHALLENGER! Header */}
                  <div className="space-y-2">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#78DCFF] drop-shadow-2xl animate-pulse">
                      WELCOME
                    </h1>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-2xl -mt-2">
                      NEW CHALLENGER!
                    </h1>
                  </div>

                  {/* Initials Display */}
                  <div className="flex justify-center my-8">
                    <div
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-6xl sm:text-7xl font-black text-white shadow-2xl"
                      style={{ backgroundColor: CATEGORY_COLORS[challengerData.category as keyof typeof CATEGORY_COLORS] || '#00AEFF' }}
                    >
                      {challengerData.initials}
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div>
                    <Badge
                      className="text-xl sm:text-2xl px-6 py-3 font-bold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[challengerData.category as keyof typeof CATEGORY_COLORS] || '#00AEFF' }}
                    >
                      {CATEGORY_NAMES[challengerData.category as keyof typeof CATEGORY_NAMES] || challengerData.category}
                    </Badge>
                  </div>

                  {/* Score and Rank */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-6">
                    <div className="text-center">
                      <p className="text-lg sm:text-xl text-[#78DCFF]/80 font-semibold mb-2">SCORE</p>
                      <p className="text-5xl sm:text-6xl font-black text-white drop-shadow-2xl">
                        {challengerData.score}
                      </p>
                      <p className="text-xl sm:text-2xl text-white/60 mt-1">/100</p>
                    </div>
                    {challengerData.rank > 0 && (
                      <div className="text-center">
                        <p className="text-lg sm:text-xl text-[#78DCFF]/80 font-semibold mb-2">RANK</p>
                        <p className="text-5xl sm:text-6xl font-black text-yellow-400 drop-shadow-2xl">
                          #{challengerData.rank}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Decorative Icons */}
                  <div className="flex justify-center items-center gap-4 text-4xl sm:text-5xl mt-6">
                    <div className="announcement-bounce">🏆</div>
                    <div className="announcement-bounce" style={{ animationDelay: '0.2s' }}>⚡</div>
                    <div className="announcement-bounce" style={{ animationDelay: '0.4s' }}>🎯</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {!isPresentationMode && (
          <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-xl shadow-xl shadow-[#007BC3]/30 ring-2 ring-[#00AEFF]/40">
                <img
                  src={leaderboardFullImage}
                  alt="Leaderboard"
                  className="h-full w-full object-cover"
                  style={{ transform: 'scale(1.8)' }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Live Leaderboard
                </h1>
                <p className="text-sm text-[#78DCFF]/80">
                  Real-time rankings & active challengers
                </p>
              </div>
            </div>
            {/* Beat the Bot - centered on desktop, visible on same line */}
            <div className="flex-shrink-0">
              <p className="text-2xl lg:text-3xl font-bold text-data3-pale-blue">
                Beat the Bot
              </p>
            </div>
            {/* Desktop-only navigation */}
            <div className="hidden lg:flex gap-3">
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-[#00AEFF] hover:bg-[#2CC8FF] text-data3-blue-black font-bold"
              >
                <i className="fas fa-home mr-2"></i>
                Home
              </Button>
            </div>
          </div>
        )}

        {/* View Controls */}
        {!isPresentationMode && (
          <div className="mb-6 space-y-3">
            {/* Mobile: Home + Auto-Rotate row */}
            <div className="flex gap-2 justify-center sm:hidden">
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                size="sm"
                className="flex-1 lg:hidden bg-[#000045]/60 border-[#00AEFF]/20 text-[#78DCFF] hover:bg-[#00AEFF]/20"
                title="Go to Home"
                aria-label="Go to Home"
              >
                <i className="fas fa-home"></i>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoRotateEnabled(!isAutoRotateEnabled)}
                className={`flex-1 ${autoRotateButtonClasses}`}
                title={autoRotateTitle}
                aria-label={autoRotateTitle}
              >
                <i className={`fas ${autoRotateIcon}`}></i>
                <span className="sr-only">{autoRotateLabel}</span>
              </Button>
            </div>

            {/* Mobile: Tab buttons */}
            <div className="sm:hidden flex gap-2 p-1.5 bg-[#000045]/60 rounded-xl border border-[#00AEFF]/20 shadow-lg justify-center">
              {viewOptions.map((view) => (
                <Button
                  key={view.key}
                  variant={activeView === view.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveView(view.key);
                    setIsAutoRotateEnabled(false);
                  }}
                  className={`flex-1 transition-all duration-200 ${
                    activeView === view.key
                      ? 'bg-[#00AEFF]/20 border border-[#00AEFF]/40 text-[#78DCFF] shadow-lg shadow-[#00AEFF]/20'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                  title={`Show ${view.label}`}
                  aria-label={`Show ${view.label}`}
                >
                  <i className={`fas ${view.icon}`}></i>
                </Button>
              ))}
            </div>

            {/* Tablet/Desktop: Controls */}
            <div className="hidden sm:flex flex-row gap-3 items-center justify-center">
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                size="sm"
                className="lg:hidden bg-[#000045]/60 border-[#00AEFF]/20 text-[#78DCFF] hover:bg-[#00AEFF]/20"
                title="Go to Home"
              >
                <i className="fas fa-home sm:mr-2"></i>
                <span className="hidden sm:inline">Home</span>
              </Button>
              <div className="flex gap-2 p-1.5 bg-[#000045]/60 rounded-xl border border-[#00AEFF]/20 shadow-lg flex-1 sm:flex-initial justify-center">
                {viewOptions.map((view) => (
                  <Button
                    key={view.key}
                    variant={activeView === view.key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setActiveView(view.key);
                      setIsAutoRotateEnabled(false);
                    }}
                    className={`flex-1 sm:flex-initial transition-all duration-200 ${
                      activeView === view.key
                        ? 'bg-[#00AEFF]/20 border border-[#00AEFF]/40 text-[#78DCFF] shadow-lg shadow-[#00AEFF]/20'
                        : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <i className={`fas ${view.icon} sm:mr-2`}></i>
                    <span className="hidden sm:inline">{view.label}</span>
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoRotateEnabled(!isAutoRotateEnabled)}
                className={`${autoRotateButtonClasses}`}
                title={autoRotateTitle}
              >
                <i className={`fas ${autoRotateIcon} sm:mr-2`}></i>
                <span className="hidden sm:inline">{autoRotateLabel}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Leaderboard (wider) */}
          <div className="lg:col-span-7">
            <Card className="relative overflow-hidden border-none bg-gradient-to-b from-[#000025] via-[#000045] to-[#007BC3]/20 text-white shadow-2xl">
              <div className="absolute -top-40 -left-32 h-72 w-72 rounded-full bg-[#00AEFF]/30 blur-3xl"></div>
              <div className="absolute -bottom-48 -right-24 h-80 w-80 rounded-full bg-[#7300FF]/20 blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#007BC3]/10 blur-[160px]"></div>

              <CardHeader className="relative z-10 pt-8 pb-6 text-center">
                {activeView === "rankings" && (
                  <>
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
                  </>
                )}
                {activeView === "wordcloud" && (
                  <>
                    <CardTitle className="text-3xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,123,195,0.55)]">
                      <i className="fas fa-cloud text-[#00AEFF] mr-3"></i>
                      Popular Themes
                    </CardTitle>
                    <p className="mt-2 text-sm text-[#78DCFF]/80">
                      Most mentioned across submissions
                    </p>
                  </>
                )}
                {activeView === "categories" && (
                  <>
                    <CardTitle className="text-3xl font-black tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,123,195,0.55)]">
                      <i className="fas fa-chart-pie text-[#6B21A8] mr-3"></i>
                      Problem Categories
                    </CardTitle>
                    <p className="mt-2 text-sm text-[#78DCFF]/80">
                      Distribution by category
                    </p>
                  </>
                )}
              </CardHeader>

              <CardContent className="relative z-10 pb-8">
                {activeView === "rankings" && renderLeaderboardView(displayData.leaderboard)}
                {activeView === "wordcloud" && renderWordCloudView(displayData.wordCloud)}
                {activeView === "categories" && renderCategoryStatsView(displayData.categoryStats)}
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
                  {triviaChallengers.length + projectPitchChallengers.length} {(triviaChallengers.length + projectPitchChallengers.length) === 1 ? 'Challenger' : 'Challengers'}
                </p>
              </CardHeader>

              <CardContent className="relative z-10 py-6">
                {renderActiveChallengersView(triviaChallengers, projectPitchChallengers)}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        {!isPresentationMode && (
          <div className="text-center mt-6">
            <div className="flex justify-center gap-4">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Live Updates
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${isAutoRotateEnabled ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></div>
                {isAutoRotateEnabled ? 'Auto-rotating' : 'Auto-rotate paused'}
              </span>
            </div>
          </div>
        )}

        {/* Presentation Mode Button - At bottom */}
        {!isPresentationMode && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={enterPresentationMode}
              size="lg"
              className="bg-gradient-to-r from-[#7300FF] to-[#00AEFF] hover:from-[#8500FF] hover:to-[#2CC8FF] text-white font-bold shadow-2xl shadow-[#7300FF]/40 border-2 border-white/20"
            >
              <i className="fas fa-expand mr-2"></i>
              Hide Interface (Presentation Mode)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
