import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { triviaCardCategoryMeta, isTriviaCardCategory, type TriviaCardCategory } from "@/data/triviaCards";
import { cn } from "@/lib/utils";

import { TriviaOverlay } from "./TriviaOverlay";
import {
  practiceCardToQuestion,
  type TriviaPracticeCard,
  type TriviaTrackMeta,
} from "./utils";

type TriviaWarmupMode = "dojo" | "ring";

interface TriviaWarmupProps {
  mode: TriviaWarmupMode;
  className?: string;
  continueLabel?: string;
  exitHref?: string;
  onContinue?: (score?: number) => void;
}

const TRIVIA_TRACK_DETAILS: Record<TriviaCardCategory, { summary: string; description: string }> = {
  SECURE_CONNECTIVITY: {
    summary: "Secure connectivity quick-fire",
    description: "Can you recall the zero-trust stats before the countdown hits zero?",
  },
  HYBRID_DC: {
    summary: "Hybrid cloud warm-up",
    description: "Prove you know our scale across data centres and elastic infrastructure.",
  },
  COLLAB_CX: {
    summary: "Collaboration pulse check",
    description: "Customer experience numbers are on the line — lock them in fast.",
  },
  OBSERVABILITY: {
    summary: "Observability lightning round",
    description: "Find the metrics that keep MTTR low and trust sky high.",
  },
  EDGE_IOT: {
    summary: "Edge & IoT blitz",
    description: "Stay sharp on the stats powering the production floor.",
  },
};

type TriviaCategorySummary = {
  category: string;
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

function isPracticeCard(value: unknown): value is TriviaPracticeCard {
  if (!value || typeof value !== "object") {
    return false;
  }

  const card = value as Partial<TriviaPracticeCard>;
  return (
    typeof card.id === "string" &&
    typeof card.stem === "string" &&
    Array.isArray(card.choices) &&
    typeof card.correctIndex === "number"
  );
}

export function TriviaWarmup({ mode, className, continueLabel = "Enter the ring", exitHref = "/beta", onContinue }: TriviaWarmupProps) {
  const [selectedTrack, setSelectedTrack] = useState<TriviaTrackMeta | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const tracks = useMemo(() => {
    return (Object.keys(triviaCardCategoryMeta) as TriviaCardCategory[]).map((key) => {
      const meta = triviaCardCategoryMeta[key];
      const detail = TRIVIA_TRACK_DETAILS[key];
      return {
        id: key,
        name: meta.name,
        accentClass: meta.accent,
        summary: detail.summary,
        description: detail.description,
      } satisfies TriviaTrackMeta;
    });
  }, []);

  const {
    data: categorySummaries,
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    error: categoriesError,
  } = useQuery<TriviaCategorySummary[]>({
    queryKey: ["trivia", "categories"],
    queryFn: async () => {
      const response = await fetch("/api/trivia/categories", { credentials: "include" });
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message?: string }).message)
            : "Failed to load trivia categories";
        throw new Error(message);
      }

      if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { categories?: unknown }).categories)
      ) {
        return (payload as { categories: TriviaCategorySummary[] }).categories;
      }

      return Array.isArray(payload) ? (payload as TriviaCategorySummary[]) : [];
    },
    staleTime: 60_000,
  });

  const categoryMap = useMemo(() => {
    const map = new Map<TriviaCardCategory, TriviaCategorySummary>();
    for (const entry of categorySummaries ?? []) {
      if (entry && typeof entry.category === "string" && isTriviaCardCategory(entry.category)) {
        map.set(entry.category, entry);
      }
    }
    return map;
  }, [categorySummaries]);

  const {
    data: practiceDeck,
    isLoading: isDeckLoading,
    isError: isDeckError,
    error: deckError,
    refetch: refetchDeck,
    isFetching: isDeckFetching,
  } = useQuery<TriviaPracticeCard[]>({
    queryKey: ["trivia", "practice", selectedTrack?.id],
    enabled: !!selectedTrack,
    queryFn: async () => {
      if (!selectedTrack) {
        return [];
      }

      const params = new URLSearchParams({ category: selectedTrack.id });
      const response = await fetch(`/api/trivia/practice?${params.toString()}`, {
        credentials: "include",
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message?: string }).message)
            : "Failed to load trivia deck";
        throw new Error(message);
      }

      if (payload && typeof payload === "object" && Array.isArray((payload as { cards?: unknown }).cards)) {
        return ((payload as { cards: unknown[] }).cards).filter(isPracticeCard);
      }

      return [];
    },
    gcTime: 0,
  });

  const questions = useMemo(
    () => (practiceDeck ? practiceDeck.map(practiceCardToQuestion) : []),
    [practiceDeck],
  );

  // Open overlay when deck is loaded
  useMemo(() => {
    if (selectedTrack && practiceDeck && practiceDeck.length > 0 && !isDeckLoading) {
      setShowOverlay(true);
    }
  }, [selectedTrack, practiceDeck, isDeckLoading]);

  const categoriesErrorMessage =
    categoriesError instanceof Error ? categoriesError.message : null;
  const deckErrorMessage =
    deckError instanceof Error ? deckError.message : "Failed to load trivia deck";

  const renderSelection = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">Choose your track</p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Which tech will you defend?</h2>
          <p className="text-sm text-slate-300/80 sm:text-base">
            Pick the architecture you want to drill. Each warm-up pulls curated Data#3 trivia from the live question set for
            that track.
          </p>
          {isCategoriesError && (
            <p className="text-xs text-amber-300/80">
              We couldn&apos;t confirm deck counts right now{categoriesErrorMessage ? ` (${categoriesErrorMessage})` : ""}, but every
              track remains open for practice.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tracks.map((track) => {
            const summary = categoryMap.get(track.id);
            const total = summary?.total ?? 0;
            const status = summary
              ? `${total} question${total === 1 ? "" : "s"} ready`
              : isCategoriesError
              ? "Deck counts unavailable — jump in"
              : isLoadingCategories
              ? "Loading question counts…"
              : "Warm-up deck ready";

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setSelectedTrack(track)}
                className="group h-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/30 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                      track.accentClass,
                    )}
                  />
                  <div>
                    <p className="text-base font-semibold text-white">{track.name}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-300/70">Trivia warm-up</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-200/80">{track.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-300/60">{status}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoadingCategories) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold">Loading warm-up decks…</CardTitle>
          <p className="text-sm text-slate-300/80">Gathering the latest trivia tracks from the question set.</p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center gap-4">
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedTrack) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-2">
          <Badge className="w-fit bg-white/10 text-xs uppercase tracking-[0.3em] text-slate-200">Warm-up</Badge>
          <CardTitle className="text-2xl font-semibold">Pick your trivia track</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {renderSelection()}
        </CardContent>
      </Card>
    );
  }

  if (selectedTrack && isDeckLoading) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-950", selectedTrack.accentClass)}>
              {selectedTrack.name}
            </Badge>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Loading deck</p>
          </div>
          <CardTitle className="text-2xl font-semibold">Building your warm-up</CardTitle>
          <p className="text-sm text-slate-300/80">
            Pulling a fresh question set for {selectedTrack.name}. This only takes a moment.
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center gap-4">
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  if (selectedTrack && (isDeckError || (!isDeckLoading && !questions.length))) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Trivia deck unavailable</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <p className="text-sm text-slate-300/80">
            {isDeckError
              ? deckErrorMessage
              : `We couldn’t load a trivia deck for ${selectedTrack.name} right now. Try again or select a different track.`}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="self-start"
              onClick={() => {
                void refetchDeck();
              }}
              disabled={isDeckFetching}
            >
              {isDeckFetching ? "Retrying…" : "Try this track again"}
            </Button>
            <Button variant="outline" className="self-start" onClick={() => setSelectedTrack(null)}>
              Choose another track
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showOverlay && selectedTrack && questions.length > 0 && (
        <TriviaOverlay
          questions={questions}
          track={selectedTrack}
          mode={mode}
          onExit={() => {
            setShowOverlay(false);
            setSelectedTrack(null);
          }}
          onComplete={(score) => {
            // Score is captured but attempt tracking not yet implemented
            // TODO: In ring mode, submit attempt completion to API
            console.log(`[TriviaWarmup] Completed with score: ${score}`);
          }}
          continueLabel={continueLabel}
          onContinue={(score?: number) => {
            setShowOverlay(false);
            if (onContinue) {
              onContinue(score);
            }
          }}
        />
      )}

      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-2">
          <Badge className="w-fit bg-white/10 text-xs uppercase tracking-[0.3em] text-slate-200">Warm-up</Badge>
          <CardTitle className="text-2xl font-semibold">Pick your trivia track</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {renderSelection()}
        </CardContent>
      </Card>
    </>
  );
}

