import { useState, useEffect, useRef } from "react";
import { Trophy, Target, Lightbulb, Zap, ChevronRight } from "lucide-react";
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

  const steps = [
    { icon: "💡", title: "Name the Problem", desc: "Identify a real business challenge" },
    { icon: "📊", title: "Quantify Impact", desc: "Define measurable KPIs" },
    { icon: "🔧", title: "Explore Technologies", desc: "AI suggests Cisco solutions" },
    { icon: "🏆", title: "Submit & Score", desc: "Get instant AI evaluation" }
  ];

  const categories = [
    { name: "Zero Trust", color: "#00BCF2" },
    { name: "Hybrid Cloud", color: "#6CC04A" },
    { name: "Collaboration", color: "#FF6B35" },
    { name: "Observability", color: "#9B59B6" },
    { name: "Edge & IoT", color: "#F39C12" }
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
      <div className="flex-1 grid grid-cols-12 gap-8">
        {/* Left Column - QR Code & Prize */}
        <div className="col-span-3 flex flex-col items-center">
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
              <p className="text-lg text-cyan-200 mt-2">50 Points Maximum</p>
              <p className="text-sm text-blue-200 mt-1">3-Reply Sprint Format</p>
            </div>
          </div>
        </div>

        {/* Middle Column - Process */}
        <div className="col-span-6 flex flex-col">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl flex-1">
            <h2 className="text-3xl font-bold mb-8 text-center text-cyan-300">
              Four Simple Steps to Success
            </h2>
            
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-xl flex items-center justify-center border border-cyan-400/50 shadow-lg">
                      <span className="text-3xl">{step.icon}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl font-bold text-cyan-400">{index + 1}</span>
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                      {index < steps.length - 1 && (
                        <ChevronRight className="w-6 h-6 text-cyan-400/50 ml-auto" />
                      )}
                    </div>
                    <p className="text-lg text-blue-200">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Categories Bar */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-cyan-300 mb-3 text-center">Solution Categories:</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {categories.map((cat) => (
                  <div 
                    key={cat.name}
                    className="px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Scoring */}
        <div className="col-span-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-cyan-300">
              <Target className="inline-block w-8 h-8 mr-2" />
              AI Scoring System
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-400/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">🎯 Problem & KPIs</span>
                  <span className="text-xl font-bold text-yellow-400">10pts</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-cyan-400/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">🏗️ Cisco Fit</span>
                  <span className="text-xl font-bold text-cyan-400">10pts</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">🔐 Feasibility</span>
                  <span className="text-xl font-bold text-green-400">10pts</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">📈 Business Impact</span>
                  <span className="text-xl font-bold text-purple-400">10pts</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg p-4 border border-orange-400/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">🤖 Automation</span>
                  <span className="text-xl font-bold text-orange-400">10pts</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                50 Points Total
              </p>
              <p className="text-sm text-blue-200 mt-2">Minimum 10 points guaranteed</p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full px-8 py-4 border border-cyan-400/30">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          <p className="text-lg font-semibold">Pro Tip: Be specific with metrics and use real Cisco product names for higher scores!</p>
          <Zap className="w-6 h-6 text-cyan-400" />
        </div>
      </div>
    </div>
  );
}