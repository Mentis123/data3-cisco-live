import { CSSProperties, useMemo, useState } from "react";
import { Activity, ArrowRight, FileSearch, RotateCcw, ShieldCheck, TimerReset } from "lucide-react";
import { BriefScreen, ChallengePrelude } from "./ChallengePrelude";
import { ChallengePanel, PrototypeShell } from "./PrototypeShell";

type SignalKey = "service" | "trust" | "evidence" | "time";
type Signals = Record<SignalKey, number>;

interface CascadeChoice {
  label: string;
  consequence: string;
  effects: Partial<Signals>;
  trait: "evidence" | "resilience" | "decisive" | "systems" | "collaborative";
}

interface CascadeDecision {
  label: string;
  signal: string;
  prompt: string;
  choices: CascadeChoice[];
}

const cascadeDecisions: CascadeDecision[] = [
  {
    label: "Signal 01 · The gap",
    signal: "The customer dashboard is green. Splunk has received no trusted telemetry from one regional edge site for seven minutes.",
    prompt: "What happens first?",
    choices: [
      {
        label: "Freeze automated changes and validate the telemetry path",
        consequence: "The agent stops altering the scene. Recovery slows, but the evidence trail remains intact and the blind spot becomes explicit.",
        effects: { service: -8, trust: 10, evidence: 18, time: -9 },
        trait: "evidence",
      },
      {
        label: "Restart the affected edge stack immediately",
        consequence: "Telemetry returns quickly. The restart removes volatile evidence, and the reason for the agent’s behaviour is still unknown.",
        effects: { service: 17, trust: -6, evidence: -17, time: 10 },
        trait: "decisive",
      },
      {
        label: "Hold changes and ask the site team to verify conditions",
        consequence: "Local knowledge enters the response. The wait protects against a blind action, while pressure continues to build.",
        effects: { service: -5, trust: 7, evidence: 8, time: -14 },
        trait: "collaborative",
      },
    ],
  },
  {
    label: "Signal 02 · The retry storm",
    signal: "The AI agent has attempted the same remediation 186 times using a broadly privileged identity. Latency is rising at two neighbouring sites.",
    prompt: "How do you contain it?",
    choices: [
      {
        label: "Disable the service identity everywhere",
        consequence: "The retry storm ends across the fleet. Several healthy automations stop as well, increasing service pressure beyond the affected region.",
        effects: { service: -12, trust: 17, evidence: 4, time: -5 },
        trait: "decisive",
      },
      {
        label: "Constrain permissions, cap retries, and isolate the workflow",
        consequence: "The blast radius contracts without disabling every automation. The response team gains time to investigate the original trigger.",
        effects: { service: 7, trust: 16, evidence: 10, time: 4 },
        trait: "systems",
      },
      {
        label: "Let it continue while you collect deeper traces",
        consequence: "The evidence becomes richer, but the agent continues consuming resources and the neighbouring sites move closer to impact.",
        effects: { service: -16, trust: -12, evidence: 14, time: -13 },
        trait: "evidence",
      },
    ],
  },
  {
    label: "Signal 03 · Restore with confidence",
    signal: "A known-good policy can restore service. The likely configuration fault is understood, but the reason the agent escalated is not fully proven.",
    prompt: "How do you restore?",
    choices: [
      {
        label: "Push the known-good policy across the whole fleet",
        consequence: "Recovery is fast and consistent. Any hidden difference between sites now shares the same change and potential failure mode.",
        effects: { service: 18, trust: -8, evidence: -5, time: 14 },
        trait: "decisive",
      },
      {
        label: "Restore one observed canary, validate, then expand",
        consequence: "One site recovers under close observation. The evidence supports a controlled expansion with an explicit rollback point.",
        effects: { service: 11, trust: 14, evidence: 13, time: 2 },
        trait: "resilience",
      },
      {
        label: "Remain degraded until the root cause is complete",
        consequence: "No unproven change reaches the fleet. Customers carry the cost of a longer degradation while the investigation reaches certainty.",
        effects: { service: -11, trust: 10, evidence: 16, time: -17 },
        trait: "evidence",
      },
    ],
  },
];

const signalMeta: Array<{ key: SignalKey; label: string; icon: typeof Activity }> = [
  { key: "service", label: "Service", icon: Activity },
  { key: "trust", label: "Trust", icon: ShieldCheck },
  { key: "evidence", label: "Evidence", icon: FileSearch },
  { key: "time", label: "Time", icon: TimerReset },
];

const profileCopy = {
  evidence: ["Evidence guardian", "You protect facts, auditability, and the ability to explain what happened. Your pressure point is the cost of waiting for certainty."],
  resilience: ["Resilience architect", "You restore through bounded change and observable checkpoints. Your pressure point is the complexity added by staged recovery."],
  decisive: ["Decisive contained mover", "You favour momentum and rapid stabilisation. Your pressure point is preserving evidence while the clock is moving."],
  systems: ["Systems investigator", "You reduce blast radius while connecting signals across the stack. Your pressure point is knowing when the picture is complete enough to act."],
  collaborative: ["Collaborative commander", "You bring operational context and ownership into the response. Your pressure point is acting when coordination is slow."],
} as const;

const initialSignals: Signals = { service: 55, trust: 52, evidence: 48, time: 58 };

const cascadeBrief: [BriefScreen, BriefScreen, BriefScreen, BriefScreen] = [
  {
    label: "01 · Problem",
    question: "What is happening today that is broken, difficult, risky, slow, or limiting?",
    title: "AI can act faster than the evidence can keep up.",
    body: "AI operations agents can now change production systems while teams are still establishing what happened. A green dashboard, missing telemetry, and automated retries can create three different versions of the same incident.",
  },
  {
    label: "02 · Audience impact",
    question: "What does that problem mean for enterprise and corporate engineers?",
    title: "Engineering teams inherit the blast radius.",
    body: "The people operating enterprise environments remain accountable for the customer outcome, even when an agent made the change.",
    points: [
      "They must restore service without destroying the evidence needed to explain the incident.",
      "They must decide whether to contain, reverse, or expand a change while technical signals disagree.",
      "They carry the operational cost, audit exposure, and customer friction when a fast response is wrong.",
    ],
  },
  {
    label: "03 · Why it matters now",
    question: "Why does this require attention now rather than later?",
    title: "AI is moving from assistance into action.",
    body: "Agent access is expanding across network, security, edge, cloud, and observability environments. As permissions and dependencies scale, retry costs and potential blast radius compound. The safe response pattern must exist before the next incident, not during it.",
  },
  {
    label: "04 · Desired outcome",
    question: "What should become true?",
    title: "Fast recovery becomes bounded, observable, and explainable.",
    body: "Engineers can act quickly while preserving evidence, containing scope, validating recovery, and retaining a clear rollback point.",
    learn: [
      "See how one technical choice affects service, trust, evidence, and time.",
      "Practise containment, canary recovery, and rollback decisions under pressure.",
      "Recognise the response instinct you bring to an AI-enabled incident.",
    ],
  },
];

export default function CascadePrototype() {
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [step, setStep] = useState(0);
  const [signals, setSignals] = useState<Signals>(initialSignals);
  const [selected, setSelected] = useState<CascadeChoice | null>(null);
  const [traits, setTraits] = useState<CascadeChoice["trait"][]>([]);

  const profile = useMemo(() => {
    const counts = traits.reduce<Record<string, number>>((result, trait) => {
      result[trait] = (result[trait] ?? 0) + 1;
      return result;
    }, {});
    const trait = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "systems") as keyof typeof profileCopy;
    return profileCopy[trait];
  }, [traits]);

  function choose(choice: CascadeChoice) {
    if (selected) return;
    setSelected(choice);
    setTraits((current) => [...current, choice.trait]);
    setSignals((current) => {
      const next = { ...current };
      for (const key of Object.keys(choice.effects) as SignalKey[]) {
        next[key] = Math.max(5, Math.min(95, current[key] + (choice.effects[key] ?? 0)));
      }
      return next;
    });
  }

  function continueJourney() {
    if (step === cascadeDecisions.length - 1) {
      setPhase("result");
      return;
    }
    setStep((current) => current + 1);
    setSelected(null);
  }

  function restart() {
    setPhase("intro");
    setStep(0);
    setSignals(initialSignals);
    setSelected(null);
    setTraits([]);
  }

  const decision = cascadeDecisions[step];
  const progress = phase === "play" ? `Decision ${step + 1} of ${cascadeDecisions.length}` : undefined;

  return (
    <PrototypeShell
      code="cascade"
      concept="Cascade"
      title="Every decision changes the incident."
      description="Take command of Incident Emerald. This compressed alpha tests three representative decisions from the proposed five-decision journey."
      progress={progress}
      briefing={phase === "intro"}
    >
      {phase === "intro" && (
        <ChallengePrelude
          concept="Cascade"
          storageKey="cascade"
          screens={cascadeBrief}
          startLabel="Take command"
          onComplete={() => setPhase("play")}
        />
      )}

      {phase === "play" && decision && (
        <div className="cascade-layout">
          <aside className="cascade-signals" aria-label="Current incident signals">
            {signalMeta.map(({ key, label, icon: Icon }) => (
              <div className="cascade-meter" key={key}>
                <div className="cascade-meter__label"><Icon aria-hidden="true" /><span>{label}</span><strong>{signals[key]}</strong></div>
                <div className="cascade-meter__track"><span style={{ "--meter-value": `${signals[key]}%` } as CSSProperties} /></div>
              </div>
            ))}
          </aside>

          <section className="prototype-stage cascade-decision">
            <p className="alpha-kicker">{decision.label}</p>
            <div className="cascade-signal-copy">{decision.signal}</div>
            <h2>{decision.prompt}</h2>
            <div className="prototype-choice-list">
              {decision.choices.map((choice, index) => (
                <button
                  type="button"
                  className={`prototype-choice ${selected === choice ? "is-selected" : ""}`}
                  key={choice.label}
                  disabled={Boolean(selected)}
                  onClick={() => choose(choice)}
                >
                  <span>0{index + 1}</span>
                  {choice.label}
                </button>
              ))}
            </div>

            {selected && (
              <div className="prototype-consequence" role="status">
                <p className="alpha-kicker">Consequence</p>
                <p>{selected.consequence}</p>
                <button className="prototype-primary" type="button" onClick={continueJourney}>
                  {step === cascadeDecisions.length - 1 ? "See your response profile" : "Continue incident"}
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {phase === "result" && (
        <section className="prototype-stage prototype-result">
          <p className="alpha-kicker">Your response profile</p>
          <h2>{profile[0]}</h2>
          <p>{profile[1]}</p>
          <div className="prototype-result__insight">
            <span>Engineering insight</span>
            A fast action becomes safer when its scope, evidence, expiry, and rollback are explicit.
          </div>
          <div className="prototype-actions">
            <button className="prototype-primary" type="button" onClick={restart}><RotateCcw aria-hidden="true" /> Try another path</button>
            <a className="prototype-secondary" href="?brief=1">Review the challenge</a>
            <a className="prototype-secondary" href="/2026alpha">Compare all concepts</a>
          </div>
          <ChallengePanel context="Cascade result" />
        </section>
      )}
    </PrototypeShell>
  );
}
