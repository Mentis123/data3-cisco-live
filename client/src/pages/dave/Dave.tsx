import { useEffect, useRef } from "react";
import { DaveScene } from "./dave-scene";
import { sourceFrameToActiveTime } from "./dave-physical";
import "./dave.css";

declare global {
  interface Window {
    __DAVE_QA__?: {
      ready: boolean;
      setTime: (seconds: number) => void;
      setSourceFrame: (frame: number) => void;
      setFrame: (frame: number) => void;
      setBraidVisible: (visible: boolean) => void;
      setFrameVisible: (visible: boolean) => void;
      getPhysicsState: () => {
        activeTime: number;
        rootYawDegrees: number;
        contact: number[];
        braidVisible: boolean;
        frameVisible: boolean;
        mirrorCount: number;
      };
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
      const setSourceFrame = (frame: number) => {
        daveScene.renderAt(sourceFrameToActiveTime(frame));
      };
      window.__DAVE_QA__ = {
        ready: true,
        setTime: (seconds) => daveScene.renderAt(seconds),
        setSourceFrame,
        // Backwards-compatible synthetic 30 fps control. Canonical video
        // anchors must use setSourceFrame() so recorder duplication is removed.
        setFrame: (frame) => daveScene.renderAt(frame / 30),
        setBraidVisible: (visible) => daveScene.setBraidVisible(visible),
        setFrameVisible: (visible) => daveScene.setFrameVisible(visible),
        getPhysicsState: () => daveScene.getPhysicsState(),
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
        aria-label="A mirrored cube with one iridescent seven-strand figure-eight cable rotates above a dark checkerboard floor."
      />
      <p className="dave-description">
        A mirrored cube with one iridescent seven-strand figure-eight cable rotates above a dark checkerboard floor.
      </p>
    </main>
  );
}
