import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Home, Maximize, Minimize, Rows3, Square } from "lucide-react";

export default function HowToPlay() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compactMode, setCompactMode] = useState(true); // Default to compact
  const appUrl = window.location.origin;

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  };

  // Listen for fullscreen changes and escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const categories = [
    { name: "Zero Trust & Secure Connectivity", color: "bg-[#00BCF2]", short: "Zero Trust" },
    { name: "Data Centre & Hybrid Cloud", color: "bg-[#6CC04A]", short: "Hybrid Cloud" },
    { name: "Collaboration & Contact Centre", color: "bg-[#FF6B35]", short: "Collaboration" },
    { name: "Observability & Performance", color: "bg-[#9B59B6]", short: "Observability" },
    { name: "Edge & IoT Solutions", color: "bg-[#F39C12]", short: "Edge & IoT" }
  ];

  const scoringCriteria = [
    { title: "Problem Definition & KPIs", icon: "🎯", points: 10 },
    { title: "Cisco Architecture Fit", icon: "🏗️", points: 10 },
    { title: "Feasibility & Security", icon: "🔐", points: 10 },
    { title: "Business Impact at Scale", icon: "📈", points: 10 },
    { title: "Observability & Automation", icon: "🤖", points: 10 }
  ];

  const fourSteps = [
    { step: 1, title: "Name the Problem", desc: "Identify your business challenge" },
    { step: 2, title: "Quantify Impact", desc: "Define measurable KPIs" },
    { step: 3, title: "Explore Tech", desc: "AI suggests Cisco solutions" },
    { step: 4, title: "Submit & Win", desc: "Get instant scoring" }
  ];

  const tips = {
    do: ["Use specific metrics (%, $)", "Name Cisco products", "Real problems", "Consider security"],
    dont: ["Vague problems", "Generic tech", "No metrics", "Skip review"]
  };

  // Compact view for everything on one screen
  if (compactMode) {
    return (
      <div className="min-h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col">
        {/* Compact Header - Hide buttons in fullscreen */}
        {!isFullscreen && (
          <header className="bg-background/95 backdrop-blur-sm border-b px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">#</span>
                </div>
                <h1 className="text-lg font-bold">Data#3 Solution Sprint — How to Play</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCompactMode(false)} data-testid="button-normal">
                  <Square className="w-4 h-4 mr-1" />
                  Normal
                </Button>
                <Link href="/">
                  <Button variant="outline" size="sm" data-testid="button-home">
                    <Home className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={toggleFullscreen} data-testid="button-fullscreen">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Compact Content Grid */}
        <div className="flex-1 p-3 grid grid-cols-12 gap-3 overflow-hidden">
          {/* Left Column - Hero & QR */}
          <div className="col-span-3 flex flex-col gap-3">
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 p-3">
              <h2 className="text-xl font-bold mb-2">🏆 Win Prizes!</h2>
              <p className="text-xs text-muted-foreground mb-2">
                3-Reply Sprint • AI Coaching • 50 Points Max
              </p>
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={appUrl} size={140} level="H" />
                <p className="text-center mt-2 text-xs font-medium text-gray-700">Scan to Play!</p>
              </div>
            </Card>
          </div>

          {/* Middle Column - Process & Categories */}
          <div className="col-span-5 flex flex-col gap-3">
            {/* Four-Step Process */}
            <Card className="p-3">
              <h3 className="text-sm font-bold mb-2">📝 The Four-Step Sprint Process</h3>
              <div className="grid grid-cols-4 gap-2">
                {fourSteps.map((step) => (
                  <div key={step.step} className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-2 border border-cyan-500/30">
                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded text-xs font-bold text-white flex items-center justify-center mb-1">
                      {step.step}
                    </div>
                    <p className="text-xs font-semibold">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Solution Categories */}
            <Card className="p-3">
              <h3 className="text-sm font-bold mb-2">🏷️ Solution Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge key={cat.name} className={`${cat.color} text-white text-xs px-2 py-1`}>
                    {cat.short}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* AI Scoring Criteria */}
            <Card className="p-3 flex-1">
              <h3 className="text-sm font-bold mb-2">📊 AI Scoring Criteria (50 Points Total)</h3>
              <div className="grid grid-cols-5 gap-2">
                {scoringCriteria.map((criterion) => (
                  <div key={criterion.title} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-2 border border-yellow-500/30">
                    <div className="text-lg mb-1">{criterion.icon}</div>
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-1 py-0">
                      {criterion.points}pts
                    </Badge>
                    <p className="text-xs font-medium mt-1">{criterion.title}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Participation Floor: Min 10 points guaranteed
              </p>
            </Card>
          </div>

          {/* Right Column - Tips & CTA */}
          <div className="col-span-4 flex flex-col gap-3">
            {/* Tips for High Scores */}
            <Card className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <h3 className="text-sm font-bold mb-2">🎯 Tips for High Scores</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-green-400 mb-1">✅ Do This:</p>
                  <ul className="text-xs space-y-1">
                    {tips.do.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-400 mb-1">❌ Avoid:</p>
                  <ul className="text-xs space-y-1">
                    {tips.dont.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <Card className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex-1 flex flex-col justify-center">
              <h2 className="text-lg font-bold mb-2">Ready to Sprint? 🚀</h2>
              <p className="text-sm mb-3 opacity-90">
                Scan the QR code or visit the booth!
              </p>
              <div className="flex gap-2">
                <Link href="/play">
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100" data-testid="button-play">
                    Start Playing →
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="sm" variant="outline" className="border-white text-white hover:bg-white/20" data-testid="button-leaderboard">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Normal view (scrollable)
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - Hide buttons in fullscreen */}
      {!isFullscreen && (
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">#</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Data#3 Solution Sprint — How to Play</h1>
                  <p className="text-sm text-muted-foreground">Cisco Live Melbourne 2025 • Powered by AI</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCompactMode(true)} data-testid="button-compact">
                  <Rows3 className="w-4 h-4 mr-2" />
                  Compact
                </Button>
                <Link href="/">
                  <Button variant="outline" size="sm" data-testid="button-home">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={toggleFullscreen} data-testid="button-fullscreen">
                  {isFullscreen ? (
                    <>
                      <Minimize className="w-4 h-4 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="w-4 h-4 mr-2" />
                      Fullscreen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-4">
                  🏆 Win Prizes with Your Business Solutions!
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Use AI to craft innovative Cisco-powered solutions in just 3 replies. 
                  Compete for top prizes with instant scoring and live leaderboard updates!
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Badge className="text-lg px-4 py-2 bg-cyan-500">
                    ⏱️ 3-Reply Sprint
                  </Badge>
                  <Badge className="text-lg px-4 py-2 bg-green-500">
                    🤖 AI-Powered Coaching
                  </Badge>
                  <Badge className="text-lg px-4 py-2 bg-purple-500">
                    💯 50 Points Max
                  </Badge>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-xl">
                  <QRCodeSVG 
                    value={appUrl}
                    size={250}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="text-center mt-4 text-sm font-medium text-gray-700">
                    Scan to Start Playing!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Four-Step Process */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">
              <span className="mr-3">📝</span>
              The Four-Step Sprint Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fourSteps.map((step) => (
                <div key={step.step} className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-500/30">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-white">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rest of normal view content... */}
      </main>
    </div>
  );
}