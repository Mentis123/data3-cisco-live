import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  {
    title: "Secure Connectivity",
    copy: "Zero Trust access, segmentation, and posture controls that keep workflows moving.",
  },
  {
    title: "Hybrid DC",
    copy: "Hybrid cloud, elastic capacity, and automation across on-prem and hosted estates.",
  },
  {
    title: "Collab & CX",
    copy: "Agent experience, AI assist, contact centre velocity, and CSAT lift.",
  },
  {
    title: "Observability",
    copy: "Telemetry quality, golden signals, incident response, and automation plays.",
  },
  {
    title: "Edge & IoT",
    copy: "Edge analytics, ruggedised compute, real-time control loops, and uptime wins.",
  },
];

const howItWorks = [
  {
    title: "Answer 5 trivia questions in your chosen category.",
    bullets: [
      "15s per question.",
      "T−10s: one wrong option drops.",
      "T−5s: a hint appears.",
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
      "If your Total /50 clears today’s Bot Bar, we record a raffle entry for today’s draw.",
    ],
  },
];

const scoringTiers = [
  { label: "Answer before T−10s", value: "+6" },
  { label: "Answer between T−10s and T−5s", value: "+4" },
  { label: "Answer between T−5s and 0s", value: "+2" },
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
    copy: "Trivia (0–30) + Case Card (0–20) = Total (0–50).",
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
        <section className="space-y-6 text-center sm:text-left">
          <Badge className="mx-auto w-fit bg-primary/30 text-white sm:mx-0">/beta</Badge>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Beat the Bot — Two-Left Tango
            </h1>
            <p className="mx-auto max-w-3xl text-pretty text-lg text-slate-200/85 sm:mx-0">
              Practice in the Dojo. Enter the Ring up to 5× per day (once per category). Every win is a raffle entry for today’s Meta AI Glasses.
            </p>
          </div>
          <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
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
            <Link href="/beta/how-to-play">
              <Button size="lg" variant="ghost" className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10">
                How it works
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Categories (5-up)</p>
            <h2 className="text-3xl font-semibold">Pick your arena</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.title} className="border-white/10 bg-white/5 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl text-white">{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-200/80">{category.copy}</CardContent>
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
          <Link href="/beta/how-to-play">
            <Button size="lg" variant="ghost" className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10">
              How it works
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
