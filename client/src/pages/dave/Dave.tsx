import { useEffect, useRef, useState } from "react";
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
        autoRotate: boolean;
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
  const sceneRef = useRef<DaveScene | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const requestedTime = fixedReferenceTime();
    const qaMode = new URLSearchParams(window.location.search).get("qa") === "1";
    const daveScene = new DaveScene(canvas, {
      // The exhibit is intentionally still until the visitor moves the view.
      // QA and `?t=` retain deterministic frame selection.
      fixedTime: requestedTime ?? 0,
      interactiveFraming: !qaMode && requestedTime === undefined,
    });
    sceneRef.current = daveScene;

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
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", resize);
    let settledResizeFrame = 0;
    const settleFrame = window.requestAnimationFrame(() => {
      settledResizeFrame = window.requestAnimationFrame(resize);
    });

    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(settleFrame);
      window.cancelAnimationFrame(settledResizeFrame);
      resizeObserver.disconnect();
      visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
      delete window.__DAVE_QA__;
      sceneRef.current = null;
      daveScene.dispose();
    };
  }, []);

  return (
    <main className="dave-experience">
      <canvas
        ref={canvasRef}
        className="dave-canvas"
        data-dave-canvas
        aria-label="An interactive mirrored cube with one iridescent seven-strand figure-eight cable above a dark checkerboard floor. Drag or swipe in any direction to rotate the view. Use a two-finger drag to slide the view left, right, up, or down; pinch or scroll to zoom."
        title="Drag/swipe to rotate · Two-finger drag to slide · Scroll/pinch to zoom"
      />
      <button
        type="button"
        className="dave-auto-rotate"
        role="switch"
        aria-checked={autoRotate}
        onClick={() => {
          setAutoRotate((current) => {
            const next = !current;
            sceneRef.current?.setAutoRotate(next);
            return next;
          });
        }}
      >
        <span className="dave-auto-rotate__indicator" aria-hidden="true" />
        Auto rotate
      </button>
      <p className="dave-description">
        A mirrored cube with one iridescent seven-strand figure-eight cable above a dark checkerboard floor. Drag or swipe to rotate; use a two-finger drag to slide the view; scroll or pinch to zoom.
      </p>
    </main>
  );
}
