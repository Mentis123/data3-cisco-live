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

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
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
  }, [lastMessage]);

  const getRankBadge = (index: number) => {
    const rank = index + 1;
    if (rank === 1) {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-lg">
          {rank}
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
          {rank}
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-black font-bold text-lg">
          {rank}
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold text-lg">
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
      <div className="sticky top-0 z-40 glass-panel">
        <div className="p-6 text-center">
          <h2 className="text-4xl font-bold mb-2">Data#3 | Cisco Solution Sprint — Live Leaderboard</h2>
          <p className="text-xl text-muted-foreground">Cisco Live Melbourne — World of Solutions</p>
          <div className="mt-4 text-lg">
            <span className="text-primary font-bold" data-testid="text-total-participants">
              {totalParticipants}
            </span> solutions submitted
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-muted-foreground">
              {connectionState === 'connected' ? 'Live updates enabled' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="px-6 pb-6">
        <div className="space-y-3" data-testid="leaderboard-entries">
          {entries.map((entry, index) => (
            <div 
              key={entry.id}
              className={`leaderboard-entry ${getBorderColor(index)}`}
              data-testid={`leaderboard-entry-${index}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getRankBadge(index)}
                  <div>
                    <div className="font-bold text-lg" data-testid={`text-name-${index}`}>
                      {entry.name}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid={`text-category-${index}`}>
                      {CATEGORY_NAMES[entry.category] || entry.category}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(index)}`} data-testid={`text-score-${index}`}>
                    {entry.totalScore}/50
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`text-time-${index}`}>
                    {formatTimeAgo(entry.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-4">
                No submissions yet. Be the first to compete!
              </div>
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-trophy text-muted-foreground text-2xl"></i>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
