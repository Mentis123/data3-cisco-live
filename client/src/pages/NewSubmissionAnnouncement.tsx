import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNameToInitials } from "@/lib/utils";
import { audioManager } from "@/lib/audio";
import { RingVideoModal } from "@/components/RingVideoModal";

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
    technology_fit: number;
    feasibility: number;
    business_value: number;
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
  const [showReadyPrompt, setShowReadyPrompt] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [shouldStartAnimation, setShouldStartAnimation] = useState(false);
  const hasTriggeredBroadcastRef = useRef(false);
  const hasAnnouncedRef = useRef(false);

  const categoryColor = CATEGORY_COLORS[submission.category as keyof typeof CATEGORY_COLORS] || BRAND_PRIMARY;
  const categoryName = CATEGORY_NAMES[submission.category as keyof typeof CATEGORY_NAMES] || submission.category;
  const categoryIcon = CATEGORY_ICONS[submission.category as keyof typeof CATEGORY_ICONS] || "fa-star";

  const broadcastLeaderboardAnnouncement = useCallback(() => {
    if (hasTriggeredBroadcastRef.current) {
      return;
    }

    hasTriggeredBroadcastRef.current = true;

    try {
      sessionStorage.setItem('triggerNewChallenger', JSON.stringify({
        submissionId: submission.id,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('[NewSubmissionAnnouncement] Failed to set leaderboard trigger:', error);
    }
  }, [submission.id]);

  const announceSubmission = useCallback(() => {
    if (hasAnnouncedRef.current) {
      return;
    }

    hasAnnouncedRef.current = true;

    fetch(`/api/submission/${submission.id}/announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(error => {
      console.error('[NewSubmissionAnnouncement] Failed to announce submission on leaderboard:', error);
    });
  }, [submission.id]);

  const startAnnouncementSequence = useCallback(() => {
    console.log('[NewSubmissionAnnouncement] Starting announcement sequence');
    setAnimationPhase('flash');
    setShowContent(false);
    setShouldStartAnimation(true);
    console.log('[NewSubmissionAnnouncement] State set - phase: flash, showContent: false, shouldStartAnimation: true');
    broadcastLeaderboardAnnouncement();
    announceSubmission();
  }, [announceSubmission, broadcastLeaderboardAnnouncement]);

  // Handle user clicking to start the animation sequence
  const handleStartAnimation = () => {
    setShowReadyPrompt(false);

    // Check if we should show video modal (Ring mode)
    // ONLY show video if immersive mode is ON
    try {
      const videoDataStr = sessionStorage.getItem('shouldShowVideo');
      if (videoDataStr && audioManager.isImmersiveMode()) {
        const videoData = JSON.parse(videoDataStr);
        setIsWinner(videoData.isWinner);
        setShowVideoModal(true);
        // Clear the video flag
        sessionStorage.removeItem('shouldShowVideo');
        return;
      } else if (videoDataStr) {
        // Video flag exists but immersive mode is OFF - skip video and clear flag
        console.log('[NewSubmissionAnnouncement] Skipping video - immersive mode is OFF');
        sessionStorage.removeItem('shouldShowVideo');
      }
    } catch (error) {
      console.error('Error checking video state:', error);
    }

    // For classic mode (no video), start animation immediately without buzz sound
    // (buzz sound removed per feedback - video takes its place)
    startAnnouncementSequence();
  };

  // Animation sequence - only starts after user interaction
  useEffect(() => {
    if (!shouldStartAnimation) return;

    console.log('[NewSubmissionAnnouncement] Animation effect triggered - setting up timers');

    const timer1 = setTimeout(() => {
      console.log('[NewSubmissionAnnouncement] Timer 1 fired - transitioning to reveal phase');
      setAnimationPhase('reveal');
      setShowContent(true);
    }, 1500); // Flash for 1.5 seconds

    const timer2 = setTimeout(() => {
      console.log('[NewSubmissionAnnouncement] Timer 2 fired - transitioning to display phase');
      setAnimationPhase('display');
    }, 3000); // Start main display after 3 seconds

    return () => {
      console.log('[NewSubmissionAnnouncement] Cleaning up animation timers');
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [shouldStartAnimation]);

  // Safety timeout - force transition out of flash phase if timers fail
  useEffect(() => {
    if (animationPhase === 'flash' && shouldStartAnimation) {
      console.log('[NewSubmissionAnnouncement] Safety timeout armed for flash phase');
      const safetyTimer = setTimeout(() => {
        console.warn('[NewSubmissionAnnouncement] Safety timeout triggered - forcing reveal phase');
        setAnimationPhase('reveal');
        setShowContent(true);
      }, 5000); // If still in flash phase after 5 seconds, force reveal

      return () => clearTimeout(safetyTimer);
    }
  }, [animationPhase, shouldStartAnimation]);

  // No auto-dismiss - user must manually continue

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      audioManager.playClickSound();
      setLocation('/leaderboard');
    }
  };

  const getRankDisplay = (rank: number) => {
    // Ensure rank is a valid number, default to 1 if not
    const validRank = typeof rank === 'number' && rank > 0 ? rank : 1;

    if (validRank === 1) return { icon: "fa-crown", text: "1ST PLACE!", class: "text-yellow-400" };
    if (validRank === 2) return { icon: "fa-medal", text: "2ND PLACE!", class: "text-gray-300" };
    if (validRank === 3) return { icon: "fa-award", text: "3RD PLACE!", class: "text-orange-400" };
    return { icon: "fa-trophy", text: `RANK #${validRank}`, class: "text-[#78DCFF]" };
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
  const FINAL_MAX = 100;
  const TRIVIA_MAX = 60;
  const PITCH_MAX = 40;
  const finalScore =
    (triviaScore !== null || pitchScore !== null)
      ? Math.min(FINAL_MAX, Math.round(computedTotal))
      : (typeof submission.totalScore === "number" ? submission.totalScore : 0);

  console.log('[NewSubmissionAnnouncement] Rendering announcement:', {
    finalScore,
    pitchScore,
    triviaScore,
    rank: submission.rank,
    rankDisplay,
    botBar: submission.botBar,
    isEligible: submission.isEligible,
    subScores: submission.subScores
  });

  return (
    <>
      {/* Ring Video Modal - shown when View Results is clicked in Ring mode */}
      {showVideoModal && (
        <RingVideoModal
          isWinner={isWinner}
          onComplete={() => {
            console.log('[NewSubmissionAnnouncement] Video complete - unmounting modal');
            setShowVideoModal(false);
            // Add a small delay to ensure video modal fully unmounts before starting animation
            // This prevents React from batching the state updates which can cause timing issues
            setTimeout(() => {
              console.log('[NewSubmissionAnnouncement] Starting announcement sequence after video unmount');
              startAnnouncementSequence();
            }, 100);
          }}
        />
      )}

      <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
        {/* Ready prompt - requires user interaction to start animations/audio */}
        {showReadyPrompt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-data3-blue-black/95 backdrop-blur-sm cursor-pointer"
          onClick={handleStartAnimation}
        >
          <div className="text-center space-y-8 animate-fade-in">
            {/* Pulsing icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#00AEFF]/30 blur-3xl animate-pulse"></div>
              <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#00AEFF] to-[#0088CC] flex items-center justify-center animate-pulse">
                <i className="fas fa-trophy text-6xl text-white"></i>
              </div>
            </div>

            {/* Text content */}
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-white">
                Results Ready!
              </h2>
              <p className="text-xl md:text-2xl text-[#78DCFF]">
                Click to see how you performed
              </p>
            </div>

            {/* Click prompt button */}
            <button
              onClick={handleStartAnimation}
              className="group relative px-12 py-6 bg-gradient-to-r from-[#00AEFF] to-[#0088CC] hover:from-[#2CC8FF] hover:to-[#00AEFF] text-white text-2xl font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              <span className="flex items-center gap-3">
                <i className="fas fa-play"></i>
                View Results
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </span>
            </button>

            {/* Hint text */}
            <p className="text-sm text-white/50 animate-pulse">
              <i className="fas fa-hand-pointer mr-2"></i>
              Tap anywhere to continue
            </p>
          </div>
        </div>
      )}

      {/* Flash overlay during flash phase */}
      {animationPhase === 'flash' && !showReadyPrompt && (
        <div
          className="absolute inset-0 announcement-strobe"
          style={{ backgroundColor: categoryColor }}
        />
      )}

      {/* Main content with frame container like dojo */}
      <div className="flex min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 sm:gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">
            {showContent && (
              <div className={`text-center space-y-4 sm:space-y-6 ${
                animationPhase === 'reveal' ? 'announcement-reveal' :
                animationPhase === 'display' ? 'announcement-display' : ''
              }`}>

            {/* Category Display - Moved to Top */}
            <div className="announcement-slide-up" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-panel border-2"
                    style={{
                      borderColor: `${categoryColor}AA`,
                      backgroundColor: `${categoryColor}15`
                    }}>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center">
                    <div className="announcement-category-icon mb-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center"
                           style={{ backgroundColor: `${categoryColor}30` }}>
                        <i className={`fas ${categoryIcon} text-2xl sm:text-3xl`}
                           style={{ color: categoryColor }}></i>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className="text-xs sm:text-sm md:text-base px-3 py-1 sm:px-4 sm:py-2 mb-2 text-white font-bold"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {categoryName}
                    </Badge>

                    <p className="text-xs sm:text-sm md:text-base text-white/80">
                      Solution category
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NEW SUBMISSION Header - Only show if Top 10 AND Beat Bot */}
            {submission.rank <= 10 && submission.isEligible && (
              <div className="space-y-2">
                <div className="announcement-pulse">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#78DCFF] drop-shadow-2xl">
                    NEW
                  </h1>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-2xl -mt-2">
                    CHALLENGER!
                  </h1>
                </div>

                <div className="flex justify-center items-center gap-2 sm:gap-3 text-xl sm:text-2xl md:text-3xl text-[#78DCFF]/80">
                  <div className="announcement-bounce">🏆</div>
                  <div className="announcement-bounce" style={{ animationDelay: '0.2s' }}>⚡</div>
                  <div className="announcement-bounce" style={{ animationDelay: '0.4s' }}>🎯</div>
                </div>
              </div>
            )}

            {/* Participant Name */}
            <div className="announcement-slide-up" style={{ animationDelay: '0.5s' }}>
              <Card className="glass-panel border-2 border-[#78DCFF]/40 bg-data3-blue-black/40">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#78DCFF]/20 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-xl sm:text-2xl text-[#78DCFF]"></i>
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {formatNameToInitials(submission.participantName)}
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg text-[#78DCFF]/80">has joined the leaderboard!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Display */}
            <div className="announcement-slide-up" style={{ animationDelay: '0.8s' }}>
              <Card className="glass-panel border-2"
                    style={{
                      borderColor: `${categoryColor}50`,
                      backgroundColor: `${categoryColor}08`
                    }}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center flex-1">
                      <div className="announcement-score-pulse">
                        <p className="text-sm sm:text-base md:text-lg text-white/80 font-semibold mb-1">FINAL SCORE</p>
                        <p className="text-4xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-2xl">
                          {finalScore}
                        </p>
                        <p className="text-xl sm:text-2xl md:text-3xl text-white/60">/{FINAL_MAX}</p>
                        <p className="text-xs sm:text-sm text-white/60 mt-1">
                          {TRIVIA_MAX} trivia + {PITCH_MAX} pitch points
                        </p>
                      </div>
                    </div>

                    <div className="text-center flex-1">
                      <div className="announcement-rank-glow">
                        <i className={`fas ${rankDisplay.icon} text-3xl sm:text-4xl md:text-5xl ${rankDisplay.class} mb-2`}></i>
                        <p className={`text-xl sm:text-2xl md:text-3xl font-black ${rankDisplay.class} drop-shadow-lg`}>
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
              <Card className="glass-panel border-2 border-[#78DCFF]/40 bg-data3-blue-black/40">
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-white/70 uppercase tracking-[0.2em]">
                        Trivia Score
                      </p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                        {triviaScore !== null ? triviaScore : "—"}
                        <span className="text-white/60 text-lg sm:text-xl md:text-2xl">/{TRIVIA_MAX}</span>
                      </p>
                      <p className="text-xs text-white/60">Fast-fire quiz</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-white/70 uppercase tracking-[0.2em]">
                        Pitch Score
                      </p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                        {pitchScore !== null ? pitchScore : "—"}
                        <span className="text-white/60 text-lg sm:text-xl md:text-2xl">/{PITCH_MAX}</span>
                      </p>
                      <p className="text-xs text-white/60">5 criteria × 8 pts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Beat the Bot & Raffle Status */}
            {submission.botBar !== undefined && (
              <div className="announcement-slide-up" style={{ animationDelay: '1.1s' }}>
                <Card className={`glass-panel border-2 ${
                  submission.isEligible ? 'border-green-400/50 bg-green-500/10' : 'border-orange-400/50 bg-orange-500/10'
                }`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center space-y-2 sm:space-y-3">
                      {submission.isEligible ? (
                        <>
                          <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <i className="fas fa-check-circle text-2xl sm:text-3xl md:text-4xl text-green-400"></i>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-green-400">
                              YOU BEAT THE BOT!
                            </h3>
                          </div>
                          <p className="text-sm sm:text-base md:text-lg text-white/90">
                            Your score of <span className="font-bold text-green-400">{finalScore}</span>/<span className="font-bold text-green-200">{FINAL_MAX}</span> exceeded the bot bar of <span className="font-bold">{submission.botBar}</span>!
                          </p>
                          {submission.raffleEntered && (
                            <div className="mt-3 pt-3 border-t border-green-500/30">
                              <div className="flex items-center justify-center gap-2">
                                <i className="fas fa-ticket-alt text-xl sm:text-2xl text-yellow-400"></i>
                                <h4 className="text-base sm:text-lg md:text-xl font-bold text-yellow-400">
                                  RAFFLE ENTRY CONFIRMED!
                                </h4>
                              </div>
                              <p className="text-xs sm:text-sm md:text-base text-white/80 mt-1">
                                You've been entered into today's raffle for this category!
                              </p>
                            </div>
                          )}
                          {submission.alreadyEntered && (
                            <div className="mt-3 pt-3 border-t border-green-500/30">
                              <p className="text-xs sm:text-sm md:text-base text-white/70">
                                <i className="fas fa-info-circle mr-2"></i>
                                You were already entered in this category's raffle today
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <i className="fas fa-robot text-2xl sm:text-3xl md:text-4xl text-orange-400"></i>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-orange-400">
                              BOT BAR NOT BEATEN
                            </h3>
                          </div>
                          <p className="text-sm sm:text-base md:text-lg text-white/90">
                            Your score of <span className="font-bold">{finalScore}</span>/<span className="font-bold text-white/70">{FINAL_MAX}</span> didn't exceed the bot bar of <span className="font-bold text-orange-400">{submission.botBar}</span>
                          </p>
                          <p className="text-xs sm:text-sm md:text-base text-white/70 mt-2">
                            Try again to beat the bot and enter the raffle!
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Subscore Breakdown */}
            {submission.subScores && (
              <div className="announcement-slide-up" style={{ animationDelay: '1.7s' }}>
                <Card className="glass-panel border border-[#78DCFF]/30 bg-data3-blue-black/40">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 text-center">
                      <i className="fas fa-chart-bar mr-2 text-[#78DCFF]"></i>
                      Pitch Criteria Breakdown
                    </h3>
                    <p className="text-xs text-white/60 text-center mb-3">
                      Each criterion scored 0–8
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                      {Object.entries(submission.subScores).map(([key, value], index) => {
                        const label = key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (match) => match.toUpperCase());
                        return (
                          <div key={key} className="text-center announcement-subscore-pop"
                               style={{ animationDelay: `${1.9 + index * 0.1}s` }}>
                            <div className="bg-[#78DCFF]/10 rounded-lg p-2 sm:p-3 border border-[#78DCFF]/30">
                              <p className="text-xs text-white/80 mb-1">
                                {label}
                              </p>
                              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#78DCFF]">
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

            {/* Action Button */}
            <div className="announcement-slide-up" style={{ animationDelay: '2.1s' }}>
              <div className="flex justify-center items-center">
                <Button
                  onClick={handleDismiss}
                  className="text-sm sm:text-base md:text-lg px-4 py-2 sm:px-6 sm:py-3 bg-[#00AEFF] hover:bg-[#2CC8FF] text-data3-blue-black font-bold"
                  data-testid="button-dismiss-announcement"
                >
                  <i className="fas fa-times mr-2"></i>
                  Dismiss
                </Button>
              </div>
            </div>

              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

// Component for use in routing (retrieves data from sessionStorage)
export function NewSubmissionAnnouncementPage() {
  const [, setLocation] = useLocation();

  // Retrieve submission data from sessionStorage
  const getSubmissionData = (): SubmissionData => {
    try {
      const storedData = sessionStorage.getItem('newSubmissionData');
      console.log('[NewSubmissionAnnouncement] Raw sessionStorage data:', storedData);

      if (storedData) {
        const submissionData = JSON.parse(storedData);
        console.log('[NewSubmissionAnnouncement] Parsed submission data:', submissionData);

        // Validate and provide defaults for critical fields
        const validatedData: SubmissionData = {
          ...submissionData,
          rank: typeof submissionData.rank === 'number' ? submissionData.rank : 1,
          totalScore: typeof submissionData.totalScore === 'number' ? submissionData.totalScore : 0,
          pitchScore: typeof submissionData.pitchScore === 'number' ? submissionData.pitchScore : null,
          triviaScore: typeof submissionData.triviaScore === 'number' ? submissionData.triviaScore : null,
          botBar: typeof submissionData.botBar === 'number' ? submissionData.botBar : undefined,
          isEligible: typeof submissionData.isEligible === 'boolean' ? submissionData.isEligible : false,
        };

        console.log('[NewSubmissionAnnouncement] Validated submission data:', validatedData);

        // Clear the data after retrieving it
        sessionStorage.removeItem('newSubmissionData');
        return validatedData;
      }
    } catch (error) {
      console.error('[NewSubmissionAnnouncement] Failed to retrieve submission data from sessionStorage:', error);
    }

    console.warn('[NewSubmissionAnnouncement] No stored data found, using fallback demo data');

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
        technology_fit: 7,
        feasibility: 7,
        business_value: 8
      },
      botBar: 70,
      isEligible: true,
      createdAt: new Date().toISOString()
    };
  };

  const submissionData = getSubmissionData();

  console.log('[NewSubmissionAnnouncement] Rendering with submission data:', submissionData);

  return (
    <NewSubmissionAnnouncement
      submission={submissionData}
      onDismiss={() => {
        audioManager.playClickSound();

        // Trigger WELCOME NEW CHALLENGER animation on leaderboard
        sessionStorage.setItem('triggerNewChallenger', JSON.stringify({
          submissionId: submissionData.id,
          timestamp: Date.now()
        }));

        setLocation('/leaderboard');
      }}
    />
  );
}