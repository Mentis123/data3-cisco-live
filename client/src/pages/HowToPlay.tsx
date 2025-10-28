import { useEffect } from "react";
import { Link } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6 self-start text-left">
          <img
            src="/Data3_Logo_Blue_Blue_Boxed-01.png"
            alt="Data#3"
            className="h-12 w-auto sm:h-16 md:h-20"
            style={{ minWidth: "60px" }}
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-data3-white">
            Delivering the Digital Future
          </h1>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl shadow-cyan-500/20 ring-2 ring-cyan-400/20 sm:h-32 sm:w-32">
              <img
                src={howitworksFullImage}
                alt="How it works"
                className="h-full w-full object-cover"
              />
            </div>
            <Badge className="mt-2 h-fit rounded-full bg-emerald-400/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Learn
            </Badge>
          </div>
          <div className="space-y-4 text-left sm:max-w-2xl">
            <h2 className="text-4xl font-semibold sm:text-5xl">How to Play – Beat the Bot</h2>
            <p className="text-base text-data3-white/80 sm:text-lg">
              Choose a category, race through 5 trivia questions, and pitch your solution. Beat the Bot Bar to earn raffle entries for Meta AI Glasses and climb the live leaderboard.
            </p>
          </div>
        </div>

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
            <CardContent className="space-y-3 text-sm text-data3-white/85">
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
            <CardContent className="space-y-3 text-sm text-data3-white/85">
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


        {/* Playbook accordion */}
        <section className="space-y-6">
          <div className="space-y-3 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70">Playbook</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Open the moves when you're ready</h2>
            <p className="text-data3-white/70 max-w-3xl">
              Each accordion unlocks another part of the Cisco Solution Sprint experience—from picking a category to checking the leaderboard.
            </p>
          </div>

          <Accordion type="multiple" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            <AccordionItem value="step-1" className="border-b border-white/10 last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge variant="outline" className="border-cyan-300/50 bg-cyan-500/10 text-xs uppercase tracking-[0.3em] text-cyan-200">
                    Step 1
                  </Badge>
                  <span>Choose your category</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="space-y-4 text-sm text-data3-white/85">
                  <p className="text-base">
                    Pick one of five business challenge categories that match your expertise or curiosity. Your trivia and pitch will both use this track.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10"
                      >
                        <div className="mb-2 flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                              category.accentClass,
                            )}
                          />
                          <p className="font-semibold text-white">{category.title}</p>
                        </div>
                        <p className="text-xs text-data3-white/70">{category.copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2" className="border-b border-white/10 last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="border-blue-300/50 bg-blue-500/10 px-3 text-xs uppercase tracking-[0.2em] text-blue-200 whitespace-nowrap"
                  >
                    Step 2
                  </Badge>
                  <span>Answer 5 trivia questions</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="space-y-6 text-data3-white/85">
                  <p className="text-sm sm:text-base">
                    <i className="fas fa-clock text-cyan-400 mr-2"></i>
                    15 seconds per question · 4 answer options · keyboard shortcuts (1-4 + Enter) keep you fast.
                  </p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-star text-yellow-400"></i>
                        <p className="text-base font-semibold text-white">Scoring tiers per question</p>
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
                            <div className="mb-1 flex items-center justify-between">
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
                              <p className="mt-1 text-xs text-cyan-200/80">
                                <i className="fas fa-bolt mr-1"></i>
                                Maximum points! Answer fast!
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                        <i className="fas fa-calculator mr-2 text-cyan-400"></i>
                        <strong>Maximum trivia score:</strong> 60 points (5 × 12)
                      </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-stopwatch text-blue-400"></i>
                        <p className="text-base font-semibold text-white">What happens during the countdown</p>
                      </div>
                      <div className="space-y-2">
                        {triviaTimeline.map((item) => (
                          <div
                            key={item.label}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                              item.highlight ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/5"
                            )}
                          >
                            <div className="w-20 flex-shrink-0 font-mono font-bold text-cyan-300">{item.label}</div>
                            <div className="flex-1">{item.description}</div>
                            <div className="w-16 flex-shrink-0 text-right font-semibold text-white">{item.points}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3" className="border-b border-white/10 last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge variant="outline" className="border-purple-300/50 bg-purple-500/10 text-xs uppercase tracking-[0.3em] text-purple-200">
                    Step 3
                  </Badge>
                  <span>Pitch your solution</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="space-y-6 text-data3-white/85">
                  <p className="text-base">
                    After trivia, the AI coach guides a three-part conversation. Nail each prompt to maximise the 40-point pitch score.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 text-sm font-bold text-white">1</div>
                        <p className="font-semibold text-white">Problem</p>
                      </div>
                      <p className="text-sm">
                        Spell out the pain point. Who is affected? How often? What breaks when it fails?
                      </p>
                    </div>
                    <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 text-sm font-bold text-white">2</div>
                        <p className="font-semibold text-white">Impact</p>
                      </div>
                      <p className="text-sm">
                        Quantify time, cost, headcount, or risk. Numbers prove the value of your fix.
                      </p>
                    </div>
                    <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 text-sm font-bold text-white">3</div>
                        <p className="font-semibold text-white">Solution</p>
                      </div>
                      <p className="text-sm">
                        Propose a Cisco technology from <span className="font-semibold text-white">your trivia category</span>. The coach keeps you aligned if you drift.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-400/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-robot text-purple-400 text-xl"></i>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-white">AI scoring checklist</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-check-circle text-purple-400"></i>
                            <span>Problem clarity</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="fas fa-check-circle text-purple-400"></i>
                            <span>Impact quantification</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="fas fa-check-circle text-purple-400"></i>
                            <span>Solution alignment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="fas fa-check-circle text-purple-400"></i>
                            <span>Technical fit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-400/30 bg-purple-500/10 p-3 text-sm text-purple-100">
                    <i className="fas fa-calculator mr-2 text-purple-400"></i>
                    <strong>Maximum pitch score:</strong> 40 points
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4" className="border-b border-white/10 last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge variant="outline" className="border-cyan-300/60 bg-cyan-500/10 text-xs uppercase tracking-[0.3em] text-cyan-200">
                    Step 4
                  </Badge>
                  <span>Beat the Bot Bar</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="space-y-6 text-data3-white/85">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <i className="fas fa-calculator text-cyan-300 text-2xl"></i>
                        <p className="font-semibold text-white">Final scoring breakdown</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Trivia score</span>
                          <span className="font-bold text-white">/60</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Pitch score</span>
                          <span className="font-bold text-white">/40</span>
                        </div>
                        <Separator className="bg-white/20" />
                        <div className="flex items-center justify-between text-base">
                          <span className="font-semibold text-white">Total score</span>
                          <span className="text-xl font-bold text-cyan-200">/100</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-yellow-400/40 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <i className="fas fa-robot text-yellow-300 text-2xl"></i>
                        <p className="font-semibold text-white">Meet the Bot Bar</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>Dynamic daily threshold per category (default 60 if no data yet).</p>
                        <div className="rounded-lg border border-yellow-400/30 bg-yellow-500/20 p-2 text-sm font-semibold text-white">
                          <i className="fas fa-trophy mr-2 text-yellow-300"></i>
                          Score ≥ Bot Bar = raffle entry!
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-green-400/40 bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-4">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-check-circle text-green-300 text-2xl"></i>
                      <div>
                        <p className="font-semibold text-white mb-2">Win conditions</p>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <i className="fas fa-caret-right text-green-300"></i>
                            Total score ≥ Bot Bar threshold
                          </li>
                          <li className="flex items-center gap-2">
                            <i className="fas fa-caret-right text-green-300"></i>
                            Cisco Live registered email submitted
                          </li>
                          <li className="flex items-center gap-2">
                            <i className="fas fa-caret-right text-green-300"></i>
                            Complete all three pitch prompts
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="raffle" className="border-b border-white/10 last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge variant="outline" className="border-yellow-300/60 bg-yellow-500/10 text-xs uppercase tracking-[0.3em] text-yellow-200">
                    Raffle
                  </Badge>
                  <span>Raffle &amp; prizes</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-white/5 p-6 text-sm text-data3-white/85">
                  <div className="mb-4 flex items-center gap-3 text-white">
                    <i className="fas fa-gift text-yellow-300 text-3xl"></i>
                    <p className="text-2xl font-semibold">Meta AI Glasses up for grabs daily</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-yellow-400/40 bg-yellow-500/20 p-4">
                      <p className="font-semibold text-white mb-2">How entries work</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <i className="fas fa-ticket-alt text-yellow-300"></i>
                          Beat the Bot Bar = 1 raffle ticket
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-calendar-day text-yellow-300"></i>
                          Up to 5 entries per day (one per category)
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-random text-yellow-300"></i>
                          Daily winner selected automatically
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-yellow-400/40 bg-yellow-500/20 p-4">
                      <p className="font-semibold text-white mb-2">Claiming your prize</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <i className="fas fa-bullhorn text-yellow-300"></i>
                          Winners notified on-site by the Data#3 team
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-id-badge text-yellow-300"></i>
                          Bring your Cisco Live badge to verify
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-map-marker-alt text-yellow-300"></i>
                          Collect at the Data#3 stand before the day ends
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="leaderboard" className="border-b border-white/10 last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge variant="outline" className="border-pink-300/60 bg-pink-500/10 text-xs uppercase tracking-[0.3em] text-pink-200">
                    Live
                  </Badge>
                  <span>Live leaderboard</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="rounded-2xl border border-pink-400/40 bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-white/5 p-6 text-sm text-data3-white/85">
                  <div className="mb-4 flex items-center gap-3 text-white">
                    <i className="fas fa-chart-line text-pink-300 text-3xl"></i>
                    <p className="text-2xl font-semibold">See how you rank in real time</p>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <i className="fas fa-signal text-pink-300 mt-1"></i>
                      <span>Scores post instantly after each official run—watch the Bot Bar move as the day progresses.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fas fa-users text-pink-300 mt-1"></i>
                      <span>Filter by category on the leaderboard page to see where you stand versus your peers.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fas fa-bell text-pink-300 mt-1"></i>
                      <span>Top performers get shout-outs from the Data#3 team on the show floor.</span>
                    </li>
                  </ul>
                  <div className="mt-4">
                    <Link href="/leaderboard">
                      <Button size="sm" variant="secondary" className="border border-pink-400/40 bg-white/10 text-white hover:bg-white/20">
                        View live leaderboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pro-tips" className="border-b border-white/10 last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="border-emerald-300/60 bg-emerald-500/10 px-3 text-xs uppercase tracking-[0.2em] text-emerald-200 whitespace-nowrap"
                  >
                    Pro tips
                  </Badge>
                  <span>Quick ways to gain an edge</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm text-data3-white/85">
                  <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <i className="fas fa-bolt text-cyan-400"></i>
                      <p className="font-semibold text-white">Speed matters</p>
                    </div>
                    <p>Answer in the first 5 seconds for a 12-point bonus each time.</p>
                  </div>
                  <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <i className="fas fa-keyboard text-purple-400"></i>
                      <p className="font-semibold text-white">Use the keyboard</p>
                    </div>
                    <p>Keys 1/2/3/4 for A/B/C/D + Enter to lock in faster than clicking.</p>
                  </div>
                  <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <i className="fas fa-clock text-yellow-400"></i>
                      <p className="font-semibold text-white">Watch the timer</p>
                    </div>
                    <p>One wrong answer disappears at 10s and a hint appears with 5s left.</p>
                  </div>
                  <div className="rounded-xl border border-green-400/30 bg-green-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <i className="fas fa-chart-line text-green-400"></i>
                      <p className="font-semibold text-white">Quantify impact</p>
                    </div>
                    <p>Concrete numbers like "Saves 2 hours/day for 50 people" impress the scorer.</p>
                  </div>
                  <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <i className="fas fa-bullseye text-blue-400"></i>
                      <p className="font-semibold text-white">Match the category</p>
                    </div>
                    <p>Your pitch must stay inside the technology track you selected in Step 1.</p>
                  </div>
                  <div className="rounded-xl border border-pink-400/30 bg-pink-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <i className="fas fa-graduation-cap text-pink-400"></i>
                      <p className="font-semibold text-white">Warm up in the dojo</p>
                    </div>
                    <p>Unlimited practice runs with explanations help you get the rhythm before going official.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq" className="last:border-b-0">
              <AccordionTrigger className="px-6 text-left text-lg font-semibold text-white">
                <span className="flex items-center gap-3">
                  <Badge variant="outline" className="border-cyan-300/60 bg-cyan-500/10 text-xs uppercase tracking-[0.3em] text-cyan-200">
                    FAQ
                  </Badge>
                  <span>Frequently asked questions</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <Accordion type="single" collapsible className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <AccordionItem value="faq-1" className="border-b border-white/10 last:border-b-0">
                    <AccordionTrigger className="px-4 text-left text-base font-semibold text-white">
                      Why do I need trivia before I pitch?
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-sm text-data3-white/85">
                      The trivia round levels the field with baseline knowledge. Your <span className="font-semibold text-white">pitch</span> is where you stand out by applying Cisco tech to real business problems.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-2" className="border-b border-white/10 last:border-b-0">
                    <AccordionTrigger className="px-4 text-left text-base font-semibold text-white">
                      Do I have to pitch from the same category?
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-sm text-data3-white/85">
                      Yes. The AI coach ensures your solution comes from <span className="font-semibold text-white">the track you selected</span> so judging stays fair and aligned to track-specific criteria.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-3" className="border-b border-white/10 last:border-b-0">
                    <AccordionTrigger className="px-4 text-left text-base font-semibold text-white">
                      Can I just play trivia without pitching?
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-sm text-data3-white/85">
                      In <span className="font-semibold text-white">Dojo mode</span> yes—practice as much as you like. In <span className="font-semibold text-white">Ring mode</span> you must complete trivia and the pitch to record a score and earn raffle entries.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-4">
                    <AccordionTrigger className="px-4 text-left text-base font-semibold text-white">
                      What if I'm not an expert in my category?
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-sm text-data3-white/85">
                      Hints arrive as the timer counts down, and the AI coach nudges you toward category-aligned solutions. <span className="font-semibold text-white">Practice in Dojo</span> to see explanations and build confidence before your official run.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Call to Action */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold sm:text-4xl">Ready to Play?</h2>
            <p className="text-data3-white/70">Choose your path and start competing!</p>
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
                <CardContent className="text-sm text-data3-white/85 space-y-2">
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
                <CardContent className="text-sm text-data3-white/85 space-y-2">
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
