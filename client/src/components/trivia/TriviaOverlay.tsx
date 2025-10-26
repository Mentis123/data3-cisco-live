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
}

export function TriviaOverlay({
  questions,
  track,
  mode,
  onExit,
  onComplete,
  continueLabel,
  onContinue,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
        {/* Exit button */}
        <button
          onClick={handleExitClick}
          className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 hover:border-white/30"
          aria-label="Exit trivia"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Trivia game container */}
        <div className="h-full w-full max-w-4xl overflow-auto p-4 sm:p-6">
          <div className="mx-auto h-full">
            <TriviaGame
              questions={questions}
              track={track}
              mode={mode}
              onComplete={(score) => {
                onComplete?.(score);
              }}
              completionRender={({ score, restart }) => (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {mode === "ring" && onContinue && (
                    <Button
                      onClick={() => onContinue(score)}
                      className="shadow-[0_20px_70px_-40px_rgba(34,197,94,0.8)]"
                    >
                      {continueLabel || "Enter the ring"}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={restart}>
                    {mode === "ring" ? "Replay warm-up" : "Restart track"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExitClick}
                  >
                    Exit trivia
                  </Button>
                </div>
              )}
            />
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
