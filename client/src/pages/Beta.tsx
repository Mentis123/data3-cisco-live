import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "SECURE_CONNECTIVITY",
    label: "Secure Connectivity",
    description: "Zero Trust, segmentation, and secure access outcomes.",
    unitChips: ["% MFA coverage", "% traffic inspected", "# apps protected"],
  },
  {
    id: "HYBRID_DC",
    label: "Hybrid Data Centre",
    description: "Platform automation, infrastructure coverage, hybrid control.",
    unitChips: ["$/workload/month", "% IaC", "% platform coverage"],
  },
  {
    id: "COLLAB_CX",
    label: "Collab & CX",
    description: "Customer experience, agent efficiency, and automation outcomes.",
    unitChips: ["FCR %", "ACW minutes", "CSAT %"],
  },
  {
    id: "OBSERVABILITY",
    label: "Observability",
    description: "Telemetry quality, incident response, and error budgets.",
    unitChips: ["p95 ms", "error budget %", "incidents/week"],
  },
  {
    id: "EDGE_IOT",
    label: "Edge & IoT",
    description: "Device coverage, firmware hygiene, and latency gains.",
    unitChips: ["on-device latency ms", "firmware coverage %", "devices updated %"],
  },
];

const dialScores = [
  {
    title: "Clarity",
    description:
      "Single-sentence problem framing with a tangible system or context. " +
      "Earn the full 4 points by making the pain obvious to a sponsor.",
  },
  {
    title: "Impact",
    description:
      "Automatic scoring from the users × minutes × frequency inputs or documented risk reduction bands.",
  },
  {
    title: "KPI Strength",
    description:
      "SMART alignment (Specific, Measurable, Achievable, Relevant, Time-bound) up to 4 points.",
  },
  {
    title: "Execution",
    description:
      "Owner role, milestone, dependency/risk, and action verbs combine for the execution dial.",
  },
  {
    title: "Confidence",
    description:
      "Self-rating plus realism cross-check to keep the commitment grounded in reality.",
  },
];

const leaderboards = [
  {
    title: "Top Score (Today)",
    description: "Highest total score per category. Only the best run per email counts.",
  },
  {
    title: "Sharp Shooter",
    description: "Fastest average time on correct flash-card answers amongst eligible passes.",
  },
  {
    title: "Track Champs",
    description: "Category leaders across the five Cisco Live tracks.",
  },
  {
    title: "Most Precise KPI",
    description: "Largest KPI dial with impact and speed tie-breakers.",
  },
];

const flashCardTimeline = [
  {
    time: "5s",
    title: "Drop",
    description: "One incorrect choice fades automatically. Choices reflow without losing keyboard focus.",
  },
  {
    time: "9s",
    title: "Hint",
    description: "Micro hint appears beneath the stem for gentle guidance in the Ring and Dojo alike.",
  },
  {
    time: "12s",
    title: "Lock",
    description: "Card auto-submits. No answer recorded counts as incorrect for scoring.",
  },
];

const apiSurface = [
  "GET /api/items?category=…",
  "POST /api/attempts/start",
  "POST /api/attempts/answers",
  "POST /api/case-card",
  "POST /api/attempts/score",
  "POST /api/raffle/entry",
  "POST /api/raffle/draw (admin)",
  "GET /api/leaderboards?tab=…",
];

const antiAbuseSignals = [
  "Turnstile or equivalent challenge on official runs.",
  "Paste-vs-type ratio and burst edits tracked for eligibility gating.",
  "Human check question when behaviour looks automated (20 seconds, paste disabled).",
];

export default function Beta() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-gradient-to-b from-background via-background/80 to-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <Badge variant="outline" className="mb-4 uppercase tracking-widest">Beta Preview</Badge>
          <h1 className="text-balance text-4xl sm:text-5xl font-semibold leading-tight mb-4">
            Beat the Bot — Two-Left Tango
          </h1>
          <p className="text-pretty text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl">
            Practice in the Dojo, then enter the Ring up to five times per day (once per category). Every qualified win drops a
            raffle entry for the Meta AI Glasses daily draw. This beta spec shows how the next evolution of the Cisco Solution
            Sprint comes together.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="secondary">Back to current experience</Button>
            </Link>
            <Link href="/play">
              <Button>Jump into today&apos;s sprint</Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-muted-foreground/10 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl">Two game modes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground">Dojo (Practice)</h3>
                <p>Unlimited runs without email, with instant explanations after each flash-card.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ring (Official)</h3>
                <p>
                  Requires Cisco Live registered email at submit, limited to one official run per category per day. Qualified
                  passes deliver a raffle entry.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Five daily categories</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {categories.map((category) => (
                <div key={category.id} className="rounded-lg border border-border/60 p-4 bg-background/80">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg">{category.label}</h3>
                    <Badge variant="secondary" className="uppercase tracking-wide text-xs">
                      {category.id}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-1">{category.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.unitChips.map((chip) => (
                      <span key={chip} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Flash-card rhythm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Six cards per run (2 easy, 3 medium, 1 hard) with answer shuffling. Keyboard shortcuts (1/2/3) and Enter keep the
                pace moving on mobile kiosks.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {flashCardTimeline.map((step) => (
                  <div key={step.time} className="rounded-lg border border-border/60 p-4 bg-muted/30">
                    <div className="text-sm font-semibold text-primary mb-2">{step.time}</div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Case Card capture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Players lock a single problem statement, KPI triplet, owner role, and first milestone. Optional impact fields compute
                annualised time/cost savings automatically.
              </p>
              <p className="border-l-2 border-primary/60 pl-3 text-sm">
                Eligibility reminder: “You’ll see a score, but only complete Baseline, Target & Due Date makes this an official
                raffle entry.”
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Dial scoring (20 points)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {dialScores.map((dial) => (
                <div key={dial.title} className="rounded-lg border border-border/60 p-4 bg-background/80">
                  <h3 className="font-semibold text-lg mb-1">{dial.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{dial.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/10 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl">Scoring & Bot Bar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Flash-cards contribute up to 30 points based on speed and correctness. The Elastic Bot Bar recalculates every 15
                minutes as the rolling median of the last 30 Ring totals minus 2 (clamped to 35–42).
              </p>
              <p>
                Pass status requires meeting the Bot Bar, completing the KPI triplet, and landing a KPI dial score of 3 or higher.
              </p>
              <p className="text-foreground font-medium">
                Pass copy: “You beat the Bot Bar ({{bar}})! Score {{score}}/50 — Raffle entry recorded for {{date}} ✅”
              </p>
              <p className="text-foreground font-medium">
                Fail copy: “Close! {{score}}/50. Add a number + date on your Case Card to qualify next time.”
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Raffle engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Each eligible pass (max one per category per day) records a raffle entry. The admin dashboard triggers the daily draw
                with a stored RNG seed, timestamp, and admin identifier.
              </p>
              <p>
                A draw announcement banner shows “Today’s draw runs at {{time}}. Winner appears here and receives email instructions.”
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Leaderboards</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {leaderboards.map((board) => (
                <div key={board.title} className="rounded-lg border border-border/60 p-4 bg-background/80">
                  <h3 className="font-semibold text-lg mb-1">{board.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{board.description}</p>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Leaderboard carousel rotates every 6–8 seconds. Entries surface the first name, last initial, and company when
                supplied.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-muted-foreground/10 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl">API surface area</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {apiSurface.map((endpoint) => (
                <div key={endpoint} className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-xs font-semibold">
                    {endpoint.startsWith("GET") ? "GET" : endpoint.startsWith("POST") ? "POST" : "API"}
                  </span>
                  <span className="font-mono text-xs sm:text-sm">{endpoint}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Anti-abuse guardrails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {antiAbuseSignals.map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 text-primary">
                    <i className="fas fa-shield-alt" aria-hidden="true"></i>
                  </span>
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground/80">
                Failed human checks still log the attempt but mark it ineligible for leaderboards and raffle entries.
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-2xl">Admin & analytics expansion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                The existing /admin-leaderboard area grows to include raffle metrics, draw controls, category trends, and Case Card
                insights. Charts reuse the current component library.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 text-sm">
                <li className="rounded-lg border border-border/60 bg-background/80 p-4">
                  <span className="font-semibold text-foreground block mb-1">Raffle panel</span>
                  <span>View total entries, unique emails, per-category counts, and run the daily draw with audit logging.</span>
                </li>
                <li className="rounded-lg border border-border/60 bg-background/80 p-4">
                  <span className="font-semibold text-foreground block mb-1">Performance trends</span>
                  <span>Track attempts, pass rates, rolling medians, and average flash-card timings.</span>
                </li>
                <li className="rounded-lg border border-border/60 bg-background/80 p-4">
                  <span className="font-semibold text-foreground block mb-1">Case Card insights</span>
                  <span>Surface completion rates, top metrics, and annualised impact to guide follow-up.</span>
                </li>
                <li className="rounded-lg border border-border/60 bg-background/80 p-4">
                  <span className="font-semibold text-foreground block mb-1">Content operations</span>
                  <span>Manage flash-item banks (60–100/category) with active flags for daily rotations.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-muted-foreground/10 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl">Launch checklist highlights</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="mt-1 text-primary"><i className="fas fa-clock" aria-hidden="true"></i></span>
                <p>Verify the 5/9/12 second triggers stay precise on kiosk hardware.</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 text-primary"><i className="fas fa-random" aria-hidden="true"></i></span>
                <p>Ensure dropIndex maps to the intended wrong answer after shuffling.</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 text-primary"><i className="fas fa-balance-scale" aria-hidden="true"></i></span>
                <p>Clamp the Elastic Bot Bar between 35 and 42 and enforce category/day limits per email.</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 text-primary"><i className="fas fa-envelope-open-text" aria-hidden="true"></i></span>
                <p>Email the winner with unsubscribe controls when marketing consent is ticked.</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 text-primary"><i className="fas fa-qrcode" aria-hidden="true"></i></span>
                <p>QR codes point to /play with Dojo vs. Ring toggles, ready for expo floor traffic.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
