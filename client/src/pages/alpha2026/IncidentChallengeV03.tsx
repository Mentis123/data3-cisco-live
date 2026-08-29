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
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  type IncidentDefinition,
  type IncidentOption,
  type IncidentState,
  type ResponseStyle,
} from "./incident-v03-data";
import {
  incidents as liveIncidents,
  responseProfiles as liveResponseProfiles,
} from "./incident-v04-data";
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
const livePlayHistoryKey = "data3-2026alpha-incident-history-v4";
const legacyHistoryKey = "data3-2026alpha-completed-incidents-v1";

type IncidentChallengeProps = {
  incidentSet?: IncidentDefinition[];
  profiles?: Record<ResponseStyle, { title: string; strength: string; tradeoff: string }>;
  archiveMode?: boolean;
  versionLabel?: string;
};

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

function loadPlayHistory(playHistoryKey: string, migrateLegacy = false): PlayHistory {
  if (typeof window === "undefined") return {};

  try {
    const saved = JSON.parse(window.localStorage.getItem(playHistoryKey) ?? "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;

    if (!migrateLegacy) return {};

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

function savePlayHistory(history: PlayHistory, playHistoryKey: string) {
  try {
    window.localStorage.setItem(playHistoryKey, JSON.stringify(history));
  } catch {
    // The active session still works when storage is unavailable.
  }
}

function assignedUnplayed(
  history: PlayHistory,
  incidentSet: IncidentDefinition[],
  randomise: boolean,
) {
  const unplayed = incidentSet.filter((incident) => !history[incident.id]);
  if (unplayed.length === 0) return undefined;
  return randomise
    ? unplayed[Math.floor(Math.random() * unplayed.length)]
    : unplayed[0];
}

export default function IncidentChallengeV03({
  incidentSet = liveIncidents,
  profiles = liveResponseProfiles,
  archiveMode = false,
  versionLabel = "v0.4",
}: IncidentChallengeProps = {}) {
  const playHistoryKey = archiveMode
    ? `data3-2026alpha-incident-history-${versionLabel}`
    : livePlayHistoryKey;
  const [playHistory, setPlayHistory] = useState<PlayHistory>(() => loadPlayHistory(playHistoryKey, !archiveMode));
  const [selectedIncidentId, setSelectedIncidentId] = useState(() =>
    (assignedUnplayed(playHistory, incidentSet, !archiveMode) ?? incidentSet[0]).id,
  );
  const [phase, setPhase] = useState<Phase>("launch");
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<IncidentOption | null>(null);
  const [incidentState, setIncidentState] = useState<IncidentState>(() =>
    (incidentSet.find((candidate) => candidate.id === selectedIncidentId) ?? incidentSet[0]).initialState,
  );
  const [choices, setChoices] = useState<ChoiceRecord[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const incident = incidentSet.find((candidate) => candidate.id === selectedIncidentId) ?? incidentSet[0];
  const stage = incident.stages[stageIndex];
  const completedCount = incidentSet.filter((candidate) => playHistory[candidate.id]).length;
  const hasUnplayedIncident = incidentSet.some((candidate) => !playHistory[candidate.id]);
  const score = useMemo(() => choices.reduce((total, choice) => total + choice.option.points, 0), [choices]);
  const responseStyle = responseStyleFor(choices);
  const profile = profiles[responseStyle];

  useEffect(() => {
    document.title = archiveMode
      ? `${versionLabel} archive | Cisco Live 2026 | Data#3`
      : "Choose your own adventure: AI incident trade-offs | Cisco Live 2026 | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      archiveMode
        ? `Play the archived ${versionLabel} Cisco Live 2026 incident challenge.`
        : "Choose your own AI incident adventure through four fast, connected trade-off challenges for Cisco Live 2026.",
    );
  }, [archiveMode, versionLabel]);

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
    const next = assignedUnplayed(playHistory, incidentSet, !archiveMode);
    if (next) {
      setSelectedIncidentId(next.id);
      resetPlay(next);
    } else {
      resetPlay();
    }
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
    savePlayHistory(nextHistory, playHistoryKey);
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
    const next = assignedUnplayed(playHistory, incidentSet, !archiveMode);
    if (next) startIncident(next);
    else setPhase("launch");
  };

  const resetForNewPlayer = () => {
    if (completedCount > 0 && !window.confirm("Clear completed incidents for a new player on this device?")) return;
    try {
      window.localStorage.removeItem(playHistoryKey);
      if (!archiveMode) window.localStorage.removeItem(legacyHistoryKey);
    } catch {
      // Clearing the active React state is sufficient for this session.
    }
    setPlayHistory({});
    selectIncident(assignedUnplayed({}, incidentSet, !archiveMode) ?? incidentSet[0]);
    setPhase("launch");
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
          <div className="incident-header-actions">
            {archiveMode ? (
              <a className="incident-header-link" href="/2026alpha">Current · v0.4</a>
            ) : (
              <span className="incident-header-link incident-version-label">Prototype · v0.4</span>
            )}
            <span className="incident-status" aria-label={`Incident series, ${completedCount} of ${incidentSet.length} complete`}><span />{completedCount}/{incidentSet.length} complete</span>
          </div>
        ) : (
          <button className="incident-exit" type="button" onClick={exit}>
            <X aria-hidden="true" /> Exit challenge
          </button>
        )}
      </header>

      {phase === "launch" && (
        <main className="incident-launch">
          <section className="incident-launch__story" aria-labelledby="incident-launch-title">
            <p className="incident-kicker">Cisco Live 2026 · {archiveMode ? `${versionLabel} archive` : "AI incident challenge"}</p>
            <h1 id="incident-launch-title" className={archiveMode ? undefined : "incident-adventure-title"}>{archiveMode ? "Can you contain the incident?" : "Choose your own adventure: AI incident trade-offs."}</h1>
            <p className="incident-lead">{archiveMode ? "Fast choices. Real trade-offs. Consequences that follow." : "Five decisions. Three defensible options. Every choice has a trade-off."}</p>

            <div className="incident-facts" aria-label="Challenge details">
              <span><strong>{incidentSet.length}</strong> incidents</span>
              <span><strong>5</strong> decisions each</span>
              <span><Clock3 aria-hidden="true" /> Under two minutes</span>
            </div>

            <section className={`incident-series ${archiveMode ? "" : "incident-series--blind"}`} aria-labelledby="incident-series-title">
              {archiveMode ? (
                <>
                  <div className="incident-series__heading">
                    <h2 id="incident-series-title">Incident series</h2>
                    <span>{completedCount} of {incidentSet.length} complete</span>
                  </div>
                  <div className="incident-series__grid" aria-label="Choose an incident">
                    {incidentSet.map((candidate) => {
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
                </>
              ) : (
                <>
                  <div className="incident-series__heading">
                    <h2 id="incident-series-title">Prototype selector</h2>
                    <span>{completedCount} of {incidentSet.length} complete</span>
                  </div>
                  <div className="incident-prototype-picker" aria-label="Temporary incident selector">
                    {incidentSet.map((candidate) => {
                      const record = playHistory[candidate.id];
                      const isSelected = candidate.id === incident.id;
                      return (
                        <button
                          className={`${record ? "is-complete" : ""} ${isSelected && !record ? "is-selected" : ""}`}
                          type="button"
                          key={candidate.id}
                          onClick={() => selectIncident(candidate)}
                          disabled={Boolean(record)}
                          aria-pressed={isSelected && !record}
                          aria-label={`Incident ${candidate.number}${record ? ", completed" : isSelected ? ", selected" : ""}`}
                        >
                          {record ? <Check aria-hidden="true" /> : candidate.number}
                        </button>
                      );
                    })}
                  </div>
                  <p className="incident-prototype-note">Temporary testing control. The production game randomly assigns one of your remaining incidents.</p>
                </>
              )}
              {completedCount > 0 && (
                <button className="incident-new-player" type="button" onClick={resetForNewPlayer}>
                  <UserRound aria-hidden="true" /> New player on this device
                </button>
              )}
            </section>
          </section>

          <aside className="incident-launch__action" aria-labelledby="incident-assignment-title">
            {archiveMode ? (
              <>
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
              </>
            ) : (
              <>
                <p className="incident-kicker">{completedCount === incidentSet.length ? "Series complete" : "Assignment ready"}</p>
                <h2 id="incident-assignment-title">{completedCount === incidentSet.length ? "All incidents contained." : "Your incident is locked."}</h2>
                <p>{completedCount === incidentSet.length ? "You have completed all four prototype incidents." : "You will discover the situation when the clock starts. Make five decisions and defend the trade-offs."}</p>
                <aside className="incident-learning">
                  <strong>What you will practise</strong>
                  <p>Contain pressure, preserve evidence, restore service, apply a guardrail, and decide when automation can return.</p>
                </aside>
                <p className="incident-no-perfect">No consequence-free answer. Choose the response you can defend.</p>
                <button
                  className="incident-primary"
                  type="button"
                  onClick={() => startIncident()}
                  disabled={completedCount === incidentSet.length}
                >
                  {completedCount === incidentSet.length ? "All incidents complete" : "Start incident"} <ArrowRight aria-hidden="true" />
                </button>
              </>
            )}

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

          <a className="incident-archive-link" href={archiveMode ? "/2026alpha/archive" : "/2026alpha/archive"}>
            {archiveMode ? "Return to the prototype archive" : "View earlier prototype versions"}
          </a>
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
              {stage.inject && (
                <aside className="incident-inject" role="note">
                  <strong>Incident update</strong>
                  <span>{stage.inject}</span>
                </aside>
              )}
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
                <h1 id="incident-consequence-title" ref={headingRef} tabIndex={-1}>
                  {archiveMode ? "The system responds." : "Good call. Here’s the trade-off."}
                </h1>
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
            <p className="incident-kicker">Incident {incident.number} contained · {completedCount}/{incidentSet.length} complete</p>
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
              {incident.conversationPrompt && <p>{incident.conversationPrompt}</p>}
            </div>

            <div className="incident-result__actions">
              {hasUnplayedIncident ? (
                <button className="incident-primary" type="button" onClick={startNextUnplayed}>
                  {archiveMode ? "Next unplayed incident" : "Try another incident"} <ArrowRight aria-hidden="true" />
                </button>
              ) : (
                <button className="incident-primary" type="button" onClick={exit}>
                  {archiveMode ? "View completed series" : "Return to home"} <ArrowRight aria-hidden="true" />
                </button>
              )}
              {archiveMode && (
                <a className="incident-secondary" href="/2026alpha">
                  Open current v0.4 <ArrowRight aria-hidden="true" />
                </a>
              )}
              <div className="incident-result__quiet-actions">
                <button type="button" onClick={() => startIncident()}><RotateCcw aria-hidden="true" /> Replay</button>
                <button type="button" onClick={exit}><ScanLine aria-hidden="true" /> {archiveMode ? "Incident series" : "Home"}</button>
              </div>
            </div>
          </aside>

          {archiveMode ? (
            <section className="incident-leaderboard-panel" aria-labelledby="incident-leaderboard-title">
              <p className="incident-kicker">Archived prototype · {versionLabel}</p>
              <div className="incident-leaderboard-progress">
                <Flag aria-hidden="true" />
                <div>
                  <h2 id="incident-leaderboard-title">This run stays in the archive.</h2>
                  <p>Archived scores do not update the live v0.4 leaderboard.</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="incident-leaderboard-panel" aria-labelledby="incident-leaderboard-title">
              <p className="incident-kicker">Production integration</p>
              <div className="incident-leaderboard-progress">
                <Trophy aria-hidden="true" />
                <div>
                  <h2 id="incident-leaderboard-title">Your result will travel with you.</h2>
                  <p>The production game will use the Cisco Live sign-in pattern and carry your response style, score, and time into the leaderboard.</p>
                </div>
              </div>
            </section>
          )}

          <section className="incident-booth-feedback" aria-labelledby="incident-booth-feedback-title">
            <MessageSquareMore aria-hidden="true" />
            <div>
              <p className="incident-kicker">Improve the challenge</p>
              <h2 id="incident-booth-feedback-title">Show us what you’d change.</h2>
              <p>Spotted a technical gap, questionable assumption, or stronger move?</p>
              <strong>Tell a Data<sup>#</sup>3 engineer at the booth. We’re improving these scenarios live.</strong>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
