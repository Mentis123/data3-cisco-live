import { useEffect, useRef } from "react";
import { DaveScene } from "./dave-scene";
import "./dave.css";

declare global {
  interface Window {
    __DAVE_QA__?: {
      ready: boolean;
      setFrame: (frame: number) => void;
    };
  }
}

function fixedReferenceTime() {
  const value = new URLSearchParams(window.location.search).get("t");
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function Dave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const requestedTime = fixedReferenceTime();
    const qaMode = new URLSearchParams(window.location.search).get("qa") === "1";
    const daveScene = new DaveScene(canvas, {
      fixedTime: requestedTime ?? (qaMode || reduceMotion.matches ? 0 : undefined),
    });

    if (qaMode) {
      window.__DAVE_QA__ = {
        ready: true,
        setFrame: (frame) => daveScene.renderAt(frame / 30),
      };
    }
    window.dispatchEvent(new Event("dave:ready"));

    const resize = () => daveScene.resize();
    const visibility = () => {
      if (document.visibilityState === "visible") {
        daveScene.start();
      } else {
        daveScene.stop();
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    daveScene.start();

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      delete window.__DAVE_QA__;
      daveScene.dispose();
    };
  }, []);

  return (
    <main className="dave-experience">
      <canvas
        ref={canvasRef}
        className="dave-canvas"
        data-dave-canvas
        aria-label="An iridescent glass cube filled with wireframe knots rotates above a dark checkerboard floor."
      />
      <p className="dave-description">
        An iridescent glass cube filled with wireframe knots rotates above a dark checkerboard floor.
      </p>
    </main>
  );
}
