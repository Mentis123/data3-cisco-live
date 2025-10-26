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
      const requiresDelay = hasExplanation && earnedPoints < 6;

      if (requiresDelay) {
        setContinueAvailable(false);
        const timer = setTimeout(() => setContinueAvailable(true), 2000);
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
  }, [mode, phase, questionIndex, questions.length, currentQuestion, earnedPoints]);

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

  return (
    <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur landscape:h-screen landscape:max-h-screen landscape:overflow-hidden", className)}>
      {/* Minimal header */}
      <CardHeader className="space-y-2 landscape:space-y-0 landscape:py-2">
        <div className="flex flex-wrap items-center justify-between gap-3 landscape:gap-2">
          <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-950 landscape:px-2 landscape:py-0.5 landscape:text-[0.5rem]", track.accentClass)}>
            {track.name}
          </Badge>
          <div className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300/80 landscape:text-[0.5rem]">
            {progress} / {questions.length}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-5 landscape:gap-2 landscape:overflow-hidden landscape:pb-3">
        {currentQuestion ? (
          <>
            {/* Portrait layout - original vertical stacking */}
            <div className="portrait:space-y-5 portrait:flex portrait:flex-col portrait:flex-1 portrait:justify-between sm:portrait:space-y-6">
              {/* Stats bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 portrait:rounded-2xl landscape:rounded-lg landscape:gap-2 landscape:p-2 sm:p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70 landscape:text-[0.5rem]">Score</p>
                  <p className="text-xl font-semibold text-white landscape:text-base sm:text-2xl">{score}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70 landscape:text-[0.5rem]">Time left</p>
                  <p className="text-xl font-semibold text-cyan-300 landscape:text-base sm:text-2xl">{Math.ceil(timeLeft)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70 landscape:text-[0.5rem]">Points at stake</p>
                  <p className="text-xl font-semibold text-emerald-300 landscape:text-base sm:text-2xl">{tierPoints}</p>
                </div>
              </div>

              {/* Question */}
              <div className="space-y-2 landscape:space-y-1 landscape:mt-2">
                <h2 className="text-pretty text-lg font-semibold text-white sm:text-2xl landscape:text-base landscape:leading-snug">{currentQuestion.prompt}</h2>
              </div>

              {/* Hint - shown inline in landscape for compact viewing */}
              {showHint && (
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100 landscape:rounded-lg landscape:p-2 landscape:text-[0.65rem] sm:p-4">
                  <p className="font-semibold uppercase tracking-[0.2em] text-cyan-200 landscape:text-[0.55rem]">Hint</p>
                  <p className="mt-2 text-pretty leading-relaxed text-cyan-50/90 landscape:mt-1 landscape:leading-tight">{currentQuestion.hint}</p>
                </div>
              )}

              {/* Answer buttons - stack vertically in portrait */}
              <div className="portrait:flex portrait:flex-col portrait:gap-2 sm:portrait:gap-3">
                <div className="hidden landscape:grid landscape:grid-cols-3 landscape:gap-2">
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
                          "relative rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-medium transition",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                          isHidden && "pointer-events-none opacity-25",
                          !isHidden && phase === "playing" && "hover:bg-white/10",
                          showState && isCorrect && "border-emerald-300/50 bg-emerald-400/10",
                          showState && isSelected && !isCorrect && "border-rose-400/50 bg-rose-500/10",
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[0.6rem] font-semibold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-[0.7rem] leading-tight text-slate-100">{choice}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="portrait:flex portrait:flex-col portrait:gap-3 landscape:hidden">
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
                          "relative w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-base font-medium transition sm:py-4",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                          isHidden && "pointer-events-none opacity-25",
                          !isHidden && phase === "playing" && "hover:bg-white/10",
                          showState && isCorrect && "border-emerald-300/50 bg-emerald-400/10",
                          showState && isSelected && !isCorrect && "border-rose-400/50 bg-rose-500/10",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-pretty text-sm text-slate-100 sm:text-base">{choice}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {phase === "feedback" && (
              <div className="space-y-3 landscape:space-y-2 landscape:mt-2">
                <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm landscape:rounded-lg landscape:p-2 landscape:text-[0.7rem] sm:p-4">
                  <p
                    className={cn(
                      "font-semibold",
                      earnedPoints > 0 ? "text-emerald-300" : "text-rose-300",
                    )}
                  >
                    {earnedPoints > 0
                      ? `Correct! +${earnedPoints} points`
                      : `Tough break. The correct answer was ${currentQuestion.choices[currentQuestion.correctIndex]}`}
                  </p>
                </div>
                {currentQuestion.explanation && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100/85 landscape:rounded-lg landscape:p-2 landscape:text-[0.65rem] sm:p-4">
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-200/70 landscape:text-[0.55rem]">Why it works</p>
                    <p className="mt-2 text-pretty leading-relaxed landscape:mt-1 landscape:leading-tight">{currentQuestion.explanation}</p>
                  </div>
                )}
                {mode === "dojo" && continueAvailable && (
                  <div className="flex justify-end">
                    <Button onClick={handleContinue} variant="secondary" className="landscape:py-1 landscape:px-3 landscape:text-xs landscape:h-auto">
                      {isLastQuestion ? "View results" : "Next question"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {phase === "complete" && (
              <div className="space-y-4 landscape:space-y-2 landscape:py-4">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center landscape:rounded-lg landscape:p-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200 landscape:text-[0.6rem]">Complete!</p>
                  <p className="mt-2 text-4xl font-semibold text-white landscape:mt-1 landscape:text-2xl">{score} pts</p>
                </div>
                {completionRender?.({ score, restart })}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-200/70">
            No trivia cards available yet. Check back soon.
          </div>
        )}
      </CardContent>

      {(phase === "ready" || phase === "go") && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-5xl font-bold text-white landscape:text-3xl">
          {phase === "ready" ? "Ready" : "Go!"}
        </div>
      )}
    </Card>
  );
}

