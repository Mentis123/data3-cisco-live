import { useEffect, useState } from "react";

export function RotateTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleVisibility = () => {
      const isPortrait = window.innerHeight >= window.innerWidth;
      setVisible(mediaQuery.matches && isPortrait);
    };

    handleVisibility();
    window.addEventListener("resize", handleVisibility);
    screen.orientation?.addEventListener?.("change", handleVisibility);

    return () => {
      window.removeEventListener("resize", handleVisibility);
      screen.orientation?.removeEventListener?.("change", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const previousPadding = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "7rem";

    return () => {
      document.body.style.paddingBottom = previousPadding;
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:hidden">
      <div className="w-full max-w-md rounded-2xl bg-white/10 p-4 text-center shadow-lg backdrop-blur">
        <div className="text-base font-semibold text-white">
          For the best experience, rotate to <strong>landscape</strong> 📱↔️
        </div>
        <div className="mt-1 text-sm text-white/80">
          You can still play in portrait — this is just a recommendation.
        </div>
      </div>
    </div>
  );
}
