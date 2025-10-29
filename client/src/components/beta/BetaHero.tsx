import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const entryPoints = [
  {
    id: "trivia-cards",
    eyebrow: "Dojo",
    title: "Practice trivia cards",
    description: "Drill the daily decks with instant rationale reveals and unlimited restarts.",
    href: "/beta/dojo",
    action: "Start practicing",
    variant: "outline" as const,
  },
  {
    id: "case-builder",
    eyebrow: "Dojo",
    title: "Build a case card",
    description: "Shape KPI dials and narrative beats before committing to an official run.",
    href: "/beta/dojo/case-builder",
    action: "Open case builder",
    variant: "secondary" as const,
  },
  {
    id: "ring",
    eyebrow: "Ring",
    title: "Pitch My Project",
    description:
      "Run the full experience — trivia mastery, case submission, scoring and leaderboard glory.",
    href: "/beta/ring",
    action: "Launch full run",
    variant: "default" as const,
  },
];

export type BetaHeroStat = {
  value: string;
  label: string;
  detail: string;
};

type BetaHeroProps = {
  stats: BetaHeroStat[];
};

export function BetaHero({ stats }: BetaHeroProps) {
  return (
    <div className="relative z-10 border-b border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <div className="space-y-6">
            <Badge className="w-fit bg-primary/30 text-white shadow-[0_20px_70px_-40px_rgba(34,197,94,0.8)]">Beta preview</Badge>
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
                Choose your starting move
              </h1>
              <p className="max-w-3xl text-pretty text-lg text-slate-300">
                Warm up in the Dojo or head straight into a full run. Every path keeps the existing beta blueprint
                intact below — we just surface the shortcuts you need to get moving.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {entryPoints.slice(0, 2).map((entry) => (
                <Card
                  key={entry.id}
                  className="h-full border-white/10 bg-white/[0.06] shadow-[0_30px_90px_-55px_rgba(59,130,246,0.6)] backdrop-blur"
                >
                  <CardHeader className="space-y-1">
                    <Badge variant="outline" className="w-fit border-white/20 text-xs uppercase tracking-[0.25em]">
                      {entry.eyebrow}
                    </Badge>
                    <CardTitle className="text-xl">{entry.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-200/80">
                    <p>{entry.description}</p>
                    <Link href={entry.href}>
                      <Button variant={entry.variant} className="w-full">
                        {entry.action}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/">
                <Button variant="secondary" className="backdrop-blur">
                  Back to current experience
                </Button>
              </Link>
              <Link href="/play">
                <Button variant="outline" className="border-primary/50 text-primary">
                  Jump into today&apos;s sprint
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-white/10 bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent shadow-[0_35px_120px_-60px_rgba(34,197,94,0.8)] backdrop-blur">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary/80">
                Ring ready
              </Badge>
              <CardTitle className="text-2xl">Ready for the full gauntlet?</CardTitle>
              <p className="text-sm text-slate-200/80">
                When you&apos;re confident, enter the Ring to log an official attempt, submit a case card and post a
                leaderboard score.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200/80">
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span aria-hidden="true">🏁</span>
                  <span>Timed trivia-card round with instant feedback for each decision.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden="true">🧮</span>
                  <span>Case Card builder captures KPI dials, impact math and execution details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden="true">🏆</span>
                  <span>Automatic scoring, raffle eligibility checks and leaderboard placement.</span>
                </li>
              </ul>
              <Link href={entryPoints[2].href}>
                <Button className="w-full shadow-[0_25px_70px_-40px_rgba(34,197,94,0.9)]">
                  {entryPoints[2].action}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent p-6 shadow-[0_35px_120px_-60px_rgba(59,130,246,0.85)] backdrop-blur"
            >
              <div className="text-4xl font-semibold text-primary sm:text-5xl">{stat.value}</div>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-slate-200/80">{stat.label}</p>
              <p className="mt-3 text-sm text-slate-200/70">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BetaHero;
