import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotFound from "@/pages/not-found";

type DojoExperienceId = "flash-cards" | "case-builder";

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
  "flash-cards": {
    title: "Dojo flash-card drills",
    eyebrow: "Practice",
    description:
      "We are putting the finishing touches on the dojo flash-card flow. It will mirror the beta decks with instant rationales, unlimited restarts and kiosk-ready shortcuts.",
    status: "In development",
    highlights: [
      "Adaptive pacing with rationale reveals",
      "Quick restart loops for skill drilling",
      "Designed for expo kiosks and touchscreens",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <Badge className="w-fit bg-primary/20 text-primary">{experience.status}</Badge>
          <h1 className="text-4xl font-semibold sm:text-5xl">{experience.title}</h1>
          <p className="max-w-3xl text-pretty text-base text-slate-200/80 sm:text-lg">
            {experience.description}
          </p>
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
              live, you can still enter the ring to run the full flash-card round and submit a case card today.
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
