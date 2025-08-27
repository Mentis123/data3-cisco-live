import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/websocket";
import { triggerFlashAndRise, createConfetti } from "@/lib/anim";

interface LeaderboardEntry {
  id: string;
  name: string;
  category: string;
  totalScore: number;
  createdAt: string;
}

interface NewScoreEvent {
  type: "score:new";
  entry: {
    id: string;
    name: string;
    category: string;
    targetRank: number;
    finalScore: number;
  };
}

const CATEGORY_NAMES: Record<string, string> = {
  "SECURE_CONNECTIVITY": "Zero Trust & Secure Connectivity",
  "HYBRID_DC": "Data Centre & Hybrid Cloud", 
  "COLLAB_CX": "Collaboration & Contact Centre",
  "OBSERVABILITY": "Observability & Performance",
  "EDGE_IOT": "Edge & IoT Solutions"
};

const CATEGORY_COLORS: Record<string, string> = {
  "SECURE_CONNECTIVITY": "from-blue-500 to-blue-600",
  "HYBRID_DC": "from-purple-500 to-purple-600",
  "COLLAB_CX": "from-green-500 to-green-600",
  "OBSERVABILITY": "from-orange-500 to-orange-600",
  "EDGE_IOT": "from-red-500 to-red-600"
};

const ALL_CATEGORIES = ["OVERALL", ...Object.keys(CATEGORY_NAMES)];

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("OVERALL");
  const [cycleIndex, setCycleIndex] = useState(0);
  const [lastUpdateCategory, setLastUpdateCategory] = useState<string | null>(null);

  const { data: leaderboardData, isLoading, refetch } = useQuery({
    queryKey: ["/api/leaderboard", currentCategory === "OVERALL" ? undefined : currentCategory],
    queryFn: async () => {
      const params = currentCategory === "OVERALL" ? "" : `?category=${currentCategory}`;
      const response = await fetch(`/api/leaderboard${params}`);
      return response.json();
    },
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  const { lastMessage, connectionState } = useWebSocket("/ws");

  // Initialize leaderboard data
  useEffect(() => {
    if (leaderboardData && Array.isArray(leaderboardData)) {
      setEntries(leaderboardData);
      setTotalParticipants(leaderboardData.length);
    }
  }, [leaderboardData]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message: NewScoreEvent = JSON.parse(lastMessage.data);
        
        if (message.type === "score:new") {
          const { entry } = message;
          
          // Switch to the category of the new submission
          if (entry.category && entry.category !== currentCategory && currentCategory !== "OVERALL") {
            setCurrentCategory(entry.category);
            setLastUpdateCategory(entry.category);
            // Stop cycling temporarily
            setCycleIndex(ALL_CATEGORIES.indexOf(entry.category));
          }
          
          // Trigger flash animation
          triggerFlashAndRise(() => {
            // Insert new entry
            const newEntry: LeaderboardEntry = {
              id: entry.id,
              name: entry.name,
              category: entry.category,
              totalScore: entry.finalScore,
              createdAt: new Date().toISOString(),
            };

            setEntries(prevEntries => {
              const updatedEntries = [...prevEntries, newEntry];
              // Sort by score (descending) then by date (descending)
              updatedEntries.sort((a, b) => {
                if (b.totalScore !== a.totalScore) {
                  return b.totalScore - a.totalScore;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });
              return updatedEntries;
            });

            setTotalParticipants(prev => prev + 1);

            // Trigger confetti after animation completes (3-5 seconds)
            const animDuration = 3000 + Math.random() * 2000; // Random between 3-5 seconds
            setTimeout(() => {
              createConfetti();
            }, animDuration);
          });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    }
  }, [lastMessage, currentCategory]);

  // Cycle through categories every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only cycle if we haven't had a recent update
      if (!lastUpdateCategory) {
        setCycleIndex((prev) => (prev + 1) % ALL_CATEGORIES.length);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [lastUpdateCategory]);
  
  // Clear last update category after 30 seconds
  useEffect(() => {
    if (lastUpdateCategory) {
      const timeout = setTimeout(() => {
        setLastUpdateCategory(null);
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [lastUpdateCategory]);
  
  // Update current category when cycle index changes
  useEffect(() => {
    setCurrentCategory(ALL_CATEGORIES[cycleIndex]);
  }, [cycleIndex]);
  
  // Refetch when category changes
  useEffect(() => {
    refetch();
  }, [currentCategory, refetch]);

  const getRankBadge = (index: number) => {
    const rank = index + 1;
    if (rank === 1) {
      return (
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
          <i className="fas fa-trophy text-sm sm:text-base"></i>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
          {rank}
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
          {rank}
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
          {rank}
        </div>
      );
    }
  };

  const getBorderColor = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return "border-l-4 border-yellow-500";
    if (rank === 2) return "border-l-4 border-gray-400";
    if (rank === 3) return "border-l-4 border-orange-500";
    return "";
  };

  const getScoreColor = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-500";
    return "text-foreground";
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="portrait-leaderboard min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold mb-4">Loading Leaderboard...</div>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="portrait-leaderboard min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      {/* Flash Overlay */}
      <div id="flashOverlay" className="fixed inset-0 bg-white opacity-0 pointer-events-none z-50"></div>
      
      {/* ARIA Live Region for Accessibility */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {entries.length > 0 && `New score posted for ${entries[0].name}`}
      </div>

      {/* Leaderboard Header */}
      <div className="sticky top-0 z-40 glass-panel safe-area-padding">
        <div className="p-4 sm:p-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Data#3 | Cisco Solution Sprint — Live Leaderboard</h2>
          <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground">Cisco Live Melbourne — World of Solutions</p>
          <div className="mt-4 space-y-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {currentCategory === "OVERALL" ? (
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Overall Leaderboard
                </span>
              ) : (
                <span className={`bg-gradient-to-r ${CATEGORY_COLORS[currentCategory]} bg-clip-text text-transparent`}>
                  {CATEGORY_NAMES[currentCategory]}
                </span>
              )}
            </div>
            <div className="text-base sm:text-lg">
              <span className="text-primary font-bold" data-testid="text-total-participants">
                {totalParticipants}
              </span> solutions submitted
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mt-1 sm:mt-2">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {connectionState === 'connected' ? 'Live updates enabled' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="px-3 sm:px-6 pb-6 safe-area-padding">
        <div className="space-y-2 sm:space-y-3" data-testid="leaderboard-entries">
          {entries.map((entry, index) => (
            <div 
              key={entry.id}
              className={`leaderboard-entry p-3 sm:p-4 ${getBorderColor(index)}`}
              data-testid={`leaderboard-entry-${index}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {getRankBadge(index)}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-base sm:text-lg truncate" data-testid={`text-name-${index}`}>
                      {entry.name}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm" data-testid={`text-category-${index}`}>
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[entry.category] || 'from-gray-500 to-gray-600'} flex-shrink-0`}></div>
                      <span className="text-muted-foreground truncate">{CATEGORY_NAMES[entry.category] || entry.category}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(index)}`} data-testid={`text-score-${index}`}>
                    {entry.totalScore}/50
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground" data-testid={`text-time-${index}`}>
                    {formatTimeAgo(entry.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-base sm:text-lg mb-3 sm:mb-4">
                No submissions yet. Be the first to compete!
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-trophy text-muted-foreground text-xl sm:text-2xl"></i>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
