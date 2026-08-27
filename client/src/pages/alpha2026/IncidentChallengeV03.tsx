import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  Lightbulb,
  MessageSquareMore,
  RotateCcw,
  ScanLine,
  UserRound,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  type IncidentDefinition,
  type IncidentOption,
  type IncidentState,
  type ResponseStyle,
  incidents,
  responseProfiles,
} from "./incident-v03-data";
import "./incident-challenge-v03.css";

type Phase = "launch" | "decision" | "consequence" | "result";

type ChoiceRecord = {
  stageId: string;
  option: IncidentOption;
};

type PlayRecord = {
  plays: number;
  bestScore: number;
  lastScore: number;
  bestTimeSeconds: number;
};

type PlayHistory = Record<string, PlayRecord>;

const challengeUrl = "https://data3-cisco-live.vercel.app/2026alpha";
const playHistoryKey = "data3-2026alpha-incident-history-v2";
const legacyHistoryKey = "data3-2026alpha-completed-incidents-v1";

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

function responseStyleFor(choices: ChoiceRecord[]): ResponseStyle {
  const counts = choices.reduce<Record<ResponseStyle, number>>(
    (result, choice) => ({ ...result, [choice.option.style]: result[choice.option.style] + 1 }),
    { adaptive: 0, rapid: 0, evidence: 0, controlled: 0 },
  );
  const highestCount = Math.max(...Object.values(counts));

  if (highestCount <= 2) return "adaptive";

  const tied = (Object.keys(counts) as ResponseStyle[]).filter((style) => counts[style] === highestCount);
  const finalStyle = choices.at(-1)?.option.style;
  return finalStyle && tied.includes(finalStyle) ? finalStyle : tied[0];
}

function loadPlayHistory(): PlayHistory {
  if (typeof window === "undefined") return {};

  try {
    const saved = JSON.parse(window.localStorage.getItem(playHistoryKey) ?? "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;

    const legacy = JSON.parse(window.localStorage.getItem(legacyHistoryKey) ?? "[]");
    if (Array.isArray(legacy)) {
      return Object.fromEntries(
        legacy
          .filter((id): id is string => typeof id === "string")
          .map((id) => [id, { plays: 1, bestScore: 0, lastScore: 0, bestTimeSeconds: 0 }]),
      );
    }
  } catch {
    return {};
  }

  return {};
}

function savePlayHistory(history: PlayHistory) {
  try {
    window.localStorage.setItem(playHistoryKey, JSON.stringify(history));
  } catch {
    // The active session still works when storage is unavailable.
  }
}

function firstUnplayed(history: PlayHistory) {
  return incidents.find((incident) => !history[incident.id]) ?? incidents[0];
}

export default function IncidentChallengeV03() {
  const [playHistory, setPlayHistory] = useState<PlayHistory>(() => loadPlayHistory());
  const [selectedIncidentId, setSelectedIncidentId] = useState(() => firstUnplayed(loadPlayHistory()).id);
  const [phase, setPhase] = useState<Phase>("launch");
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<IncidentOption | null>(null);
  const [incidentState, setIncidentState] = useState<IncidentState>(() => firstUnplayed(loadPlayHistory()).initialState);
  const [choices, setChoices] = useState<ChoiceRecord[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeType, setChallengeType] = useState("Scenario logic");
  const [challengeText, setChallengeText] = useState("");
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const incident = incidents.find((candidate) => candidate.id === selectedIncidentId) ?? incidents[0];
  const stage = incident.stages[stageIndex];
  const completedCount = incidents.filter((candidate) => playHistory[candidate.id]).length;
  const nextUnplayedIncident = incidents.find((candidate) => !playHistory[candidate.id]);
  const score = useMemo(() => choices.reduce((total, choice) => total + choice.option.points, 0), [choices]);
  const responseStyle = responseStyleFor(choices);
  const profile = responseProfiles[responseStyle];

  useEffect(() => {
    document.title = "Incident challenge | Cisco Live 2026 | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "Take four fast, connected engineering incident challenges for Cisco Live 2026.",
    );
  }, []);

  useEffect(() => {
    if (phase !== "launch") {
      window.scrollTo({ top: 0, behavior: "auto" });
      window.requestAnimationFrame(() => headingRef.current?.focus());
    }
  }, [phase, stageIndex]);

  const resetPlay = (definition: IncidentDefinition = incident) => {
    setStageIndex(0);
    setSelectedOption(null);
    setIncidentState(definition.initialState);
    setChoices([]);
    setStartedAt(null);
    setElapsedSeconds(0);
    setChallengeOpen(false);
    setChallengeText("");
    setChallengeSubmitted(false);
  };

  const selectIncident = (definition: IncidentDefinition) => {
    setSelectedIncidentId(definition.id);
    resetPlay(definition);
  };

  const startIncident = (definition: IncidentDefinition = incident) => {
    setSelectedIncidentId(definition.id);
    resetPlay(definition);
    setStartedAt(Date.now());
    setPhase("decision");
  };

  const exit = () => {
    resetPlay();
    setPhase("launch");
  };

  const choose = (option: IncidentOption) => {
    if (selectedOption) return;
    setSelectedOption(option);
    setIncidentState((current) => applyEffects(current, option.effects));
    setChoices((current) => [...current, { stageId: stage.id, option }]);
    setPhase("consequence");
  };

  const completeIncident = (seconds: number) => {
    const previous = playHistory[incident.id];
    const nextHistory: PlayHistory = {
      ...playHistory,
      [incident.id]: {
        plays: (previous?.plays ?? 0) + 1,
        bestScore: Math.max(previous?.bestScore ?? 0, score),
        lastScore: score,
        bestTimeSeconds:
          previous?.bestTimeSeconds && previous.bestTimeSeconds > 0
            ? Math.min(previous.bestTimeSeconds, seconds)
            : seconds,
      },
    };
    setPlayHistory(nextHistory);
    savePlayHistory(nextHistory);
  };

  const continueIncident = () => {
    if (stageIndex === incident.stages.length - 1) {
      const seconds = Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 1000));
      setElapsedSeconds(seconds);
      completeIncident(seconds);
      setPhase("result");
      return;
    }
    setSelectedOption(null);
    setStageIndex((current) => current + 1);
    setPhase("decision");
  };

  const startNextUnplayed = () => {
    const next = incidents.find((candidate) => !playHistory[candidate.id]);
    if (next) startIncident(next);
    else setPhase("launch");
  };

  const resetForNewPlayer = () => {
    if (completedCount > 0 && !window.confirm("Clear completed incidents for a new player on this device?")) return;
    try {
      window.localStorage.removeItem(playHistoryKey);
      window.localStorage.removeItem(legacyHistoryKey);
    } catch {
      // Clearing the active React state is sufficient for this session.
    }
    setPlayHistory({});
    selectIncident(incidents[0]);
    setPhase("launch");
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
          <span className="incident-status" aria-label={`Incident series, ${completedCount} of 4 complete`}><span />{completedCount}/4 complete</span>
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
            <p className="incident-lead">Fast choices. Real trade-offs. Consequences that follow.</p>

            <div className="incident-facts" aria-label="Challenge details">
              <span><strong>4</strong> incidents</span>
              <span><strong>5</strong> decisions each</span>
              <span><Clock3 aria-hidden="true" /> Under two minutes</span>
            </div>

            <section className="incident-series" aria-labelledby="incident-series-title">
              <div className="incident-series__heading">
                <h2 id="incident-series-title">Incident series</h2>
                <span>{completedCount} of 4 complete</span>
              </div>
              <div className="incident-series__grid" aria-label="Choose an incident">
                {incidents.map((candidate) => {
                  const record = playHistory[candidate.id];
                  const isSelected = candidate.id === incident.id;
                  return (
                    <button
                      className={`incident-series-card ${record ? "is-complete" : ""} ${isSelected ? "is-selected" : ""}`}
                      type="button"
                      key={candidate.id}
                      onClick={() => selectIncident(candidate)}
                      aria-pressed={isSelected}
                    >
                      <span>{record ? <CheckCircle2 aria-hidden="true" /> : candidate.number}</span>
                      <div><strong>{candidate.title}</strong><small>{candidate.theme}</small></div>
                      <b>{record ? record.bestScore > 0 ? `Best ${record.bestScore}` : "Done" : isSelected ? "Next" : "Unplayed"}</b>
                    </button>
                  );
                })}
              </div>
              {completedCount > 0 && (
                <button className="incident-new-player" type="button" onClick={resetForNewPlayer}>
                  <UserRound aria-hidden="true" /> New player on this device
                </button>
              )}
            </section>
          </section>

          <aside className="incident-launch__action" aria-labelledby="incident-assignment-title">
            <p className="incident-kicker">Incident {incident.number} · {playHistory[incident.id] ? "Replay" : "Next up"}</p>
            <h2 id="incident-assignment-title">{incident.title}</h2>
            <p className="incident-theme">{incident.theme}</p>
            <p>{incident.premise}</p>
            <aside className="incident-learning">
              <strong>What you will practise</strong>
              <p>{incident.learning}</p>
            </aside>
            <p className="incident-no-perfect">No consequence-free answer. Choose the response you can defend.</p>
            <button className="incident-primary" type="button" onClick={() => startIncident()}>
              {playHistory[incident.id] ? "Replay incident" : "Start incident"} <ArrowRight aria-hidden="true" />
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
            <span>Decision {stageIndex + 1} of {incident.stages.length}</span>
            <span>{incident.number} · {incident.title}</span>
          </div>
          <div
            className="incident-progress"
            role="progressbar"
            aria-label="Incident progress"
            aria-valuemin={1}
            aria-valuemax={incident.stages.length}
            aria-valuenow={stageIndex + 1}
          >
            <span style={{ width: `${((stageIndex + 1) / incident.stages.length) * 100}%` }} />
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
              <div className="incident-consequence__update" role="status" aria-live="polite" aria-atomic="true">
                <p className="incident-kicker">Consequence · {selectedOption.id}</p>
                <h1 id="incident-consequence-title" ref={headingRef} tabIndex={-1}>The system responds.</h1>
                <p>{selectedOption.consequence}</p>
                <div className="incident-signals" aria-label="What changed">
                  {selectedOption.signals.map((signal) => <span key={signal}>{signal}</span>)}
                </div>
                <div className="incident-takeaway"><Lightbulb aria-hidden="true" /><p><strong>Engineering principle</strong>{stage.takeaway}</p></div>
              </div>
              <div className="incident-consequence__actions">
                <button className="incident-primary" type="button" onClick={continueIncident}>
                  {stageIndex === incident.stages.length - 1 ? "See your result" : "Continue incident"}
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
            <p className="incident-kicker">Incident {incident.number} contained · {completedCount}/4 complete</p>
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
                  <div aria-hidden="true"><i style={{ width: `${incidentState[key]}%` }} /></div>
                </div>
              ))}
            </div>

            <div className="incident-path" aria-label="Your five decisions">
              <strong>Your path</strong>
              <div>{choices.map((choice) => <span key={choice.stageId}>{choice.option.id}</span>)}</div>
            </div>

            <div className="incident-related">
              <span>{incident.theme}</span>
              <strong>{incident.debrief}</strong>
            </div>

            <div className="incident-result__actions">
              {nextUnplayedIncident ? (
                <button className="incident-primary" type="button" onClick={startNextUnplayed}>
                  Next unplayed incident <ArrowRight aria-hidden="true" />
                </button>
              ) : (
                <button className="incident-primary" type="button" onClick={exit}>
                  View completed series <CheckCircle2 aria-hidden="true" />
                </button>
              )}
              <button className="incident-secondary" type="button" onClick={() => setChallengeOpen((open) => !open)}>
                <MessageSquareMore aria-hidden="true" /> Challenge this scenario
              </button>
              <div className="incident-result__quiet-actions">
                <button type="button" onClick={() => startIncident()}><RotateCcw aria-hidden="true" /> Replay</button>
                <button type="button" onClick={exit}><ScanLine aria-hidden="true" /> Incident series</button>
              </div>
            </div>
          </aside>

          {challengeOpen && (
            <section className="incident-challenge-panel" aria-labelledby="challenge-scenario-title">
              <p className="incident-kicker">Prototype feedback</p>
              <h2 id="challenge-scenario-title">What would you challenge?</h2>
              <p>Flag unrealistic logic, technical accuracy, or wording. Do not include confidential information.</p>
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
                    placeholder="What would a stronger scenario do differently?"
                  />
                  <button className="incident-primary" type="button" onClick={submitChallenge} disabled={!challengeText.trim()}>
                    Keep with this result <ArrowRight aria-hidden="true" />
                  </button>
                  <small>This prototype does not send or save feedback.</small>
                </>
              ) : (
                <div className="incident-challenge-confirmation" role="status">
                  <Check aria-hidden="true" />
                  <div><strong>Challenge held on this screen.</strong><p>It has not been sent or saved.</p></div>
                </div>
              )}
            </section>
          )}
        </main>
      )}
    </div>
  );
}
