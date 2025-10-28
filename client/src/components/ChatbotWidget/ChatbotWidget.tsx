import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackForm } from "./FeedbackForm";
import { cn } from "@/lib/utils";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Smol Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "h-14 w-14 rounded-full",
          "bg-primary text-primary-foreground",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "hover:scale-110 active:scale-95",
          "flex items-center justify-center",
          "border-2 border-primary/20",
          isOpen && "opacity-0 pointer-events-none"
        )}
        aria-label="Open feedback widget"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Expandable Panel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
              Share Your Feedback
            </DialogTitle>
            <DialogDescription className="text-sm">
              Help us improve your experience. We read every message!
            </DialogDescription>
          </DialogHeader>

          <FeedbackForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
