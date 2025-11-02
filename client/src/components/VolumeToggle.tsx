import { useState, useEffect } from "react";
import { Sparkles, SparklesIcon } from "lucide-react";
import { audioManager } from "@/lib/audio";
import { cn } from "@/lib/utils";

export function ImmersiveToggle() {
  const [isImmersive, setIsImmersive] = useState(false); // Default to immersive OFF
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Initialize immersive state from audioManager
    setIsImmersive(audioManager.isImmersiveMode());
  }, []);

  const handleToggle = () => {
    const newImmersiveState = audioManager.toggleImmersive();
    setIsImmersive(newImmersiveState);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={handleToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
        className={cn(
          "h-12 w-12 rounded-full",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "hover:scale-110 active:scale-95",
          "flex items-center justify-center",
          "border-2",
          "backdrop-blur-sm",
          isImmersive
            ? "bg-[#00AEFF] text-white border-[#00AEFF]/50"
            : "bg-gray-700/80 text-gray-400 border-gray-600/50"
        )}
        aria-label={isImmersive ? "Disable immersive mode" : "Enable immersive mode"}
      >
        {isImmersive ? (
          <Sparkles className="h-5 w-5" />
        ) : (
          <SparklesIcon className="h-5 w-5" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-14 left-0 bg-gray-900/95 text-white px-4 py-2 rounded-lg shadow-xl text-sm whitespace-nowrap border border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="font-semibold mb-1">
            {isImmersive ? "Immersive Mode: ON" : "Immersive Mode: OFF"}
          </div>
          <div className="text-xs text-gray-300">
            {isImmersive
              ? "Enhanced experience with sound & video"
              : "Click to enable sound & video effects"}
          </div>
        </div>
      )}
    </div>
  );
}

// Keep the old name as an alias for backward compatibility
export const VolumeToggle = ImmersiveToggle;
