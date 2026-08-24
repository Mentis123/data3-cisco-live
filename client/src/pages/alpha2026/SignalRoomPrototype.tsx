import { useMemo, useState } from "react";
import { ArrowRight, Eye, Network, RotateCcw } from "lucide-react";
import { BriefScreen, ChallengePrelude } from "./ChallengePrelude";
import { ChallengePanel, PrototypeShell } from "./PrototypeShell";

type SignalRole = "early" | "connect" | "context";

interface Signal {
  text: string;
  role: SignalRole;
}

interface Lens {
  name: string;
  short: string;
  prompt: string;
  signals: Signal[];
}

const lenses: Lens[] = [
  {
    name: "Network operations",
    short: "Network",
    prompt: "Which network signal deserves the room’s attention?",
    signals: [
      { text: "Regional edge latency climbed before the first service alert.", role: "early" },
      { text: "One routing path changed as the AI workflow began retrying.", role: "connect" },
      { text: "Healthy sites share the same policy but not the same uplink profile.", role: "context" },
    ],
  },
  {
    name: "Security operations",
    short: "Security",
    prompt: "Which security signal changes the investigation?",
    signals: [
      { text: "A service identity requested a privilege it has never used before.", role: "early" },
      { text: "The request followed an untrusted instruction entering agent context.", role: "connect" },
      { text: "The identity is shared by three unrelated automations.", role: "context" },
    ],
  },
  {
    name: "Application experience",
    short: "Application",
    prompt: "Which application signal would you elevate?",
    signals: [
      { text: "Customer task completion dropped while availability stayed green.", role: "early" },
      { text: "Every failed task touches the same agent-managed dependency.", role: "connect" },
      { text: "Synthetic tests do not use the identity path affected in production.", role: "context" },
    ],
  },
  {
    name: "Edge and infrastructure",
    short: "Edge",
    prompt: "Which edge observation matters most?",
    signals: [
      { text: "One regional site stopped sending trusted telemetry seven minutes ago.", role: "early" },
      { text: "The silence began immediately after an automated policy update.", role: "connect" },
      { text: "The site runs a different hardware generation from the test environment.", role: "context" },
    ],
  },
  {
    name: "Cloud and AI platform",
    short: "AI platform",
    prompt: "Which platform signal should connect the room?",
    signals: [
      { text: "Token use increased twelvefold without a matching rise in requests.", role: "early" },
      { text: "The same remediation was attempted 186 times across two regions.", role: "connect" },
      { text: "The retry policy has no spend cap or human escalation threshold.", role: "context" },
    ],
  },
  {
    name: "Risk and compliance",
    short: "Compliance",
    prompt: "Which evidence matters for the accountable response?",
    signals: [
      { text: "The reporting window has started, but the evidence bundle is incomplete.", role: "early" },
      { text: "Agent actions and infrastructure changes use different audit clocks.", role: "connect" },
      { text: "The current response plan names a system owner, not an AI decision owner.", role: "context" },
    ],
  },
  {
    name: "Customer and service",
    short: "Customer",
    prompt: "Which customer signal gives the room its purpose?",
    signals: [
      { text: "A critical user journey is slow even though the SLA remains green.", role: "early" },
      { text: "The affected customers all depend on the same regional edge service.", role: "connect" },
      { text: "The next service window is six hours away; the customer cannot wait.", role: "context" },
    ],
  },
];

const supportSignals = [
  { lens: "Network", text: "Regional edge latency climbed before the first service alert." },
  { lens: "Security", text: "A shared service identity requested new privilege." },
  { lens: "Application", text: "Customer task completion fell before availability changed." },
  { lens: "Edge", text: "Trusted telemetry disappeared after a policy update." },
  { lens: "AI platform", text: "The same remediation ran 186 times." },
  { lens: "Compliance", text: "The incident evidence clocks do not align." },
  { lens: "Customer", text: "One critical journey cannot wait for the next window." },
];

const roleCopy: Record<SignalRole, { title: string; summary: string }> = {
  early: {
    title: "Early-warning spotter",
    summary: "You noticed the weak signal before the system declared an incident. Teams need this instinct when dashboards lag behind reality.",
  },
  connect: {
    title: "Evidence connector",
    summary: "You chose the clue that links technical domains. The room moves when separate observations become one defensible story.",
  },
  context: {
    title: "Operational context maker",
    summary: "You surfaced the constraint that changes what a safe response looks like. Context stops a technically correct action becoming the wrong outcome.",
  },
};

const signalRoomBrief: [BriefScreen, BriefScreen, BriefScreen, BriefScreen] = [
  {
    label: "01 · Problem",
    question: "What is happening today that is broken, difficult, risky, slow, or limiting?",
    title: "Every dashboard can be right while the shared picture is wrong.",
    body: "Enterprise incidents increasingly cross network, security, application, edge, cloud, AI, compliance, and customer domains. Each team sees a valid signal, but no single view explains the outcome.",
  },
  {
    label: "02 · Audience impact",
    question: "What does that problem mean for enterprise and corporate engineers?",
    title: "Engineers lose time assembling the truth.",
    body: "Specialist teams are accountable for fast, defensible decisions, but their evidence often arrives through different tools, clocks, and ownership models.",
    points: [
      "They must decide which weak signal deserves attention before a formal alert exists.",
      "They carry the friction of manual correlation while customer impact continues.",
      "They risk treating a cross-domain failure as a local technology problem.",
    ],
  },
  {
    label: "03 · Why it matters now",
    question: "Why does this require attention now rather than later?",
    title: "AI makes the environment faster and more connected.",
    body: "AI workflows can act across Cisco infrastructure and enterprise platforms at machine speed. Telemetry volume is rising, dependencies are multiplying, and reporting windows do not pause while teams reconcile their tools. Shared context is becoming an engineering control, not a meeting outcome.",
  },
  {
    label: "04 · Desired outcome",
    question: "What should become true?",
    title: "Weak signals become one timely, defensible picture.",
    body: "Teams can contribute their specialist evidence quickly, connect it across domains, and act on the customer outcome with a shared understanding of risk.",
    learn: [
      "Distinguish a useful weak signal from background noise.",
      "See how specialist observations reveal a system-level incident.",
      "Recognise whether you contribute early warning, connecting evidence, or operational context.",
    ],
  },
];

export default function SignalRoomPrototype() {
  const [phase, setPhase] = useState<"intro" | "choose" | "room" | "result">("intro");
  const [lensIndex, setLensIndex] = useState(0);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [revealed, setRevealed] = useState(false);

  const lens = lenses[lensIndex];
  const role = selected ? roleCopy[selected.role] : null;
  const visibleSupport = useMemo(
    () => supportSignals.filter((signal) => signal.lens !== lens.short),
    [lens.short],
  );

  function enterRoom() {
    setLensIndex(Math.floor(Math.random() * lenses.length));
    setSelected(null);
    setRevealed(false);
    setPhase("choose");
  }

  function restart() {
    setPhase("intro");
    setSelected(null);
    setRevealed(false);
  }

  return (
    <PrototypeShell
      code="signal"
      concept="The Signal Room"
      title="One clue is noise. Seven clues are a system."
      description="Take one operational lens, elevate one signal, and discover the incident that only a connected room can see."
      progress={phase === "choose" ? "Choose one of three signals" : phase === "room" ? "Shared picture forming" : undefined}
      briefing={phase === "intro"}
    >
      {phase === "intro" && (
        <ChallengePrelude
          concept="The Signal Room"
          storageKey="signal-room"
          screens={signalRoomBrief}
          startLabel="Enter the room"
          onComplete={enterRoom}
        />
      )}

      {phase === "choose" && (
        <section className="prototype-stage signal-lens">
          <div className="signal-lens__badge"><Eye aria-hidden="true" /><span>Your lens</span><strong>{lens.name}</strong></div>
          <p className="alpha-kicker">Observe before you solve</p>
          <h2>{lens.prompt}</h2>
          <div className="prototype-choice-list">
            {lens.signals.map((signal, index) => (
              <button
                type="button"
                className={`prototype-choice signal-choice ${selected === signal ? "is-selected" : ""}`}
                key={signal.text}
                onClick={() => setSelected(signal)}
              >
                <span>0{index + 1}</span>
                {signal.text}
              </button>
            ))}
          </div>
          <button className="prototype-primary" type="button" disabled={!selected} onClick={() => setPhase("room")}>
            Send to the room <Network aria-hidden="true" />
          </button>
        </section>
      )}

      {phase === "room" && selected && (
        <section className="prototype-stage signal-room">
          <div className="signal-room__header">
            <div><p className="alpha-kicker">Live signal field</p><h2>The room is building the picture.</h2></div>
            <span>7 lenses connected</span>
          </div>
          <p className="signal-room__note">Six supporting participants are simulated in this alpha.</p>
          <div className={`signal-field ${revealed ? "is-revealed" : ""}`}>
            <article className="signal-core">
              <Network aria-hidden="true" />
              <strong>{revealed ? "Incident Emerald" : "Unknown pattern"}</strong>
              <span>{revealed ? "Connected evidence" : "Waiting for context"}</span>
            </article>
            <article className="signal-node signal-node--user">
              <span>Your {lens.short} signal</span><p>{selected.text}</p>
            </article>
            {visibleSupport.map((signal) => (
              <article className="signal-node" key={`${signal.lens}-${signal.text}`}>
                <span>{signal.lens}</span><p>{signal.text}</p>
              </article>
            ))}
          </div>
          {!revealed ? (
            <button className="prototype-primary" type="button" onClick={() => setRevealed(true)}>
              Reveal the connected picture <ArrowRight aria-hidden="true" />
            </button>
          ) : (
            <div className="signal-reveal" role="status">
              <p className="alpha-kicker">The shared picture</p>
              <p>A green dashboard is showing the last known state while an AI workflow retries with a broadly privileged identity. An edge policy difference turns the retry into customer impact—and the reporting clock is already running.</p>
              <button className="prototype-primary" type="button" onClick={() => setPhase("result")}>
                See your contribution <ArrowRight aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      )}

      {phase === "result" && role && selected && (
        <section className="prototype-stage prototype-result signal-result">
          <p className="alpha-kicker">Your contribution</p>
          <h2>{role.title}</h2>
          <p>{role.summary}</p>
          <blockquote>“{selected.text}”</blockquote>
          <div className="prototype-result__insight">
            <span>Engineering insight</span>
            Observability creates value when teams can correlate signals across infrastructure, security, applications, AI, risk, and customer experience.
          </div>
          <div className="prototype-actions">
            <button className="prototype-primary" type="button" onClick={restart}><RotateCcw aria-hidden="true" /> Take another lens</button>
            <a className="prototype-secondary" href="?brief=1">Review the challenge</a>
            <a className="prototype-secondary" href="/2026alpha">Compare all concepts</a>
          </div>
          <ChallengePanel context="Signal Room result" />
        </section>
      )}
    </PrototypeShell>
  );
}
