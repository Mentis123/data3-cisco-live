import { useState, useEffect } from "react";
import { Settings, MessageSquare, Music, Volume2, VolumeX } from "lucide-react";
import { audioManager } from "@/lib/audio";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackForm } from "@/components/ChatbotWidget/FeedbackForm";

const VOLUME_STEPS = [100, 80, 60, 40, 20, 0];

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [volumePercent, setVolumePercent] = useState(100);

  // Initialize state from audioManager
  useEffect(() => {
    setMusicEnabled(audioManager.isMusicEnabled());
    setSoundsEnabled(audioManager.isSoundsEnabled());
    setVolumePercent(audioManager.getMasterVolumePercent());
  }, []);

  const handleToggleMusic = () => {
    const newState = audioManager.toggleMusic();
    setMusicEnabled(newState);
  };

  const handleToggleSounds = () => {
    const newState = audioManager.toggleSounds();
    setSoundsEnabled(newState);
  };

  const handleVolumeChange = () => {
    // Cycle through volume steps: 100 -> 80 -> 60 -> 40 -> 20 -> 0 -> 100
    const currentIndex = VOLUME_STEPS.indexOf(volumePercent);
    const nextIndex = (currentIndex + 1) % VOLUME_STEPS.length;
    const newVolume = VOLUME_STEPS[nextIndex];

    setVolumePercent(newVolume);
    audioManager.setMasterVolume(newVolume / 100);
  };

  const handleFeedbackClick = () => {
    setIsFeedbackOpen(true);
  };

  return (
    <>
      {/* Settings Gear Button */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
        {/* Slide-out menu items */}
        <div
          className={cn(
            "flex items-center gap-3 transition-all duration-300 ease-out",
            isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-16 pointer-events-none"
          )}
        >
          {/* Feedback Button */}
          <button
            onClick={handleFeedbackClick}
            className={cn(
              "h-12 w-12 rounded-full",
              "bg-primary text-primary-foreground",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300 ease-out",
              "hover:scale-110 active:scale-95",
              "flex items-center justify-center",
              "border-2 border-primary/20"
            )}
            aria-label="Open feedback"
          >
            <MessageSquare className="h-6 w-6" />
          </button>

          {/* Music Toggle */}
          <button
            onClick={handleToggleMusic}
            className={cn(
              "h-12 w-12 rounded-full",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300 ease-out",
              "hover:scale-110 active:scale-95",
              "flex items-center justify-center",
              "border-2",
              musicEnabled
                ? "bg-[#00AEFF] text-white border-[#00AEFF]/50"
                : "bg-gray-700/80 text-gray-400 border-gray-600/50"
            )}
            aria-label={musicEnabled ? "Disable music" : "Enable music"}
          >
            <Music className="h-6 w-6" />
          </button>

          {/* Sound Effects Toggle */}
          <button
            onClick={handleToggleSounds}
            className={cn(
              "h-12 w-12 rounded-full",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300 ease-out",
              "hover:scale-110 active:scale-95",
              "flex items-center justify-center",
              "border-2",
              soundsEnabled
                ? "bg-[#00AEFF] text-white border-[#00AEFF]/50"
                : "bg-gray-700/80 text-gray-400 border-gray-600/50"
            )}
            aria-label={soundsEnabled ? "Disable sound effects" : "Enable sound effects"}
          >
            {soundsEnabled ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
          </button>

          {/* Volume Dial */}
          <button
            onClick={handleVolumeChange}
            className={cn(
              "h-12 w-12 rounded-full",
              "bg-gradient-to-br from-purple-500 to-pink-500",
              "text-white",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-300 ease-out",
              "hover:scale-110 active:scale-95",
              "flex items-center justify-center",
              "border-2 border-purple-400/50",
              "font-bold text-sm"
            )}
            aria-label={`Volume ${volumePercent}%`}
          >
            {volumePercent}%
          </button>
        </div>

        {/* Gear Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-12 w-12 rounded-full",
            "bg-gradient-to-br from-gray-700 to-gray-800",
            "text-white",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-300 ease-out",
            "hover:scale-110 active:scale-95",
            "flex items-center justify-center",
            "border-2 border-gray-600/50"
          )}
          aria-label={isOpen ? "Close settings menu" : "Open settings menu"}
        >
          <Settings
            className={cn(
              "h-6 w-6 transition-transform duration-300",
              isOpen && "rotate-90"
            )}
          />
        </button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Share Your Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve your experience. We read every message!
            </DialogDescription>
          </DialogHeader>

          <FeedbackForm onSuccess={() => setIsFeedbackOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
