import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import howitworksFullImage from "@assets/howitworksfull.jpg";
import { triviaCardCategoryMeta, type TriviaCardCategory } from "@/data/triviaCards";
import { cn } from "@/lib/utils";

const categories = (Object.keys(triviaCardCategoryMeta) as TriviaCardCategory[]).map((key) => {
  const meta = triviaCardCategoryMeta[key];
  return {
    id: key,
    title: meta.name,
    copy: meta.blurb,
    accentClass: meta.accent,
  };
});

const triviaTimeline = [
  {
    label: "0s → 5s",
    description: "Maximum points window! All 4 answer options visible.",
    points: "12 points",
    highlight: true,
  },
  {
    label: "5s → 10s",
    description: "Good timing zone. All 4 options still visible.",
    points: "8 points",
    highlight: false,
  },
  {
    label: "10s",
    description: "One wrong option disappears (helpful hint).",
    points: "—",
    highlight: false,
  },
  {
    label: "10s → 15s",
    description: "Final chance! 3 options remain, hint appears at 5s remaining.",
    points: "4 points",
    highlight: false,
  },
  {
    label: "15s",
    description: "Time's up! Question locks.",
    points: "0 points",
    highlight: false,
  },
];

const scoringTiers = [
  { label: "Answer within first 5 seconds", value: "12", gradient: "from-cyan-500 to-blue-500" },
  { label: "Answer between 5-10 seconds", value: "8", gradient: "from-blue-500 to-purple-500" },
  { label: "Answer in final 5 seconds", value: "4", gradient: "from-purple-500 to-pink-500" },
  { label: "Wrong answer or timeout", value: "0", gradient: "from-slate-600 to-slate-700" },
];

export default function HowToPlay() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="space-y-6 text-center">
          <div className="flex justify-center mb-6">
            <img
              src={howitworksFullImage}
              alt="How to Play"
              className="max-h-64 w-auto rounded-2xl object-contain shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/40"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              How to Play
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-2">
                Beat the Bot
              </span>
            </h1>
            <p className="mx-auto max-w-3xl text-pretty text-lg text-slate-200/85 sm:text-xl">
              Choose a category. Answer 5 trivia questions. Pitch your business solution.
              Beat the Bot Bar and earn a raffle entry for Meta AI Glasses!
            </p>
          </div>
        </section>

        {/* Game Modes */}
        <section className="grid gap-6 sm:grid-cols-2">
          <Card className="border-white/10 bg-gradient-to-br from-purple-500/20 via-white/5 to-white/5 backdrop-blur shadow-lg shadow-purple-500/10">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-purple-300/40 text-xs uppercase tracking-[0.3em] text-purple-200">
                Practice Mode
              </Badge>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <i className="fas fa-graduation-cap text-purple-400"></i>
                Dojo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200/85">
              <div className="flex items-start gap-2">
                <i className="fas fa-infinity text-purple-400 mt-1"></i>
                <p>Unlimited plays, perfect for learning</p>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-envelope-open text-purple-400 mt-1"></i>
                <p>No email required</p>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-lightbulb text-purple-400 mt-1"></i>
                <p>See explanations after each trivia question</p>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-stopwatch text-purple-400 mt-1"></i>
                <p>Manual "Continue" button between questions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-white/5 to-white/5 backdrop-blur shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-400/20">
            <CardHeader>
              <Badge variant="outline" className="w-fit border-cyan-300/60 text-xs uppercase tracking-[0.3em] text-cyan-200 bg-cyan-500/20">
                Official Mode
              </Badge>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <i className="fas fa-trophy text-cyan-400"></i>
                Ring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200/85">
              <div className="flex items-start gap-2">
                <i className="fas fa-envelope text-cyan-400 mt-1"></i>
                <p>Cisco Live registered email required</p>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-calendar-check text-cyan-400 mt-1"></i>
                <p>1 official run per day per category (max 5/day)</p>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-bolt text-cyan-400 mt-1"></i>
                <p>Auto-advance between questions (1.4s delay)</p>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-ticket-alt text-cyan-400 mt-1"></i>
                <p>Beat the Bot Bar → Earn raffle entry!</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Step by Step */}
        <section className="space-y-8">
          <div className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70">Step-by-step</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Your Path to Victory</h2>
            <p className="text-slate-200/70">Follow these steps to beat the bot and win</p>
          </div>
          <div className="space-y-8">
            {/* Step 1: Pick Category */}
            <Card className="border-white/10 bg-white/5 backdrop-blur overflow-hidden">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-cyan-300/40 text-xs uppercase tracking-[0.3em] text-cyan-200 mb-2">
                  Step 1
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold">1</span>
                  Choose Your Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-200/85">Pick one of five business challenge categories that matches your expertise or interest:</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                            category.accentClass,
                          )}
                        />
                        <p className="font-semibold text-white">{category.title}</p>
                      </div>
                      <p className="text-xs text-slate-300/70">{category.copy}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Trivia Round */}
            <Card className="border-white/10 bg-white/5 backdrop-blur overflow-hidden">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-blue-300/40 text-xs uppercase tracking-[0.3em] text-blue-200 mb-2">
                  Step 2
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">2</span>
                  Answer 5 Trivia Questions
                </CardTitle>
                <p className="text-sm text-slate-200/80 mt-2">
                  <i className="fas fa-clock text-cyan-400 mr-2"></i>
                  15 seconds per question • 4 answer options (A/B/C/D) • Speed matters!
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scoring Tiers - Featured */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-star text-yellow-400"></i>
                    <p className="text-base font-semibold text-white">Scoring System (per question):</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {scoringTiers.map((tier) => (
                      <div
                        key={tier.label}
                        className={cn(
                          "relative overflow-hidden rounded-xl border px-4 py-4 text-sm",
                          tier.value === "12" && "border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-400/30",
                          tier.value === "8" && "border-blue-400/40 bg-gradient-to-br from-blue-500/15 to-purple-500/15",
                          tier.value === "4" && "border-purple-400/40 bg-gradient-to-br from-purple-500/15 to-pink-500/15",
                          tier.value === "0" && "border-slate-600/40 bg-gradient-to-br from-slate-600/15 to-slate-700/15"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white">{tier.label}</p>
                          <Badge
                            className={cn(
                              "text-base font-bold",
                              tier.value === "12" && "bg-gradient-to-r from-cyan-500 to-blue-500",
                              tier.value === "8" && "bg-gradient-to-r from-blue-500 to-purple-500",
                              tier.value === "4" && "bg-gradient-to-r from-purple-500 to-pink-500",
                              tier.value === "0" && "bg-gradient-to-r from-slate-600 to-slate-700"
                            )}
                          >
                            {tier.value === "0" ? "0" : `+${tier.value}`}
                          </Badge>
                        </div>
                        {tier.value === "12" && (
                          <p className="text-xs text-cyan-200/80 mt-1">
                            <i className="fas fa-bolt mr-1"></i>
                            Maximum points! Answer fast!
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/30">
                    <p className="text-sm text-cyan-100">
                      <i className="fas fa-calculator mr-2 text-cyan-400"></i>
                      <strong>Maximum Trivia Score:</strong> 60 points (5 questions × 12 points)
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-stopwatch text-blue-400"></i>
                    <p className="text-base font-semibold text-white">Timeline (what happens during 15 seconds):</p>
                  </div>
                  <div className="space-y-2">
                    {triviaTimeline.map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                          item.highlight
                            ? "border-cyan-400/40 bg-cyan-500/10"
                            : "border-white/10 bg-white/5"
                        )}
                      >
                        <div className="flex-shrink-0 w-20 font-mono font-bold text-cyan-300">
                          {item.label}
                        </div>
                        <div className="flex-1 text-slate-200/85">{item.description}</div>
                        <div className="flex-shrink-0 w-16 text-right font-semibold text-white">
                          {item.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Pro Tips */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-lightbulb text-yellow-400"></i>
                    <p className="text-sm font-semibold text-white">Pro Tips:</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-sm text-slate-200/85">
                      <i className="fas fa-keyboard text-purple-400 mt-1 flex-shrink-0"></i>
                      <p>Use keyboard: 1/2/3/4 for A/B/C/D, Enter to confirm</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-200/85">
                      <i className="fas fa-eye-slash text-purple-400 mt-1 flex-shrink-0"></i>
                      <p>At 10s: One wrong answer disappears</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-200/85">
                      <i className="fas fa-comment-dots text-purple-400 mt-1 flex-shrink-0"></i>
                      <p>At 5s remaining: Hint appears</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-200/85">
                      <i className="fas fa-book-open text-purple-400 mt-1 flex-shrink-0"></i>
                      <p>Dojo mode: See explanations after each answer</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Project Pitch */}
            <Card className="border-white/10 bg-white/5 backdrop-blur overflow-hidden">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-purple-300/40 text-xs uppercase tracking-[0.3em] text-purple-200 mb-2">
                  Step 3
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white font-bold">3</span>
                  Pitch Your Solution
                </CardTitle>
                <p className="text-sm text-slate-200/80 mt-2">
                  <i className="fas fa-comments text-purple-400 mr-2"></i>
                  AI-guided conversation • 3 simple steps • Worth up to 40 points
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-200/85">
                  After trivia, you'll pitch your business solution through a guided conversation with our AI:
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 text-white text-sm font-bold">
                        1
                      </div>
                      <p className="font-semibold text-white">Problem</p>
                    </div>
                    <p className="text-sm text-slate-200/85">
                      What business challenge are you facing? Be specific about the pain point.
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 text-white text-sm font-bold">
                        2
                      </div>
                      <p className="font-semibold text-white">Impact</p>
                    </div>
                    <p className="text-sm text-slate-200/85">
                      Quantify the consequences: time, cost, people affected, frequency.
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 text-white text-sm font-bold">
                        3
                      </div>
                      <p className="font-semibold text-white">Solution</p>
                    </div>
                    <p className="text-sm text-slate-200/85">
                      Propose a Cisco technology that fits your category and solves the problem.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-robot text-purple-400 text-xl mt-1"></i>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">AI Evaluation Criteria:</p>
                      <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-200/85">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-check-circle text-purple-400"></i>
                          <span>Problem Clarity</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-check-circle text-purple-400"></i>
                          <span>Impact Quantification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-check-circle text-purple-400"></i>
                          <span>Solution Alignment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-check-circle text-purple-400"></i>
                          <span>Technical Fit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-400/30">
                  <p className="text-sm text-purple-100">
                    <i className="fas fa-calculator mr-2 text-purple-400"></i>
                    <strong>Maximum Pitch Score:</strong> 40 points (AI-evaluated)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Score & Bot Bar */}
            <Card className="border-white/10 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/10 backdrop-blur overflow-hidden ring-2 ring-cyan-400/20">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-cyan-300/60 text-xs uppercase tracking-[0.3em] text-cyan-200 mb-2 bg-cyan-500/20">
                  Step 4
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold">4</span>
                  Beat the Bot Bar!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/40">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-calculator text-cyan-400 text-2xl"></i>
                      <p className="font-semibold text-white">Final Score</p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-200/85">
                      <div className="flex justify-between items-center">
                        <span>Trivia Score:</span>
                        <span className="font-bold text-white">/60</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pitch Score:</span>
                        <span className="font-bold text-white">/40</span>
                      </div>
                      <Separator className="bg-white/20" />
                      <div className="flex justify-between items-center text-base">
                        <span className="font-semibold text-white">Total Score:</span>
                        <span className="font-bold text-cyan-300 text-xl">/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/40">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-robot text-yellow-400 text-2xl"></i>
                      <p className="font-semibold text-white">The Bot Bar</p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-200/85">
                      <p>Dynamic daily threshold per category</p>
                      <p className="text-xs text-slate-300/70">
                        (Default: 60 points if no data yet)
                      </p>
                      <div className="mt-3 p-2 rounded-lg bg-yellow-500/20 border border-yellow-400/30">
                        <p className="text-sm font-semibold text-white">
                          <i className="fas fa-trophy text-yellow-400 mr-2"></i>
                          Score ≥ Bot Bar = Raffle Entry!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/40">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-check-circle text-green-400 text-2xl"></i>
                    <div>
                      <p className="font-semibold text-white mb-2">Win Conditions:</p>
                      <ul className="space-y-1 text-sm text-slate-200/85">
                        <li className="flex items-center gap-2">
                          <i className="fas fa-caret-right text-green-400"></i>
                          Total Score ≥ Bot Bar threshold
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-caret-right text-green-400"></i>
                          Cisco Live registered email used
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-caret-right text-green-400"></i>
                          Complete all 3 pitch steps
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Raffle & Prizes */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-white/5 backdrop-blur shadow-lg shadow-yellow-500/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-gift text-yellow-400 text-3xl"></i>
                <CardTitle className="text-2xl sm:text-3xl text-white">Raffle & Prizes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/50">
                <p className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <i className="fas fa-glasses"></i>
                  Meta AI Glasses
                </p>
                <p className="text-sm text-slate-200/85">One pair awarded each day via random draw</p>
              </div>
              <div className="space-y-2 text-sm text-slate-200/85">
                <div className="flex items-start gap-2">
                  <i className="fas fa-ticket-alt text-yellow-400 mt-1"></i>
                  <p>Every win (beat the Bot Bar) = 1 raffle entry</p>
                </div>
                <div className="flex items-start gap-2">
                  <i className="fas fa-calendar-day text-yellow-400 mt-1"></i>
                  <p>Up to 5 entries per day (one per category)</p>
                </div>
                <div className="flex items-start gap-2">
                  <i className="fas fa-random text-yellow-400 mt-1"></i>
                  <p>Winner selected randomly by the system each day</p>
                </div>
                <div className="flex items-start gap-2">
                  <i className="fas fa-trophy text-yellow-400 mt-1"></i>
                  <p>More wins = more chances to win!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-white/5 backdrop-blur shadow-lg shadow-cyan-500/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-trophy text-cyan-400 text-3xl"></i>
                <CardTitle className="text-2xl sm:text-3xl text-white">Live Leaderboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200/85">
              <p className="text-base text-white mb-3">
                See where you rank in real-time! The leaderboard displays:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <i className="fas fa-medal text-yellow-400 mt-1"></i>
                  <p><strong className="text-white">Top 10 Scores</strong> - Overall rankings</p>
                </div>
                <div className="flex items-start gap-2">
                  <i className="fas fa-bolt text-cyan-400 mt-1"></i>
                  <p><strong className="text-white">Sharp Shooters</strong> - Fastest accurate answers</p>
                </div>
                <div className="flex items-start gap-2">
                  <i className="fas fa-crown text-purple-400 mt-1"></i>
                  <p><strong className="text-white">Category Champions</strong> - Top score per category</p>
                </div>
                <div className="flex items-start gap-2">
                  <i className="fas fa-sync text-blue-400 mt-1"></i>
                  <p><strong className="text-white">Real-time Updates</strong> - Refreshes every 5 seconds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tips & FAQ */}
        <section>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-lightbulb text-yellow-400 text-3xl"></i>
                <CardTitle className="text-2xl sm:text-3xl text-white">Pro Tips for Success</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-bolt text-cyan-400"></i>
                    <p className="font-semibold text-white">Speed Matters</p>
                  </div>
                  <p className="text-sm text-slate-200/85">
                    Answer in the first 5 seconds for maximum 12 points per question!
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-purple-400/30 bg-purple-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-keyboard text-purple-400"></i>
                    <p className="font-semibold text-white">Use Keyboard</p>
                  </div>
                  <p className="text-sm text-slate-200/85">
                    Keys 1/2/3/4 for A/B/C/D, Enter to confirm. Faster than clicking!
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <p className="font-semibold text-white">Wait for Hints</p>
                  </div>
                  <p className="text-sm text-slate-200/85">
                    Not sure? Wait for the wrong answer to drop at 10s, or hint at 5s remaining.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-green-400/30 bg-green-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-chart-line text-green-400"></i>
                    <p className="font-semibold text-white">Quantify Impact</p>
                  </div>
                  <p className="text-sm text-slate-200/85">
                    Use numbers! "Saves 2 hours/day for 50 people" beats "saves time."
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-blue-400/30 bg-blue-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-bullseye text-blue-400"></i>
                    <p className="font-semibold text-white">Match Category</p>
                  </div>
                  <p className="text-sm text-slate-200/85">
                    Align your solution with your chosen category for better AI scoring.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-pink-400/30 bg-pink-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-graduation-cap text-pink-400"></i>
                    <p className="font-semibold text-white">Practice First</p>
                  </div>
                  <p className="text-sm text-slate-200/85">
                    Try Dojo mode with unlimited plays to learn the timing and format!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold sm:text-4xl">Ready to Play?</h2>
            <p className="text-slate-200/70">Choose your path and start competing!</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            <Link href="/play" className="group">
              <Card className="border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-white/5 backdrop-blur shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-400/30 hover:shadow-cyan-500/40 transition-all duration-300 group-hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500">
                        <i className="fas fa-trophy text-white text-xl"></i>
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-white">Enter the Ring</CardTitle>
                        <p className="text-sm text-cyan-200/80 mt-1">Official competition mode</p>
                      </div>
                    </div>
                    <i className="fas fa-arrow-right text-cyan-400 text-xl group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-slate-200/85 space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-cyan-400"></i>
                    <span>Compete for raffle entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-cyan-400"></i>
                    <span>1 attempt per day per category</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-cyan-400"></i>
                    <span>Appear on live leaderboard</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dojo/trivia-cards" className="group">
              <Card className="border-purple-400/40 bg-gradient-to-br from-purple-500/20 via-white/5 to-white/5 backdrop-blur shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 group-hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
                        <i className="fas fa-graduation-cap text-white text-xl"></i>
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-white">Practice in Dojo</CardTitle>
                        <p className="text-sm text-purple-200/80 mt-1">Learn and improve</p>
                      </div>
                    </div>
                    <i className="fas fa-arrow-right text-purple-400 text-xl group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-slate-200/85 space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-purple-400"></i>
                    <span>Unlimited practice attempts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-purple-400"></i>
                    <span>See explanations after answers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-purple-400"></i>
                    <span>Perfect for learning</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
            <Link href="/leaderboard">
              <Button size="lg" variant="outline" className="w-full border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10">
                <i className="fas fa-trophy mr-2"></i>
                View Leaderboard
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="ghost" className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10">
                <i className="fas fa-home mr-2"></i>
                Back to Home
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
