import { useState } from "react";
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

import { TriviaGame } from "./TriviaGame";
import type { TriviaQuestion, TriviaTrackMeta } from "./utils";

interface TriviaOverlayProps {
  questions: TriviaQuestion[];
  track: TriviaTrackMeta;
  mode: "dojo" | "ring";
  onExit: () => void;
  onComplete?: (score: number) => void;
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
        className="fixed inset-0 z-50 flex min-h-[100svh] items-center justify-center bg-slate-950/95 px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)] backdrop-blur-md sm:px-6"
      >
        {/* Exit button */}
        <button
          onClick={handleExitClick}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-white/40 hover:bg-white/20 sm:right-6 sm:top-6"
          aria-label="Exit trivia"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Trivia game container */}
        <div className="relative flex h-full w-full max-w-5xl items-center justify-center">
          <TriviaGame
            className="h-[calc(100svh-2.5rem)] w-full rounded-3xl border-white/15 bg-slate-900/70 shadow-[0_45px_140px_-80px_rgba(56,189,248,0.75)] backdrop-blur-xl sm:border-white/10 supports-[height:100dvh]:h-[calc(100dvh-2.5rem)]"
            questions={questions}
            track={track}
            mode={mode}
            onComplete={(score) => {
              onComplete?.(score);
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
                    {isShuffling ? "Shuffling…" : "Shuffle deck"}
                  </Button>
                )}
                {mode === "ring" && onContinue && (
                  <Button
                    onClick={() => onContinue(score)}
                    className="shadow-[0_20px_70px_-40px_rgba(34,197,94,0.8)] max-[480px]:w-full"
                  >
                    {continueLabel || "Enter the ring"}
                  </Button>
                )}
                <Button variant="secondary" onClick={restart} className="max-[480px]:w-full">
                  {mode === "ring" ? "Replay warm-up" : "Restart deck"}
                </Button>
                <Button variant="outline" onClick={handleExitClick} className="max-[480px]:w-full">
                  Exit track
                </Button>
              </div>
            )}
          />
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
              Your progress in this trivia session will be lost. Are you sure you want to exit?
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
