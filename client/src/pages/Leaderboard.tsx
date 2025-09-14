import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";
import { animateScoreCountUp } from "@/lib/anim";
import { audioManager } from "@/lib/audio";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LabelList } from "recharts";

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

export default function Leaderboard() {
  const [activeView, setActiveView] = useState<"leaderboard" | "wordcloud" | "categories" | "data3stats">("data3stats");
  const [displayData, setDisplayData] = useState<DashboardData | null>(null);

  // Test function for manual audio trigger
  const testAudio = () => {
    console.log('🎵 Testing audio manually...');
    audioManager.playFlashSound().catch(err => console.warn('Manual flash sound failed:', err));
    setTimeout(() => {
      audioManager.playNewChallengerSound().catch(err => console.warn('Manual challenger sound failed:', err));
    }, 750); // Same timing as real announcement
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewDisplayCounts, setViewDisplayCounts] = useState<Record<string, number>>({});
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  
  // New submission detection and announcement state
  const [, setLocation] = useLocation();
  const [knownSubmissionIds, setKnownSubmissionIds] = useState<Set<string>>(new Set());
  const [newSubmissionTime, setNewSubmissionTime] = useState<number | null>(null);
  const [isAnnouncementMode, setIsAnnouncementMode] = useState(false);

  // Reset timing counters when a new submission occurs
  useEffect(() => {
    if (newSubmissionTime) {
      setViewDisplayCounts({});
    }
  }, [newSubmissionTime]);

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
    console.log('WebSocket message received:', message);
    if (message.type === "scoreUpdate") {
      // Check if this is a genuinely new submission
      const submissionId = message.data.id;
      const isNewSubmission = !knownSubmissionIds.has(submissionId);
      
      console.log('Score update - New submission?', isNewSubmission, 'ID:', submissionId);
      
      if (isNewSubmission) {
        console.log('🚨 NEW SUBMISSION DETECTED! Playing sounds...');
        
        // Mark as announcement mode and record time
        setIsAnnouncementMode(true);
        setNewSubmissionTime(Date.now());
        
        // Add to known submissions
        setKnownSubmissionIds(prev => new Set([...Array.from(prev), submissionId]));
        
        // Play flash sound immediately, then challenger sound after a brief delay
        audioManager.playFlashSound().catch(err => console.warn('Flash sound failed:', err));
        setTimeout(() => {
          audioManager.playNewChallengerSound().catch(err => console.warn('Challenger sound failed:', err));
        }, 750); // Wait 750ms so flash sound plays first
        
        // Store submission data for announcement page
        const submissionData = {
          id: submissionId,
          participantName: message.data.name,
          firstName: message.data.name.split(' ')[0],
          lastName: message.data.name.split(' ')[1] || '',
          category: message.data.category,
          totalScore: message.data.finalScore,
          rank: message.data.targetRank,
          createdAt: new Date().toISOString()
        };
        
        // Store in sessionStorage for announcement page to retrieve
        sessionStorage.setItem('newSubmissionData', JSON.stringify(submissionData));
        
        // Navigate to announcement page
        setLocation('/announcement');
        
        // Auto-return to leaderboard after 10 seconds
        setTimeout(() => {
          setLocation('/leaderboard');
        }, 10000);
      }
      
      // Trigger animation for score update
      setTimeout(() => {
        const element = document.querySelector(`[data-entry-id="${message.data.id}"] .text-2xl`);
        if (element) {
          animateScoreCountUp(element as HTMLElement, message.data.finalScore || message.data.totalScore);
        }
      }, 100);

      // Refresh data
      refetch();
    }
  });

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  };

  // Listen for fullscreen changes and escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        // Browser handles escape automatically, we just update state
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Reset view counts when a new submission arrives
  useEffect(() => {
    if (displayData?.recentSubmission?.id && displayData.recentSubmission.id !== lastSubmissionId) {
      setLastSubmissionId(displayData.recentSubmission.id);
      setViewDisplayCounts({}); // Reset counts for new submission
    }
  }, [displayData?.recentSubmission?.id, lastSubmissionId]);

  // Auto-rotate views with graduated timing for new submissions
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

    // Calculate display interval based on submission timing and view count
    const getDisplayInterval = () => {
      // Check if we're in announcement mode and within 5 minutes of new submission
      const now = Date.now();
      const timeSinceNewSubmission = newSubmissionTime ? (now - newSubmissionTime) / 1000 : Infinity; // in seconds
      const isWithin5Minutes = isAnnouncementMode && timeSinceNewSubmission < 300;
      
      if (isWithin5Minutes && activeView === "data3stats") {
        // Get the current display count for the stats view
        const currentViewCount = viewDisplayCounts[activeView] || 0;
        
        // Graduated timing: 30s → 20s → 10s for stats view only after new submission
        if (currentViewCount === 0) {
          return 30000; // First display: 30 seconds
        } else if (currentViewCount === 1) {
          return 20000; // Second display: 20 seconds
        }
        // Third display and beyond: 10 seconds (falls through to default)
      }
      
      return 10000; // Default: 10 seconds
    };

    const displayInterval = getDisplayInterval();

    const interval = setInterval(() => {
      // Update the display count for the current view before rotating
      setViewDisplayCounts(prev => ({
        ...prev,
        [activeView]: (prev[activeView] || 0) + 1
      }));
      
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
    }, displayInterval);

    return () => clearInterval(interval);
  }, [displayData, activeView, viewDisplayCounts]);

  // Initialize known submission IDs from existing data and update display data
  useEffect(() => {
    if (data) {
      setDisplayData(data);
      
      // Initialize known submission IDs from existing leaderboard
      if (data.leaderboard) {
        const existingIds = new Set(data.leaderboard.map(entry => entry.id));
        setKnownSubmissionIds(existingIds);
      }
    }
  }, [data]);

  // Clear announcement mode when returning to leaderboard
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnnouncementMode(false);
    }, 5 * 60 * 1000); // Clear after 5 minutes
    
    return () => clearTimeout(timer);
  }, [newSubmissionTime]);

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
    const titleSize = isFullscreen ? 'text-5xl' : 'text-3xl';
    const subtitleSize = isFullscreen ? 'text-2xl' : 'text-lg';
    const nameSize = isFullscreen ? 'text-2xl' : 'text-lg';
    const scoreSize = isFullscreen ? 'text-4xl' : 'text-2xl';
    const badgeSize = isFullscreen ? 'text-sm' : 'text-xs';
    const rankSize = isFullscreen ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-lg';
    const padding = isFullscreen ? 'p-6' : 'p-4';
    const spaceY = isFullscreen ? 'space-y-4' : 'space-y-3';
    
    if (displayData.leaderboard.length === 0) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className={`${titleSize} font-bold text-center`}>
              <i className="fas fa-trophy text-yellow-500 mr-3"></i>
              Live Leaderboard
            </CardTitle>
            <p className={`text-center text-muted-foreground ${subtitleSize}`}>
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
        <CardTitle className={`${titleSize} font-bold text-center`}>
          <i className="fas fa-trophy text-yellow-500 mr-3"></i>
          Live Leaderboard
        </CardTitle>
        <p className={`text-center text-muted-foreground ${subtitleSize}`}>
          {displayData.leaderboard.length} Solutions • Real-time Rankings
        </p>
      </CardHeader>
      <CardContent>
        <div className={spaceY}>
          {displayData.leaderboard.slice(0, 10).map((entry, index) => (
            <div
              key={entry.id}
              data-entry-id={entry.id}
              className={`flex items-center justify-between ${padding} rounded-xl transition-all duration-300 ${
                index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30' :
                index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/30' :
                index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-2 border-orange-600/30' :
                'bg-muted/30 border border-border'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`${rankSize} rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-[#FFD700] text-gray-900 shadow-lg shadow-yellow-400/50' :
                  index === 1 ? 'bg-[#C0C0C0] text-gray-900 shadow-lg shadow-gray-400/50' :
                  index === 2 ? 'bg-[#CD7F32] text-white shadow-lg shadow-orange-600/50' :
                  'bg-cyan-900/30 text-cyan-300/70'
                }`}>
                  {index < 3 ? (
                    <i className={`fas ${index === 0 ? 'fa-crown' : index === 1 ? 'fa-medal' : 'fa-award'}`}></i>
                  ) : (
                    index + 1
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${nameSize}`}>{entry.name}</p>
                  <Badge
                    variant="secondary"
                    className={`${badgeSize} text-white`}
                    style={{ backgroundColor: CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] }}
                  >
                    {CATEGORY_NAMES[entry.category as keyof typeof CATEGORY_NAMES]}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className={`${scoreSize} font-bold text-primary`}>{entry.totalScore}</p>
                <p className={`${isFullscreen ? 'text-lg' : 'text-sm'} text-muted-foreground`}>/ 50</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    );
  };

  const renderWordCloud = () => {
    const titleSize = isFullscreen ? 'text-5xl' : 'text-3xl';
    const subtitleSize = isFullscreen ? 'text-2xl' : 'text-lg';
    
    if (displayData.wordCloud.length === 0) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className={`${titleSize} font-bold text-center`}>
              <i className="fas fa-cloud text-blue-500 mr-3"></i>
              Popular Technologies
            </CardTitle>
            <p className={`text-center text-muted-foreground ${subtitleSize}`}>
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
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className={`${titleSize} font-bold text-center`}>
            <i className="fas fa-cloud text-blue-500 mr-3"></i>
            Popular Technologies
          </CardTitle>
          <p className={`text-center text-muted-foreground ${subtitleSize}`}>
            Most mentioned Cisco products in solutions
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[340px] sm:min-h-[400px] max-h-[340px] sm:max-h-[400px] overflow-hidden flex items-center justify-center">
            {/* Cloud background effects */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-cyan-400 rounded-full filter blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 sm:w-48 h-24 sm:h-48 bg-blue-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 sm:w-72 h-36 sm:h-72 bg-purple-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            {/* Word cloud with organic positioning */}
            <div className="relative w-full h-full flex items-center justify-center">
              {displayData.wordCloud.slice(0, 8).map((word, index) => {
                // Check if mobile (viewport width less than 640px)
                const isMobile = window.innerWidth < 640;
                
                let size: number;
                let opacity: number;
                let zIndex: number;
                let x: number;
                let y: number;
                
                if (index === 0) {
                  // Biggest word - ABSOLUTELY CENTERED
                  opacity = 1;
                  zIndex = 30;
                  
                  return (
                    <div
                      key={word.text}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex,
                      }}
                    >
                      <span
                        className="inline-block px-3 py-2 rounded-lg border-2 border-cyan-400/40 bg-gray-800/80 backdrop-blur-sm text-cyan-300 shadow-lg shadow-cyan-400/20 hover:border-cyan-400/60 hover:shadow-cyan-400/40 hover:bg-gray-800/90 word-cloud-float-1"
                        style={{
                          fontSize: isFullscreen ? 'clamp(40px, 10vw, 80px)' : 'clamp(24px, 9vw, 56px)',
                          opacity,
                          textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                          whiteSpace: 'nowrap',
                          wordBreak: 'normal',
                          overflowWrap: 'normal',
                          maxWidth: '90vw',
                        }}
                      >
                        {word.text}
                        <span className="hidden sm:inline ml-1 opacity-60" style={{ fontSize: '0.4em' }}>({word.value})</span>
                      </span>
                    </div>
                  );
                } else if (index < 5) {
                  // Next 4 words - scattered naturally around center
                  size = isFullscreen ? 48 : (isMobile ? 22 : 32);
                  opacity = 0.95;
                  zIndex = 20;
                  
                  // Create more organic positioning
                  const positions = [
                    { x: -150, y: -80 },  // Top-left
                    { x: 160, y: -60 },   // Top-right  
                    { x: -140, y: 90 },   // Bottom-left
                    { x: 150, y: 70 }     // Bottom-right
                  ];
                  
                  const pos = positions[index - 1];
                  x = isFullscreen ? pos.x * 1.8 : (isMobile ? pos.x * 0.6 : pos.x);
                  y = isFullscreen ? pos.y * 1.8 : (isMobile ? pos.y * 0.6 : pos.y);
                  
                  return (
                    <div
                      key={word.text}
                      className="absolute" // Removed animation class from wrapper to preserve positioning
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        zIndex,
                      }}
                    >
                      <span
                        className={`inline-block px-3 py-2 rounded-lg border-2 border-cyan-400/40 bg-gray-800/80 backdrop-blur-sm text-cyan-300 shadow-lg shadow-cyan-400/20 hover:border-cyan-400/60 hover:shadow-cyan-400/40 hover:bg-gray-800/90 whitespace-nowrap word-cloud-peripheral-${(index % 3) + 1}`} // Added new animation class for peripheral movement
                        style={{
                          fontSize: `${size}px`,
                          opacity,
                          textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                          animationDelay: `${index * 0.5}s`,
                        }}
                      >
                        {word.text}
                        <span className="hidden sm:inline ml-1 opacity-60" style={{ fontSize: '0.4em' }}>({word.value})</span>
                      </span>
                    </div>
                  );
                } else {
                  // Remaining 3 words (index 5-7) - outer layer
                  size = isFullscreen ? 28 : (isMobile ? 16 : 24);
                  opacity = 0.8;
                  zIndex = 10;
                  
                  // Scatter the last 3 words nicely
                  const outerPositions = [
                    { x: -200, y: -120 },   // Top-left
                    { x: 0, y: 150 },       // Bottom center
                    { x: 180, y: -100 }     // Top-right
                  ];
                  
                  const pos = outerPositions[index - 5];
                  x = isFullscreen ? pos.x * 1.5 : (isMobile ? pos.x * 0.7 : pos.x);
                  y = isFullscreen ? pos.y * 1.5 : (isMobile ? pos.y * 0.7 : pos.y);
                  
                  return (
                    <div
                      key={word.text}
                      className="absolute word-cloud-drift"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        zIndex,
                        animationDelay: `${index * 0.5}s`,
                      }}
                    >
                      <span
                        className="inline-block px-3 py-2 rounded-lg border-2 border-cyan-400/40 bg-gray-800/80 backdrop-blur-sm text-cyan-300 shadow-lg shadow-cyan-400/20 hover:border-cyan-400/60 hover:shadow-cyan-400/40 hover:bg-gray-800/90 whitespace-nowrap"
                        style={{
                          fontSize: `${size}px`,
                          opacity,
                          textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                        }}
                      >
                        {word.text}
                        <span className="hidden sm:inline ml-1 opacity-60" style={{ fontSize: '0.4em' }}>({word.value})</span>
                      </span>
                    </div>
                  );
                }
              }).filter(Boolean)}
            </div>
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

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isLargeScreen = typeof window !== 'undefined' && window.innerWidth > 1024;
    
    // Dynamic sizing based on fullscreen and screen size
    const chartRadius = isFullscreen ? (isLargeScreen ? 200 : 160) : (isMobile ? 100 : 140);
    const chartHeight = isFullscreen ? 600 : (isMobile ? 300 : 450);
    const labelFontSize = isFullscreen ? '28px' : (isMobile ? '16px' : '20px'); // Increased font sizes
    const valueFontSize = isFullscreen ? '24px' : (isMobile ? '12px' : '16px'); // Smaller font sizes for better fit
    const titleSize = isFullscreen ? 'text-5xl' : 'text-3xl';
    const subtitleSize = isFullscreen ? 'text-2xl' : 'text-lg';
    
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className={`${titleSize} font-bold text-center`}>
            <i className="fas fa-chart-pie text-green-500 mr-3"></i>
            Problem Categories
          </CardTitle>
          <p className={`text-center text-muted-foreground ${subtitleSize}`}>
            Distribution of business problems by technology area
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Pie Chart */}
            <div className="w-full sm:flex-1" style={{ minHeight: `${chartHeight}px`, height: `${chartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart
                  width={isMobile ? 300 : 500}
                  height={chartHeight}
                  style={{
                    textRendering: 'geometricPrecision',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    shapeRendering: 'crispEdges'
                  }}
                >
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={chartRadius}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={false}
                >
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
            </ResponsiveContainer>
            </div>
            
            {/* Legend with percentages and counts */}
            <div className="w-full px-4">
              <div className="space-y-2">
                {categoryData.map((entry, index) => {
                  const percent = ((entry.value / totalSubmissions) * 100).toFixed(0);
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div 
                          className="w-4 h-4 rounded flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className={`${isFullscreen ? 'text-xl' : 'text-sm'} font-medium`}>{entry.name}</span>
                      </div>
                      <span className={`${isFullscreen ? 'text-xl' : 'text-sm'} font-bold text-muted-foreground whitespace-nowrap`}>
                        {percent}% ({entry.value})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderData3Stats = () => {
    const titleSize = isFullscreen ? 'text-5xl' : 'text-3xl';
    const subtitleSize = isFullscreen ? 'text-2xl' : 'text-lg';
    const statValueSize = isFullscreen ? 'text-6xl' : 'text-4xl';
    const statTitleSize = isFullscreen ? 'text-2xl' : 'text-lg';
    const statDescSize = isFullscreen ? 'text-lg' : 'text-sm';
    const padding = isFullscreen ? 'p-8' : 'p-6';
    // Show category-specific stats for 5 minutes after submission, then show random stats
    const submissionTime = displayData.recentSubmission?.createdAt 
      ? new Date(displayData.recentSubmission.createdAt).getTime() 
      : 0;
    const now = Date.now();
    const timeSinceSubmission = (now - submissionTime) / 1000; // in seconds
    
    const isWithin5Minutes = displayData.recentSubmission && timeSinceSubmission < 300; // 5 minutes = 300 seconds
    const relevantStats = isWithin5Minutes
      ? displayData.topCategoryStats
      : displayData.data3Stats.slice(0, 6);
    
    const categoryColor = isWithin5Minutes && displayData.recentSubmission?.category
      ? CATEGORY_COLORS[displayData.recentSubmission.category as keyof typeof CATEGORY_COLORS]
      : null;

    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className={`${titleSize} font-bold text-center`}>
            <i className="fas fa-building text-blue-600 mr-3"></i>
            Data<sup>#</sup>3 by the Numbers
          </CardTitle>
          <p className={`text-center ${subtitleSize}`}>
            {isWithin5Minutes ? (
              <>
                <span 
                  className="font-semibold px-2 py-1 rounded inline-block"
                  style={{ 
                    backgroundColor: categoryColor ? `${categoryColor}20` : 'transparent',
                    color: categoryColor || 'inherit',
                    border: categoryColor ? `2px solid ${categoryColor}` : 'none'
                  }}
                >
                  {CATEGORY_NAMES[displayData.recentSubmission?.category as keyof typeof CATEGORY_NAMES]} Stats
                </span>
                <span className={`text-muted-foreground block mt-2 ${isFullscreen ? 'text-xl' : 'text-base'}`}>
                  Related to the recent submission
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                General Data<sup>#</sup>3 Stats • Scale and expertise across Australia & New Zealand
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relevantStats.map((stat, index) => (
              <div
                key={stat.id}
                className={`text-center ${padding} rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20`}
              >
                <div className={`${statValueSize} font-bold text-primary mb-2`}>
                  {stat.value}
                </div>
                <div className={`${statTitleSize} font-semibold mb-1`}>
                  {stat.title}
                </div>
                <div className={`${statDescSize} text-muted-foreground`}>
                  {stat.description}
                </div>
              </div>
            ))}
          </div>

          {displayData.recentSubmission && (
            <div className={`mt-8 ${isFullscreen ? 'p-6' : 'p-4'} rounded-lg bg-muted/20 border border-muted-foreground/20`}>
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-clock text-primary"></i>
                <span className={`font-semibold ${isFullscreen ? 'text-xl' : ''}`}>Latest Submission</span>
              </div>
              <p className={isFullscreen ? 'text-lg' : 'text-sm'}>
                <strong>{displayData.recentSubmission.name}</strong> {isWithin5Minutes ? 'just ' : ''}submitted a solution for{' '}
                <Badge 
                  className={`mx-1 text-white ${isFullscreen ? 'text-base' : ''} ${CATEGORY_BADGE_CLASSES[displayData.recentSubmission.category as keyof typeof CATEGORY_BADGE_CLASSES] || 'bg-gray-500'}`}
                >
                  {CATEGORY_NAMES[displayData.recentSubmission.category as keyof typeof CATEGORY_NAMES]}
                </Badge>
                scoring <strong>{displayData.recentSubmission.totalScore}/50</strong>
              </p>
              
              {/* Show detailed submission info during 5-minute window */}
              {isWithin5Minutes && displayData.recentSubmission && (
                <>
                  {/* Problem Summary */}
                  {(() => {
                    try {
                      const structuredData = typeof displayData.recentSubmission.structuredJson === 'string' 
                        ? JSON.parse(displayData.recentSubmission.structuredJson)
                        : displayData.recentSubmission.structuredJson;
                      
                      if (structuredData?.problem_summary) {
                        return (
                          <div className={`mt-4 ${isFullscreen ? 'p-4' : 'p-3'} rounded-lg bg-primary/10 border border-primary/20`}>
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-lightbulb text-yellow-500"></i>
                              <span className={`font-semibold ${isFullscreen ? 'text-lg' : 'text-base'}`}>Problem Summary</span>
                            </div>
                            <p className={`${isFullscreen ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'} text-muted-foreground`}>
                              {structuredData.problem_summary}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    } catch (e) {
                      console.error('Error parsing structuredJson:', e);
                      return null;
                    }
                  })()}
                  
                  {/* AI Evaluation Summary */}
                  {displayData.recentSubmission.evaluationNotes && (
                    <div className={`mt-4 ${isFullscreen ? 'p-4' : 'p-3'} rounded-lg bg-cyan-500/10 border border-cyan-500/20`}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-robot text-cyan-500"></i>
                        <span className={`font-semibold ${isFullscreen ? 'text-lg' : 'text-base'}`}>AI Evaluation Summary</span>
                      </div>
                      <p className={`${isFullscreen ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'} text-muted-foreground`}>
                        {displayData.recentSubmission.evaluationNotes}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pt-8 portrait-leaderboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {!isFullscreen && (
            <div className="flex gap-2 mb-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <i className="fas fa-home mr-2"></i>
                  Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleFullscreen}
                data-testid="button-fullscreen"
              >
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} mr-2`}></i>
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testAudio}
                data-testid="button-test-audio"
              >
                <i className="fas fa-volume-up mr-2"></i>
                Test Audio
              </Button>
            </div>
          )}
          <h1 className={`${isFullscreen ? 'text-6xl sm:text-7xl' : 'text-4xl sm:text-5xl'} font-bold mb-2 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
            Data<sup className="text-[#1cc8e4]">#</sup>3 Solution Sprint
          </h1>
          <p className={`${isFullscreen ? 'text-3xl' : 'text-xl'} text-muted-foreground text-center`}>
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
          <p>Visit the Data<sup>#</sup>3 booth to participate • Challenge entries scored in real-time</p>
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