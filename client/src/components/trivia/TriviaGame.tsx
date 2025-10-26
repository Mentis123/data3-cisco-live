import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { TriviaQuestion, TriviaTrackMeta } from "./utils";

type TriviaPhase = "idle" | "ready" | "go" | "playing" | "feedback" | "complete";

interface TriviaGameProps {
  questions: TriviaQuestion[];
  track: TriviaTrackMeta;
  className?: string;
  onComplete?: (score: number) => void;
  completionRender?: (context: { score: number; restart: () => void }) => React.ReactNode;
}

const QUESTION_TIME = 15;

function getTierPoints(timeRemaining: number): number {
  if (timeRemaining > 10) return 6;
  if (timeRemaining > 5) return 4;
  if (timeRemaining > 0) return 2;
  return 0;
}

export function TriviaGame({ questions, track, className, onComplete, completionRender }: TriviaGameProps) {
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

    const timer = setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= questions.length) {
        setPhase("complete");
      } else {
        resetForQuestion(nextIndex);
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [phase, questionIndex, questions.length]);

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
    const tierPoints = getTierPoints(timeLeft);
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

  const tierPoints = getTierPoints(timeLeft);
  const progress = questions.length ? questionIndex + 1 : 0;

  return (
    <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-950", track.accentClass)}>
            {track.name}
          </Badge>
          <div className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300/80">
            Question {progress} / {questions.length}
          </div>
        </div>
        <CardTitle className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">{track.summary}</CardTitle>
        <p className="text-sm text-slate-200/80 sm:text-base">{track.description}</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-6">
        {currentQuestion ? (
          <>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Score</p>
                  <p className="text-2xl font-semibold text-white">{score}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Time left</p>
                  <p className="text-2xl font-semibold text-cyan-300">{Math.ceil(timeLeft)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Points at stake</p>
                  <p className="text-2xl font-semibold text-emerald-300">{tierPoints}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Data#3 Trivia</p>
                <h2 className="text-pretty text-xl font-semibold text-white sm:text-2xl">{currentQuestion.prompt}</h2>
              </div>

              <div className="flex flex-col gap-3">
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
                        "relative w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-left text-base font-medium transition",
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

              {showHint && (
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                  <p className="font-semibold uppercase tracking-[0.2em] text-cyan-200">Hint</p>
                  <p className="mt-2 text-pretty leading-relaxed text-cyan-50/90">{currentQuestion.hint}</p>
                </div>
              )}
            </div>

            {phase === "feedback" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm">
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
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100/85">
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-200/70">Why it works</p>
                    <p className="mt-2 text-pretty leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {phase === "complete" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Warm-up complete</p>
                  <p className="mt-2 text-4xl font-semibold text-white">Final score: {score}</p>
                  <p className="mt-3 text-base text-slate-200/80">Ready to take those stats into the next round.</p>
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-5xl font-bold text-white">
          {phase === "ready" ? "Ready" : "Go!"}
        </div>
      )}
    </Card>
  );
}

