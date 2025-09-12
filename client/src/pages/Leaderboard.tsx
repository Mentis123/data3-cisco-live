import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";
import { animateScoreCountUp } from "@/lib/anim";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface LeaderboardEntry {
  id: string;
  name: string;
  category: string;
  totalScore: number;
  createdAt: string;
}

interface DashboardData {
  leaderboard: LeaderboardEntry[];
  wordCloud: { text: string; value: number }[];
  categoryStats: { [key: string]: number };
  recentSubmission: any;
  data3Stats: any[];
  topCategoryStats: any[];
  topCategory: string;
}

const CATEGORY_COLORS = {
  SECURE_CONNECTIVITY: "#00BCF2",
  HYBRID_DC: "#6CC04A",
  COLLAB_CX: "#FF6B35",
  OBSERVABILITY: "#9B59B6",
  EDGE_IOT: "#F39C12"
};

const CATEGORY_NAMES = {
  SECURE_CONNECTIVITY: "Zero Trust & Secure Connectivity",
  HYBRID_DC: "Data Centre & Hybrid Cloud",
  COLLAB_CX: "Collaboration & Contact Centre",
  OBSERVABILITY: "Observability & Performance",
  EDGE_IOT: "Edge & IoT Solutions"
};

export default function Leaderboard() {
  const [activeView, setActiveView] = useState<"leaderboard" | "wordcloud" | "categories" | "data3stats">("data3stats");
  const [displayData, setDisplayData] = useState<DashboardData | null>(null);

  // Fetch dashboard data
  const { data, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/dashboard-data");
      return response.json();
    },
    refetchInterval: 5000
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === "scoreUpdate") {
      // Trigger animation for new score
      setTimeout(() => {
        const element = document.querySelector(`[data-entry-id="${message.data.id}"] .text-2xl`);
        if (element) {
          animateScoreCountUp(element as HTMLElement, message.data.totalScore);
        }
      }, 100);

      // Refresh data
      refetch();
    }
  });

  // Auto-rotate views every 10 seconds
  // If user manually selects an empty view, show it for 10s then revert to data3stats
  useEffect(() => {
    if (!displayData) return;

    const getAvailableViews = () => {
      const views: Array<"leaderboard" | "wordcloud" | "categories" | "data3stats"> = [];
      
      // Always include data3stats as it has pre-populated content
      views.push("data3stats");
      
      // Only add other views if they have content (for auto-rotation)
      if (displayData.leaderboard.length > 0) {
        views.push("leaderboard");
      }
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
    
    // If current view is not available for auto-rotation, it's empty
    // Show it briefly then revert to data3stats
    const isEmptyView = currentIndex === -1 && activeView !== "data3stats";
    
    if (isEmptyView) {
      // Show empty view for 10s then revert to data3stats
      const revertTimer = setTimeout(() => {
        setActiveView("data3stats");
      }, 10000);
      return () => clearTimeout(revertTimer);
    }

    const interval = setInterval(() => {
      const views = getAvailableViews();
      if (views.length > 1) {
        currentIndex = (currentIndex + 1) % views.length;
        setActiveView(views[currentIndex]);
      } else {
        // Always revert to data3stats if it's the only available view
        if (activeView !== "data3stats") {
          setActiveView("data3stats");
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [displayData, activeView]);

  // Update display data when query data changes
  useEffect(() => {
    if (data) {
      setDisplayData(data);
    }
  }, [data]);

  if (isLoading || !displayData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const renderLeaderboard = () => {
    if (displayData.leaderboard.length === 0) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-center">
              <i className="fas fa-trophy text-yellow-500 mr-3"></i>
              Live Leaderboard
            </CardTitle>
            <p className="text-center text-muted-foreground text-lg">
              Waiting for first submissions...
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <i className="fas fa-hourglass-half text-4xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">No submissions yet!</p>
              <p className="text-muted-foreground">Come back when participants start submitting solutions to see live rankings here.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-3xl font-bold text-center">
          <i className="fas fa-trophy text-yellow-500 mr-3"></i>
          Live Leaderboard
        </CardTitle>
        <p className="text-center text-muted-foreground text-lg">
          {displayData.leaderboard.length} Solutions • Real-time Rankings
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayData.leaderboard.slice(0, 10).map((entry, index) => (
            <div
              key={entry.id}
              data-entry-id={entry.id}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30' :
                index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/30' :
                index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-2 border-orange-600/30' :
                'bg-muted/30 border border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? 'bg-yellow-500 text-yellow-50' :
                  index === 1 ? 'bg-gray-400 text-gray-50' :
                  index === 2 ? 'bg-orange-600 text-orange-50' :
                  'bg-primary text-primary-foreground'
                }`}>
                  {index < 3 ? (
                    <i className={`fas ${index === 0 ? 'fa-crown' : index === 1 ? 'fa-medal' : 'fa-award'}`}></i>
                  ) : (
                    index + 1
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{entry.name}</p>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: `${CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]}20` }}
                  >
                    {CATEGORY_NAMES[entry.category as keyof typeof CATEGORY_NAMES]}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{entry.totalScore}</p>
                <p className="text-sm text-muted-foreground">/ 50</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    );
  };

  const renderWordCloud = () => {
    if (displayData.wordCloud.length === 0) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-center">
              <i className="fas fa-cloud text-blue-500 mr-3"></i>
              Popular Technologies
            </CardTitle>
            <p className="text-center text-muted-foreground text-lg">
              Most mentioned Cisco products in solutions
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <i className="fas fa-cloud text-4xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">No technology data yet!</p>
              <p className="text-muted-foreground">Come back when solutions are submitted to see popular Cisco products mentioned.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const maxValue = Math.max(...displayData.wordCloud.map(w => w.value));

    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-center">
            <i className="fas fa-cloud text-blue-500 mr-3"></i>
            Popular Technologies
          </CardTitle>
          <p className="text-center text-muted-foreground text-lg">
            Most mentioned Cisco products in solutions
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center items-center min-h-[400px]">
            {displayData.wordCloud.slice(0, 20).map((word, index) => {
              const size = Math.max(16, Math.min(48, (word.value / maxValue) * 48));
              const opacity = Math.max(0.6, word.value / maxValue);

              return (
                <span
                  key={word.text}
                  className="inline-block px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 transition-all duration-300 hover:scale-110"
                  style={{
                    fontSize: `${size}px`,
                    opacity,
                    color: `hsl(197, 95%, ${Math.max(45, 80 - (word.value / maxValue) * 35)}%)`
                  }}
                >
                  {word.text}
                  <span className="text-xs ml-1 opacity-70">({word.value})</span>
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCategoryStats = () => {
    const categoryData = Object.entries(displayData.categoryStats).map(([category, count]) => ({
      name: CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES],
      value: count,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
    }));

    const totalSubmissions = Object.values(displayData.categoryStats).reduce((a, b) => a + b, 0);

    if (totalSubmissions === 0) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-center">
              <i className="fas fa-chart-pie text-green-500 mr-3"></i>
              Problem Categories
            </CardTitle>
            <p className="text-center text-muted-foreground text-lg">
              Distribution of business problems by technology area
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <i className="fas fa-chart-pie text-4xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">No category data yet!</p>
              <p className="text-muted-foreground">Come back when solutions are submitted to see the distribution across different technology areas.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-center">
            <i className="fas fa-chart-pie text-green-500 mr-3"></i>
            Problem Categories
          </CardTitle>
          <p className="text-center text-muted-foreground text-lg">
            Distribution of business problems by technology area
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Category Breakdown</h3>
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{category.value}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({((category.value / totalSubmissions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderData3Stats = () => {
    const relevantStats = displayData.recentSubmission
      ? displayData.topCategoryStats
      : displayData.data3Stats.slice(0, 6);

    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-center">
            <i className="fas fa-building text-blue-600 mr-3"></i>
            Data<sup>³</sup> by the Numbers
          </CardTitle>
          <p className="text-center text-muted-foreground text-lg">
            {displayData.recentSubmission
              ? `Stats related to ${CATEGORY_NAMES[displayData.topCategory as keyof typeof CATEGORY_NAMES]}`
              : "Scale and expertise across Australia & New Zealand"
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relevantStats.map((stat, index) => (
              <div
                key={stat.id}
                className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
              >
                <div className="text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold mb-1">
                  {stat.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>

          {displayData.recentSubmission && (
            <div className="mt-8 p-4 rounded-lg bg-muted/20 border border-muted-foreground/20">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-clock text-primary"></i>
                <span className="font-semibold">Latest Submission</span>
              </div>
              <p className="text-sm">
                <strong>{displayData.recentSubmission.name}</strong> just submitted a solution for{' '}
                <Badge variant="secondary" className="mx-1">
                  {CATEGORY_NAMES[displayData.recentSubmission.category as keyof typeof CATEGORY_NAMES]}
                </Badge>
                scoring <strong>{displayData.recentSubmission.totalScore}/50</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 portrait-leaderboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <Link href="/">
            <Button variant="outline" size="sm" className="absolute left-0 top-0">
              <i className="fas fa-home mr-2"></i>
              Home
            </Button>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Data<sup>³</sup> Solution Sprint
          </h1>
          <p className="text-xl text-muted-foreground">
            Cisco Live Melbourne 2025 • Powered by AI
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2 p-1 bg-muted/30 rounded-lg">
            {[
              { 
                key: "leaderboard", 
                icon: "fa-trophy", 
                mobileIcon: (
                  <svg width="20" height="16" viewBox="0 0 24 20" fill="none" className="inline-block">
                    {/* Podium steps */}
                    <rect x="0" y="12" width="6" height="8" rx="1" fill="#CD7F32" />
                    <rect x="9" y="6" width="6" height="14" rx="1" fill="#FFD700" />
                    <rect x="18" y="9" width="6" height="11" rx="1" fill="#C0C0C0" />
                    {/* Position numbers */}
                    <text x="3" y="17" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">2</text>
                    <text x="12" y="14" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">1</text>
                    <text x="21" y="16" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">3</text>
                  </svg>
                ),
                label: "Rankings", 
                hasContent: displayData?.leaderboard.length > 0 
              },
              { key: "wordcloud", icon: "fa-cloud", label: "Technologies", hasContent: displayData?.wordCloud.length > 0 },
              { key: "categories", icon: "fa-chart-pie", label: "Categories", hasContent: displayData && Object.values(displayData.categoryStats).some(v => v > 0) },
              { key: "data3stats", icon: "fa-building", label: "Stats", hasContent: true }
            ].map((view) => (
              <Button
                key={view.key}
                variant={activeView === view.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView(view.key as any)}
                className="transition-all duration-200"
              >
                {/* Mobile: Show only icons */}
                <div className="block sm:hidden">
                  {view.key === "leaderboard" ? view.mobileIcon : <i className={`fas ${view.icon}`}></i>}
                </div>
                {/* Desktop: Show icon + text */}
                <div className="hidden sm:flex items-center">
                  {view.key === "leaderboard" ? (
                    <>
                      {view.mobileIcon}
                      <span className="ml-2">{view.label}</span>
                    </>
                  ) : (
                    <>
                      <i className={`fas ${view.icon} mr-2`}></i>
                      {view.label}
                    </>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Active View */}
        <div className="transition-all duration-500">
          {activeView === "leaderboard" && renderLeaderboard()}
          {activeView === "wordcloud" && renderWordCloud()}
          {activeView === "categories" && renderCategoryStats()}
          {activeView === "data3stats" && renderData3Stats()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Visit the Data<sup>³</sup> booth to participate • Challenge entries scored in real-time</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Live Updates
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Auto-rotating every 10s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}