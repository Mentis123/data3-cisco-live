import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TriviaCard, triviaCardCategoryMeta } from "@/data/triviaCards";

interface TriviaCardDeckProps {
  cards: TriviaCard[];
  variant?: "full" | "compact";
  className?: string;
}

export function TriviaCardDeck({ cards, variant = "full", className }: TriviaCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [seenCards, setSeenCards] = useState<Set<string>>(() =>
    cards.length ? new Set([cards[0].id]) : new Set()
  );

  useEffect(() => {
    if (!cards.length) {
      setCurrentIndex(0);
      setSeenCards(new Set());
      setRevealed(false);
      return;
    }

    setCurrentIndex(0);
    setRevealed(false);
    setSeenCards(new Set([cards[0].id]));
  }, [cards]);

  const totalCards = cards.length;
  const currentCard = cards[currentIndex];

  const completion = useMemo(() => {
    if (!totalCards) return 0;
    return (seenCards.size / totalCards) * 100;
  }, [seenCards, totalCards]);

  if (!currentCard) {
    return (
      <Card className={cn("border-dashed border-white/20 bg-transparent text-slate-300", className)}>
        <CardContent className="flex h-40 items-center justify-center text-sm">
          No trivia cards available yet.
        </CardContent>
      </Card>
    );
  }

  const categoryMeta = triviaCardCategoryMeta[currentCard.category];
  const isCompact = variant === "compact";

  const handleAdvance = useCallback(
    (direction: 1 | -1) => {
      if (!totalCards) return;
      setCurrentIndex((prev) => {
        const nextIndex = (prev + direction + totalCards) % totalCards;
        setRevealed(false);
        setSeenCards((prevSeen) => {
          const updated = new Set(prevSeen);
          const nextCard = cards[nextIndex];
          if (nextCard) {
            updated.add(nextCard.id);
          }
          return updated;
        });
        return nextIndex;
      });
    },
    [cards, totalCards]
  );

  const handleReset = () => {
    if (!totalCards) return;
    setCurrentIndex(0);
    setRevealed(false);
    setSeenCards(new Set([cards[0].id]));
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
          return;
        }
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleAdvance(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleAdvance(-1);
      } else if ((event.key === " " || event.key === "Enter") && !revealed) {
        event.preventDefault();
        setRevealed(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleAdvance, revealed]);

  return (
    <Card
      className={cn(
        "flex flex-col border-white/10 bg-white/5 text-white shadow-[0_25px_120px_-60px_rgba(56,189,248,0.55)] backdrop-blur",
        isCompact ? "p-4" : "p-6 sm:p-8",
        className
      )}
    >
      <CardHeader className="space-y-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge
            className={cn(
              "rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-950",
              categoryMeta?.accent,
              isCompact ? "text-[0.6rem]" : ""
            )}
          >
            {categoryMeta?.name ?? currentCard.category}
          </Badge>
          <div className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300/80">
            Card {currentIndex + 1} / {totalCards}
          </div>
        </div>
        <CardTitle
          className={cn(
            "text-balance font-semibold text-white",
            isCompact ? "text-lg" : "text-2xl sm:text-3xl"
          )}
        >
          {currentCard.title}
        </CardTitle>
        {categoryMeta?.blurb ? (
          <p className={cn("text-slate-200/80", isCompact ? "text-xs" : "text-sm sm:text-base")}>{categoryMeta.blurb}</p>
        ) : null}
        <Progress value={completion} className="h-1.5 bg-white/10" />
      </CardHeader>

      <CardContent className="mt-4 flex-1 space-y-5 overflow-hidden p-0">
        <ScrollArea className={cn("pr-4", isCompact ? "max-h-[260px]" : "max-h-[360px]")}> 
          <div className="space-y-4">
            <div className="rounded-2xl border-4 border-white/30 bg-white/5 p-4 shadow-[inset_2px_2px_6px_rgba(255,255,255,0.3),inset_-2px_-2px_6px_rgba(0,0,0,0.4),0_4px_12px_rgba(255,255,255,0.15),0_8px_20px_rgba(255,255,255,0.08)] transition-all duration-300 hover:border-white/50 hover:shadow-[inset_2px_2px_8px_rgba(255,255,255,0.4),inset_-2px_-2px_8px_rgba(0,0,0,0.5),0_6px_16px_rgba(255,255,255,0.25),0_10px_28px_rgba(255,255,255,0.12)] hover:scale-[1.02]">
              <h3 className={cn("font-semibold text-white", isCompact ? "text-sm" : "text-base")}>Scenario</h3>
              <p className={cn("mt-2 text-pretty leading-relaxed text-slate-200/90", isCompact ? "text-sm" : "text-base")}>
                {currentCard.scenario}
              </p>
            </div>

            <div className="rounded-2xl border-4 border-cyan-300/60 bg-cyan-500/10 p-4 shadow-[inset_2px_2px_6px_rgba(255,255,255,0.3),inset_-2px_-2px_6px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,255,255,0.2),0_8px_20px_rgba(0,255,255,0.12),inset_0_0_15px_rgba(0,255,255,0.08)] transition-all duration-300 hover:border-cyan-300/90 hover:shadow-[inset_2px_2px_8px_rgba(255,255,255,0.4),inset_-2px_-2px_8px_rgba(0,0,0,0.5),0_6px_16px_rgba(0,255,255,0.35),0_10px_28px_rgba(0,255,255,0.18),inset_0_0_20px_rgba(0,255,255,0.12)] hover:scale-[1.02]">
              <h3 className={cn("font-semibold text-cyan-200", isCompact ? "text-sm" : "text-base")}>Prompt</h3>
              <p className={cn("mt-2 text-pretty leading-relaxed text-cyan-50/90", isCompact ? "text-sm" : "text-base")}>
                {currentCard.prompt}
              </p>
            </div>

            <div className="rounded-2xl border-4 border-emerald-300/60 bg-emerald-500/10 p-4 shadow-[inset_2px_2px_6px_rgba(255,255,255,0.3),inset_-2px_-2px_6px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,255,0,0.2),0_8px_20px_rgba(0,255,0,0.12),inset_0_0_15px_rgba(0,255,0,0.08)] transition-all duration-300 hover:border-emerald-300/90 hover:shadow-[inset_2px_2px_8px_rgba(255,255,255,0.4),inset_-2px_-2px_8px_rgba(0,0,0,0.5),0_6px_16px_rgba(0,255,0,0.35),0_10px_28px_rgba(0,255,0,0.18),inset_0_0_20px_rgba(0,255,0,0.12)] hover:scale-[1.02]">
              <h3 className={cn("font-semibold text-emerald-200", isCompact ? "text-sm" : "text-base")}>Winning move</h3>
              <p className={cn("mt-2 text-pretty leading-relaxed text-emerald-50/90", isCompact ? "text-sm" : "text-base")}>
                {currentCard.winningMove}
              </p>
            </div>

            {revealed ? (
              <div className="rounded-2xl border-4 border-amber-300/60 bg-amber-500/10 p-4 shadow-[inset_2px_2px_6px_rgba(255,255,255,0.3),inset_-2px_-2px_6px_rgba(0,0,0,0.4),0_4px_12px_rgba(255,191,0,0.2),0_8px_20px_rgba(255,191,0,0.12),inset_0_0_15px_rgba(255,191,0,0.08)] transition-all duration-300 hover:border-amber-300/90 hover:shadow-[inset_2px_2px_8px_rgba(255,255,255,0.4),inset_-2px_-2px_8px_rgba(0,0,0,0.5),0_6px_16px_rgba(255,191,0,0.35),0_10px_28px_rgba(255,191,0,0.18),inset_0_0_20px_rgba(255,191,0,0.12)] hover:scale-[1.02]">
                <h3 className={cn("font-semibold text-amber-200", isCompact ? "text-sm" : "text-base")}>Rationale</h3>
                <p className={cn("mt-2 text-pretty leading-relaxed text-amber-50/90", isCompact ? "text-sm" : "text-base")}>
                  {currentCard.rationale}
                </p>
                <ul className={cn("mt-3 space-y-2", isCompact ? "text-sm" : "text-base")}>
                  {currentCard.scoringSignals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2 text-amber-100/80">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-300"></span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Button
                onClick={() => setRevealed(true)}
                className="w-full rounded-xl bg-white/15 py-5 text-sm font-semibold text-white hover:bg-white/25"
              >
                Reveal rationale & scoring cues
              </Button>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="mt-4 flex flex-col gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-slate-300/70">
          <span>Progress {seenCards.size}/{totalCards}</span>
          <span>Tap the arrows or keyboard ← →</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => handleAdvance(-1)}
            className="flex-1 min-w-[96px] rounded-xl bg-white/15 text-white hover:bg-white/25"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Prev
          </Button>
          <Button
            onClick={() => handleAdvance(1)}
            className="flex-1 min-w-[120px] rounded-xl bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            Next card
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="min-w-[100px] rounded-xl text-white/70 hover:bg-white/10"
          >
            Reset deck
          </Button>
        </div>
        {revealed ? (
          <Button
            variant="outline"
            onClick={() => setRevealed(false)}
            className="w-full rounded-xl border-white/30 text-white/80 hover:bg-white/10"
          >
            Hide rationale
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
