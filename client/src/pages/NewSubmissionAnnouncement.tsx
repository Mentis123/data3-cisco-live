import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNameToInitials } from "@/lib/utils";
import { audioManager } from "@/lib/audio";

interface SubmissionData {
  id: string;
  participantName: string;
  firstName: string;
  lastName: string;
  category: string;
  totalScore: number;
  rank: number;
  pitchScore?: number | null;
  triviaScore?: number | null;
  subScores?: {
    clarity: number;
    impact: number;
    kpi_strength: number;
    execution: number;
    confidence: number;
  };
  createdAt: string;
  botBar?: number;
  isEligible?: boolean;
  raffleEntered?: boolean;
  alreadyEntered?: boolean;
}

interface NewSubmissionAnnouncementProps {
  submission: SubmissionData;
  onDismiss?: () => void;
}

const BRAND_PRIMARY = "#00AEFF";

// Consistent color scheme for all categories aligned to Data#3 palette
const CATEGORY_COLORS = {
  SECURE_CONNECTIVITY: BRAND_PRIMARY,
  HYBRID_DC: BRAND_PRIMARY,
  COLLAB_CX: BRAND_PRIMARY,
  OBSERVABILITY: BRAND_PRIMARY,
  EDGE_IOT: BRAND_PRIMARY
};

const CATEGORY_NAMES = {
  SECURE_CONNECTIVITY: "Zero Trust & Secure Connectivity",
  HYBRID_DC: "Data Centre & Hybrid Cloud",
  COLLAB_CX: "Collaboration & Contact Centre",
  OBSERVABILITY: "Observability & Performance",
  EDGE_IOT: "Edge & IoT Solutions"
};

const CATEGORY_ICONS = {
  SECURE_CONNECTIVITY: "fa-shield-alt",
  HYBRID_DC: "fa-cloud",
  COLLAB_CX: "fa-users",
  OBSERVABILITY: "fa-chart-line",
  EDGE_IOT: "fa-microchip"
};

export default function NewSubmissionAnnouncement({ submission, onDismiss }: NewSubmissionAnnouncementProps) {
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'flash' | 'reveal' | 'display'>('flash');

  const categoryColor = CATEGORY_COLORS[submission.category as keyof typeof CATEGORY_COLORS] || BRAND_PRIMARY;
  const categoryName = CATEGORY_NAMES[submission.category as keyof typeof CATEGORY_NAMES] || submission.category;
  const categoryIcon = CATEGORY_ICONS[submission.category as keyof typeof CATEGORY_ICONS] || "fa-star";

  // Animation sequence
  useEffect(() => {
    // Play buzz sound immediately when flash animation starts
    audioManager.playBuzzSound().catch(err => {
      console.log('Buzz sound playback prevented by browser:', err);
    });

    const timer1 = setTimeout(() => {
      setAnimationPhase('reveal');
      setShowContent(true);
    }, 1500); // Flash for 1.5 seconds

    const timer2 = setTimeout(() => {
      setAnimationPhase('display');
    }, 3000); // Start main display after 3 seconds

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Auto-dismiss after showing for a while
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      } else {
        setLocation('/leaderboard');
      }
    }, 15000); // Show for 15 seconds total

    return () => clearTimeout(timer);
  }, [onDismiss, setLocation]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      setLocation('/leaderboard');
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: "fa-crown", text: "1ST PLACE!", class: "text-yellow-400" };
    if (rank === 2) return { icon: "fa-medal", text: "2ND PLACE!", class: "text-gray-300" };
    if (rank === 3) return { icon: "fa-award", text: "3RD PLACE!", class: "text-orange-400" };
    return { icon: "fa-trophy", text: `RANK #${rank}`, class: "text-[#78DCFF]" };
  };

  const rankDisplay = getRankDisplay(submission.rank);

  const triviaScore =
    typeof submission.triviaScore === "number"
      ? submission.triviaScore
      : null;

  const derivedPitchScore =
    typeof submission.pitchScore === "number"
      ? submission.pitchScore
      : submission.subScores
        ? Object.values(submission.subScores).reduce((total, value) =>
            typeof value === "number" ? total + value : total,
          0)
        : null;

  const pitchScore = derivedPitchScore;
  const computedTotal =
    (triviaScore ?? 0) +
    (pitchScore ?? 0);
  const finalScore =
    (triviaScore !== null || pitchScore !== null)
      ? Math.min(FINAL_MAX, Math.round(computedTotal))
      : submission.totalScore;
  const FINAL_MAX = 100;
  const TRIVIA_MAX = 60;
  const PITCH_MAX = 40;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
      {/* Flash overlay during flash phase */}
      {animationPhase === 'flash' && (
        <div className="absolute inset-0 announcement-strobe" 
             style={{ backgroundColor: categoryColor }}>
        </div>
      )}

      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center p-4">
        {showContent && (
          <div className={`w-full max-w-6xl mx-auto text-center space-y-8 ${
            animationPhase === 'reveal' ? 'announcement-reveal' : 
            animationPhase === 'display' ? 'announcement-display' : ''
          }`}>
            
            {/* NEW SUBMISSION Header */}
            <div className="space-y-4">
              <div className="announcement-pulse">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-[#78DCFF] drop-shadow-2xl">
                  NEW
                </h1>
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white drop-shadow-2xl -mt-4">
                  SUBMISSION!
                </h1>
              </div>
              
              <div className="flex justify-center items-center gap-4 text-4xl md:text-6xl text-[#78DCFF]/80">
                <div className="announcement-bounce">🚀</div>
                <div className="announcement-bounce" style={{ animationDelay: '0.2s' }}>⚡</div>
                <div className="announcement-bounce" style={{ animationDelay: '0.4s' }}>🎯</div>
              </div>
            </div>

            {/* Participant Name */}
            <div className="announcement-slide-up" style={{ animationDelay: '0.5s' }}>
              <Card className="glass-panel border-2 border-[#78DCFF]/40 bg-data3-blue-black/40 max-w-4xl mx-auto">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-[#78DCFF]/20 flex items-center justify-center">
                      <i className="fas fa-user text-4xl text-[#78DCFF]"></i>
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-6xl font-bold text-white">
                        {formatNameToInitials(submission.participantName)}
                      </h2>
                      <p className="text-xl md:text-2xl text-[#78DCFF]/80">has joined the leaderboard!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Display */}
            <div className="announcement-slide-up" style={{ animationDelay: '0.8s' }}>
              <Card className="glass-panel border-2 max-w-3xl mx-auto"
                    style={{
                      borderColor: `${categoryColor}50`,
                      backgroundColor: `${categoryColor}08`
                    }}>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div className="announcement-score-pulse">
                        <p className="text-2xl md:text-3xl text-white/80 font-semibold mb-2">FINAL SCORE</p>
                        <p className="text-7xl md:text-9xl font-black text-white drop-shadow-2xl">
                          {finalScore}
                        </p>
                        <p className="text-3xl md:text-4xl text-white/60">/{FINAL_MAX}</p>
                        <p className="text-base md:text-lg text-white/60 mt-2">
                          {TRIVIA_MAX} trivia + {PITCH_MAX} pitch points
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center flex-1">
                      <div className="announcement-rank-glow">
                        <i className={`fas ${rankDisplay.icon} text-5xl md:text-7xl ${rankDisplay.class} mb-4`}></i>
                        <p className={`text-3xl md:text-4xl font-black ${rankDisplay.class} drop-shadow-lg`}>
                          {rankDisplay.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trivia & Pitch Breakdown */}
            <div className="announcement-slide-up" style={{ animationDelay: '1.0s' }}>
              <Card className="glass-panel border-2 max-w-3xl mx-auto border-[#78DCFF]/40 bg-data3-blue-black/40">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <div className="space-y-2">
                      <p className="text-sm md:text-base text-white/70 uppercase tracking-[0.3em]">
                        Trivia Score
                      </p>
                      <p className="text-4xl md:text-5xl font-black text-white">
                        {triviaScore !== null ? triviaScore : "—"}
                        <span className="text-white/60 text-2xl md:text-3xl">/{TRIVIA_MAX}</span>
                      </p>
                      <p className="text-sm text-white/60">Fast-fire quiz performance</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm md:text-base text-white/70 uppercase tracking-[0.3em]">
                        Pitch Score
                      </p>
                      <p className="text-4xl md:text-5xl font-black text-white">
                        {pitchScore !== null ? pitchScore : "—"}
                        <span className="text-white/60 text-2xl md:text-3xl">/{PITCH_MAX}</span>
                      </p>
                      <p className="text-sm text-white/60">5 criteria × 8 points each</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Beat the Bot & Raffle Status */}
            {submission.botBar !== undefined && (
              <div className="announcement-slide-up" style={{ animationDelay: '1.1s' }}>
                <Card className={`glass-panel border-2 max-w-4xl mx-auto ${
                  submission.isEligible ? 'border-green-400/50 bg-green-500/10' : 'border-orange-400/50 bg-orange-500/10'
                }`}>
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      {submission.isEligible ? (
                        <>
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <i className="fas fa-check-circle text-5xl text-green-400"></i>
                            <h3 className="text-4xl md:text-5xl font-black text-green-400">
                              YOU BEAT THE BOT!
                            </h3>
                          </div>
                          <p className="text-xl md:text-2xl text-white/90">
                            Your score of <span className="font-bold text-green-400">{finalScore}</span>/<span className="font-bold text-green-200">{FINAL_MAX}</span> exceeded the bot bar of <span className="font-bold">{submission.botBar}</span>!
                          </p>
                          {submission.raffleEntered && (
                            <div className="mt-6 pt-6 border-t border-green-500/30">
                              <div className="flex items-center justify-center gap-3 mb-2">
                                <i className="fas fa-ticket-alt text-4xl text-yellow-400"></i>
                                <h4 className="text-3xl md:text-4xl font-bold text-yellow-400">
                                  RAFFLE ENTRY CONFIRMED!
                                </h4>
                              </div>
                              <p className="text-lg md:text-xl text-white/80">
                                You've been entered into today's raffle for this category!
                              </p>
                            </div>
                          )}
                          {submission.alreadyEntered && (
                            <div className="mt-6 pt-6 border-t border-green-500/30">
                              <p className="text-lg md:text-xl text-white/70">
                                <i className="fas fa-info-circle mr-2"></i>
                                You were already entered in this category's raffle today
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <i className="fas fa-robot text-5xl text-orange-400"></i>
                            <h3 className="text-4xl md:text-5xl font-black text-orange-400">
                              BOT BAR NOT BEATEN
                            </h3>
                          </div>
                          <p className="text-xl md:text-2xl text-white/90">
                            Your score of <span className="font-bold">{finalScore}</span>/<span className="font-bold text-white/70">{FINAL_MAX}</span> didn't exceed the bot bar of <span className="font-bold text-orange-400">{submission.botBar}</span>
                          </p>
                          <p className="text-lg md:text-xl text-white/70 mt-4">
                            Try again to beat the bot and enter the raffle!
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Category Display */}
            <div className="announcement-slide-up" style={{ animationDelay: '1.4s' }}>
              <Card className="glass-panel border-2 max-w-4xl mx-auto"
                    style={{
                      borderColor: `${categoryColor}AA`,
                      backgroundColor: `${categoryColor}15`
                    }}>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="announcement-category-icon mb-6">
                      <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
                           style={{ backgroundColor: `${categoryColor}30` }}>
                        <i className={`fas ${categoryIcon} text-5xl`}
                           style={{ color: categoryColor }}></i>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className="text-2xl md:text-3xl px-8 py-4 mb-4 text-white font-bold"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {categoryName}
                    </Badge>

                    <p className="text-xl md:text-2xl text-white/80">
                      Solution category automatically assigned based on content analysis
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscore Breakdown */}
            {submission.subScores && (
              <div className="announcement-slide-up" style={{ animationDelay: '1.7s' }}>
                <Card className="glass-panel border border-[#78DCFF]/30 max-w-5xl mx-auto bg-data3-blue-black/40">
                  <CardContent className="p-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
                      <i className="fas fa-chart-bar mr-3 text-[#78DCFF]"></i>
                      Pitch Criteria Breakdown
                    </h3>
                    <p className="text-sm md:text-base text-white/60 text-center mb-6">
                      Each criterion is scored on a 0–8 scale by the judging panel
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(submission.subScores).map(([key, value], index) => {
                        const label = key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (match) => match.toUpperCase());
                        return (
                          <div key={key} className="text-center announcement-subscore-pop"
                               style={{ animationDelay: `${1.9 + index * 0.1}s` }}>
                            <div className="bg-[#78DCFF]/10 rounded-lg p-4 border border-[#78DCFF]/30">
                              <p className="text-sm text-white/80 mb-2">
                                {label}
                              </p>
                              <p className="text-2xl md:text-3xl font-bold text-[#78DCFF]">
                                {value}/8
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="announcement-slide-up" style={{ animationDelay: '2.1s' }}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => setLocation('/leaderboard')}
                  className="text-xl px-8 py-4 bg-[#00AEFF] hover:bg-[#2CC8FF] text-data3-blue-black font-bold"
                  data-testid="button-view-leaderboard"
                >
                  <i className="fas fa-trophy mr-3"></i>
                  View Full Leaderboard
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="text-xl px-8 py-4 border-[#78DCFF]/50 text-[#78DCFF] hover:bg-[#78DCFF]/10"
                  data-testid="button-dismiss-announcement"
                >
                  <i className="fas fa-times mr-3"></i>
                  Dismiss
                </Button>
              </div>
            </div>

            {/* Auto-dismiss countdown */}
            <div className="text-center text-white/60 text-lg">
              <i className="fas fa-clock mr-2"></i>
              Auto-closing in a few seconds...
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

// Component for use in routing (retrieves data from sessionStorage)
export function NewSubmissionAnnouncementPage() {
  const [, setLocation] = useLocation();
  
  // Retrieve submission data from sessionStorage
  const getSubmissionData = (): SubmissionData => {
    try {
      const storedData = sessionStorage.getItem('newSubmissionData');
      if (storedData) {
        const submissionData = JSON.parse(storedData);
        // Clear the data after retrieving it
        sessionStorage.removeItem('newSubmissionData');
        return submissionData;
      }
    } catch (error) {
      console.warn('Failed to retrieve submission data from sessionStorage:', error);
    }
    
    // Fallback to sample data if no stored data available
    return {
      id: "demo",
      participantName: "Demo User",
      firstName: "Demo",
      lastName: "User",
      category: "SECURE_CONNECTIVITY",
      totalScore: 88,
      rank: 3,
      pitchScore: 36,
      triviaScore: 52,
      subScores: {
        clarity: 7,
        impact: 7,
        kpi_strength: 7,
        execution: 7,
        confidence: 8
      },
      botBar: 70,
      isEligible: true,
      createdAt: new Date().toISOString()
    };
  };

  const submissionData = getSubmissionData();

  return (
    <NewSubmissionAnnouncement 
      submission={submissionData} 
      onDismiss={() => setLocation('/leaderboard')} 
    />
  );
}