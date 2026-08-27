import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Flag,
  MessageSquareMore,
  RotateCcw,
  ScanLine,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  INITIAL_INCIDENT_STATE,
  type IncidentOption,
  type IncidentState,
  type ResponseStyle,
  responseProfiles,
  runawayAgentIncident,
} from "./incident-v03-data";
import "./incident-challenge-v03.css";

type Phase = "launch" | "decision" | "consequence" | "result";

type ChoiceRecord = {
  stageId: string;
  stageTitle: string;
  option: IncidentOption;
};

const challengeUrl = "https://data3-cisco-live.vercel.app/2026alpha";
const stateLabels: Record<keyof IncidentState, string> = {
  service: "Service",
  containment: "Containment",
  evidence: "Evidence",
  governance: "Governance",
};

function applyEffects(state: IncidentState, effects: IncidentState): IncidentState {
  return Object.fromEntries(
    (Object.keys(state) as Array<keyof IncidentState>).map((key) => [
      key,
      Math.max(0, Math.min(100, state[key] + effects[key])),
    ]),
  ) as IncidentState;
}

function responseStyleFor(choices: ChoiceRecord[], score: number): ResponseStyle {
  const counts = choices.reduce<Record<ResponseStyle, number>>(
    (result, choice) => ({ ...result, [choice.option.style]: result[choice.option.style] + 1 }),
    { adaptive: 0, rapid: 0, evidence: 0, controlled: 0 },
  );
  const highestCount = Math.max(...Object.values(counts));

  if (score >= 86 || highestCount <= 2) return "adaptive";

  const tied = (Object.keys(counts) as ResponseStyle[]).filter((style) => counts[style] === highestCount);
  const finalStyle = choices.at(-1)?.option.style;
  return finalStyle && tied.includes(finalStyle) ? finalStyle : tied[0];
}

export default function IncidentChallengeV03() {
  const [phase, setPhase] = useState<Phase>("launch");
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<IncidentOption | null>(null);
  const [incidentState, setIncidentState] = useState<IncidentState>(INITIAL_INCIDENT_STATE);
  const [choices, setChoices] = useState<ChoiceRecord[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeType, setChallengeType] = useState("Scenario logic");
  const [challengeText, setChallengeText] = useState("");
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const stages = runawayAgentIncident.stages;
  const stage = stages[stageIndex];
  const score = useMemo(() => choices.reduce((total, choice) => total + choice.option.points, 0), [choices]);
  const responseStyle = responseStyleFor(choices, score);
  const profile = responseProfiles[responseStyle];

  useEffect(() => {
    document.title = "Incident challenge | Cisco Live 2026 | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "Make five connected decisions in a Data#3 Cisco Live 2026 incident challenge.",
    );
  }, []);

  useEffect(() => {
    if (phase !== "launch") {
      window.scrollTo({ top: 0, behavior: "auto" });
      window.requestAnimationFrame(() => headingRef.current?.focus());
    }
  }, [phase, stageIndex]);

  const reset = () => {
    setStageIndex(0);
    setSelectedOption(null);
    setIncidentState(INITIAL_INCIDENT_STATE);
    setChoices([]);
    setStartedAt(null);
    setElapsedSeconds(0);
    setChallengeOpen(false);
    setChallengeText("");
    setChallengeSubmitted(false);
  };

  const start = () => {
    reset();
    setStartedAt(Date.now());
    setPhase("decision");
  };

  const exit = () => {
    reset();
    setPhase("launch");
  };

  const choose = (option: IncidentOption) => {
    if (selectedOption) return;
    setSelectedOption(option);
    setIncidentState((current) => applyEffects(current, option.effects));
    setChoices((current) => [
      ...current,
      { stageId: stage.id, stageTitle: stage.title, option },
    ]);
    setPhase("consequence");
  };

  const continueIncident = () => {
    if (stageIndex === stages.length - 1) {
      setElapsedSeconds(Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 1000)));
      setPhase("result");
      return;
    }
    setSelectedOption(null);
    setStageIndex((current) => current + 1);
    setPhase("decision");
  };

  const submitChallenge = () => {
    if (!challengeText.trim()) return;
    setChallengeSubmitted(true);
  };

  const stageContext = typeof stage?.context === "function" ? stage.context(incidentState) : stage?.context;

  return (
    <div className="incident-page">
      <div className="incident-grid" aria-hidden="true" />
      <header className="incident-header">
        <a className="incident-brand" href="/" aria-label="Data#3 home">
          <img src="/Data3_Logo_Blue_Blue_Boxed-01.png" alt="Data#3" />
        </a>
        {phase === "launch" ? (
          <span className="incident-status"><span />Validation build · v0.3</span>
        ) : (
          <button className="incident-exit" type="button" onClick={exit}>
            <X aria-hidden="true" /> Exit challenge
          </button>
        )}
      </header>

      {phase === "launch" && (
        <main className="incident-launch">
          <section className="incident-launch__story" aria-labelledby="incident-launch-title">
            <p className="incident-kicker">Cisco Live 2026 · Engineering challenge</p>
            <h1 id="incident-launch-title">Can you contain the incident?</h1>
            <p className="incident-lead">Make the calls. Manage the trade-offs. See the consequences.</p>

            <div className="incident-facts" aria-label="Challenge details">
              <span><strong>5</strong> connected decisions</span>
              <span><Clock3 aria-hidden="true" /> Under two minutes</span>
              <span><ScanLine aria-hidden="true" /> Scenario adapts</span>
            </div>

            <aside className="incident-learning">
              <strong>What you will practise</strong>
              <p>{runawayAgentIncident.learning}</p>
            </aside>
          </section>

          <aside className="incident-launch__action" aria-labelledby="incident-assignment-title">
            <p className="incident-kicker">Your assignment</p>
            <h2 id="incident-assignment-title">{runawayAgentIncident.title}</h2>
            <p>{runawayAgentIncident.premise}</p>
            <p className="incident-no-perfect">There is no consequence-free answer. Choose the response you can defend.</p>
            <button className="incident-primary" type="button" onClick={start}>
              Start challenge <ArrowRight aria-hidden="true" />
            </button>

            <a className="incident-mobile-qr" href={challengeUrl} aria-label="Open this challenge on your mobile">
              <span aria-hidden="true">
                <QRCodeSVG
                  value={challengeUrl}
                  size={144}
                  level="H"
                  marginSize={4}
                  bgColor="#ffffff"
                  fgColor="#000025"
                  title="QR code for the Cisco Live 2026 incident challenge"
                />
              </span>
              <span><strong>Move to mobile</strong><small>Scan the live challenge</small></span>
            </a>
          </aside>

          <a className="incident-archive-link" href="/2026alpha/archive">View earlier prototype versions</a>
        </main>
      )}

      {(phase === "decision" || phase === "consequence") && stage && (
        <main className="incident-game">
          <div className="incident-progress-row">
            <span>Decision {stageIndex + 1} of {stages.length}</span>
            <span>{runawayAgentIncident.title}</span>
          </div>
          <div className="incident-progress" aria-label={`Decision ${stageIndex + 1} of ${stages.length}`}>
            <span style={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }} />
          </div>

          {phase === "decision" && (
            <section className="incident-decision" aria-labelledby="incident-decision-title">
              <p className="incident-kicker">{stage.label}</p>
              <h1 id="incident-decision-title" ref={headingRef} tabIndex={-1}>{stage.title}</h1>
              <p className="incident-context">{stageContext}</p>
              <h2>{stage.question}</h2>
              <div className="incident-options" aria-label="Choose one response">
                {stage.options.map((option, index) => (
                  <button type="button" key={option.id} onClick={() => choose(option)}>
                    <span>{String.fromCharCode(65 + index)}</span>
                    <strong>{option.action}</strong>
                    <ArrowRight aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {phase === "consequence" && selectedOption && (
            <section className="incident-consequence" aria-labelledby="incident-consequence-title">
              <p className="incident-kicker">Consequence · {selectedOption.id}</p>
              <h1 id="incident-consequence-title" ref={headingRef} tabIndex={-1}>The system responds.</h1>
              <p>{selectedOption.consequence}</p>
              <div className="incident-signals" aria-label="What changed">
                {selectedOption.signals.map((signal) => <span key={signal}>{signal}</span>)}
              </div>
              <div className="incident-consequence__actions">
                <button className="incident-primary" type="button" onClick={continueIncident}>
                  {stageIndex === stages.length - 1 ? "See your incident result" : "Continue incident"}
                  <ArrowRight aria-hidden="true" />
                </button>
                <button className="incident-secondary" type="button" onClick={exit}>Exit challenge</button>
              </div>
            </section>
          )}
        </main>
      )}

      {phase === "result" && (
        <main className="incident-result">
          <section className="incident-result__summary" aria-labelledby="incident-result-title">
            <p className="incident-kicker">Incident contained · Your result</p>
            <h1 id="incident-result-title" ref={headingRef} tabIndex={-1}>{profile.title}</h1>
            <p className="incident-result__qualifier">Your response style in this incident.</p>

            <div className="incident-scoreline">
              <div><strong>{score}</strong><span>/ 100</span><small>Decision quality</small></div>
              <div><strong>{elapsedSeconds}</strong><span>sec</span><small>Response time</small></div>
            </div>

            <div className="incident-profile-copy">
              <div><Check aria-hidden="true" /><p><strong>Your strength</strong>{profile.strength}</p></div>
              <div><Flag aria-hidden="true" /><p><strong>Your trade-off</strong>{profile.tradeoff}</p></div>
            </div>

            <p className="incident-result__principle">Built with AI. Improved by the people who play it.</p>
          </section>

          <aside className="incident-result__state" aria-labelledby="incident-state-title">
            <p className="incident-kicker">End state</p>
            <h2 id="incident-state-title">What your decisions protected.</h2>
            <div className="incident-state-bars">
              {(Object.keys(incidentState) as Array<keyof IncidentState>).map((key) => (
                <div key={key}>
                  <span><strong>{stateLabels[key]}</strong><b>{incidentState[key]}</b></span>
                  <div><i style={{ width: `${incidentState[key]}%` }} /></div>
                </div>
              ))}
            </div>

            <div className="incident-path" aria-label="Your five decisions">
              <strong>Your path</strong>
              <div>{choices.map((choice) => <span key={choice.stageId}>{choice.option.id}</span>)}</div>
            </div>

            <div className="incident-related">
              <span>Related engineering theme</span>
              <strong>Agents, commands and guardrails</strong>
            </div>

            <div className="incident-result__actions">
              <button className="incident-primary" type="button" onClick={start}>
                <RotateCcw aria-hidden="true" /> Replay this incident
              </button>
              <button className="incident-secondary" type="button" onClick={() => setChallengeOpen((open) => !open)}>
                <MessageSquareMore aria-hidden="true" /> Challenge the scenario
              </button>
            </div>
          </aside>

          {challengeOpen && (
            <section className="incident-challenge-panel" aria-labelledby="challenge-scenario-title">
              <p className="incident-kicker">Prototype feedback</p>
              <h2 id="challenge-scenario-title">What would you challenge?</h2>
              <p>Tell us where the scenario, consequence or technical logic needs to be stronger. Do not include confidential information.</p>
              {!challengeSubmitted ? (
                <>
                  <div className="incident-challenge-types" aria-label="Feedback type">
                    {["Scenario logic", "Technical accuracy", "Wording or clarity", "Other"].map((type) => (
                      <button
                        className={challengeType === type ? "is-selected" : ""}
                        type="button"
                        key={type}
                        onClick={() => setChallengeType(type)}
                        aria-pressed={challengeType === type}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <label htmlFor="incident-challenge-text">Your challenge</label>
                  <textarea
                    id="incident-challenge-text"
                    value={challengeText}
                    onChange={(event) => setChallengeText(event.target.value)}
                    rows={4}
                    placeholder="What would a stronger or more realistic scenario do differently?"
                  />
                  <button className="incident-primary" type="button" onClick={submitChallenge} disabled={!challengeText.trim()}>
                    Keep with this result <ArrowRight aria-hidden="true" />
                  </button>
                  <small>This validation build does not send or save feedback.</small>
                </>
              ) : (
                <div className="incident-challenge-confirmation" role="status">
                  <Check aria-hidden="true" />
                  <div><strong>Challenge held on this screen.</strong><p>It has not been sent or saved in this validation build.</p></div>
                </div>
              )}
            </section>
          )}
        </main>
      )}
    </div>
  );
}
