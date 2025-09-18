import { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Target,
  Lightbulb,
  Zap,
  QrCode,
  MessageSquare,
  BrainCircuit,
  Sparkles,
  Gift
} from "lucide-react";
import QRCode from "qrcode";

export default function HowToPlay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appUrl = "https://data3-cisco-live.replit.app";

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate QR code on mount
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, appUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, []);

  const experienceMoments = [
    {
      title: "Scan the QR code",
      description: "Launch the Data#3 Solution Sprint on your device in seconds.",
      icon: QrCode,
      gradient: "from-cyan-500/30 to-blue-500/30"
    },
    {
      title: "Share your biggest frustration",
      description: "Tell us the business challenge slowing your team down right now.",
      icon: MessageSquare,
      gradient: "from-blue-500/30 to-indigo-500/30"
    },
    {
      title: "Coach your AI solver",
      description: "Walk through KPIs, impact math, and action plans with our guided prompts.",
      icon: BrainCircuit,
      gradient: "from-violet-500/30 to-purple-500/30"
    },
    {
      title: "Submit for instant scoring",
      description: "Our AI judge scores clarity, impact, KPI strength, execution and confidence.",
      icon: Sparkles,
      gradient: "from-amber-500/30 to-orange-500/30"
    },
    {
      title: "More points, more entries",
      description: "Every 10 points unlocks another chance in the onsite prize draw.",
      icon: Gift,
      gradient: "from-emerald-500/30 to-teal-500/30"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Data<sup className="text-3xl text-[#00d5eb]">#</sup>3 Solution Sprint Challenge
          </h1>
        </div>
        <p className="text-xl text-cyan-200">Cisco Live Melbourne 2025 • AI-Powered Innovation</p>
        <p className="text-sm text-blue-200 mt-2">{currentTime.toLocaleTimeString()}</p>
      </div>
      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column - QR Code & Prize */}
        <div className="col-span-1 xl:col-span-3 flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-4 text-cyan-300">
              <Trophy className="inline-block w-8 h-8 mr-2 text-yellow-400" />
              Scan to Play
            </h2>
            <div className="bg-white p-4 rounded-xl shadow-inner flex items-center justify-center" style={{ width: '232px', height: '232px' }}>
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">Win Prizes!</p>
              <p className="text-lg text-cyan-200 mt-2">Earn up to 50 points per run</p>
              <p className="text-sm text-blue-200 mt-1">More points, more entries.</p>
              <p className="text-sm text-blue-200 mt-1">3-reply sprint format.</p>
            </div>
          </div>
        </div>

        {/* Middle Column - Process */}
        <div className="col-span-1 xl:col-span-6 flex flex-col">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl flex-1">
            <h2 className="text-3xl font-bold mb-8 text-center text-cyan-300">
              Your Solution Sprint Playbook
            </h2>

            <div className="space-y-5">
              {experienceMoments.map((moment, index) => {
                const Icon = moment.icon;
                return (
                  <div
                    key={moment.title}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/5 rounded-2xl p-5 border border-white/10 shadow-lg"
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${moment.gradient} flex items-center justify-center border border-white/20 shadow-md mx-auto sm:mx-0`}>
                      <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                        <span className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full border border-cyan-400/60 text-sm font-semibold text-cyan-200">
                          {index + 1}
                        </span>
                        <h3 className="text-2xl font-bold text-white">{moment.title}</h3>
                      </div>
                      <p className="text-base text-blue-100 max-w-2xl">{moment.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Scoring */}
        <div className="col-span-1 xl:col-span-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-cyan-300">
              <Target className="inline-block w-8 h-8 mr-2" />
              AI Scoring System
            </h2>
            
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">🎯 Clarity</span>
                    <span className="text-xl font-bold text-yellow-400">10pts</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-cyan-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">📊 Impact</span>
                    <span className="text-xl font-bold text-cyan-400">10pts</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">📌 KPI Strength</span>
                    <span className="text-xl font-bold text-green-400">10pts</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">🚀 Execution</span>
                    <span className="text-xl font-bold text-purple-400">10pts</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg p-4 border border-orange-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg">🧭 Confidence</span>
                    <span className="text-xl font-bold text-orange-400">10pts</span>
                  </div>
                </div>
              </div>

            <div className="mt-6 text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                50 Points Total
              </p>
              <p className="text-sm text-blue-200 mt-2">Every 10 points adds another prize entry.</p>
              <p className="text-sm text-blue-200 mt-1">Leaderboard updates live throughout the event.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Edison Quote */}
      <div className="mt-10">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-slate-900/80 via-blue-900/70 to-slate-900/80 border border-cyan-400/40 rounded-3xl px-8 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col items-center text-center space-y-4">
            <Sparkles className="w-10 h-10 text-cyan-300" aria-hidden="true" />
            <p className="text-2xl font-semibold italic text-blue-100 max-w-3xl">
              "Opportunity is missed by most people because it is dressed in overalls and looks like work."
            </p>
            <p className="text-sm tracking-[0.35em] uppercase text-cyan-200/80">Thomas Edison</p>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full px-8 py-4 border border-cyan-400/30">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          <p className="text-lg font-semibold">Pro Tip: Be specific with baselines, targets, owners and next steps for higher scores!</p>
          <Zap className="w-6 h-6 text-cyan-400" />
        </div>
      </div>
    </div>
  );
}