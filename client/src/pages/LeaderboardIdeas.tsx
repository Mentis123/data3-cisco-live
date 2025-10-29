import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ConceptIdea {
  id: number;
  title: string;
  icon: string;
  whatToDisplay: string;
  why: string;
  currentGap: string;
  difficulty: "easy" | "medium" | "hard";
  impact: "high" | "medium" | "low";
  tags: string[];
}

const concepts: ConceptIdea[] = [
  {
    id: 1,
    title: "Show the 5 Subscore Dimensions",
    icon: "fa-chart-radar",
    whatToDisplay: "Each submission has 5 subscores (Clarity, Impact, KPI Strength, Execution Plan, Risk Awareness) - each worth 0-8 points. Show these as: small radar/spider charts next to each leaderboard entry, OR hover/tap to expand and see the breakdown, OR show as colored bar segments in the score display.",
    why: "Makes competition multidimensional. Someone might lose on total score but WIN on 'Risk Awareness' - gives more ways to compete and be recognized.",
    currentGap: "You only show total score (0-50), hiding these 5 dimensions entirely.",
    difficulty: "medium",
    impact: "high",
    tags: ["visualization", "gamification", "educational"]
  },
  {
    id: 2,
    title: "Highlight Category Champions by Subscore",
    icon: "fa-trophy",
    whatToDisplay: "Rotating callouts like: '🏆 Sarah Chen - Highest Impact Score (8/8) in Hybrid DC', '🏆 Mike Johnson - Best Execution Plan (8/8) in Security', '🏆 Alex Kumar - Top Risk Awareness (8/8) Overall'",
    why: "Creates 5 additional 'winners' beyond just top score. More recognition = more engagement. Research shows micro-achievements boost participation 40%.",
    currentGap: "Only top 10 overall get recognition.",
    difficulty: "easy",
    impact: "high",
    tags: ["recognition", "gamification", "motivation"]
  },
  {
    id: 3,
    title: "Business Impact Metrics Display",
    icon: "fa-dollar-sign",
    whatToDisplay: "You're capturing rich business case data: annual cost savings (annualCostEst), time saved (annualTimeHours), users affected (usersAffected). Show: '💰 $2.4M in potential savings proposed today' or '⏱️ 15,000 hours saved across all solutions'",
    why: "Shows real business value, not just competition. Makes Data#3's capabilities tangible.",
    currentGap: "This gold-mine data exists but isn't visualized anywhere.",
    difficulty: "easy",
    impact: "high",
    tags: ["roi", "business-value", "enterprise"]
  },
  {
    id: 4,
    title: "Problem Clarity Ranking",
    icon: "fa-lightbulb",
    whatToDisplay: "Separate mini-leaderboard for 'Best Defined Problems' using the dialClarity score (1-5 scale). Show: Name, Problem summary (first 80 chars), Clarity rating (⭐⭐⭐⭐⭐)",
    why: "Rewards quality problem definition, not just solution scores. Teaches what 'good' looks like.",
    currentGap: "Dial scores are hidden in database.",
    difficulty: "medium",
    impact: "medium",
    tags: ["educational", "quality", "mini-leaderboard"]
  },
  {
    id: 5,
    title: "Speed-to-Submission Leaderboard",
    icon: "fa-stopwatch",
    whatToDisplay: "You capture createdAt timestamps. Show: 'Fastest Complete Solution: 8m 42s', Speed vs Score scatter plot, 'Quality vs Speed' quadrant chart",
    why: "Gamifies the experience. Some people optimize for speed, others for quality. Show both.",
    currentGap: "Time data exists but not displayed.",
    difficulty: "medium",
    impact: "medium",
    tags: ["gamification", "analytics", "performance"]
  },
  {
    id: 6,
    title: "Solution Quality Tiers",
    icon: "fa-medal",
    whatToDisplay: "Categorize scores into visual tiers: 🥇 Elite (40-50 pts): Gold badge, animated glow | 🥈 Strong (30-39 pts): Silver badge | 🥉 Solid (20-29 pts): Bronze badge | 📝 Submitted (<20 pts): Standard badge",
    why: "Makes thresholds clear. Attendees aim for 'Elite' tier, not just 'beat #1.'",
    currentGap: "All scores shown identically.",
    difficulty: "easy",
    impact: "high",
    tags: ["gamification", "visual-design", "achievement"]
  },
  {
    id: 7,
    title: "Technology Mentions Heatmap",
    icon: "fa-microchip",
    whatToDisplay: "You extract word cloud data. Go deeper: 'Most Popular Cisco Technology: SD-WAN (mentioned 23 times)', 'Trending Now: Secure Endpoint +40% this hour', Technology co-occurrence network (what's mentioned together)",
    why: "Shows Data#3/Cisco expertise across portfolio. Creates talking points for booth staff.",
    currentGap: "Word cloud is generic, not technology-focused.",
    difficulty: "medium",
    impact: "medium",
    tags: ["analytics", "technology", "trends"]
  },
  {
    id: 8,
    title: "Risk Awareness Spotlight",
    icon: "fa-shield-alt",
    whatToDisplay: "You score risk_awareness (0-8). Highlight: '🛡️ Most Comprehensive Risk Analysis: Jessica M. (8/8)', Show actual risks identified: 'Identified: bandwidth constraints, vendor lock-in, training needs'",
    why: "Risk management is critical in enterprise IT. Showcases mature thinking. Differentiates from competitors who only show 'wins.'",
    currentGap: "Risk data is scored but never shown.",
    difficulty: "medium",
    impact: "medium",
    tags: ["risk", "enterprise", "maturity"]
  },
  {
    id: 9,
    title: "Category-Specific KPI Leaderboard",
    icon: "fa-bullseye",
    whatToDisplay: "You have baseline_metrics and target_metrics. Show: Security Track: 'Best KPIs - Threat detection: 2min → 30sec' | Collab Track: 'Best KPIs - Agent handle time: 8min → 4min' | Edge Track: 'Best KPIs - Device onboarding: 2 days → 2 hours'",
    why: "Makes KPIs concrete and comparable. Attendees learn what 'good' metrics look like for their domain.",
    currentGap: "Rich KPI data is captured but never displayed.",
    difficulty: "hard",
    impact: "high",
    tags: ["kpi", "category-specific", "educational"]
  },
  {
    id: 10,
    title: "Execution Plan Strength",
    icon: "fa-tasks",
    whatToDisplay: "You score execution_plan (0-8). Show: Action plan step count, Timeline clarity, Success criteria defined. Format: 'Sarah's 7-step implementation plan scored 8/8 for execution clarity'",
    why: "Rewards thorough planning, not just ideas. Shows Data#3 values implementation, not just vision.",
    currentGap: "Execution scoring hidden.",
    difficulty: "easy",
    impact: "medium",
    tags: ["execution", "planning", "quality"]
  },
  {
    id: 11,
    title: "Real-Time Competition Stats",
    icon: "fa-chart-line",
    whatToDisplay: "Meta-statistics updating live: '🔥 18 submissions in the last hour', '📈 Average score trending UP: 32 → 35', '⚡ Current session: 73% pass rate', '🎯 To beat the leader: need 47+ points'",
    why: "Creates urgency and social proof. Shows 'the bar is rising' or 'momentum building.'",
    currentGap: "No meta-stats shown.",
    difficulty: "easy",
    impact: "high",
    tags: ["real-time", "urgency", "social-proof"]
  },
  {
    id: 12,
    title: "Participant Journey Visualization",
    icon: "fa-route",
    whatToDisplay: "Show the full journey for top entries: Trivia performance, Dojo time vs score correlation, Subscription to updates, Submission evolution. Format: Timeline showing: Trivia (10/10) → Dojo (12 min) → Pitch (38/40) → Total (48/50)",
    why: "Shows the full competition experience. Makes the path to success transparent. Encourages complete participation (not just submission).",
    currentGap: "Journey is fragmented - only final score shown.",
    difficulty: "hard",
    impact: "medium",
    tags: ["journey", "holistic", "transparency"]
  }
];

export default function LeaderboardIdeas() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "high" | "easy">("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Get all unique tags
  const allTags = Array.from(new Set(concepts.flatMap(c => c.tags))).sort();

  // Filter concepts
  const filteredConcepts = concepts.filter(concept => {
    if (selectedFilter === "high" && concept.impact !== "high") return false;
    if (selectedFilter === "easy" && concept.difficulty !== "easy") return false;
    if (selectedTags.size > 0 && !concept.tags.some(tag => selectedTags.has(tag))) return false;
    return true;
  });

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/20 text-green-700 border-green-500/40";
      case "medium": return "bg-yellow-500/20 text-yellow-700 border-yellow-500/40";
      case "hard": return "bg-red-500/20 text-red-700 border-red-500/40";
      default: return "bg-gray-500/20 text-gray-700 border-gray-500/40";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-purple-500/20 text-purple-700 border-purple-500/40";
      case "medium": return "bg-blue-500/20 text-blue-700 border-blue-500/40";
      case "low": return "bg-gray-500/20 text-gray-700 border-gray-500/40";
      default: return "bg-gray-500/20 text-gray-700 border-gray-500/40";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071734] via-[#0b2650] to-[#13316b] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                <i className="fas fa-lightbulb text-yellow-400 mr-3"></i>
                Leaderboard Display Ideas
              </h1>
              <p className="text-cyan-100/80 text-lg">
                12 concepts to enhance your Cisco Live competition leaderboard
              </p>
            </div>
            <Link href="/leaderboard">
              <Button variant="outline" size="lg">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Leaderboard
              </Button>
            </Link>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-cyan-300">{concepts.length}</div>
                <div className="text-sm text-cyan-100/70">Total Concepts</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-300">
                  {concepts.filter(c => c.impact === "high").length}
                </div>
                <div className="text-sm text-cyan-100/70">High Impact</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-300">
                  {concepts.filter(c => c.difficulty === "easy").length}
                </div>
                <div className="text-sm text-cyan-100/70">Easy to Implement</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-yellow-300">
                  {concepts.filter(c => c.impact === "high" && c.difficulty === "easy").length}
                </div>
                <div className="text-sm text-cyan-100/70">Quick Wins</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("all")}
            >
              All Ideas
            </Button>
            <Button
              variant={selectedFilter === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("high")}
            >
              <i className="fas fa-fire mr-2"></i>
              High Impact Only
            </Button>
            <Button
              variant={selectedFilter === "easy" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("easy")}
            >
              <i className="fas fa-bolt mr-2"></i>
              Easy Wins Only
            </Button>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-cyan-100/70 self-center mr-2">Filter by tag:</span>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.has(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
            {selectedTags.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags(new Set())}
                className="text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Concept Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredConcepts.map(concept => (
            <Card
              key={concept.id}
              className="bg-white/5 border-white/20 hover:bg-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <i className={`fas ${concept.icon} text-xl`}></i>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {concept.id}. {concept.title}
                      </CardTitle>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${getDifficultyColor(concept.difficulty)} border`}>
                    {concept.difficulty}
                  </Badge>
                  <Badge className={`${getImpactColor(concept.impact)} border`}>
                    {concept.impact} impact
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-1 uppercase tracking-wide">
                    <i className="fas fa-tv mr-2"></i>What to Display
                  </h4>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {concept.whatToDisplay}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-green-300 mb-1 uppercase tracking-wide">
                    <i className="fas fa-check-circle mr-2"></i>Why It Works
                  </h4>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {concept.why}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-yellow-300 mb-1 uppercase tracking-wide">
                    <i className="fas fa-exclamation-triangle mr-2"></i>Current Gap
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed italic">
                    {concept.currentGap}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  {concept.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredConcepts.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-filter text-4xl text-cyan-100/50 mb-4"></i>
            <p className="text-xl text-cyan-100/70">No concepts match your filters</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSelectedFilter("all");
                setSelectedTags(new Set());
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Recommendations Section */}
        <Card className="mt-8 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-300/40">
          <CardHeader>
            <CardTitle className="text-2xl">
              <i className="fas fa-star text-yellow-400 mr-3"></i>
              Top Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Most Impactful</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#1 - Subscore Dimensions: Show the 5-way breakdown. Makes leaderboard multidimensional and educational</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#3 - Business Impact Metrics: Surface the $ and hour savings. Shows real ROI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#6 - Quality Tiers: Gamifies achievement. Clear goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#11 - Real-Time Stats: Creates urgency and FOMO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#2 - Category Champions: More winners = more booth traffic</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-300 mb-3">Easiest to Implement</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#11 - Real-time stats: Just aggregation queries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#6 - Quality tiers: Just visual badges based on score ranges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#7 - Technology mentions: Enhance existing word cloud</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-300 mb-3">Most Unique/Differentiating</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#9 - KPI Leaderboard: No other booth does this</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#3 - Business impact: Shows enterprise maturity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-300 mt-1">→</span>
                  <span>#8 - Risk awareness: Shows depth beyond "happy path"</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-cyan-100/60">
          <p>Generated from research on trade show gamification, digital signage best practices, and 2025 event trends</p>
        </div>
      </div>
    </div>
  );
}
