import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { triviaCardCategoryMeta, type TriviaCardCategory } from "@/data/triviaCards";
import { cn } from "@/lib/utils";
import ringImage from "@assets/ring.jpg";
import dojoImage from "@assets/dojo.jpg";
import leaderboardImage from "@assets/leaderboard.jpg";
import howitworksImage from "@assets/howitworks.jpg";

const categories = (Object.keys(triviaCardCategoryMeta) as TriviaCardCategory[]).map((key) => {
  const meta = triviaCardCategoryMeta[key];
  return {
    id: key,
    title: meta.name,
    copy: meta.blurb,
    accentClass: meta.accent,
  };
});

const howItWorks = [
  {
    title: "Answer 5 trivia questions in your chosen category.",
    bullets: [
      "15 seconds per question.",
      "After 5 seconds (at 10s remaining): one wrong option drops.",
      "After 10 seconds (at 5s remaining): a hint appears.",
    ],
  },
  {
    title: "Submit your Case Card",
    bullets: [
      "One-line problem.",
      "Baseline / Target / Due date + Owner & first milestone.",
    ],
  },
  {
    title: "Beat the Bot → Earn a raffle entry",
    bullets: [
      "If your Total /100 clears today's Bot Bar, we record a raffle entry for today's draw.",
    ],
  },
];

const scoringTiers = [
  { label: "Answer within first 5 seconds", value: "+12" },
  { label: "Answer between 5 and 10 seconds", value: "+8" },
  { label: "Answer in final 5 seconds (10-15s)", value: "+4" },
  { label: "Wrong or time-out", value: "+0" },
];

const quickRules = [
  {
    title: "Dojo",
    copy: "Unlimited practice; no email; explanations shown.",
  },
  {
    title: "Ring",
    copy: "Cisco Live email required on submit. 1 official run/day per category (max 5/day).",
  },
  {
    title: "Scoring",
    copy: "Trivia (0–60) + Project Pitch (0–40) = Total (0–100).",
  },
  {
    title: "Bot Bar",
    copy: "Dynamic daily bar; clear it to win the round.",
  },
  {
    title: "Prize",
    copy: "Every win = 1 raffle entry for today’s random draw (software-picked).",
  },
];

const microFaq = [
  {
    question: "How many times can I play?",
    answer: "Up to 5 official entries/day (one per category). Practice is unlimited.",
  },
  {
    question: "Eligibility?",
    answer: "Use your Cisco Live registered email, complete the KPI triplet, and beat the Bot Bar.",
  },
  {
    question: "Queues?",
    answer: "Nope. Scan the QR and play on your phone.",
  },
];

export default function Beta() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-36 pt-16 sm:px-6 lg:px-8">
          <section className="space-y-6 text-center">
            <Badge className="mx-auto w-fit bg-primary/30 text-white">/beta</Badge>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1">
              <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
                Beat the Bot
              </h1>
              <Link href="/admin-leaderboard">
                <button
                  className="px-2 py-1 text-transparent transition-colors hover:text-muted-foreground/10"
                  aria-label="Admin"
                  data-testid="button-secret-admin"
                >
                  •
                </button>
              </Link>
            </div>
            <p className="mx-auto max-w-3xl text-pretty text-lg text-slate-200/85 text-center">
              Practice dojo. Enter the Ring up to 5× per day (once per category). Every win is a raffle entry for today's Meta AI Glasses.
            </p>
          </div>
          <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 sm:gap-6 mx-auto">
            <Link href="/beta/play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                <div className="relative aspect-square">
                  <img src={ringImage} alt="Enter the Ring" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-60" />
                  <div className="absolute inset-0 bg-slate-950/40" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                    <span className="text-sm uppercase tracking-[0.3em] text-primary/70">Play</span>
                    <span className="text-xl font-semibold text-white">Enter the Ring</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/beta/dojo" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                <div className="relative aspect-square">
                  <img src={dojoImage} alt="Practice Dojo" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-60" />
                  <div className="absolute inset-0 bg-slate-950/40" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                    <span className="text-sm uppercase tracking-[0.3em] text-primary/70">Practice</span>
                    <span className="text-xl font-semibold text-white">Practice Dojo</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/beta/leaderboard" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                <div className="relative aspect-square">
                  <img src={leaderboardImage} alt="View Leaderboard" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-60" />
                  <div className="absolute inset-0 bg-slate-950/40" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                    <span className="text-sm uppercase tracking-[0.3em] text-primary/70">Standings</span>
                    <span className="text-xl font-semibold text-white">View Leaderboard</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/beta/how-to-play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                <div className="relative aspect-square">
                  <img src={howitworksImage} alt="How it works" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-60" />
                  <div className="absolute inset-0 bg-slate-950/40" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
                    <span className="text-sm uppercase tracking-[0.3em] text-primary/70">Learn</span>
                    <span className="text-xl font-semibold text-white">How it works</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Categories (5-up)</p>
            <h2 className="text-3xl font-semibold">Pick your arena</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                      category.accentClass,
                    )}
                  />
                  <div>
                    <p className="text-base font-semibold text-white">{category.title}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-200/80">{category.copy}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">How it works</p>
            <h2 className="text-3xl font-semibold">Three moves to log your entry</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {howItWorks.map((step, index) => (
              <Card key={step.title} className="border-white/10 bg-white/5 backdrop-blur">
                <CardHeader>
                  <Badge variant="outline" className="w-fit border-white/20 text-xs uppercase tracking-[0.3em] text-white/80">
                    Step {index + 1}
                  </Badge>
                  <CardTitle className="text-xl text-white">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-200/80">
                    {step.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-primary/40 text-xs uppercase tracking-[0.3em] text-primary/80">
                Scoring (per trivia question)
              </Badge>
              <CardTitle className="text-2xl text-white">Lock points before the hint lands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scoringTiers.map((tier) => (
                <div key={tier.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/85">
                  <span>{tier.label}</span>
                  <span className="font-semibold text-primary">{tier.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Quick rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200/85">
              {quickRules.map((rule) => (
                <div key={rule.title}>
                  <p className="font-semibold text-white">{rule.title}</p>
                  <p>{rule.copy}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Micro-FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200/85">
              {microFaq.map((item) => (
                <div key={item.question}>
                  <p className="font-semibold text-white">{item.question}</p>
                  <p>{item.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid w-full max-w-2xl gap-3 self-center sm:grid-cols-2">
          <Link href="/beta/play">
            <Button size="lg" className="w-full relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${ringImage})` }}>
              <span className="relative z-10">Enter the Ring</span>
            </Button>
          </Link>
          <Link href="/beta/dojo">
            <Button size="lg" variant="outline" className="w-full border-primary/40 text-primary relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${dojoImage})` }}>
              <span className="relative z-10">Practice Dojo</span>
            </Button>
          </Link>
          <Link href="/beta/leaderboard">
            <Button size="lg" variant="secondary" className="w-full relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${leaderboardImage})` }}>
              <span className="relative z-10">View Leaderboard</span>
            </Button>
          </Link>
          <Link href="/beta/how-to-play">
            <Button size="lg" variant="ghost" className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10 relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${howitworksImage})` }}>
              <span className="relative z-10">How it works</span>
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
