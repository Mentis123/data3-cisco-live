import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Gift, GraduationCap } from "lucide-react";

export interface BriefScreen {
  label: string;
  question: string;
  title: string;
  body: string;
  points?: string[];
  learn?: string[];
}

interface ChallengePreludeProps {
  concept: string;
  storageKey: string;
  screens: [BriefScreen, BriefScreen, BriefScreen, BriefScreen];
  startLabel: string;
  onComplete: () => void;
}

const preferencePrefix = "data3-2026-show-brief-";

export function ChallengePrelude({ concept, storageKey, screens, startLabel, onComplete }: ChallengePreludeProps) {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [showNextTime, setShowNextTime] = useState(true);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const key = `${preferencePrefix}${storageKey}`;
    const forceBrief = new URLSearchParams(window.location.search).get("brief") === "1";
    const storedPreference = window.localStorage.getItem(key);

    if (storedPreference === "false" && !forceBrief) {
      completeRef.current();
      return;
    }

    setShowNextTime(storedPreference !== "false");
    setReady(true);
  }, [storageKey]);

  function completeBrief() {
    window.localStorage.setItem(`${preferencePrefix}${storageKey}`, String(showNextTime));
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.has("brief")) {
      currentUrl.searchParams.delete("brief");
      window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }
    completeRef.current();
  }

  if (!ready) return null;

  const screen = screens[step];
  const isFinal = step === screens.length - 1;

  return (
    <section className="prototype-stage challenge-prelude" aria-labelledby={`brief-${storageKey}-title`}>
      <div className="challenge-prelude__topline">
        <p className="alpha-kicker">{concept} · Challenge brief · {screen.label}</p>
        <span aria-live="polite">{step + 1} of {screens.length}</span>
      </div>

      <div className="challenge-prelude__progress" aria-hidden="true">
        {screens.map((item, index) => (
          <span className={index <= step ? "is-active" : ""} key={item.label} />
        ))}
      </div>

      <div className="challenge-prelude__content" key={screen.label}>
        <p className="challenge-prelude__question">{screen.question}</p>
        <h1 id={`brief-${storageKey}-title`}>{screen.title}</h1>
        <p>{screen.body}</p>

        {screen.points && (
          <ul className="challenge-prelude__points">
            {screen.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        )}

        {screen.learn && (
          <div className="challenge-prelude__learn">
            <div className="challenge-prelude__learn-heading">
              <GraduationCap aria-hidden="true" />
              <h3>What you’ll learn by playing</h3>
            </div>
            <ul>
              {screen.learn.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="challenge-prelude__reward">
              <Gift aria-hidden="true" />
              <p><strong>At Cisco Live:</strong> Complete the activation to unlock an entry in the draw. This alpha is for testing only and does not submit an entry.</p>
            </div>
          </div>
        )}
      </div>

      <div className="challenge-prelude__footer">
        <label className="challenge-prelude__preference">
          <input
            type="checkbox"
            checked={showNextTime}
            onChange={(event) => setShowNextTime(event.target.checked)}
          />
          <span>Show this introduction next time</span>
        </label>

        <div className="challenge-prelude__actions">
          {step > 0 && (
            <button className="prototype-secondary" type="button" onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft aria-hidden="true" /> Back
            </button>
          )}
          <button
            className="prototype-primary"
            type="button"
            onClick={() => isFinal ? completeBrief() : setStep((current) => current + 1)}
          >
            {isFinal ? startLabel : "Continue"}
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
