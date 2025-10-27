import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import howitworksFullImage from "@assets/howitworksfull.jpg";

const categories = [
  "Secure Connectivity",
  "Hybrid DC",
  "Collab & CX",
  "Observability",
  "Edge & IoT",
];

const triviaTimeline = [
  {
    label: "T−15s → T−10s",
    description: "All 3 options visible (max points window).",
  },
  {
    label: "T−10s",
    description: "One wrong option drops (2 options remain).",
  },
  {
    label: "T−5s",
    description: "A micro-hint appears under the question.",
  },
  {
    label: "T−0s",
    description: "Question locks; no answer = wrong.",
  },
];

const scoringTiers = [
  { label: "Answer before T−10s", value: "+6" },
  { label: "Answer T−10s to T−5s", value: "+4" },
  { label: "Answer T−5s to 0s", value: "+2" },
  { label: "Wrong / no answer", value: "+0" },
];

const leaderboardBadges = [
  "Top Score",
  "Sharp Shooter (fastest accurate answers)",
  "Track Champs (per category)",
  "Most Precise KPI",
];

const eligibility = [
  "Cisco Live registered email used on submit.",
  "KPI triplet complete (Baseline, Target, Due date).",
  "Total meets or exceeds the Bot Bar.",
];

const accessibilityTips = [
  "Keyboard: 1/2/3 to answer; Enter to confirm.",
  "Answer early for more points; wait for the T−5s hint if unsure.",
  "Keep your problem statement concrete and include a date — it boosts your Case Card score.",
];

export default function HowToPlay() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <section className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <img
            src={howitworksFullImage}
            alt="How to Play"
            className="h-24 w-24 rounded-2xl object-cover shadow-2xl shadow-purple-500/30 ring-2 ring-purple-400/40"
          />
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <Badge className="mx-auto w-fit bg-primary/30 text-white sm:mx-0">/beta/how-to-play</Badge>
            <div className="space-y-3">
              <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">How to Play — Two-Left Tango</h1>
              <p className="mx-auto max-w-3xl text-pretty text-lg text-slate-200/85 sm:mx-0">
                Five categories. Five trivia questions. One Case Card. Beat the Bot and earn today's raffle entry.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-white/20 text-xs uppercase tracking-[0.3em] text-white/80">
                Dojo vs Ring
              </Badge>
              <CardTitle className="text-2xl">Dojo (practice)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-200/85">
              <p>Unlimited plays, no email. Explanations after each trivia question.</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-white/20 text-xs uppercase tracking-[0.3em] text-white/80">
                Dojo vs Ring
              </Badge>
              <CardTitle className="text-2xl">Ring (official)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-200/85">
              <p>Cisco Live email required on submit. 1 run/day per category (max 5/day). Each pass = 1 raffle entry.</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Step-by-step</p>
            <h2 className="text-3xl font-semibold">From scan to raffle entry</h2>
          </div>
          <div className="space-y-8">
            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">1) Pick a category</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 text-sm text-slate-200/85">
                {categories.map((category) => (
                  <span key={category} className="rounded-full border border-white/20 px-3 py-1">
                    {category}
                  </span>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">2) Trivia round (×5)</CardTitle>
                <p className="text-sm text-slate-200/80">Each question has 3 answer buttons (A/B/C).</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Timer model (countdown from 15s):</p>
                  <ul className="space-y-2 text-sm text-slate-200/85">
                    {triviaTimeline.map((item) => (
                      <li key={item.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-semibold text-white/90">{item.label}</span>
                        <span>{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator className="bg-white/10" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Scoring per question:</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {scoringTiers.map((tier) => (
                      <div key={tier.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/85">
                        <p className="font-semibold text-white">{tier.label}</p>
                        <p>{tier.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <p className="text-sm text-slate-200/80">Dojo only: show a short explanation after each question.</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">3) Case Card (your mini pitch)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-200/85">
                <ul className="list-disc space-y-2 pl-6">
                  <li>Problem one-liner (120 chars).</li>
                  <li>KPI Triplet: Baseline value+unit, Target value+unit, Due date.</li>
                  <li>Owner & first milestone (chips + date).</li>
                  <li>(Optional) users affected, minutes saved, frequency — we compute annualised impact.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">4) Score & Bot Bar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-200/85">
                <p>Trivia /30 + Case Card /20 = Total /50.</p>
                <p>Beat today’s Bot Bar to win the round and record a raffle entry.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Raffle & Prizes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-200/85">
              <p>Every win (per category) = 1 raffle entry for the daily draw.</p>
              <p>Up to 5 entries/day (one per category).</p>
              <p>The winner is picked randomly by the system from that day’s entries.</p>
              <p>Prize: Meta AI Glasses (one pair per day).</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Leaderboards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-200/85">
              {leaderboardBadges.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Eligibility checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-200/85">
              <ul className="list-disc space-y-2 pl-6">
                {eligibility.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Accessibility & tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-200/85">
              <ul className="list-disc space-y-2 pl-6">
                {accessibilityTips.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid w-full max-w-2xl gap-3 self-center sm:grid-cols-2">
          <Link href="/beta/play">
            <Button size="lg" className="w-full">
              Enter the Ring
            </Button>
          </Link>
          <Link href="/beta/dojo/trivia-cards">
            <Button size="lg" variant="outline" className="w-full border-primary/40 text-primary">
              Practice in Dojo
            </Button>
          </Link>
          <Link href="/beta/leaderboard">
            <Button size="lg" variant="secondary" className="w-full">
              View Leaderboard
            </Button>
          </Link>
          <Link href="/beta">
            <Button size="lg" variant="ghost" className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10">
              Back to beta home
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
