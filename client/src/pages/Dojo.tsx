import { useEffect } from "react";
import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TriviaWarmup } from "@/components/trivia";
import NotFound from "@/pages/not-found";
import dojoFullImage from "@assets/dojofull.jpg";

type DojoExperienceId = "trivia-cards" | "case-builder";

type DojoRouteProps = {
  params: {
    mode?: string;
  };
};

const dojoExperiences: Record<DojoExperienceId, {
  title: string;
  eyebrow: string;
  description: string;
  status: string;
  highlights: string[];
}> = {
  "trivia-cards": {
    title: "Dojo trivia-card drills",
    eyebrow: "Practice",
    description:
      "Race the countdown with live trivia before your official run. Pick a Cisco architecture tile and lock in the numbers before you enter the ring.",
    status: "WARM UP",
    highlights: [
      "Five architecture tracks fed by the current stats deck",
      "One wrong answer drops at 10 seconds remaining",
      "Hints appear at 5 seconds remaining with tiered scoring (6/4/2 pts)",
    ],
  },
  "case-builder": {
    title: "Dojo case-card builder",
    eyebrow: "Prep work",
    description:
      "The guided case-card builder is almost ready. Soon you will be able to pre-build KPI dials, narrative beats and execution plans before submitting an official run.",
    status: "In development",
    highlights: [
      "Step-by-step prompts for each dial",
      "Auto math helpers for impact sizing",
      "Save drafts before entering the ring",
    ],
  },
};

export default function Dojo({ params }: DojoRouteProps) {
  const rawMode = params?.mode;
  const fallbackMode: DojoExperienceId = "trivia-cards";
  const mode = rawMode
    ? (Object.prototype.hasOwnProperty.call(dojoExperiences, rawMode)
        ? (rawMode as DojoExperienceId)
        : undefined)
    : fallbackMode;

  if (!mode) {
    return <NotFound />;
  }

  const experience = dojoExperiences[mode];

  // Claude: Scroll to top on page load to avoid offset anchors
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  if (mode === "trivia-cards") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          <TriviaWarmup mode="dojo" className="h-full" />

          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="secondary" className="backdrop-blur">
                Back to home
              </Button>
            </Link>
            <Link href="/play">
              <Button className="shadow-[0_25px_70px_-40px_rgba(34,197,94,0.9)]">
                Enter the ring now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <img
            src={dojoFullImage}
            alt="Dojo"
            className="h-24 w-24 rounded-2xl object-cover shadow-2xl shadow-blue-500/30 ring-2 ring-blue-400/40"
          />
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <Badge className="w-fit bg-primary/20 text-primary">{experience.status}</Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl">{experience.title}</h1>
            <p className="max-w-3xl text-pretty text-base text-data3-white/80 sm:text-lg">
              {experience.description}
            </p>
          </div>
        </div>

        <Card className="border-white/10 bg-white/[0.04] shadow-[0_35px_120px_-60px_rgba(59,130,246,0.85)] backdrop-blur">
          <CardHeader className="space-y-1">
            <Badge variant="outline" className="w-fit border-white/20 uppercase tracking-[0.25em] text-xs">
              {experience.eyebrow}
            </Badge>
            <CardTitle className="text-2xl">What to expect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-data3-white/80">
            <p>
              We are rolling these dojo paths out alongside the ring experience. Until the dedicated flows go
              live, you can still enter the ring to run the full trivia-card round and submit a case card today.
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm">
              {experience.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link href="/">
            <Button variant="secondary" className="backdrop-blur">
              Back to home
            </Button>
          </Link>
          <Link href="/play">
            <Button className="shadow-[0_25px_70px_-40px_rgba(34,197,94,0.9)]">
              Enter the ring now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
