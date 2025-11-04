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
      <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          <div className="flex flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8 border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">
            <TriviaWarmup mode="dojo" className="w-full" />
            <div className="mx-auto mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
              <Link href="/play">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10"
                >
                  Enter the Ring Now
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <i className="fas fa-home mr-2"></i>
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <div className="flex flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8 border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <img
              src={dojoFullImage}
              alt="Dojo"
              className="h-24 w-24 rounded-2xl object-cover shadow-2xl shadow-data3-light-blue/40 ring-2 ring-data3-light-blue/50"
          />
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <Badge className="w-fit bg-data3-blue/30 text-data3-pale-blue border-data3-light-blue/50">{experience.status}</Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl">{experience.title}</h1>
            <p className="max-w-3xl text-pretty text-base text-data3-white/80 sm:text-lg">
              {experience.description}
            </p>
          </div>
        </div>

        <Card className="border-white/10 bg-white/[0.04] shadow-[0_35px_120px_-60px_rgba(0,174,255,0.85)] backdrop-blur">
          <CardHeader className="space-y-1">
            <Badge variant="outline" className="w-fit border-data3-light-blue/50 bg-data3-blue/20 text-data3-pale-blue uppercase tracking-[0.25em] text-xs">
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
        <div className="mx-auto mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
          <Link href="/play">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10"
            >
              Enter the Ring Now
            </Button>
          </Link>
          <Link href="/">
            <Button
              size="lg"
              variant="ghost"
              className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </Button>
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
