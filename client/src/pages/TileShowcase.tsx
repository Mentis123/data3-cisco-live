import { useState } from "react";
import { useLocation } from "wouter";

interface TileVariation {
  id: number;
  title: string;
  description: string;
  className: string;
  style?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  backgroundColor: string; // Background color for the showcase area
  backgroundDescription: string; // Description of the background choice
}

export default function TileShowcase() {
  const [, setLocation] = useLocation();
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);

  const tileVariations: TileVariation[] = [
    {
      id: 1,
      title: "Original Dojo Style",
      description: "Classic purple glow with layered shadows",
      className: "relative overflow-hidden rounded-2xl border-4 border-data3-cool-purple/80 bg-gradient-to-br from-data3-cool-purple/10 via-data3-cool-purple/15 to-data3-cool-purple/5 transition-all duration-300 hover:scale-105",
      style: {
        boxShadow: `
          inset 2px 2px 8px rgba(255,255,255,0.3),
          inset -2px -2px 8px rgba(0,0,0,0.5),
          0 8px 0 rgba(115,0,255,0.85),
          0 12px 20px rgba(115,0,255,0.65),
          0 20px 40px rgba(115,0,255,0.45)
        `
      },
      backgroundColor: "#000025",
      backgroundDescription: "Dark blue-black to let purple glow stand out"
    },
    {
      id: 2,
      title: "Pulsing Glow",
      description: "Animated glow that pulses to draw attention",
      className: "relative overflow-hidden rounded-2xl border-4 border-data3-cool-purple bg-gradient-to-br from-data3-cool-purple/20 to-data3-blue-black animate-pulse",
      style: {
        boxShadow: `
          0 0 20px rgba(115,0,255,0.8),
          0 0 40px rgba(115,0,255,0.6),
          0 0 60px rgba(115,0,255,0.4),
          inset 0 0 20px rgba(115,0,255,0.2)
        `
      },
      backgroundColor: "#0a0014",
      backgroundDescription: "Very dark purple-black for maximum glow contrast"
    },
    {
      id: 3,
      title: "Holographic Gradient (Dark BG)",
      description: "Shimmering holographic effect with rainbow gradients on dark",
      className: "relative overflow-hidden rounded-2xl border-4 border-transparent bg-gradient-to-br from-data3-cool-purple via-data3-aqua to-data3-magenta transition-all duration-500 hover:scale-110",
      style: {
        backgroundSize: "200% 200%",
        animation: "gradient 3s ease infinite",
        boxShadow: `
          0 8px 32px rgba(115,0,255,0.5),
          0 0 0 2px rgba(255,255,255,0.1),
          inset 0 0 40px rgba(255,255,255,0.1)
        `
      },
      backgroundColor: "#000025",
      backgroundDescription: "Dark background for vibrant color contrast"
    },
    {
      id: 4,
      title: "Holographic Gradient (Light BG)",
      description: "Holographic effect with subtle shadows on light background",
      className: "relative overflow-hidden rounded-2xl border-4 border-white/30 bg-gradient-to-br from-purple-400 via-cyan-300 to-pink-400 transition-all duration-500 hover:scale-110",
      style: {
        backgroundSize: "200% 200%",
        animation: "gradient 3s ease infinite",
        boxShadow: `
          0 8px 32px rgba(115,0,255,0.3),
          0 4px 16px rgba(0,0,0,0.1),
          inset 0 0 40px rgba(255,255,255,0.3)
        `
      },
      backgroundColor: "#f0f4f8",
      backgroundDescription: "Light gray-blue for softer holographic appearance"
    },
    {
      id: 5,
      title: "Neon Border Animation",
      description: "Animated neon border that traces the edges",
      className: "relative overflow-hidden rounded-2xl bg-gradient-to-br from-data3-blue-black to-data3-cool-purple/20 transition-all duration-300 hover:scale-105",
      style: {
        border: "4px solid transparent",
        backgroundImage: "linear-gradient(#000025, #000025), linear-gradient(90deg, #7300FF, #00FFFF, #FF00FF, #7300FF)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: `
          0 0 20px rgba(115,0,255,0.8),
          0 0 40px rgba(0,255,255,0.4),
          inset 0 0 20px rgba(115,0,255,0.2)
        `
      },
      backgroundColor: "#000000",
      backgroundDescription: "Pure black for maximum neon effect"
    },
    {
      id: 6,
      title: "3D Raised Button",
      description: "Physical button with strong depth and shadow",
      className: "relative overflow-hidden rounded-2xl border-4 border-data3-cool-purple bg-gradient-to-b from-data3-cool-purple/40 to-data3-cool-purple/60 transition-all duration-200 hover:translate-y-1",
      style: {
        boxShadow: `
          0 4px 0 #5a00cc,
          0 8px 0 #4a00aa,
          0 12px 0 #3a0088,
          0 16px 40px rgba(115,0,255,0.6),
          inset 0 -4px 8px rgba(0,0,0,0.3),
          inset 0 4px 8px rgba(255,255,255,0.2)
        `
      },
      hoverStyle: {
        boxShadow: `
          0 2px 0 #5a00cc,
          0 4px 0 #4a00aa,
          0 8px 20px rgba(115,0,255,0.6),
          inset 0 -4px 8px rgba(0,0,0,0.3),
          inset 0 4px 8px rgba(255,255,255,0.2)
        `
      },
      backgroundColor: "#1a1a2e",
      backgroundDescription: "Dark navy for 3D depth perception"
    },
    {
      id: 7,
      title: "Double Border Glow",
      description: "Dual-layer border with intense outer glow",
      className: "relative overflow-hidden rounded-2xl border-4 border-data3-cool-purple bg-gradient-to-br from-data3-blue-black to-data3-cool-purple/10 transition-all duration-300 hover:scale-105",
      style: {
        boxShadow: `
          0 0 0 4px rgba(115,0,255,0.3),
          0 0 0 8px rgba(115,0,255,0.2),
          0 0 40px rgba(115,0,255,0.9),
          0 0 80px rgba(115,0,255,0.6),
          inset 0 0 20px rgba(115,0,255,0.2)
        `
      },
      backgroundColor: "#000025",
      backgroundDescription: "Dark blue-black for intense glow visibility"
    },
    {
      id: 8,
      title: "Glass Morphism (Dark BG)",
      description: "Strong glass effect with bright backdrop blur on dark",
      className: "relative overflow-hidden rounded-2xl border-2 border-white/40 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/60",
      style: {
        background: "rgba(115,0,255,0.15)",
        boxShadow: `
          0 8px 32px rgba(115,0,255,0.4),
          0 0 0 1px rgba(255,255,255,0.2),
          inset 0 0 60px rgba(255,255,255,0.1),
          inset 0 -10px 40px rgba(115,0,255,0.2)
        `
      },
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      backgroundDescription: "Gradient background to show glass blur effect"
    },
    {
      id: 9,
      title: "Glass Morphism (Light BG)",
      description: "Frosted glass effect on bright colorful background",
      className: "relative overflow-hidden rounded-2xl border-2 border-purple-400/60 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-purple-500/80",
      style: {
        background: "rgba(255,255,255,0.25)",
        boxShadow: `
          0 8px 32px rgba(115,0,255,0.2),
          0 4px 16px rgba(0,0,0,0.1),
          0 0 0 1px rgba(255,255,255,0.4),
          inset 0 0 60px rgba(255,255,255,0.3)
        `
      },
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #f093fb 50%, #4facfe 100%)",
      backgroundDescription: "Light gradient background for frosted glass look"
    },
    {
      id: 10,
      title: "Electric Border",
      description: "Lightning-like electric glow effect",
      className: "relative overflow-hidden rounded-2xl border-4 border-data3-aqua/80 bg-gradient-to-br from-data3-blue-black via-data3-cool-purple/20 to-data3-blue-black transition-all duration-300 hover:scale-105",
      style: {
        boxShadow: `
          0 0 10px rgba(0,255,255,1),
          0 0 20px rgba(0,255,255,0.8),
          0 0 40px rgba(0,255,255,0.6),
          0 0 80px rgba(0,255,255,0.4),
          inset 0 0 20px rgba(0,255,255,0.2)
        `
      },
      backgroundColor: "#000814",
      backgroundDescription: "Very dark blue for electric cyan contrast"
    },
    {
      id: 11,
      title: "Gradient Shift Hover",
      description: "Background gradient shifts dramatically on hover",
      className: "relative overflow-hidden rounded-2xl border-4 border-data3-magenta/60 transition-all duration-700 hover:scale-105",
      style: {
        background: "linear-gradient(135deg, rgba(115,0,255,0.3) 0%, rgba(0,0,37,1) 100%)",
        boxShadow: `
          0 8px 32px rgba(255,0,255,0.5),
          inset 0 0 40px rgba(255,0,255,0.1)
        `
      },
      hoverStyle: {
        background: "linear-gradient(135deg, rgba(255,0,255,0.5) 0%, rgba(115,0,255,0.3) 50%, rgba(0,255,255,0.2) 100%)",
        boxShadow: `
          0 12px 48px rgba(255,0,255,0.7),
          0 0 60px rgba(115,0,255,0.5),
          inset 0 0 60px rgba(255,0,255,0.2)
        `
      },
      backgroundColor: "#0a0014",
      backgroundDescription: "Deep purple-black for gradient visibility"
    },
    {
      id: 12,
      title: "Mega Depth Shadow",
      description: "Extreme layered shadow for maximum depth",
      className: "relative overflow-hidden rounded-2xl border-4 border-data3-cool-purple bg-gradient-to-br from-data3-cool-purple/30 to-data3-blue-black transition-all duration-300 hover:translate-y-2",
      style: {
        boxShadow: `
          0 2px 0 rgba(115,0,255,1),
          0 4px 0 rgba(115,0,255,0.95),
          0 8px 0 rgba(115,0,255,0.9),
          0 12px 0 rgba(115,0,255,0.85),
          0 16px 0 rgba(115,0,255,0.8),
          0 20px 0 rgba(115,0,255,0.75),
          0 24px 0 rgba(115,0,255,0.7),
          0 28px 60px rgba(115,0,255,0.6),
          inset 0 0 20px rgba(115,0,255,0.2)
        `
      },
      hoverStyle: {
        boxShadow: `
          0 1px 0 rgba(115,0,255,1),
          0 2px 0 rgba(115,0,255,0.95),
          0 4px 0 rgba(115,0,255,0.9),
          0 8px 0 rgba(115,0,255,0.85),
          0 12px 0 rgba(115,0,255,0.8),
          0 16px 40px rgba(115,0,255,0.6),
          inset 0 0 20px rgba(115,0,255,0.2)
        `
      },
      backgroundColor: "#000025",
      backgroundDescription: "Dark background to emphasize shadow depth"
    }
  ];

  const currentDesign = tileVariations[currentDesignIndex];

  const goToPrevious = () => {
    setCurrentDesignIndex((prev) =>
      prev === 0 ? tileVariations.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentDesignIndex((prev) =>
      prev === tileVariations.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="min-h-screen bg-data3-blue-black text-data3-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <button
          onClick={() => setLocation("/")}
          className="mb-6 px-4 py-2 rounded-lg border-2 border-data3-cool-purple/50 bg-data3-cool-purple/10 hover:bg-data3-cool-purple/20 transition-all"
        >
          ← Back to Home
        </button>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-data3-cool-purple via-data3-aqua to-data3-magenta bg-clip-text text-transparent">
          Dojo Tile Design Carousel
        </h1>
        <p className="text-xl text-data3-white/70 mb-2">
          Browse through {tileVariations.length} design variations shown across all 4 dojo buttons
        </p>
        <p className="text-sm text-data3-white/50">
          Use the arrow buttons to navigate between designs • Hover to see interactive effects
        </p>
      </div>

      {/* Carousel Controls and Info */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between gap-4 p-6 rounded-xl bg-data3-cool-purple/10 border border-data3-cool-purple/30">
          {/* Left Arrow */}
          <button
            onClick={goToPrevious}
            className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-data3-cool-purple bg-data3-cool-purple/20 hover:bg-data3-cool-purple/40 transition-all flex items-center justify-center text-2xl"
            aria-label="Previous design"
          >
            ←
          </button>

          {/* Current Design Info */}
          <div className="flex-grow text-center">
            <h2 className="text-2xl font-bold text-data3-cool-purple mb-1">
              {currentDesign.title}
            </h2>
            <p className="text-data3-white/70 mb-1">{currentDesign.description}</p>
            <p className="text-sm text-data3-white/50">
              Background: {currentDesign.backgroundDescription}
            </p>
            <p className="text-xs text-data3-white/40 mt-2">
              Design {currentDesignIndex + 1} of {tileVariations.length}
            </p>
          </div>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-data3-cool-purple bg-data3-cool-purple/20 hover:bg-data3-cool-purple/40 transition-all flex items-center justify-center text-2xl"
            aria-label="Next design"
          >
            →
          </button>
        </div>
      </div>

      {/* Carousel Showcase Area - 2x2 Grid of 4 Tiles */}
      <div
        className="max-w-7xl mx-auto rounded-3xl p-8 md:p-12 transition-all duration-500"
        style={{
          background: currentDesign.backgroundColor,
          minHeight: "600px"
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Render 4 copies of the current design */}
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={currentDesign.className}
              style={hoveredTile === index && currentDesign.hoverStyle ? currentDesign.hoverStyle : currentDesign.style}
              onMouseEnter={() => setHoveredTile(index)}
              onMouseLeave={() => setHoveredTile(null)}
            >
              <div className="p-6 md:p-10 cursor-pointer">
                {/* Inner Content - Different content for each of the 4 dojos */}
                <div className="text-center space-y-3">
                  <div className="text-5xl md:text-6xl">
                    {index === 0 && "🥋"}
                    {index === 1 && "⚔️"}
                    {index === 2 && "🎯"}
                    {index === 3 && "🏆"}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold">
                    {index === 0 && "Training Dojo"}
                    {index === 1 && "Combat Arena"}
                    {index === 2 && "Target Practice"}
                    {index === 3 && "Tournament Hall"}
                  </h2>
                  <p className="text-sm md:text-base text-data3-white/80">
                    {index === 0 && "Practice your skills"}
                    {index === 1 && "Test your prowess"}
                    {index === 2 && "Perfect your aim"}
                    {index === 3 && "Compete for glory"}
                  </p>
                  <div className="pt-2">
                    <span className="inline-block px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs md:text-sm font-semibold">
                      Click to Enter
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="max-w-7xl mx-auto mt-8 flex justify-center gap-2">
        {tileVariations.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentDesignIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentDesignIndex
                ? "bg-data3-cool-purple w-8"
                : "bg-data3-cool-purple/30 hover:bg-data3-cool-purple/50"
            }`}
            aria-label={`Go to design ${index + 1}`}
          />
        ))}
      </div>

      {/* Additional Info */}
      <div className="max-w-7xl mx-auto mt-16 p-6 rounded-xl bg-data3-cool-purple/10 border border-data3-cool-purple/30">
        <h3 className="text-xl font-bold mb-3 text-data3-cool-purple">Design Techniques Used:</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-data3-white/70">
          <li>✓ Layered box shadows for depth</li>
          <li>✓ Gradient backgrounds and borders</li>
          <li>✓ Animated glow effects</li>
          <li>✓ Glass morphism with backdrop blur</li>
          <li>✓ 3D transformation effects</li>
          <li>✓ Hover state transitions</li>
          <li>✓ Neon/electric border effects</li>
          <li>✓ Multi-color gradient shifts</li>
          <li>✓ Inset shadows for depth</li>
          <li>✓ Scale and translate animations</li>
          <li>✓ Smart background pairing (light/dark)</li>
          <li>✓ Design variants for different contexts</li>
        </ul>
      </div>

      {/* Add custom keyframes for gradient animation */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
