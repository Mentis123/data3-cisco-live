import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { triviaCardCategoryMeta, isTriviaCardCategory, type TriviaCardCategory } from "@/data/triviaCards";
import { cn } from "@/lib/utils";

import { TriviaOverlay } from "./TriviaOverlay";
import {
  triviaCardToQuestion,
  type TriviaDeckCard,
  type TriviaQuestion,
  type TriviaTrackMeta,
} from "./utils";
import dojoFullImage from "@assets/dojofull.jpg";

type TriviaWarmupMode = "dojo" | "ring";

interface TriviaWarmupProps {
  mode: TriviaWarmupMode;
  className?: string;
  continueLabel?: string;
  exitHref?: string;
  onContinue?: (score?: number, category?: string, attemptId?: string) => void;
  email?: string; // Required for ring mode to create attempt
  firstName?: string;
  lastName?: string;
}

const TRIVIA_TRACK_DETAILS: Record<TriviaCardCategory, { summary: string; description: string }> = {
  SECURE_CONNECTIVITY: {
    summary: "Secure connectivity quick-fire",
    description: "Can you recall the zero-trust stats before the countdown hits zero?",
  },
  HYBRID_DC: {
    summary: "Hybrid cloud pressure test",
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

function isDeckCard(value: unknown): value is TriviaDeckCard {
  if (!value || typeof value !== "object") {
    return false;
  }

  const card = value as Partial<TriviaDeckCard>;
  return (
    typeof card.id === "string" &&
    typeof card.stem === "string" &&
    Array.isArray(card.choices) &&
    typeof card.correctIndex === "number"
  );
}

function areDecksEquivalent(
  nextDeck: TriviaDeckCard[] | undefined | null,
  previousDeck: TriviaDeckCard[] | undefined | null,
) {
  if (!nextDeck || !previousDeck) {
    return false;
  }

  if (nextDeck.length !== previousDeck.length) {
    return false;
  }

  const normalize = (cards: TriviaDeckCard[]) =>
    [...cards].map((card) => card.id).sort((a, b) => a.localeCompare(b));

  const nextIds = normalize(nextDeck);
  const prevIds = normalize(previousDeck);

  return nextIds.every((id, index) => id === prevIds[index]);
}

export function TriviaWarmup({
  mode,
  className,
  continueLabel = "Pitch My Project",
  exitHref = "/beta",
  onContinue,
  email,
  firstName,
  lastName
}: TriviaWarmupProps) {
  const [selectedTrack, setSelectedTrack] = useState<TriviaTrackMeta | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isShuffleRequested, setIsShuffleRequested] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [isCreatingAttempt, setIsCreatingAttempt] = useState(false);
  const [triviaCompleted, setTriviaCompleted] = useState(false);
  const [attemptQuestions, setAttemptQuestions] = useState<TriviaQuestion[]>([]);

  const sanitizedEmail = useMemo(() => {
    if (!email) {
      return undefined;
    }
    const trimmed = email.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [email]);

  const sanitizedFirstName = useMemo(() => {
    if (!firstName) {
      return undefined;
    }
    const trimmed = firstName.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [firstName]);

  const sanitizedLastName = useMemo(() => {
    if (!lastName) {
      return undefined;
    }
    const trimmed = lastName.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [lastName]);

  useEffect(() => {
    if (!selectedTrack && attemptId) {
      setAttemptId(null);
    }
    // Clear duplicate error when track changes
    if (!selectedTrack && attemptError) {
      setAttemptError(null);
    }
    // Reset triviaCompleted flag when track changes
    if (!selectedTrack && triviaCompleted) {
      setTriviaCompleted(false);
    }
    if (!selectedTrack && attemptQuestions.length) {
      setAttemptQuestions([]);
    }
  }, [selectedTrack, attemptId, attemptError, triviaCompleted, attemptQuestions.length]);

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
  } = useQuery<TriviaDeckCard[]>({
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
        return ((payload as { cards: unknown[] }).cards).filter(isDeckCard);
      }

      return [];
    },
    gcTime: 0,
  });

  const practiceQuestions = useMemo(
    () => (practiceDeck ? practiceDeck.map(triviaCardToQuestion) : []),
    [practiceDeck],
  );

  const questions = mode === "ring" ? attemptQuestions : practiceQuestions;

  // Open overlay when deck is loaded - for ring mode, wait until attempt is created
  useEffect(() => {
    if (!selectedTrack) {
      return;
    }

    if (triviaCompleted) {
      return;
    }

    if (mode === "dojo") {
      if (!practiceDeck || practiceDeck.length === 0 || isDeckLoading) {
        return;
      }
      setShowOverlay(true);
      return;
    }

    if (mode === "ring") {
      if (!sanitizedEmail) {
        return;
      }

      if (!attemptId && !isCreatingAttempt && !attemptError) {
        const createAttempt = async () => {
          setIsCreatingAttempt(true);
          setAttemptQuestions([]);
          try {
            const response = await fetch("/api/trivia/attempts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                category: selectedTrack.id,
                mode: "ring",
                email: sanitizedEmail,
                playerProfile:
                  sanitizedFirstName || sanitizedLastName
                    ? {
                        ...(sanitizedFirstName ? { firstName: sanitizedFirstName } : {}),
                        ...(sanitizedLastName ? { lastName: sanitizedLastName } : {}),
                      }
                    : undefined,
              }),
            });

            type StartAttemptResponse =
              | {
                  attemptId?: unknown;
                  attempt?: { id?: unknown } | null;
                  cards?: unknown;
                  message?: string;
                }
              | null;

            const payload = (await response.json().catch(() => null)) as StartAttemptResponse;

            if (response.status === 409) {
              const errorMessage =
                payload && typeof payload === "object" && "message" in payload
                  ? String((payload as { message?: string }).message)
                  : "You have already submitted for this category today";
              setAttemptError(errorMessage);
              setSelectedTrack(null);
              setIsCreatingAttempt(false);
              return;
            }

            if (!response.ok) {
              const message =
                payload && typeof payload === "object" && "message" in payload
                  ? String((payload as { message?: string }).message)
                  : "Failed to start trivia attempt";
              throw new Error(message);
            }

            let nextAttemptId: string | null = null;
            if (payload && typeof payload === "object") {
              if (typeof payload.attemptId === "string") {
                nextAttemptId = payload.attemptId;
              } else if (typeof payload.attemptId === "number") {
                nextAttemptId = String(payload.attemptId);
              } else if (payload.attempt && typeof payload.attempt === "object" && payload.attempt !== null) {
                const attempt = payload.attempt as { id?: unknown };
                if (typeof attempt.id === "string") {
                  nextAttemptId = attempt.id;
                } else if (typeof attempt.id === "number") {
                  nextAttemptId = String(attempt.id);
                }
              }
            }

            const rawCards =
              payload && typeof payload === "object" && Array.isArray((payload as { cards?: unknown }).cards)
                ? ((payload as { cards: unknown[] }).cards).filter(isDeckCard)
                : [];

            if (!nextAttemptId) {
              throw new Error("Invalid attempt response");
            }

            if (rawCards.length === 0) {
              throw new Error("No trivia cards returned for this attempt");
            }

            setAttemptId(nextAttemptId);
            setAttemptQuestions(rawCards.map(triviaCardToQuestion));
            setAttemptError(null);
            setShowOverlay(true);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to start trivia attempt";
            setAttemptError(message);
            setAttemptId(null);
            setAttemptQuestions([]);
            setShowOverlay(false);
            setSelectedTrack(null);
          } finally {
            setIsCreatingAttempt(false);
          }
        };

        void createAttempt();
        return;
      }

      if (attemptId && attemptQuestions.length > 0 && !showOverlay) {
        setShowOverlay(true);
      }
    }
  }, [
    mode,
    selectedTrack,
    practiceDeck,
    isDeckLoading,
    triviaCompleted,
    sanitizedEmail,
    attemptId,
    isCreatingAttempt,
    attemptError,
    showOverlay,
    attemptQuestions.length,
    sanitizedFirstName,
    sanitizedLastName,
  ]);

  const categoriesErrorMessage =
    categoriesError instanceof Error ? categoriesError.message : null;
  const deckErrorMessage =
    deckError instanceof Error ? deckError.message : "Failed to load trivia deck";

  const isRingDeckLoading =
    mode === "ring" && selectedTrack ? isCreatingAttempt || (!attemptId && !attemptError && attemptQuestions.length === 0) : false;

  const isDojoDeckLoading = mode === "dojo" && isDeckLoading;

  const shouldShowLoadingState = selectedTrack && (isRingDeckLoading || isDojoDeckLoading);

  const showDeckUnavailable =
    !!selectedTrack &&
    ((mode === "dojo" && (isDeckError || (!isDeckLoading && practiceQuestions.length === 0))) ||
      (mode === "ring" && attemptId !== null && !isCreatingAttempt && attemptQuestions.length === 0));

  const renderSelection = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">Choose your track</p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Which tech will you defend?</h2>
          <p className="text-sm text-slate-300/80 sm:text-base">
            Pick the architecture you want to drill. {mode === "ring" ? "Each official run pulls" : "Each warm-up pulls"} curated Data#3 trivia from the live question set
            for that track.
          </p>
          {attemptError && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">{attemptError}</p>
              <p className="mt-1 text-xs text-amber-300/80">
                If you've already entered this category today, pick another track — otherwise try again in a moment.
              </p>
            </div>
          )}
          {isCategoriesError && (
            <p className="text-xs text-amber-300/80">
              We couldn&apos;t confirm deck counts right now{categoriesErrorMessage ? ` (${categoriesErrorMessage})` : ""}, but every
              track remains open for {mode === "ring" ? "official runs" : "practice"}.
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
              : mode === "ring" ? "Official deck ready" : "Warm-up deck ready";

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  console.log("[TriviaWarmup] 🎯 User selected track:", track.id, track.name);
                  setAttemptError(null);
                  setSelectedTrack(track);
                }}
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
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-300/70">
                      {mode === "ring" ? "Official trivia" : "Trivia warm-up"}
                    </p>
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
          <CardTitle className="text-2xl font-semibold">
            {mode === "ring" ? "Loading trivia decks…" : "Loading warm-up decks…"}
          </CardTitle>
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
        <CardHeader className="space-y-6">
          {mode === "dojo" && (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white whitespace-nowrap">
                <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400" />
                Warm-up
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap sm:gap-6">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-xl sm:h-24 sm:w-24">
                  <img
                    src={dojoFullImage}
                    alt="Training Dojo"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-3 text-left">
                  <CardTitle className="text-3xl font-semibold text-white sm:text-4xl">Training Dojo</CardTitle>
                  <p className="text-sm text-slate-200/80 sm:text-base">
                    Race the countdown with live trivia before your official run. Pick a Cisco architecture tile and lock in the
                    numbers before you enter the ring.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardHeader>
        <CardContent className="flex-1 pt-2">
          {renderSelection()}
        </CardContent>
      </Card>
    );
  }

  if (shouldShowLoadingState) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-950", selectedTrack.accentClass)}>
              {selectedTrack.name}
            </Badge>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">
              {mode === "ring" ? "Creating attempt" : "Loading deck"}
            </p>
          </div>
          <CardTitle className="text-2xl font-semibold">
            {mode === "ring"
              ? "Entering the ring..."
              : "Building your warm-up"}
          </CardTitle>
          <p className="text-sm text-slate-300/80">
            {mode === "ring"
              ? `Registering your official attempt for ${selectedTrack.name}. This only takes a moment.`
              : `Pulling a new random mix of questions for ${selectedTrack.name}. This only takes a moment.`}
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

  if (showDeckUnavailable) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Trivia deck unavailable</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <p className="text-sm text-slate-300/80">
            {mode === "dojo"
              ? deckErrorMessage
              : `We couldn’t load a trivia deck for ${selectedTrack.name} right now. Try again or select a different track.`}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="self-start"
              onClick={() => {
                if (mode === "dojo") {
                  void refetchDeck();
                } else {
                  setSelectedTrack(null);
                }
              }}
              disabled={mode === "dojo" ? isDeckFetching : false}
            >
              {mode === "dojo"
                ? isDeckFetching
                  ? "Retrying…"
                  : "Try this track again"
                : "Pick a different track"}
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
          onComplete={async (score) => {
            console.log(`[TriviaWarmup] Completed with score: ${score}`);

            // Note: Full answer submission requires TriviaGame to expose individual answers
            // For now, the attempt is created and attemptId is passed to submission
            // The backend will calculate score from the submission's trivia attempt
          }}
          continueLabel={continueLabel}
          onContinue={(score?: number) => {
            console.log("[TriviaWarmup] Trivia completed, calling parent onContinue");
            setTriviaCompleted(true);
            setShowOverlay(false);
            if (onContinue) {
              // Pass score, category, and attemptId back to parent
              onContinue(score, selectedTrack?.id, attemptId || undefined);
            }
          }}
          onShuffle={async () => {
            if (isShuffleRequested || isDeckFetching || !selectedTrack) {
              return;
            }

            setIsShuffleRequested(true);
            try {
              const previousDeck = practiceDeck;
              const MAX_SHUFFLE_ATTEMPTS = 2;
              let attempts = 0;
              let result = await refetchDeck({ throwOnError: false });

              while (
                previousDeck &&
                result.data &&
                areDecksEquivalent(result.data, previousDeck) &&
                attempts < MAX_SHUFFLE_ATTEMPTS
              ) {
                attempts += 1;
                result = await refetchDeck({ throwOnError: false });
              }
            } finally {
              setIsShuffleRequested(false);
            }
          }}
          isShuffling={isShuffleRequested}
        />
      )}

      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Pick your technology track</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {renderSelection()}
        </CardContent>
      </Card>
    </>
  );
}

