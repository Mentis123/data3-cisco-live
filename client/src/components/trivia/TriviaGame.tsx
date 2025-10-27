import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { TriviaQuestion, TriviaTrackMeta } from "./utils";

/**
 * TriviaGame phases flow through a state machine:
 * idle → ready (1s) → go (1s) → playing (15s timer) → feedback → complete
 */
type TriviaPhase = "idle" | "ready" | "go" | "playing" | "feedback" | "complete";

/**
 * TriviaMode determines UI behavior:
 * - "dojo": Practice mode with manual "Continue" button between questions
 * - "ring": Official mode with auto-advance (1.4s delay)
 */
type TriviaMode = "dojo" | "ring";

/**
 * Props for the TriviaGame component
 * @param questions - Array of trivia questions to display (typically 5)
 * @param track - Category metadata (name, colors, descriptions)
 * @param className - Optional CSS classes for styling
 * @param onComplete - Callback fired when all questions are answered, receives final score
 * @param completionRender - Custom render function for completion screen
 * @param mode - "dojo" (practice) or "ring" (official) mode
 */
interface TriviaGameProps {
  questions: TriviaQuestion[];
  track: TriviaTrackMeta;
  className?: string;
  onComplete?: (score: number) => void;
  completionRender?: (context: { score: number; restart: () => void }) => React.ReactNode;
  mode?: TriviaMode;
}

const QUESTION_TIME = 15;

/**
 * Calculate points based on time elapsed (not remaining)
 * Scoring tiers:
 * - 0-5s elapsed: 6 points (answered within first 5 seconds)
 * - 5-10s elapsed: 4 points (answered between 5 and 10 seconds)
 * - 10-15s elapsed: 2 points (answered in final 5 seconds)
 * - Timeout/wrong: 0 points
 */
function getTierPoints(timeElapsed: number): number {
  if (timeElapsed <= 5) return 6;
  if (timeElapsed <= 10) return 4;
  if (timeElapsed <= 15) return 2;
  return 0;
}

/**
 * TriviaGame - Core trivia gameplay component with countdown timer and scoring
 *
 * Features:
 * - 15-second countdown per question using requestAnimationFrame for smooth updates
 * - Tiered scoring: 6pts (0-5s), 4pts (5-10s), 2pts (10-15s)
 * - At 10s remaining: one wrong answer is hidden
 * - At 5s remaining: hint appears
 * - Supports both Dojo (practice) and Ring (official) modes
 *
 * Game Flow:
 * 1. Ready countdown (1s)
 * 2. Go countdown (1s)
 * 3. Playing phase (15s per question)
 * 4. Feedback phase (shows correct/incorrect)
 * 5. Complete phase (shows final score)
 */
export function TriviaGame({
  questions,
  track,
  className,
  onComplete,
  completionRender,
  mode = "ring",
}: TriviaGameProps) {
  const [phase, setPhase] = useState<TriviaPhase>("idle");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [hiddenChoiceIndex, setHiddenChoiceIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [completionAnnounced, setCompletionAnnounced] = useState(false);
  const [continueAvailable, setContinueAvailable] = useState(false);

  const frameRef = useRef<number | null>(null);

  const currentQuestion = useMemo(() => questions[questionIndex], [questions, questionIndex]);

  const resetForQuestion = (index: number) => {
    setQuestionIndex(index);
    setTimeLeft(QUESTION_TIME);
    setHiddenChoiceIndex(null);
    setShowHint(false);
    setAnswered(false);
    setEarnedPoints(0);
    setSelectedIndex(null);
    setPhase("ready");
    setContinueAvailable(false);
  };

  const resetGame = () => {
    setScore(0);
    setCompletionAnnounced(false);
    resetForQuestion(0);
  };

  useEffect(() => {
    if (questions.length) {
      resetGame();
    } else {
      setPhase("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  useEffect(() => {
    if (phase === "ready") {
      const timer = setTimeout(() => setPhase("go"), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === "go") {
      const timer = setTimeout(() => setPhase("playing"), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  // Clear any lingering browser focus/active states when entering playing phase
  // This prevents highlights from persisting in landscape mode after "ready go" disappears
  useEffect(() => {
    if (phase === "playing") {
      // Blur any focused element to clear browser focus states
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const delta = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      setTimeLeft((prev) => {
        const next = Math.max(0, prev - delta);
        return next;
      });

      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") {
      return;
    }

    if (timeLeft <= 10 && hiddenChoiceIndex === null && currentQuestion) {
      const configuredDrop =
        typeof currentQuestion.dropIndex === "number" ? currentQuestion.dropIndex : null;

      if (
        configuredDrop !== null &&
        configuredDrop >= 0 &&
        configuredDrop < currentQuestion.choices.length &&
        configuredDrop !== currentQuestion.correctIndex
      ) {
        setHiddenChoiceIndex(configuredDrop);
      } else {
        const wrongIndices = currentQuestion.choices
          .map((_, index) => index)
          .filter((index) => index !== currentQuestion.correctIndex);
        if (wrongIndices.length) {
          const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
          setHiddenChoiceIndex(pick);
        }
      }
    }

    if (timeLeft <= 5 && !showHint) {
      setShowHint(true);
    }

    if (timeLeft <= 0 && !answered) {
      setAnswered(true);
      setEarnedPoints(0);
      setPhase("feedback");
    }
  }, [phase, timeLeft, hiddenChoiceIndex, currentQuestion, showHint, answered]);

  useEffect(() => {
    if (phase !== "feedback") {
      return;
    }

    if (mode === "dojo") {
      const hasExplanation = Boolean(currentQuestion?.explanation);

      // Calculate delay based on performance:
      // - 6 points (full score): 0s delay
      // - 4 points: 1s delay
      // - 2 points: 2s delay
      // - Timeout (no answer): 3s delay
      // - Wrong answer: 4s delay
      let delayMs = 0;

      if (earnedPoints === 6) {
        delayMs = 0; // Full score - show immediately
      } else if (earnedPoints === 4) {
        delayMs = 1000; // 1 second delay
      } else if (earnedPoints === 2) {
        delayMs = 2000; // 2 second delay
      } else if (earnedPoints === 0) {
        // Distinguish between timeout and wrong answer
        const isWrongAnswer = selectedIndex !== null && selectedIndex !== currentQuestion?.correctIndex;
        delayMs = isWrongAnswer ? 4000 : 3000; // 4s for wrong, 3s for timeout
      }

      const requiresDelay = hasExplanation && delayMs > 0;

      if (requiresDelay) {
        setContinueAvailable(false);
        const timer = setTimeout(() => setContinueAvailable(true), delayMs);
        return () => clearTimeout(timer);
      }

      setContinueAvailable(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= questions.length) {
        setPhase("complete");
      } else {
        resetForQuestion(nextIndex);
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [mode, phase, questionIndex, questions.length, currentQuestion, earnedPoints, selectedIndex]);

  useEffect(() => {
    if (phase === "complete" && !completionAnnounced) {
      setCompletionAnnounced(true);
      onComplete?.(score);
    }
  }, [phase, completionAnnounced, onComplete, score]);

  const handleChoice = (index: number) => {
    if (phase !== "playing" || answered || !currentQuestion) {
      return;
    }

    const correct = index === currentQuestion.correctIndex;
    const timeElapsed = QUESTION_TIME - timeLeft;
    const tierPoints = getTierPoints(timeElapsed);
    const earned = correct ? tierPoints : 0;

    setScore((prev) => prev + earned);
    setEarnedPoints(earned);
    setSelectedIndex(index);
    setAnswered(true);
    setPhase("feedback");
  };

  const restart = () => {
    resetGame();
  };

  const handleContinue = () => {
    if (mode !== "dojo" || phase !== "feedback" || !continueAvailable) {
      return;
    }

    const nextIndex = questionIndex + 1;
    if (nextIndex >= questions.length) {
      setPhase("complete");
    } else {
      resetForQuestion(nextIndex);
    }
  };

  const timeElapsed = QUESTION_TIME - timeLeft;
  const tierPoints = getTierPoints(timeElapsed);
  const progress = questions.length ? questionIndex + 1 : 0;
  const isLastQuestion = progress >= questions.length;

  const feedbackContent =
    currentQuestion && (
      <div className={cn(
        "mt-3 flex-shrink-0 rounded-xl p-4 shadow-lg transition-all duration-300",
        "max-[480px]:mt-2.5 max-[480px]:p-3",
        earnedPoints > 0
          ? "border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10"
          : "border-2 border-rose-400/40 bg-gradient-to-br from-rose-500/20 to-rose-600/10"
      )}>
        <div className="flex items-start gap-3 max-[480px]:gap-2.5">
          <div className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xl",
            "max-[480px]:h-8 max-[480px]:w-8 max-[480px]:text-lg",
            earnedPoints > 0 ? "bg-emerald-500/30 text-emerald-300" : "bg-rose-500/30 text-rose-300"
          )}>
            {earnedPoints > 0 ? "✓" : "✗"}
          </div>
          <div className="flex-1">
            <p className={cn(
              "text-lg font-bold leading-tight",
              "max-[480px]:text-base",
              earnedPoints > 0 ? "text-emerald-200" : "text-rose-200"
            )}>
              {earnedPoints > 0
                ? `Correct! +${earnedPoints} points`
                : "Incorrect"}
            </p>
            {earnedPoints === 0 && (
              <p className="mt-1.5 text-sm text-rose-100/80 max-[480px]:text-xs">
                The correct answer was <span className="font-semibold">{currentQuestion.choices[currentQuestion.correctIndex]}</span>
              </p>
            )}
          </div>
        </div>
        {currentQuestion.explanation && (
          <div className="mt-3 space-y-1.5 max-[480px]:mt-2.5">
            <p className="text-sm font-semibold text-slate-100 max-[480px]:text-xs">
              Why it works:
            </p>
            <p className="text-sm leading-snug text-slate-100/85 max-[480px]:text-xs">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
        {mode === "dojo" && continueAvailable && (
          <div className="mt-4 flex justify-center max-[480px]:mt-3">
            <Button
              onClick={handleContinue}
              className={cn(
                "h-11 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 px-8 text-base font-semibold text-white shadow-lg transition-all duration-200",
                "hover:scale-105 hover:shadow-xl active:scale-95",
                "max-[480px]:h-10 max-[480px]:px-6 max-[480px]:text-sm"
              )}
            >
              {isLastQuestion ? "View Results" : "Next Question"}
            </Button>
          </div>
        )}
      </div>
    );

  const completionContent = (
    <div className="w-full max-w-sm space-y-3.5 rounded-xl border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-5 text-center shadow-lg shadow-emerald-500/30 max-[480px]:space-y-3 max-[480px]:p-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/30 text-2xl text-emerald-300 max-[480px]:h-12 max-[480px]:w-12 max-[480px]:text-xl">
        🎉
      </div>
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-emerald-200 max-[480px]:text-[0.6rem]">
          Quiz Complete!
        </p>
        <p className="mt-1.5 text-[clamp(2.25rem,6vh,2.75rem)] font-bold leading-tight text-white max-[480px]:text-[clamp(2rem,6vh,2.25rem)]">
          {score}
        </p>
        <p className="mt-1 text-sm text-emerald-100 max-[480px]:text-xs">points earned</p>
      </div>
      {completionRender?.({ score, restart })}
    </div>
  );

  return (
    <Card
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden border-white/10 bg-slate-900/70 text-white backdrop-blur",
        "max-[520px]:rounded-2xl",
        className,
      )}
    >
      <CardHeader className="flex-shrink-0 border-b border-white/10 px-4 py-2 max-[480px]:px-3 max-[480px]:py-1.5">
        <div className="mx-auto w-full max-w-[800px]">
          <div className="flex flex-wrap items-center gap-2 max-[600px]:gap-1.5">
            <div className="flex items-center gap-2 max-[600px]:w-full max-[600px]:justify-between">
              <Badge
                className={cn(
                  "rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-950",
                  "max-[480px]:px-2.5 max-[480px]:py-0.5 max-[480px]:text-[0.6rem]",
                  track.accentClass,
                )}
              >
                {track.name}
              </Badge>
              <div className="text-xs font-medium text-slate-300/90 max-[480px]:text-[0.65rem]">
                <span className="font-bold">{progress}</span> / {questions.length}
              </div>
            </div>
            <div className="flex flex-1 justify-end gap-2 max-[600px]:w-full max-[600px]:justify-between max-[480px]:gap-1.5">
              <div className="flex min-w-[96px] flex-1 flex-col items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center backdrop-blur-sm max-[600px]:flex-none max-[600px]:basis-1/3 max-[480px]:px-2 max-[480px]:py-1">
                <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-300/70 max-[480px]:text-[0.6rem]">Score</p>
                <p className="mt-0.5 text-[clamp(1.15rem,2.8vh,1.4rem)] font-bold leading-none text-white">{score}</p>
              </div>
              <div className="flex min-w-[96px] flex-1 flex-col items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center backdrop-blur-sm max-[600px]:flex-none max-[600px]:basis-1/3 max-[480px]:px-2 max-[480px]:py-1">
                <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-300/70 max-[480px]:text-[0.6rem]">Time</p>
                <p
                  className={cn(
                    "mt-0.5 text-[clamp(1.15rem,2.8vh,1.4rem)] font-bold leading-none",
                    timeLeft <= 5 ? "animate-pulse text-orange-400" : timeLeft <= 10 ? "text-yellow-400" : "text-cyan-300",
                  )}
                >
                  {Math.ceil(timeLeft)}s
                </p>
              </div>
              <div className="flex min-w-[96px] flex-1 flex-col items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-center backdrop-blur-sm max-[600px]:flex-none max-[600px]:basis-1/3 max-[480px]:px-2 max-[480px]:py-1">
                <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-300/70 max-[480px]:text-[0.6rem]">Points</p>
                <p className="mt-0.5 text-[clamp(1.15rem,2.8vh,1.4rem)] font-bold leading-none text-emerald-300">{tierPoints}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 min-h-0 flex-col overflow-y-auto px-4 py-3 max-[480px]:px-3 max-[480px]:py-2.5">
        {currentQuestion ? (
          <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col">
            {phase !== "complete" && (
              <div className="mb-4 max-[480px]:mb-3">
                <h2 className="text-pretty text-left text-[clamp(1.125rem,3.5vh,1.5rem)] font-bold leading-[1.3] text-white">
                  {currentQuestion.prompt}
                </h2>
                {showHint && (
                  <div className="mt-3 rounded-lg border-2 border-cyan-400/30 bg-cyan-500/10 p-3 text-left max-[480px]:mt-2 max-[480px]:p-2.5">
                    <p className="text-xs font-semibold text-cyan-200 max-[480px]:text-[0.65rem]">
                      💡 Hint
                    </p>
                    <p className="mt-1.5 text-sm leading-snug text-cyan-50/90 max-[480px]:text-xs">
                      {currentQuestion.hint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {phase !== "complete" && (
              <div className="space-y-2.5 max-[480px]:space-y-2">
                {currentQuestion.choices.map((choice, index) => {
                  const isHidden = hiddenChoiceIndex === index && !answered;
                  const isCorrect = index === currentQuestion.correctIndex;
                  const isSelected = selectedIndex === index;
                  const showState = phase === "feedback";

                  return (
                    <button
                      key={choice + index}
                      type="button"
                      onClick={() => handleChoice(index)}
                      disabled={phase !== "playing" || answered || isHidden}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all duration-200",
                        "min-h-[56px] max-[480px]:min-h-[52px] max-[480px]:gap-2.5 max-[480px]:px-3 max-[480px]:py-2.5",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                        isHidden && "pointer-events-none opacity-20",
                        !isHidden && !showState && "border-white/10 bg-slate-800/40 hover:scale-[1.01] hover:border-cyan-400/50 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.99]",
                        showState && isCorrect && "scale-[1.01] border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-lg shadow-emerald-500/30",
                        showState && isSelected && !isCorrect && "border-rose-400/60 bg-gradient-to-br from-rose-500/20 to-rose-600/10",
                        !showState && isSelected && "border-cyan-400/60 bg-slate-800/60 shadow-lg shadow-cyan-500/20",
                      )}
                    >
                      <span className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 text-base font-bold transition-all",
                        "max-[480px]:h-8 max-[480px]:w-8 max-[480px]:text-sm",
                        !showState && "border-white/20 bg-white/10 text-white group-hover:border-cyan-400/50 group-hover:bg-cyan-400/20 group-hover:text-cyan-300",
                        showState && isCorrect && "border-emerald-400/60 bg-emerald-500/30 text-emerald-300",
                        showState && isSelected && !isCorrect && "border-rose-400/60 bg-rose-500/30 text-rose-300",
                      )}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 text-pretty text-[clamp(0.875rem,2.2vh,1rem)] leading-[1.4] text-slate-100">
                        {choice}
                      </span>
                      {showState && isCorrect && (
                        <span className="flex-shrink-0 text-xl text-emerald-400 max-[480px]:text-lg">✓</span>
                      )}
                      {showState && isSelected && !isCorrect && (
                        <span className="flex-shrink-0 text-xl text-rose-400 max-[480px]:text-lg">✗</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {phase === "feedback" && feedbackContent}

            {phase === "complete" && (
              <div className="flex justify-center">{completionContent}</div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-200/70">
            No trivia cards available yet. Check back soon.
          </div>
        )}
      </CardContent>

      {(phase === "ready" || phase === "go") && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="animate-pulse text-5xl font-bold text-white max-[480px]:text-4xl">
            {phase === "ready" ? "Ready" : "Go!"}
          </div>
        </div>
      )}
    </Card>
  );
}

