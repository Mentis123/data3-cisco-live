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

  const feedbackContent =
    currentQuestion && (
      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100/90 shadow-[0_30px_80px_-60px_rgba(14,165,233,0.65)] sm:p-5">
        <p
          className={cn(
            "text-base font-semibold",
            earnedPoints > 0 ? "text-emerald-300" : "text-rose-300",
          )}
        >
          {earnedPoints > 0
            ? `Correct! +${earnedPoints} points`
            : `Tough break. The correct answer was ${currentQuestion.choices[currentQuestion.correctIndex]}`}
        </p>
        {currentQuestion.explanation && (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left text-sm text-slate-100/85">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200/70">
              Why it works
            </p>
            <p className="text-pretty leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}
        {mode === "dojo" && continueAvailable && (
          <div className="flex justify-end">
            <Button onClick={handleContinue} variant="secondary" className="px-4">
              {isLastQuestion ? "View results" : "Next question"}
            </Button>
          </div>
        )}
      </div>
    );

  const completionContent = (
    <div className="space-y-5 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center text-slate-50 shadow-[0_40px_120px_-70px_rgba(16,185,129,0.75)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
          Complete!
        </p>
        <p className="mt-2 text-4xl font-semibold text-white">{score} pts</p>
      </div>
      {completionRender?.({ score, restart })}
    </div>
  );

  return (
    <Card
      className={cn(
        "relative flex h-full w-full flex-col border-white/10 bg-slate-900/70 text-white backdrop-blur",
        "landscape:h-[100svh] landscape:max-h-[100svh] landscape:overflow-y-auto landscape:overscroll-contain",
        "supports-[height:100dvh]:landscape:h-[100dvh] supports-[height:100dvh]:landscape:max-h-[100dvh]",
        className,
      )}
    >
      <CardHeader className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
          <Badge
            className={cn(
              "rounded-full px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-slate-950 sm:text-xs",
              track.accentClass,
            )}
          >
            {track.name}
          </Badge>
          <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300/80 sm:text-[0.7rem]">
            {progress} / {questions.length}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-4 py-4 sm:px-8 sm:py-8">
        {currentQuestion ? (
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 sm:gap-8">
            <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_45px_120px_-70px_rgba(56,189,248,0.55)] landscape:gap-2 landscape:p-3 sm:grid-cols-3">
              <div className="space-y-1 text-center landscape:text-left sm:text-left">
                <p className="text-[0.68rem] uppercase tracking-[0.32em] text-slate-300/70 landscape:text-[0.6rem]">Score</p>
                <p className="text-2xl font-semibold text-white landscape:text-xl sm:text-3xl">{score}</p>
              </div>
              <div className="space-y-1 text-center landscape:text-left sm:text-left">
                <p className="text-[0.68rem] uppercase tracking-[0.32em] text-slate-300/70 landscape:text-[0.6rem]">Time left</p>
                <p className="text-2xl font-semibold text-cyan-300 landscape:text-xl sm:text-3xl">{Math.ceil(timeLeft)}</p>
              </div>
              <div className="space-y-1 text-center landscape:text-left sm:text-left">
                <p className="text-[0.68rem] uppercase tracking-[0.32em] text-slate-300/70 landscape:text-[0.6rem]">Points at stake</p>
                <p className="text-2xl font-semibold text-emerald-300 landscape:text-xl sm:text-3xl">{tierPoints}</p>
              </div>
            </div>

            <div
              className={cn(
                "flex flex-1 flex-col gap-5",
                phase === "feedback" &&
                  "lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-10",
              )}
            >
              <div className="flex flex-col gap-5">
                {phase !== "complete" && (
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] landscape:px-4 landscape:py-5 sm:px-8">
                    <h2 className="text-pretty text-xl font-semibold leading-tight text-white landscape:text-lg landscape:leading-snug sm:text-2xl lg:text-3xl">
                      {currentQuestion.prompt}
                    </h2>
                    {showHint && (
                      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-left text-sm text-cyan-50/90 landscape:p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 landscape:text-[0.65rem]">Hint</p>
                        <p className="mt-2 text-pretty leading-relaxed landscape:text-sm landscape:leading-snug">{currentQuestion.hint}</p>
                      </div>
                    )}
                  </div>
                )}

                {phase !== "complete" && (
                  <div className="grid gap-3 landscape:gap-2 sm:grid-cols-2">
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
                            "group relative flex h-full w-full items-stretch overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm font-medium transition",
                            "landscape:p-3 landscape:text-[0.92rem]",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                            isHidden && "pointer-events-none opacity-20",
                            !isHidden && phase === "playing" && "hover:bg-white/10",
                            showState && isCorrect && "border-emerald-300/60 bg-emerald-500/10",
                            showState && isSelected && !isCorrect && "border-rose-400/60 bg-rose-500/10",
                          )}
                        >
                          <span className="flex w-full items-start gap-3">
                            <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold landscape:h-8 landscape:w-8 landscape:text-xs">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-pretty text-base leading-snug text-slate-100 landscape:text-[0.95rem] landscape:leading-snug">
                              {choice}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {phase === "feedback" && <div className="lg:hidden">{feedbackContent}</div>}
                {phase === "complete" && <div className="flex justify-center">{completionContent}</div>}
              </div>

              {phase === "feedback" && feedbackContent && (
                <div className="hidden min-h-full flex-col gap-4 lg:flex">{feedbackContent}</div>
              )}
            </div>
          </div>
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

