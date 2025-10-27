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
      "Race the countdown with live Data#3 trivia before your official run. Pick a Cisco architecture tile and lock in the numbers before you enter the ring.",
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
  const mode = params?.mode as DojoExperienceId | undefined;
  const experience = mode ? dojoExperiences[mode] : undefined;

  if (!experience) {
    return <NotFound />;
  }

  if (mode === "trivia-cards") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <img
              src={dojoFullImage}
              alt="Dojo"
              className="h-24 w-24 rounded-2xl object-cover shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/40"
            />
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <Badge className="w-fit bg-emerald-400/20 text-emerald-200">{experience.status}</Badge>
              <h1 className="text-4xl font-semibold sm:text-5xl">{experience.title}</h1>
              <p className="max-w-3xl text-pretty text-base text-slate-200/80 sm:text-lg">
                Choose a technology track and test your knowledge. Answer fast to maximize your score.
              </p>
            </div>
          </div>

          <TriviaWarmup mode="dojo" className="h-full" />

          <div className="flex flex-wrap gap-3">
            <Link href="/beta">
              <Button variant="secondary" className="backdrop-blur">
                Back to beta overview
              </Button>
            </Link>
            <Link href="/beta/play">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <img
            src={dojoFullImage}
            alt="Dojo"
            className="h-24 w-24 rounded-2xl object-cover shadow-2xl shadow-blue-500/30 ring-2 ring-blue-400/40"
          />
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <Badge className="w-fit bg-primary/20 text-primary">{experience.status}</Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl">{experience.title}</h1>
            <p className="max-w-3xl text-pretty text-base text-slate-200/80 sm:text-lg">
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
          <CardContent className="space-y-3 text-slate-200/80">
            <p>
              We are rolling these dojo paths out alongside the beta ring experience. Until the dedicated flows go
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
          <Link href="/beta">
            <Button variant="secondary" className="backdrop-blur">
              Back to beta overview
            </Button>
          </Link>
          <Link href="/beta/play">
            <Button className="shadow-[0_25px_70px_-40px_rgba(34,197,94,0.9)]">
              Enter the ring now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
