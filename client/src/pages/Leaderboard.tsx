
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
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

interface CategoryStats {
  category: string;
  count: number;
  averageScore: number;
  topScore: number;
}

interface ProblemKeyword {
  text: string;
  count: number;
  category: string;
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

const CHART_COLORS = {
  "SECURE_CONNECTIVITY": "#3b82f6",
  "HYBRID_DC": "#8b5cf6",
  "COLLAB_CX": "#10b981",
  "OBSERVABILITY": "#f59e0b",
  "EDGE_IOT": "#ef4444"
};

// Data#3 Company Stats
const DATA3_STATS = {
  employees: "2,400+",
  revenue: "$2.8B AUD",
  locations: "50+ locations",
  countries: "Australia & New Zealand",
  partnerships: "200+ vendor partnerships",
  experience: "45+ years",
  customers: "100,000+ customers",
  certifications: "5,000+ technical certifications"
};

const ALL_CATEGORIES = ["OVERALL", ...Object.keys(CATEGORY_NAMES)];

type DisplayMode = "leaderboard" | "wordcloud" | "stats" | "d3facts";

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("OVERALL");
  const [cycleIndex, setCycleIndex] = useState(0);
  const [lastUpdateCategory, setLastUpdateCategory] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("leaderboard");
  const [recentSubmissionCategory, setRecentSubmissionCategory] = useState<string | null>(null);

  const { data: leaderboardData, isLoading, refetch } = useQuery({
    queryKey: ["/api/leaderboard", currentCategory === "OVERALL" ? undefined : currentCategory],
    queryFn: async () => {
      const params = currentCategory === "OVERALL" ? "" : `?category=${currentCategory}`;
      const response = await fetch(`/api/leaderboard${params}`);
      return response.json();
    },
    refetchInterval: 30000,
  });

  const { data: allSubmissions } = useQuery({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const { lastMessage, connectionState } = useWebSocket("/ws");

  // Generate category statistics
  const categoryStats: CategoryStats[] = Object.keys(CATEGORY_NAMES).map(category => {
    const categoryEntries = allSubmissions?.filter((entry: LeaderboardEntry) => entry.category === category) || [];
    return {
      category,
      count: categoryEntries.length,
      averageScore: categoryEntries.length > 0 ? Math.round(categoryEntries.reduce((sum: number, entry: LeaderboardEntry) => sum + entry.totalScore, 0) / categoryEntries.length) : 0,
      topScore: categoryEntries.length > 0 ? Math.max(...categoryEntries.map((entry: LeaderboardEntry) => entry.totalScore)) : 0
    };
  });

  // Generate problem keywords (simulated word cloud data)
  const generateWordCloudData = (): ProblemKeyword[] => {
    const keywords = [
      { text: "Security", count: 45, category: "SECURE_CONNECTIVITY" },
      { text: "Network", count: 38, category: "SECURE_CONNECTIVITY" },
      { text: "Cloud", count: 42, category: "HYBRID_DC" },
      { text: "Collaboration", count: 35, category: "COLLAB_CX" },
      { text: "Monitoring", count: 29, category: "OBSERVABILITY" },
      { text: "IoT", count: 33, category: "EDGE_IOT" },
      { text: "Automation", count: 31, category: "OBSERVABILITY" },
      { text: "Remote Work", count: 27, category: "COLLAB_CX" },
      { text: "Zero Trust", count: 25, category: "SECURE_CONNECTIVITY" },
      { text: "Edge Computing", count: 23, category: "EDGE_IOT" },
      { text: "Data Centre", count: 28, category: "HYBRID_DC" },
      { text: "Analytics", count: 22, category: "OBSERVABILITY" },
      { text: "Hybrid", count: 26, category: "HYBRID_DC" },
      { text: "Communication", count: 21, category: "COLLAB_CX" },
      { text: "Sensors", count: 19, category: "EDGE_IOT" }
    ];
    return keywords;
  };

  // Initialize leaderboard data
  useEffect(() => {
    if (leaderboardData && Array.isArray(leaderboardData)) {
      const uniqueEntries = Array.from(
        new Map(leaderboardData.map(entry => [entry.id, entry])).values()
      );
      setEntries(uniqueEntries);
      setTotalParticipants(uniqueEntries.length);
    }
  }, [leaderboardData]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message: NewScoreEvent = JSON.parse(lastMessage.data);
        
        if (message.type === "score:new") {
          const { entry } = message;
          
          // Track recent submission category
          setRecentSubmissionCategory(entry.category);
          
          // Switch to the category of the new submission
          if (entry.category && entry.category !== currentCategory && currentCategory !== "OVERALL") {
            setCurrentCategory(entry.category);
            setLastUpdateCategory(entry.category);
            setCycleIndex(ALL_CATEGORIES.indexOf(entry.category));
          }
          
          // Trigger flash animation
          triggerFlashAndRise(() => {
            const newEntry: LeaderboardEntry = {
              id: entry.id,
              name: entry.name,
              category: entry.category,
              totalScore: entry.finalScore,
              createdAt: new Date().toISOString(),
            };

            setEntries(prevEntries => {
              const existingIndex = prevEntries.findIndex(e => e.id === newEntry.id);
              let updatedEntries;
              
              if (existingIndex >= 0) {
                updatedEntries = [...prevEntries];
                updatedEntries[existingIndex] = newEntry;
              } else {
                updatedEntries = [...prevEntries, newEntry];
              }
              
              updatedEntries.sort((a, b) => {
                if (b.totalScore !== a.totalScore) {
                  return b.totalScore - a.totalScore;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });
              return updatedEntries;
            });

            setTotalParticipants(prev => prev + 1);

            const animDuration = 6000 + Math.random() * 2000;
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

  // Cycle through display modes every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMode(prev => {
        const modes: DisplayMode[] = ["leaderboard", "wordcloud", "stats", "d3facts"];
        const currentIndex = modes.indexOf(prev);
        return modes[(currentIndex + 1) % modes.length];
      });
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  // Cycle through categories every 15 seconds (only for leaderboard mode)
  useEffect(() => {
    if (displayMode === "leaderboard") {
      const interval = setInterval(() => {
        if (!lastUpdateCategory || lastUpdateCategory === "OVERALL") {
          setCycleIndex((prev) => (prev + 1) % ALL_CATEGORIES.length);
        }
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [lastUpdateCategory, displayMode]);
  
  // Clear last update category after 45 seconds
  useEffect(() => {
    if (lastUpdateCategory) {
      const timeout = setTimeout(() => {
        setLastUpdateCategory(null);
      }, 45000);
      return () => clearTimeout(timeout);
    }
  }, [lastUpdateCategory]);
  
  // Update current category when cycle index changes
  useEffect(() => {
    if (displayMode === "leaderboard") {
      setCurrentCategory(ALL_CATEGORIES[cycleIndex]);
    }
  }, [cycleIndex, displayMode]);
  
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

  const renderWordCloud = () => {
    const wordData = generateWordCloudData();
    const maxCount = Math.max(...wordData.map(w => w.count));
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">Problem Keywords</h3>
          <p className="text-muted-foreground">Most common technology challenges</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 p-6">
          {wordData.map((word, index) => {
            const size = Math.max(1, (word.count / maxCount) * 3);
            const fontSize = `${size}rem`;
            const color = CHART_COLORS[word.category as keyof typeof CHART_COLORS] || "#6b7280";
            
            return (
              <span
                key={index}
                className="font-bold transition-all duration-300 hover:opacity-80"
                style={{
                  fontSize,
                  color,
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                }}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const mostActiveCategory = categoryStats.reduce((max, cat) => 
      cat.count > max.count ? cat : max, categoryStats[0] || { category: "SECURE_CONNECTIVITY", count: 0, averageScore: 0, topScore: 0 }
    );

    const recentCategory = recentSubmissionCategory || mostActiveCategory.category;
    const focusCategory = categoryStats.find(cat => cat.category === recentCategory) || mostActiveCategory;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">Category Insights</h3>
          <p className="text-muted-foreground">
            Focusing on {CATEGORY_NAMES[focusCategory.category]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ category, count }) => `${CATEGORY_NAMES[category]}: ${count}`}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[entry.category as keyof typeof CHART_COLORS]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Score Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average Scores by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats}>
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => CATEGORY_NAMES[value]?.split(' ')[0] || value}
                    />
                    <YAxis />
                    <Bar 
                      dataKey="averageScore" 
                      fill={(entry) => CHART_COLORS[entry.category as keyof typeof CHART_COLORS]}
                      radius={[4, 4, 0, 0]}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded p-2 shadow-lg">
                              <p className="font-medium">{CATEGORY_NAMES[data.category]}</p>
                              <p>Average: {data.averageScore}/50</p>
                              <p>Submissions: {data.count}</p>
                              <p>Top Score: {data.topScore}/50</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Focus Category Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl">
              <span className={`bg-gradient-to-r ${CATEGORY_COLORS[focusCategory.category]} bg-clip-text text-transparent`}>
                {CATEGORY_NAMES[focusCategory.category]}
              </span>
              {recentSubmissionCategory && " — Latest Submission Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{focusCategory.count}</div>
                <div className="text-sm text-muted-foreground">Submissions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{focusCategory.averageScore}/50</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">{focusCategory.topScore}/50</div>
                <div className="text-sm text-muted-foreground">Top Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderD3Facts = () => {
    const facts = Object.entries(DATA3_STATS);
    const randomFacts = facts.sort(() => Math.random() - 0.5).slice(0, 6);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-2">About Data#3</h3>
          <p className="text-muted-foreground">Australia's leading technology solutions provider</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {randomFacts.map(([key, value], index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">{value}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h4 className="text-xl font-bold mb-4">Cisco Partnership Excellence</h4>
            <p className="text-muted-foreground leading-relaxed">
              Data#3 is a Cisco Gold Partner with over 45 years of experience delivering 
              cutting-edge technology solutions across Australia and New Zealand. With 2,400+ 
              employees and 5,000+ technical certifications, we're helping organizations 
              transform their technology infrastructure with Cisco's industry-leading solutions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="portrait-leaderboard min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold mb-4">Loading Display Board...</div>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const getDisplayModeTitle = () => {
    switch (displayMode) {
      case "leaderboard": return currentCategory === "OVERALL" ? "Overall Leaderboard" : CATEGORY_NAMES[currentCategory];
      case "wordcloud": return "Technology Problem Insights";
      case "stats": return "Category Performance Analysis";
      case "d3facts": return "Data#3 Company Showcase";
      default: return "Live Display Board";
    }
  };

  return (
    <div className="portrait-leaderboard min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      {/* Flash Overlay */}
      <div id="flashOverlay" className="fixed inset-0 bg-white opacity-0 pointer-events-none z-50"></div>
      
      {/* ARIA Live Region for Accessibility */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {entries.length > 0 && `New score posted for ${entries[0].name}`}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel safe-area-padding">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="min-h-[40px] px-3">
                <i className="fas fa-arrow-left mr-2"></i>
                Home
              </Button>
            </Link>
            <div className="flex-1 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Data#3 | Cisco Solution Sprint — Live Display</h2>
              <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground">Cisco Live Melbourne — World of Solutions</p>
            </div>
            <div className="w-[88px] flex items-center justify-center">
              <div className="text-xs text-muted-foreground">
                {displayMode.toUpperCase()}
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {getDisplayModeTitle()}
              </span>
            </div>
            <div className="text-base sm:text-lg">
              <span className="text-primary font-bold">{totalParticipants}</span> solutions submitted
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

      {/* Main Content */}
      <div className="px-3 sm:px-6 pb-6 safe-area-padding">
        {displayMode === "leaderboard" && (
          <div className="space-y-2 sm:space-y-3">
            {entries.map((entry, index) => (
              <div 
                key={entry.id}
                className={`leaderboard-entry p-3 sm:p-4 ${getBorderColor(index)}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {getRankBadge(index)}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-base sm:text-lg truncate">
                        {entry.name}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[entry.category] || 'from-gray-500 to-gray-600'} flex-shrink-0`}></div>
                        <span className="text-muted-foreground truncate">{CATEGORY_NAMES[entry.category] || entry.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(index)}`}>
                      {entry.totalScore}/50
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
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
        )}

        {displayMode === "wordcloud" && renderWordCloud()}
        {displayMode === "stats" && renderStats()}
        {displayMode === "d3facts" && renderD3Facts()}
      </div>
    </div>
  );
}
