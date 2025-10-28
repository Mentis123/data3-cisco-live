import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { triviaCardCategoryMeta, type TriviaCardCategory } from "@/data/triviaCards";
import { cn } from "@/lib/utils";
import { Data3Logo } from "@/components/Data3Logo";
import ringImage from "@assets/ringfull.jpg";
import dojoImage from "@assets/dojofull.jpg";
import leaderboardImage from "@assets/leaderboardfull.jpg";
import howitworksImage from "@assets/howitworksfull.jpg";

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
    title: "Answer 5 trivia questions in your chosen category",
    bullets: [
      "15 seconds per question",
      "After 5 seconds (at 10s remaining): one wrong option drops",
      "After 10 seconds (at 5s remaining): a hint appears",
    ],
  },
  {
    title: "Submit your Case Card",
    bullets: [
      "One-line problem",
      "Baseline / Target / Due date + Owner & first milestone",
    ],
  },
  {
    title: "Beat the Bot → Earn a raffle entry",
    bullets: [
      "If your Total /100 clears today's Bot Bar, we record a raffle entry for today's draw",
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
    copy: "Every win = 1 raffle entry for today's random draw (software-picked).",
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

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-36 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <section className="space-y-8 text-center">
          {/* Data#3 Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/Data3_Logo_Blue_Blue_Boxed-01.png"
              alt="Data#3"
              className="h-16 w-auto sm:h-20 md:h-24"
              style={{ minWidth: '72px' }}
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl text-data3-white">
              Beat the Bot
            </h1>
            <p className="text-xl text-data3-pale-blue font-light tracking-wide">
              Delivering the Digital Future
            </p>
            <p className="mx-auto max-w-3xl text-pretty text-base sm:text-lg text-data3-white/90">
              Practice in the Dojo. Enter the Ring up to 5× per day (once per category). Every win is a raffle entry for today's Meta AI Glasses.
            </p>
          </div>
          <div className="mx-auto grid w-full max-w-2xl gap-4 sm:gap-5 sm:grid-cols-2">
            <Link href="/play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-blue/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-light-blue/40 group-hover:shadow-[0_0_30px_rgba(0,174,255,0.3)]">
                <div className="relative aspect-square">
                  <img src={ringImage} alt="Enter the Ring" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-br from-data3-blue-black/50 to-data3-blue-black/70" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-data3-pale-blue font-semibold">Play</span>
                    <span className="text-lg sm:text-xl font-bold text-data3-white">Enter the Ring</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dojo/trivia-cards" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-cool-purple/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-cool-purple/40 group-hover:shadow-[0_0_30px_rgba(115,0,255,0.3)]">
                <div className="relative aspect-square">
                  <img src={dojoImage} alt="Practice in Dojo" className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-300 group-hover:opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-br from-data3-blue-black/40 to-data3-blue-black/60" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-sm sm:text-base uppercase tracking-[0.3em] text-data3-cool-lilac font-semibold">Practice</span>
                    <span className="text-2xl sm:text-3xl font-bold text-data3-white">Practice in Dojo</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/how-to-play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-light-blue/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-aqua/40 group-hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                <div className="relative aspect-square">
                  <img src={leaderboardImage} alt="How it works" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-br from-data3-blue-black/50 to-data3-blue-black/70" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-data3-aqua/90 font-semibold">Learn</span>
                    <span className="text-lg sm:text-xl font-bold text-data3-white">How it works</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/leaderboard" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-magenta/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-magenta/40 group-hover:shadow-[0_0_30px_rgba(255,0,255,0.3)]">
                <div className="relative aspect-square">
                  <img src={howitworksImage} alt="View Leaderboard" className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-br from-data3-blue-black/50 to-data3-blue-black/70" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-data3-magenta/90 font-semibold">Standings</span>
                    <span className="text-lg sm:text-xl font-bold text-data3-white">View Leaderboard</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2 text-center">
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

        {/* Data#3 Branded Footer */}
        <footer className="border-t border-data3-pale-blue/20 pt-12 mt-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/Data3_Logo_Blue_Blue_Boxed-01.png"
                  alt="Data#3"
                  className="h-12 w-auto"
                />
                <Link href="/admin">
                  <button
                    className="px-2 py-1 text-transparent transition-colors hover:text-muted-foreground/10"
                    aria-label="Admin"
                    data-testid="button-secret-admin"
                  >
                    •
                  </button>
                </Link>
              </div>
              <p className="text-sm text-data3-pale-blue">
                <Data3Logo className="font-semibold" /> - Delivering the Digital Future
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-data3-light-blue font-bold text-sm uppercase tracking-wider">
                About <Data3Logo />
              </h4>
              <p className="text-sm text-data3-white/80 leading-relaxed">
                With 45+ years of experience, <Data3Logo className="font-semibold" /> is a leading Australian IT services provider focused on helping customers harness the power of people and technology for a better future.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-data3-light-blue font-bold text-sm uppercase tracking-wider">
                Learn More
              </h4>
              <a
                href="https://www.data3.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-data3-pale-blue hover:text-data3-light-blue transition-colors underline underline-offset-4"
              >
                www.data3.com
              </a>
              <p className="text-xs text-data3-grey mt-4">
                Grounded in Experience • Ever-Evolving • Human First
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-data3-pale-blue/10 text-center">
            <p className="text-sm text-data3-grey">
              © {new Date().getFullYear()} <Data3Logo className="font-semibold" />. Experience powered by <Data3Logo className="font-semibold" />.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
