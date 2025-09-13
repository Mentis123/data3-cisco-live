import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Home, Maximize, Minimize } from "lucide-react";

export default function HowToPlay() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const appUrl = "https://data3-cisco-live.replit.app";

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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const categories = [
    { name: "Zero Trust & Secure Connectivity", color: "bg-[#00BCF2]", icon: "🔒" },
    { name: "Data Centre & Hybrid Cloud", color: "bg-[#6CC04A]", icon: "☁️" },
    { name: "Collaboration & Contact Centre", color: "bg-[#FF6B35]", icon: "👥" },
    { name: "Observability & Performance", color: "bg-[#9B59B6]", icon: "📊" },
    { name: "Edge & IoT Solutions", color: "bg-[#F39C12]", icon: "🌐" }
  ];

  const scoringCriteria = [
    {
      title: "Problem Definition & KPIs",
      description: "Clear business problem with quantified impact and measurable metrics",
      icon: "🎯",
      points: 10
    },
    {
      title: "Cisco Architecture Fit",
      description: "Alignment with Cisco technologies and proper product selection",
      icon: "🏗️",
      points: 10
    },
    {
      title: "Feasibility & Security",
      description: "Realistic implementation with security-first design principles",
      icon: "🔐",
      points: 10
    },
    {
      title: "Business Impact at Scale",
      description: "Tangible business value with scalability and growth potential",
      icon: "📈",
      points: 10
    },
    {
      title: "Observability & Automation",
      description: "Monitoring, visibility, and intelligent automation capabilities",
      icon: "🤖",
      points: 10
    }
  ];

  const fourSteps = [
    {
      step: 1,
      title: "Name the Problem",
      description: "Identify a real business challenge your organization faces",
      tips: "Be specific about pain points and current inefficiencies"
    },
    {
      step: 2,
      title: "Quantify the Impact",
      description: "Define measurable KPIs and business metrics",
      tips: "Include numbers: cost savings, time reduction, efficiency gains"
    },
    {
      step: 3,
      title: "Explore Technologies",
      description: "AI suggests Cisco solutions tailored to your problem",
      tips: "Consider multiple Cisco products working together"
    },
    {
      step: 4,
      title: "Submit & Compete",
      description: "Review your solution and submit for instant scoring",
      tips: "Edit and refine before submitting for best score"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-home">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                data-testid="button-fullscreen"
              >
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
            <p className="text-muted-foreground">
              Complete your solution in just 3 user replies (6 max if needed)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fourSteps.map((step) => (
                <div key={step.step} className="relative">
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 h-full border border-cyan-500/30">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-white">{step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-3">{step.description}</p>
                    <p className="text-sm text-cyan-400 italic">💡 {step.tips}</p>
                  </div>
                  {step.step < 4 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-2xl text-muted-foreground">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">
              <span className="mr-3">🏷️</span>
              Solution Categories
            </CardTitle>
            <p className="text-muted-foreground">
              Your solution will be automatically categorized into one of these technology areas
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.name} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                  <span className="text-2xl">{category.icon}</span>
                  <Badge className={`${category.color} text-white px-3 py-1 text-sm`}>
                    {category.name}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scoring Criteria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">
              <span className="mr-3">📊</span>
              AI Scoring Criteria (50 Points Total)
            </CardTitle>
            <p className="text-muted-foreground">
              GPT-4o evaluates each submission across five key dimensions
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scoringCriteria.map((criterion) => (
                <div key={criterion.title} className="relative group">
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 h-full border border-yellow-500/30 transition-transform hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-3xl">{criterion.icon}</span>
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-3 py-1">
                        {criterion.points} pts
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{criterion.title}</h3>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-center text-muted-foreground">
                <span className="font-semibold">Participation Floor:</span> Minimum 10 points guaranteed for valid submissions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Success */}
        <Card className="mb-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-3xl">
              <span className="mr-3">🎯</span>
              Tips for High Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 text-green-400">✅ Do This:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Use specific numbers and metrics (%, $, hours saved)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Name specific Cisco products and how they integrate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Address real business problems with measurable impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Consider security, scalability, and automation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Review and edit before final submission</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-red-400">❌ Avoid:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Vague problems without specific context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Generic technology mentions without Cisco products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Missing quantifiable business metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Ignoring security and compliance requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>Submitting without reviewing AI's summary</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Sprint? 🚀</h2>
            <p className="text-xl mb-6 opacity-90">
              Scan the QR code or visit the booth to start crafting your solution!
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/play">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" data-testid="button-play-now">
                  Start Playing Now →
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20" data-testid="button-view-leaderboard">
                  View Live Leaderboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}