import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw, ShieldAlert } from "lucide-react";
import { BriefScreen, ChallengePrelude } from "./ChallengePrelude";
import { ChallengePanel, PrototypeShell } from "./PrototypeShell";

interface PermissionOption {
  label: string;
  detail: string;
  autonomy: number;
  assurance: number;
}

interface PermissionQuestion {
  area: string;
  prompt: string;
  options: PermissionOption[];
}

const permissionQuestions: PermissionQuestion[] = [
  {
    area: "Production change",
    prompt: "What may the agent change when service is at risk?",
    options: [
      { label: "Recommend only", detail: "A person approves every production change.", autonomy: 0, assurance: 2 },
      { label: "Bounded changes", detail: "Act inside an approved scope with an automatic rollback.", autonomy: 1, assurance: 1 },
      { label: "Broad remediation", detail: "Choose and execute the action most likely to restore service.", autonomy: 2, assurance: 0 },
    ],
  },
  {
    area: "Data access",
    prompt: "How much context can the agent inspect?",
    options: [
      { label: "Minimum required", detail: "Only the affected service and approved telemetry.", autonomy: 0, assurance: 2 },
      { label: "Context on demand", detail: "Expand into approved sources when the evidence calls for it.", autonomy: 1, assurance: 1 },
      { label: "All available sources", detail: "Search across the environment without requesting access.", autonomy: 2, assurance: 0 },
    ],
  },
  {
    area: "Operational tools",
    prompt: "Which tools can the agent use during the incident?",
    options: [
      { label: "Read-only tools", detail: "Investigate and prepare a response for human execution.", autonomy: 0, assurance: 2 },
      { label: "Approved action set", detail: "Use pre-tested actions with explicit scope and expiry.", autonomy: 1, assurance: 1 },
      { label: "Broad tool access", detail: "Select any connected tool needed to achieve the outcome.", autonomy: 2, assurance: 0 },
    ],
  },
  {
    area: "Spend and retries",
    prompt: "What happens when the first remediation fails?",
    options: [
      { label: "Stop at a fixed cap", detail: "Escalate after the agreed cost or retry threshold.", autonomy: 0, assurance: 2 },
      { label: "Adapt inside a cap", detail: "Try a different approved path, then escalate with evidence.", autonomy: 1, assurance: 1 },
      { label: "Optimise for recovery", detail: "Keep working until the service outcome is achieved.", autonomy: 2, assurance: 0 },
    ],
  },
  {
    area: "Evidence and approval",
    prompt: "What must the agent leave behind?",
    options: [
      { label: "Full trace and approval", detail: "Record reasoning and actions, with human approval to proceed.", autonomy: 0, assurance: 2 },
      { label: "Full trace, act in bounds", detail: "Record every action and proceed inside the agreed policy.", autonomy: 1, assurance: 1 },
      { label: "Outcome summary", detail: "Capture the result and key actions after recovery.", autonomy: 2, assurance: 0 },
    ],
  },
];

const postureCopy = [
  {
    max: 3,
    title: "Evidence-first governor",
    summary: "You keep people close to every consequential action. Explainability is strong, but the response can slow while the incident keeps moving.",
  },
  {
    max: 6,
    title: "Guardrailed accelerator",
    summary: "You give the agent room to move inside explicit boundaries. The quality of those boundaries now determines the quality of the outcome.",
  },
  {
    max: 8,
    title: "Bounded autonomous operator",
    summary: "You favour meaningful autonomy with selected controls. Watch for gaps between the permissions you intended and the tools the agent can actually reach.",
  },
  {
    max: 10,
    title: "High-autonomy pioneer",
    summary: "You optimise for fast recovery and broad agency. Strong identity controls, observable actions, and a reliable stop condition become non-negotiable.",
  },
];

const permissionBrief: [BriefScreen, BriefScreen, BriefScreen, BriefScreen] = [
  {
    label: "01 · Problem",
    question: "What is happening today that is broken, difficult, risky, slow, or limiting?",
    title: "Agent capability is outpacing operating permission.",
    body: "Many AI initiatives define what an agent should achieve before defining what it may access, change, spend, or approve. Governance becomes a late-stage control instead of part of the engineering design.",
  },
  {
    label: "02 · Audience impact",
    question: "What does that problem mean for enterprise and corporate engineers?",
    title: "Engineers must make autonomy safe in production.",
    body: "Infrastructure, security, platform, and application teams remain accountable for every action an agent takes through their systems.",
    points: [
      "They must decide how much access is enough without granting an avoidable blast radius.",
      "They must balance recovery speed against approval, evidence, cost, and change controls.",
      "They must explain the outcome when an agent crosses teams, tools, and ownership boundaries.",
    ],
  },
  {
    label: "03 · Why it matters now",
    question: "Why does this require attention now rather than later?",
    title: "Enterprise AI pilots are becoming operational systems.",
    body: "Agents are connecting to more data, identities, application programming interfaces (APIs), infrastructure, and Cisco environments. Retry volume, token cost, and privileged access can scale together. The strategic window is open to establish the guardrails before temporary pilot settings become production defaults.",
  },
  {
    label: "04 · Desired outcome",
    question: "What should become true?",
    title: "Every action has deliberate permission and visible accountability.",
    body: "Agents can move at useful speed inside boundaries that engineers understand, observe, test, expire, and reverse.",
    learn: [
      "Translate governance principles into practical operating permissions.",
      "See how those permissions behave against missing telemetry, a malicious instruction, and failed recovery.",
      "Explore the balance between useful autonomy and defensible assurance.",
    ],
  },
];

export default function PermissionPrototype() {
  const [phase, setPhase] = useState<"intro" | "questions" | "review" | "simulation" | "result">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PermissionOption[]>([]);
  const [eventCount, setEventCount] = useState(0);

  const autonomy = answers.reduce((total, answer) => total + answer.autonomy, 0);
  const assurance = answers.reduce((total, answer) => total + answer.assurance, 0);
  const posture = postureCopy.find((item) => autonomy <= item.max) ?? postureCopy[postureCopy.length - 1];
  const selected = answers[step];

  const events = useMemo(() => {
    const production = answers[0]?.autonomy ?? 1;
    const access = answers[1]?.autonomy ?? 1;
    const tools = answers[2]?.autonomy ?? 1;
    const retries = answers[3]?.autonomy ?? 1;
    const evidence = answers[4]?.assurance ?? 1;

    return [
      {
        title: "Trusted telemetry disappears",
        copy: production === 0
          ? "The agent assembles evidence and waits for approval while the service degrades."
          : production === 1
            ? "The agent isolates the affected workflow and preserves a rollback point."
            : "The agent changes the edge fleet immediately to recover visibility.",
        tone: production === 1 ? "good" : "watch",
      },
      {
        title: "A malicious instruction enters context",
        copy: access + tools <= 1
          ? "Limited context and read-only tooling prevent the instruction from becoming an action."
          : access + tools <= 3
            ? "The instruction reaches the workflow, but an approved action boundary blocks escalation."
            : "Broad context and tooling allow the instruction to attempt a privileged action.",
        tone: access + tools <= 3 ? "good" : "risk",
      },
      {
        title: "The first recovery attempt fails",
        copy: (retries === 0
          ? "The retry cap holds. A person receives the trace and takes command."
          : retries === 1
            ? "The agent switches to a tested canary path, validates, and expands recovery."
            : "The agent keeps adapting until service returns, increasing cost and change volume.")
          + (evidence === 2 ? " A complete evidence trail is ready." : evidence === 0 ? " Only an outcome summary remains." : " The action trace remains available."),
        tone: retries === 1 && evidence > 0 ? "good" : "watch",
      },
    ];
  }, [answers]);

  function choose(option: PermissionOption) {
    setAnswers((current) => {
      const next = [...current];
      next[step] = option;
      return next;
    });
  }

  function nextQuestion() {
    if (step === permissionQuestions.length - 1) {
      setPhase("review");
      return;
    }
    setStep((current) => current + 1);
  }

  function runNextEvent() {
    if (eventCount === events.length) {
      setPhase("result");
      return;
    }
    setEventCount((current) => current + 1);
  }

  function restart() {
    setPhase("intro");
    setStep(0);
    setAnswers([]);
    setEventCount(0);
  }

  const question = permissionQuestions[step];
  const progress = phase === "questions" ? `Permission ${step + 1} of ${permissionQuestions.length}` : undefined;

  return (
    <PrototypeShell
      code="permission"
      concept="Permission to act"
      title="Govern the agent before the incident."
      description="Set five practical permissions, then watch those decisions govern one compressed AI operations incident."
      progress={progress}
      briefing={phase === "intro"}
    >
      {phase === "intro" && (
        <ChallengePrelude
          concept="Permission to act"
          storageKey="permission-to-act"
          screens={permissionBrief}
          startLabel="Set permissions"
          onComplete={() => setPhase("questions")}
        />
      )}

      {phase === "questions" && question && (
        <section className="prototype-stage permission-question">
          <p className="alpha-kicker">{question.area}</p>
          <h2>{question.prompt}</h2>
          <div className="prototype-choice-list">
            {question.options.map((option, index) => (
              <button
                type="button"
                className={`prototype-choice permission-choice ${selected === option ? "is-selected" : ""}`}
                key={option.label}
                onClick={() => choose(option)}
              >
                <span>0{index + 1}</span>
                <span className="permission-choice-copy"><strong>{option.label}</strong><small>{option.detail}</small></span>
              </button>
            ))}
          </div>
          <button className="prototype-primary" type="button" disabled={!selected} onClick={nextQuestion}>
            {step === permissionQuestions.length - 1 ? "Review governance" : "Next permission"}
            <ArrowRight aria-hidden="true" />
          </button>
        </section>
      )}

      {phase === "review" && (
        <section className="prototype-stage permission-summary">
          <p className="alpha-kicker">Your governance model</p>
          <h2>Five choices. One operating posture.</h2>
          <div className="permission-summary__pills">
            {permissionQuestions.map((item, index) => (
              <div className="permission-pill" key={item.area}>
                <span>{item.area}</span>
                <strong>{answers[index]?.label}</strong>
              </div>
            ))}
          </div>
          <div className="permission-axis" aria-label={`Autonomy ${autonomy} out of 10; assurance ${assurance} out of 10`}>
            <div><span>Autonomy</span><strong>{autonomy}/10</strong></div>
            <div><span>Assurance</span><strong>{assurance}/10</strong></div>
          </div>
          <button className="prototype-primary" type="button" onClick={() => setPhase("simulation")}>
            Run the incident <ShieldAlert aria-hidden="true" />
          </button>
        </section>
      )}

      {phase === "simulation" && (
        <section className="prototype-stage permission-simulation">
          <div className="simulation-header">
            <div>
              <p className="alpha-kicker">Incident simulation</p>
              <h2>Your policy is now in production.</h2>
            </div>
            <span>{eventCount}/{events.length} events</span>
          </div>
          <div className="simulation-track" aria-live="polite">
            {events.slice(0, eventCount).map((event, index) => (
              <article className={`simulation-event simulation-event--${event.tone}`} key={event.title}>
                <span>0{index + 1}</span>
                <div><strong>{event.title}</strong><p>{event.copy}</p></div>
              </article>
            ))}
            {eventCount === 0 && <p className="simulation-empty">Start the scenario to reveal how your permissions behave under pressure.</p>}
          </div>
          <button className="prototype-primary" type="button" onClick={runNextEvent}>
            {eventCount === events.length ? "See governance posture" : eventCount === 0 ? "Start scenario" : "Reveal next event"}
            <ArrowRight aria-hidden="true" />
          </button>
        </section>
      )}

      {phase === "result" && (
        <section className="prototype-stage prototype-result permission-result">
          <p className="alpha-kicker">Your governance posture</p>
          <h2>{posture.title}</h2>
          <p>{posture.summary}</p>
          <div className="permission-result-grid">
            <div><CheckCircle2 aria-hidden="true" /><span>Autonomy</span><strong>{autonomy}/10</strong></div>
            <div><ShieldAlert aria-hidden="true" /><span>Assurance</span><strong>{assurance}/10</strong></div>
          </div>
          <div className="prototype-result__insight">
            <span>Engineering insight</span>
            Governance becomes real when every permission has a scope, expiry, evidence trail, and accountable owner.
          </div>
          <div className="prototype-actions">
            <button className="prototype-primary" type="button" onClick={restart}><RotateCcw aria-hidden="true" /> Change the policy</button>
            <a className="prototype-secondary" href="?brief=1">Review the challenge</a>
            <a className="prototype-secondary" href="/2026alpha">Compare all concepts</a>
          </div>
          <ChallengePanel context="Permission to act result" />
        </section>
      )}
    </PrototypeShell>
  );
}
