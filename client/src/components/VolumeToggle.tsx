import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { audioManager } from "@/lib/audio";
import { cn } from "@/lib/utils";

export function VolumeToggle() {
  const [isMuted, setIsMuted] = useState(true); // Default to muted (OFF)

  useEffect(() => {
    // Initialize mute state from audioManager
    setIsMuted(audioManager.isMutedState());
  }, []);

  const handleToggle = () => {
    const newMutedState = audioManager.toggleMute();
    setIsMuted(newMutedState);
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "fixed bottom-4 left-4 z-50",
        "h-12 w-12 rounded-full",
        "bg-primary/80 text-primary-foreground",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300 ease-out",
        "hover:scale-110 active:scale-95",
        "flex items-center justify-center",
        "border-2 border-primary/20",
        "backdrop-blur-sm"
      )}
      aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      title={isMuted ? "Unmute audio" : "Mute audio"}
    >
      {isMuted ? (
        <VolumeX className="h-5 w-5" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
    </button>
  );
}
