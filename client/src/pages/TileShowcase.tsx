import { useState } from "react";
import { useLocation } from "wouter";

interface TileVariation {
  id: number;
  title: string;
  description: string;
  className: string;
  style?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
}

export default function TileShowcase() {
  const [, setLocation] = useLocation();
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);

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
      }
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
      }
    },
    {
      id: 3,
      title: "Holographic Gradient",
      description: "Shimmering holographic effect with rainbow gradients",
      className: "relative overflow-hidden rounded-2xl border-4 border-transparent bg-gradient-to-br from-data3-cool-purple via-data3-aqua to-data3-magenta transition-all duration-500 hover:scale-110",
      style: {
        backgroundSize: "200% 200%",
        animation: "gradient 3s ease infinite",
        boxShadow: `
          0 8px 32px rgba(115,0,255,0.5),
          0 0 0 2px rgba(255,255,255,0.1),
          inset 0 0 40px rgba(255,255,255,0.1)
        `
      }
    },
    {
      id: 4,
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
      }
    },
    {
      id: 5,
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
      }
    },
    {
      id: 6,
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
      }
    },
    {
      id: 7,
      title: "Glass Morphism Ultra",
      description: "Strong glass effect with bright backdrop blur",
      className: "relative overflow-hidden rounded-2xl border-2 border-white/40 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/60",
      style: {
        background: "rgba(115,0,255,0.15)",
        boxShadow: `
          0 8px 32px rgba(115,0,255,0.4),
          0 0 0 1px rgba(255,255,255,0.2),
          inset 0 0 60px rgba(255,255,255,0.1),
          inset 0 -10px 40px rgba(115,0,255,0.2)
        `
      }
    },
    {
      id: 8,
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
      }
    },
    {
      id: 9,
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
      }
    },
    {
      id: 10,
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
      }
    }
  ];

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
          Dojo Tile Design Showcase
        </h1>
        <p className="text-xl text-data3-white/70 mb-2">
          10 different design variations to make the tile stand out as a clickable button
        </p>
        <p className="text-sm text-data3-white/50">
          Hover over each tile to see the interactive effects
        </p>
      </div>

      {/* Tile Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {tileVariations.map((tile) => (
          <div key={tile.id} className="space-y-3">
            {/* Tile Label */}
            <div>
              <h3 className="text-xl font-bold text-data3-cool-purple">
                {tile.id}. {tile.title}
              </h3>
              <p className="text-sm text-data3-white/60">{tile.description}</p>
            </div>

            {/* Actual Tile */}
            <div
              className={tile.className}
              style={hoveredTile === tile.id && tile.hoverStyle ? tile.hoverStyle : tile.style}
              onMouseEnter={() => setHoveredTile(tile.id)}
              onMouseLeave={() => setHoveredTile(null)}
            >
              <div className="p-8 md:p-12 cursor-pointer">
                {/* Inner Content */}
                <div className="text-center space-y-4">
                  <div className="text-6xl">🥋</div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Training Dojo
                  </h2>
                  <p className="text-data3-white/80">
                    Practice your skills and perfect your technique
                  </p>
                  <div className="pt-4">
                    <span className="inline-block px-6 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
                      Click to Enter
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
