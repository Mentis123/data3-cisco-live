import type { ReactNode } from "react";
import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

function Section({ eyebrow, title, description, children }: SectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.75)] sm:p-12">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden="true" />
      <div className="relative space-y-6">
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-xs uppercase tracking-[0.3em] text-primary/80"
          >
            {eyebrow}
          </Badge>
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-pretty text-base text-slate-300 sm:text-lg">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

type TemplatePlaceholderProps = {
  token: string;
};

function TemplatePlaceholder({ token }: TemplatePlaceholderProps) {
  return <code className="font-mono text-primary/90">{`{{${token}}}`}</code>;
}

const passCopyTemplate = (
  <>
    You beat the Bot Bar (<TemplatePlaceholder token="bar" />)! Score <TemplatePlaceholder token="score" />/50 — Raffle entry
    recorded for <TemplatePlaceholder token="date" /> ✅
  </>
);
const failCopyTemplate = (
  <>
    Close! <TemplatePlaceholder token="score" />/50. Add a number + date on your Case Card to qualify next time.
  </>
);
const dailyBannerCopyTemplate = (
  <>
    Today’s draw runs at <TemplatePlaceholder token="time" />. Winner appears here and receives email instructions.
  </>
);

const heroStats = [
  {
    value: "6",
    label: "cards per run",
    detail: "Drop • hint • lock rhythm keeps everyone moving in sync.",
  },
  {
    value: "5",
    label: "official entries/day",
    detail: "One per category with Cisco Live registered emails only.",
  },
  {
    value: "50",
    label: "points in play",
    detail: "30 from flash mastery, 20 from the Case Card dials.",
  },
];

const dojoHighlights = [
  {
    title: "Instant feedback",
    copy: "Every flash-card reveals the rationale immediately so practice runs double as coaching moments.",
  },
  {
    title: "Unlimited restarts",
    copy: "Players can grind categories as much as they like before stepping into the Ring.",
  },
  {
    title: "Expo-first UX",
    copy: "Optimised for kiosks with keyboard shortcuts, large tap targets, and progressive web caching.",
  },
];

const ringHighlights = [
  {
    title: "Email-verified entries",
    copy: "Cisco Live registered emails act as the key. Software enforces one official run per category per day.",
  },
  {
    title: "Raffle automation",
    copy: "Every pass logs a raffle entry with audit-friendly metadata for the daily draw.",
  },
  {
    title: "Elastic Bot Bar",
    copy: "Rolling performance benchmark keeps the challenge spicy while staying attainable for the floor.",
  },
];

const categories = [
  {
    id: "SECURE_CONNECTIVITY",
    emoji: "🛡️",
    title: "Secure Connectivity",
    description: "Zero Trust network access, segmentation and protected applications.",
    units: ["% MFA coverage", "% traffic inspected", "# apps protected"],
  },
  {
    id: "HYBRID_DC",
    emoji: "☁️",
    title: "Hybrid Data Centre",
    description: "Automated infrastructure, hybrid cloud control and platform coverage.",
    units: ["$/workload/month", "% IaC", "% platform coverage"],
  },
  {
    id: "COLLAB_CX",
    emoji: "🎧",
    title: "Collaboration & CX",
    description: "Agent experience, AI assist, CSAT lift and contact centre velocity.",
    units: ["FCR %", "ACW minutes", "CSAT %"],
  },
  {
    id: "OBSERVABILITY",
    emoji: "📈",
    title: "Observability",
    description: "Telemetry quality, golden signals and mean-time-to-resolution wins.",
    units: ["p95 ms", "error budget %", "incidents/week"],
  },
  {
    id: "EDGE_IOT",
    emoji: "📡",
    title: "Edge & IoT",
    description: "Firmware hygiene, device rollouts and latency-sensitive workloads.",
    units: ["on-device latency ms", "firmware coverage %", "devices updated %"],
  },
];

const flashTimeline = [
  {
    time: "0–5s",
    headline: "Drop",
    copy: "One incorrect choice fades while maintaining focus state for accessibility.",
  },
  {
    time: "6–9s",
    headline: "Micro hint",
    copy: "A concise nudge appears beneath the stem to steer without spoiling the answer.",
  },
  {
    time: "10–12s",
    headline: "Auto lock",
    copy: "If the player hasn’t locked a response, the card closes and records a miss.",
  },
];

const dialScores = [
  {
    title: "Clarity",
    details: ["Single sentence framing", "Concrete system or team impacted", "Sponsor-ready language"],
  },
  {
    title: "Impact",
    details: ["Users × minutes × frequency math", "Risk reduction acknowledgement", "Auto bands surface coaching"],
  },
  {
    title: "KPI Strength",
    details: ["SMART-complete", "Baseline, target and due date required", "Dial lights up at ≥3"],
  },
  {
    title: "Execution",
    details: ["Owner role chip", "Milestone and date", "Dependency/risk check", "Action verb present"],
  },
  {
    title: "Confidence",
    details: ["Self-rated 0–2", "Realism cross-check by bot", "Signals ready for follow-up"],
  },
];

const leaderboards = [
  {
    title: "Top Score (Today)",
    copy: "Highest total score per category. Only the best qualifying run per email surfaces.",
  },
  {
    title: "Sharp Shooter",
    copy: "Fastest average answer time on correct cards. Rewards confident mastery.",
  },
  {
    title: "Track Champs",
    copy: "Category champions so booths can spotlight relevant wins in real-time.",
  },
  {
    title: "Most Precise KPI",
    copy: "Top KPI dial, with Impact and time-of-day as tiebreakers for bragging rights.",
  },
];

const raffleFlow = [
  {
    stage: "Qualify",
    detail: "Beat the Bot Bar, complete the KPI triplet and earn a dial score ≥3 to unlock a raffle entry.",
  },
  {
    stage: "Record",
    detail: "Each entry references the attempt, hashed email, and category for auditability.",
  },
  {
    stage: "Draw",
    detail: "Admin triggers the RNG-backed draw, storing the seed, timestamp and operator id.",
  },
  {
    stage: "Celebrate",
    detail: "Winner banner refreshes instantly, while SendGrid (or SES) delivers instructions and follow-up.",
  },
];

const apiSurface = [
  "GET /api/items?category=…",
  "POST /api/attempts/start",
  "POST /api/attempts/answers",
  "POST /api/case-card",
  "POST /api/attempts/score",
  "POST /api/raffle/entry",
  "POST /api/raffle/draw",
  "GET /api/leaderboards?tab=…",
];

const dataHighlights = [
  {
    title: "Attempts",
    copy: "Tracks mode, category, timing, eligibility and Bot Bar snapshot for each run.",
  },
  {
    title: "Answers",
    copy: "Captures reaction time for anti-abuse and Sharp Shooter calculations.",
  },
  {
    title: "Case Cards",
    copy: "Stores KPI triplets, optional impact math and dial scoring breakdowns.",
  },
  {
    title: "Raffle tables",
    copy: "Entries and draws persist with unique indexes to enforce daily limits and auditing.",
  },
  {
    title: "Flash items",
    copy: "Content bank supports daily rotation with difficulty tags and dropIndex validation.",
  },
];

const adminPanels = [
  {
    title: "Raffle cockpit",
    detail: "Shows entries by category, unique players, and the one-click draw workflow.",
  },
  {
    title: "Performance analytics",
    detail: "Charts median scores, pass rate trends, and answer time distributions.",
  },
  {
    title: "Case Card insights",
    detail: "Surfaces favourite metrics, annualised impact and completion percentages for follow-up.",
  },
  {
    title: "Content operations",
    detail: "Manage flash-card banks, activate rotations and review hints/explanations quickly.",
  },
];

const qaChecklist = [
  "Verify 5s/9s/12s triggers across kiosk hardware and laggy Wi-Fi environments.",
  "Ensure dropIndex always maps to an incorrect option even after shuffling choices.",
  "Limit Ring mode to a single official run per category per day per email hash.",
  "Clamp the Elastic Bot Bar between 35 and 42 using the rolling 30-attempt median.",
  "Confirm marketing consent toggles propagate to email sends with unsubscribe controls.",
];

export default function Beta() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050a1a] text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-[-30%] z-0 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.35),_rgba(5,10,26,0.15)_45%,_rgba(5,10,26,0.9))]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[-40%] z-0 h-[600px] bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.3),_rgba(5,10,26,0.25)_55%,_rgba(5,10,26,1))]"
        aria-hidden="true"
      />

      <div className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Badge className="w-fit bg-primary/30 text-white shadow-[0_20px_70px_-40px_rgba(34,197,94,0.8)]">Beta concept</Badge>
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Beat the Bot — Two-Left Tango
            </h1>
            <p className="max-w-3xl text-pretty text-lg text-slate-300">
              Practice in the Dojo, then enter the Ring up to five times per day (once per category). Every qualified win drops
              a raffle entry for the Meta AI Glasses daily draw. This beta preview packages gameplay, scoring, data models and
              admin ops into a single blueprint.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/">
                <Button variant="secondary" className="backdrop-blur">
                  Back to current experience
                </Button>
              </Link>
              <Link href="/play">
                <Button className="shadow-[0_20px_60px_-35px_rgba(34,197,94,0.9)]">Jump into today&apos;s sprint</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent p-6 shadow-[0_35px_120px_-60px_rgba(59,130,246,0.85)] backdrop-blur">
                <div className="text-4xl font-semibold text-primary sm:text-5xl">{stat.value}</div>
                <p className="mt-1 text-sm uppercase tracking-[0.2em] text-slate-200/80">{stat.label}</p>
                <p className="mt-3 text-sm text-slate-200/70">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <Section
          eyebrow="Experience"
          title="Dojo for mastery. Ring for glory."
          description="Two complementary modes make the activation approachable for new visitors while keeping the competitive energy of the expo floor."
        >
          <Tabs defaultValue="ring" className="w-full">
            <TabsList className="w-full justify-start gap-2 overflow-x-auto rounded-full bg-white/5 p-1">
              <TabsTrigger
                value="ring"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Enter the Ring
              </TabsTrigger>
              <TabsTrigger
                value="dojo"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Practice in the Dojo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ring" className="pt-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {ringHighlights.map((highlight) => (
                  <Card key={highlight.title} className="h-full border-white/10 bg-white/[0.06] shadow-[0_25px_80px_-55px_rgba(59,130,246,0.6)] backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl">{highlight.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-300 leading-relaxed">
                      {highlight.copy}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="dojo" className="pt-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {dojoHighlights.map((highlight) => (
                  <Card key={highlight.title} className="h-full border-white/10 bg-white/[0.06] shadow-[0_25px_80px_-55px_rgba(59,130,246,0.6)] backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-xl">{highlight.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-300 leading-relaxed">
                      {highlight.copy}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Section>

        <Section
          eyebrow="Tracks"
          title="Five categories — five daily chances"
          description="Players choose the expertise lane that matches their remit. Units chips remind them how to quantify their wins."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.id} className="border-white/10 bg-white/[0.04] shadow-[0_20px_80px_-60px_rgba(148,163,184,0.45)] backdrop-blur">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="bg-primary/15 text-primary">
                      {category.id}
                    </Badge>
                    <CardTitle className="text-2xl font-semibold">
                      <span className="mr-2 text-2xl" aria-hidden>
                        {category.emoji}
                      </span>
                      {category.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-300">
                  <p>{category.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.units.map((unit) => (
                      <span
                        key={unit}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300"
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Flash-card arc"
          title="Tight 12-second cadence with clarity at every beat"
          description="Six cards per run (2 easy, 3 medium, 1 hard). Answers shuffle but the dropIndex always points to a wrong option even after the shuffle."
        >
          <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            <Card className="border-white/10 bg-gradient-to-br from-white/[0.14] via-white/[0.03] to-transparent shadow-[0_30px_110px_-70px_rgba(192,132,252,0.6)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Why it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <p>
                  Timers run entirely client-side for responsiveness while the API re-validates answer timings on submit.
                  Keyboard shortcuts (1/2/3), Enter to lock, and Esc to skip keep kiosks snappy.
                </p>
                <p>
                  Dojo shows explanations after each card to reinforce the learning loop. Ring mode withholds explanations until
                  after the attempt to preserve the challenge.
                </p>
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3">
              {flashTimeline.map((item) => (
                <Card key={item.time} className="border-white/10 bg-white/[0.04] shadow-[0_20px_80px_-60px_rgba(148,163,184,0.45)] backdrop-blur">
                  <CardHeader className="space-y-2">
                    <Badge variant="outline" className="w-fit border-primary/40 text-xs uppercase tracking-[0.35em]">
                      {item.time}
                    </Badge>
                    <CardTitle className="text-xl">{item.headline}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-300 leading-relaxed">{item.copy}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Case Card"
          title="Five dials lock the plan"
          description="Players commit to a KPI triplet, owner, and milestone. Optional inputs calculate annualised time/cost impact for sales follow-up."
        >
          <div className="grid gap-6 lg:grid-cols-[1.5fr_2fr]">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_80px_-60px_rgba(148,163,184,0.45)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Dial scoring (20 points)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dialScores.map((dial) => (
                  <div key={dial.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-lg font-semibold text-foreground">{dial.title}</div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {dial.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-gradient-to-br from-primary/20 via-transparent to-transparent shadow-[0_30px_100px_-60px_rgba(34,197,94,0.8)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Form moments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <p>
                  Helper chips nudge players toward the right KPI units for each category. Inline copy reminds them that baseline,
                  target and due date are mandatory for eligibility: “You’ll see a score, but only complete Baseline, Target & Due
                  Date makes this an official raffle entry.”
                </p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-foreground font-medium">Optional impact trio</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Users affected</li>
                    <li>• Minutes saved per event</li>
                    <li>• Frequency per week → auto calculates annualised time & cost</li>
                  </ul>
                </div>
                <p>
                  Anti-abuse telemetry tracks paste ratios, edit bursts and dwell time. Suspicious attempts trigger a 20-second
                  human check question; failing the check still logs the attempt but marks it ineligible.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          eyebrow="Scoring"
          title="Elastic Bot Bar keeps the competition honest"
          description="Players see a total out of 50. Flash mastery contributes up to 30 points based on timing; the Case Card dials add 20 more."
        >
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_80px_-60px_rgba(148,163,184,0.45)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Flash-card scoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>
                  ≤5s correct answers are worth <span className="text-foreground font-semibold">6 points</span> each. 6–9 seconds drop
                  to 5 points, 10–12 seconds to 4 points. Missed or unanswered cards score zero.
                </p>
                <p>
                  Average correct time fuels the Sharp Shooter leaderboard and spot-checks for automation abuse.
                </p>
                <Separator className="my-4 bg-white/10" />
                <p className="text-foreground font-medium">Pass copy: {passCopyTemplate}</p>
                <p className="text-foreground font-medium">Fail copy: {failCopyTemplate}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-gradient-to-br from-white/[0.15] via-white/[0.02] to-transparent shadow-[0_30px_120px_-70px_rgba(96,165,250,0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Bot Bar math</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>
                  Recomputed every 15 minutes as the rolling median of the last 30 Ring totals minus two points. The result is
                  clamped between 35 and 42 so the game stays aspirational without feeling out of reach.
                </p>
                <p>
                  Only eligible passes (KPI dial ≥3 with completed triplet) earn raffle entries. The system caps players at five
                  official attempts per day (one per category).
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          eyebrow="Raffle & leaderboards"
          title="Every pass is a celebration"
          description="Leaderboards rotate every 6–8 seconds in expo signage while the raffle panel tracks who’s heading for the Meta AI Glasses."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_80px_-60px_rgba(148,163,184,0.45)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Leaderboards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leaderboards.map((board) => (
                  <div key={board.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-lg font-semibold text-foreground">{board.title}</div>
                    <p className="mt-2 text-sm text-slate-300">{board.copy}</p>
                  </div>
                ))}
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Display format: first name + last initial + company when provided.
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-gradient-to-br from-primary/20 via-transparent to-transparent shadow-[0_30px_100px_-60px_rgba(34,197,94,0.8)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Raffle flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <p>Daily banner copy keeps players informed: {dailyBannerCopyTemplate}</p>
                <ul className="space-y-3">
                  {raffleFlow.map((step) => (
                    <li key={step.stage} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-foreground font-semibold uppercase tracking-[0.2em]">{step.stage}</div>
                      <p className="mt-1 text-sm text-slate-300">{step.detail}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          eyebrow="Platform"
          title="APIs and data model ready for Neon"
          description="The beta build extends the existing PostgreSQL schema and API conventions."
        >
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_80px_-60px_rgba(148,163,184,0.45)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">REST surface</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-slate-300">
                {apiSurface.map((endpoint) => (
                  <div key={endpoint} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{endpoint.split(" ")[0]}</span>
                    <span className="font-mono text-xs sm:text-sm">{endpoint}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-gradient-to-br from-white/[0.15] via-white/[0.02] to-transparent shadow-[0_30px_120px_-70px_rgba(96,165,250,0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Data building blocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                {dataHighlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-foreground font-semibold">{item.title}</div>
                    <p className="mt-1">{item.copy}</p>
                  </div>
                ))}
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  SQL migration scripts live in <code className="font-mono">docs/beta-two-left-tango-schema.sql</code>.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          eyebrow="Operations"
          title="Admin & analytics cockpit"
          description="Extends the current /admin-leaderboard tooling so staff can run the show from a single dashboard."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {adminPanels.map((panel) => (
              <Card key={panel.title} className="border-white/10 bg-white/[0.04] shadow-[0_20px_80px_-60px_rgba(148,163,184,0.45)] backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">{panel.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">{panel.detail}</CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Launch"
          title="QA before we go live"
          description="A tight checklist keeps the showfloor experience bulletproof."
        >
          <Card className="border-white/10 bg-gradient-to-br from-primary/20 via-transparent to-transparent shadow-[0_30px_100px_-60px_rgba(34,197,94,0.8)] backdrop-blur">
            <CardContent className="space-y-3 py-6 text-sm text-slate-300">
              {qaChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section
          eyebrow="Ready?"
          title="Let’s launch the beta together"
          description="From QR posters pointing at /play to the raffle draw email templates, every touchpoint is mapped out above."
        >
          <div className="flex flex-wrap gap-3">
            <Link href="/play">
              <Button className="shadow-[0_20px_60px_-35px_rgba(34,197,94,0.9)]">Preview the current sprint</Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="secondary" className="backdrop-blur">
                See today&apos;s leaders
              </Button>
            </Link>
          </div>
        </Section>
      </main>
    </div>
  );
}

