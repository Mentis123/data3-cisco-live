import { useEffect, useRef, useState, type CSSProperties } from "react";
import { X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { TriviaGame, type TriviaAnswer } from "./TriviaGame";
import type { TriviaQuestion, TriviaTrackMeta } from "./utils";

interface TriviaOverlayProps {
  questions: TriviaQuestion[];
  track: TriviaTrackMeta;
  mode: "dojo" | "ring";
  onExit: () => void;
  onComplete?: (score: number, answers: TriviaAnswer[]) => void;
  continueLabel?: string;
  onContinue?: (score?: number) => void;
  onShuffle?: () => Promise<void> | void;
  isShuffling?: boolean;
}

export function TriviaOverlay({
  questions,
  track,
  mode,
  onExit,
  onComplete,
  continueLabel,
  onContinue,
  onShuffle,
  isShuffling,
}: TriviaOverlayProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scaleState, setScaleState] = useState<{ scale: number; height: number }>({
    scale: 1,
    height: 0,
  });

  useEffect(() => {
    let frame: number | null = null;

    const updateScale = () => {
      const containerEl = containerRef.current;
      const contentEl = contentRef.current;

      if (!containerEl || !contentEl) {
        setScaleState((prev) => (prev.scale === 1 ? prev : { scale: 1, height: 0 }));
        return;
      }

      const availableHeight = containerEl.clientHeight;
      const naturalHeight = contentEl.scrollHeight;

      if (availableHeight <= 0 || naturalHeight <= 0) {
        setScaleState((prev) => (prev.scale === 1 ? prev : { scale: 1, height: 0 }));
        return;
      }

      // Minimal padding - just enough for safe areas
      const verticalPadding = 8;
      const usableHeight = availableHeight - verticalPadding;
      const heightScale = usableHeight > 0 ? usableHeight / naturalHeight : availableHeight / naturalHeight;
      const rawScale = Math.min(1, heightScale);
      const nextScale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1;
      const scaledHeight = naturalHeight * nextScale;

      setScaleState((prev) => {
        if (
          Math.abs(prev.scale - nextScale) < 0.01 &&
          Math.abs(prev.height - scaledHeight) < 1
        ) {
          return prev;
        }
        return { scale: nextScale, height: scaledHeight };
      });
    };

    const queueUpdate = () => {
      if (frame !== null) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = null;
        updateScale();
      });
    };

    queueUpdate();

    const handleResize: ResizeObserverCallback = () => {
      queueUpdate();
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleResize) : null;

    if (resizeObserver) {
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }
    }

    window.addEventListener("resize", queueUpdate);
    window.addEventListener("orientationchange", queueUpdate);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("resize", queueUpdate);
      window.removeEventListener("orientationchange", queueUpdate);
      resizeObserver?.disconnect();
    };
  }, [mode, questions.length]);

  const scaledWrapperStyle: CSSProperties | undefined =
    scaleState.scale < 1
      ? {
          transform: `scale(${scaleState.scale})`,
          transformOrigin: "top center",
        }
      : undefined;

  const reservedStyle: CSSProperties | undefined =
    scaleState.scale < 1 && scaleState.height > 0
      ? { height: `${scaleState.height}px` }
      : undefined;

  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onExit();
  };

  return (
    <>
      {/* Full screen overlay backdrop */}
      <div
        className="fixed inset-0 z-50 flex min-h-[100svh] items-start justify-center bg-slate-950/95 px-3 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-md sm:items-center sm:px-6"
      >
        {/* Trivia game container */}
        <div
          ref={containerRef}
          className="relative flex h-full w-full max-w-5xl items-start justify-center sm:items-center"
        >
          <div className="w-full max-w-[720px]" style={reservedStyle}>
            <div style={scaledWrapperStyle} className="relative">
              <button
                onClick={handleExitClick}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-white/40 hover:bg-white/20 sm:right-5 sm:top-5"
                aria-label="Exit trivia"
              >
                <X className="h-5 w-5" />
              </button>
              <div ref={contentRef} className="w-full max-w-[720px]">
                <TriviaGame
                  className="w-full rounded-3xl border-white/15 bg-slate-900/70 shadow-[0_45px_140px_-80px_rgba(56,189,248,0.75)] backdrop-blur-xl sm:border-white/10"
                  questions={questions}
                  track={track}
                  mode={mode}
                  onComplete={(score, answers) => {
                    onComplete?.(score, answers);
                  }}
                  completionRender={({ score, restart }) => (
                    <div className="flex w-full flex-wrap items-center justify-center gap-3 max-[480px]:gap-2.5">
                      {mode === "dojo" && onShuffle && (
                        <Button
                          onClick={() => {
                            void onShuffle();
                          }}
                          disabled={isShuffling}
                          className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 font-semibold text-white shadow-[0_20px_70px_-40px_rgba(34,197,94,0.8)] transition-all hover:scale-105 hover:shadow-[0_25px_80px_-45px_rgba(34,197,94,0.85)] active:scale-95 max-[480px]:w-full max-[480px]:text-sm"
                        >
                          {isShuffling ? "Shuffling…" : "Mix It Up"}
                        </Button>
                      )}
                      {mode === "ring" && onContinue && (
                        <Button
                          onClick={() => onContinue(score)}
                          className="shadow-[0_20px_70px_-40px_rgba(34,197,94,0.8)] max-[480px]:w-full"
                        >
                          {continueLabel || "Pitch your project"}
                        </Button>
                      )}
                      {mode === "dojo" && (
                        <Button variant="secondary" onClick={restart} className="max-[480px]:w-full">
                          Try Again
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleExitClick} className="max-[480px]:w-full">
                        Abandon attempt
                      </Button>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="border-white/10 bg-slate-900/95 text-white backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-white">
              Exit trivia session?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300/80">
              {mode === "ring"
                ? "Your progress in this trivia session will be lost, and you'll lose your chance to enter for that category for the day. Are you sure you want to exit?"
                : "Your progress in this trivia session will be lost. Are you sure you want to exit?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Keep playing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExit}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Yes, exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
