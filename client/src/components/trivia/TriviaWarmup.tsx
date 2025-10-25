import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { flashCardCategoryMeta, isFlashCardCategory, type FlashCardCategory } from "@/data/flashCards";
import { cn } from "@/lib/utils";

import { TriviaGame } from "./TriviaGame";
import {
  buildTriviaDeck,
  type CategorisedData3Stat,
  type Data3Stat,
  type TriviaTrackMeta,
} from "./utils";

type TriviaWarmupMode = "dojo" | "ring";

interface TriviaWarmupProps {
  mode: TriviaWarmupMode;
  className?: string;
  continueLabel?: string;
  exitHref?: string;
  onContinue?: () => void;
}

const TRIVIA_TRACK_DETAILS: Record<FlashCardCategory, { summary: string; description: string }> = {
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

const queryKey = ["public", "stats"] as const;

export function TriviaWarmup({ mode, className, continueLabel = "Enter the ring", exitHref = "/beta", onContinue }: TriviaWarmupProps) {
  const [selectedTrack, setSelectedTrack] = useState<TriviaTrackMeta | null>(null);

  const { data, isLoading, isError } = useQuery<Data3Stat[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch("/api/public/stats", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to load stats");
      }
      return response.json();
    },
    staleTime: 1000 * 60,
  });

  const tracks = useMemo(() => {
    return (Object.keys(flashCardCategoryMeta) as FlashCardCategory[]).map((key) => {
      const meta = flashCardCategoryMeta[key];
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

  const ciscoStats = useMemo<CategorisedData3Stat[]>(
    () =>
      (data ?? []).filter((stat): stat is CategorisedData3Stat =>
        isFlashCardCategory(stat.category),
      ),
    [data],
  );

  const availableTracks = useMemo(() => {
    if (!ciscoStats.length) {
      return [];
    }
    const categoriesWithStats = new Set(ciscoStats.map((stat) => stat.category));
    return tracks.filter((track) => categoriesWithStats.has(track.id));
  }, [tracks, ciscoStats]);

  const questions = useMemo(
    () => buildTriviaDeck(ciscoStats, selectedTrack?.id ?? null),
    [ciscoStats, selectedTrack],
  );

  const renderSelection = () => {
    const selectableTracks = availableTracks.length ? availableTracks : tracks;

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-300/70">Choose your track</p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Which tech will you defend?</h2>
          <p className="text-sm text-slate-300/80 sm:text-base">
            Pick the architecture you want to drill. Each warm-up pulls live stats so the correct answer is always current.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {selectableTracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => setSelectedTrack(track)}
              className="group h-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/30 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-slate-950", track.accentClass)}>
                  {track.name.split(" ")[0]}
                </span>
                <div>
                  <p className="text-base font-semibold text-white">{track.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-300/70">Trivia warm-up</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-200/80">{track.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold">Loading warm-up…</CardTitle>
          <p className="text-sm text-slate-300/80">Pulling the latest stats deck.</p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center gap-4">
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
          <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !ciscoStats.length) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Cisco stats not available</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <p className="text-sm text-slate-300/80">
            We could not load any of the Cisco architecture metrics right now. Try again shortly or jump back to the beta overview.
          </p>
          <Link href={exitHref}>
            <Button variant="secondary" className="self-start">
              Back to beta overview
            </Button>
          </Link>
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

  if (!questions.length) {
    return (
      <Card className={cn("flex h-full flex-col border-white/10 bg-slate-900/60 text-white backdrop-blur", className)}>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">No trivia cards yet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <p className="text-sm text-slate-300/80">
            This track does not have Data#3 stats assigned right now. Choose a different technology to keep the warm-up rolling.
          </p>
          <Button variant="secondary" className="self-start" onClick={() => setSelectedTrack(null)}>
            Choose another track
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TriviaGame
      className={className}
      questions={questions}
      track={selectedTrack}
      onComplete={() => {
        // handled via completionRender actions
      }}
      completionRender={({ restart }) => (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {mode === "ring" && onContinue && (
            <Button onClick={onContinue} className="shadow-[0_20px_70px_-40px_rgba(34,197,94,0.8)]">
              {continueLabel}
            </Button>
          )}
          <Button variant="secondary" onClick={restart}>
            {mode === "ring" ? "Replay warm-up" : "Restart track"}
          </Button>
          <Button variant="outline" onClick={() => setSelectedTrack(null)}>
            Choose different track
          </Button>
          {mode === "dojo" ? (
            <Link href={exitHref}>
              <Button variant="ghost">Exit to beta home</Button>
            </Link>
          ) : (
            <Link href={exitHref}>
              <Button variant="ghost">Return to beta overview</Button>
            </Link>
          )}
        </div>
      )}
    />
  );
}

