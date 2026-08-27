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
  incidents,
  responseProfiles,
} from "./incident-v03-data";
import {
  clearPlayerProfile,
  completeLeaderboardRun,
  loadPlayerProfile,
  savePlayerProfile,
  startLeaderboardRun,
  submitLeaderboardRun,
  type LeaderboardEntry,
  type PlayerProfile,
} from "./alpha2026-leaderboard";
import { LeaderboardRows } from "./Alpha2026Leaderboard";
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
  const [runToken, setRunToken] = useState("");
  const [resultToken, setResultToken] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [runWarning, setRunWarning] = useState("");
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [leaderboardName, setLeaderboardName] = useState(() => loadPlayerProfile().displayName);
  const [leaderboardStatus, setLeaderboardStatus] = useState<"idle" | "verifying" | "submitting" | "joined" | "error">("idle");
  const [leaderboardEntry, setLeaderboardEntry] = useState<LeaderboardEntry | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardError, setLeaderboardError] = useState("");
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
    setRunToken("");
    setResultToken("");
    setRunWarning("");
    setLeaderboardStatus("idle");
    setLeaderboardEntry(null);
    setLeaderboardEntries([]);
    setLeaderboardError("");
  };

  const selectIncident = (definition: IncidentDefinition) => {
    setSelectedIncidentId(definition.id);
    resetPlay(definition);
  };

  const startIncident = async (definition: IncidentDefinition = incident) => {
    setSelectedIncidentId(definition.id);
    resetPlay(definition);
    setIsStarting(true);
    try {
      setRunToken(await startLeaderboardRun(definition.id));
    } catch (caught) {
      setRunWarning(caught instanceof Error ? caught.message : "The live leaderboard is unavailable for this run.");
    }
    setStartedAt(Date.now());
    setPhase("decision");
    setIsStarting(false);
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

  const addCurrentRunToLeaderboard = async (displayName: string, verifiedResultToken: string = resultToken) => {
    const cleanName = displayName.trim();
    if (!cleanName || !verifiedResultToken) {
      setLeaderboardStatus("error");
      setLeaderboardError(
        verifiedResultToken
          ? "Enter a leaderboard name."
          : "This run was not connected to the live board. Replay the incident to join.",
      );
      return;
    }

    setLeaderboardStatus("submitting");
    setLeaderboardError("");
    try {
      const result = await submitLeaderboardRun({
        playerId: playerProfile.id,
        displayName: cleanName,
        resultToken: verifiedResultToken,
      });
      const nextProfile = { ...playerProfile, displayName: cleanName, entryId: result.entry.id };
      setPlayerProfile(nextProfile);
      setLeaderboardName(cleanName);
      savePlayerProfile(nextProfile);
      setLeaderboardEntry(result.entry);
      setLeaderboardEntries(result.entries);
      setLeaderboardStatus("joined");
    } catch (caught) {
      setLeaderboardStatus("error");
      setLeaderboardError(caught instanceof Error ? caught.message : "The leaderboard could not update.");
    }
  };

  const verifyCurrentRun = async () => {
    if (!runToken) {
      setLeaderboardStatus("error");
      setLeaderboardError(runWarning || "The live leaderboard was unavailable for this run. Replay to join.");
      return;
    }

    setLeaderboardStatus("verifying");
    try {
      const result = await completeLeaderboardRun({
        incidentId: incident.id,
        choiceIds: choices.map((choice) => choice.option.id),
        runToken,
      });
      setResultToken(result.resultToken);
      setElapsedSeconds(result.elapsedSeconds);
      if (playerProfile.displayName) {
        await addCurrentRunToLeaderboard(playerProfile.displayName, result.resultToken);
      } else {
        setLeaderboardStatus("idle");
      }
    } catch (caught) {
      setLeaderboardStatus("error");
      setLeaderboardError(caught instanceof Error ? caught.message : "This run could not be verified.");
    }
  };

  const continueIncident = () => {
    if (stageIndex === incident.stages.length - 1) {
      const seconds = Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 1000));
      setElapsedSeconds(seconds);
      completeIncident(seconds);
      setPhase("result");
      void verifyCurrentRun();
      return;
    }
    setSelectedOption(null);
    setStageIndex((current) => current + 1);
    setPhase("decision");
  };

  const startNextUnplayed = () => {
    const next = incidents.find((candidate) => !playHistory[candidate.id]);
    if (next) void startIncident(next);
    else setPhase("launch");
  };

  const resetForNewPlayer = () => {
    if (completedCount > 0 && !window.confirm("Clear completed incidents for a new player on this device?")) return;
    try {
      window.localStorage.removeItem(playHistoryKey);
      window.localStorage.removeItem(legacyHistoryKey);
      clearPlayerProfile();
    } catch {
      // Clearing the active React state is sufficient for this session.
    }
    setPlayHistory({});
    const newProfile = loadPlayerProfile();
    setPlayerProfile(newProfile);
    setLeaderboardName("");
    setLeaderboardEntry(null);
    setLeaderboardEntries([]);
    setLeaderboardStatus("idle");
    selectIncident(incidents[0]);
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
            <a className="incident-header-link" href="/2026alpha/leaderboard"><Trophy aria-hidden="true" /> Leaderboard</a>
            <span className="incident-status" aria-label={`Incident series, ${completedCount} of 4 complete`}><span />{completedCount}/4 complete</span>
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
            <button className="incident-primary" type="button" onClick={() => void startIncident()} disabled={isStarting}>
              {isStarting ? "Preparing incident" : playHistory[incident.id] ? "Replay incident" : "Start incident"} <ArrowRight aria-hidden="true" />
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
              <a className="incident-secondary" href="/2026alpha/leaderboard">
                <Trophy aria-hidden="true" /> View live leaderboard
              </a>
              <div className="incident-result__quiet-actions">
                <button type="button" onClick={() => void startIncident()}><RotateCcw aria-hidden="true" /> Replay</button>
                <button type="button" onClick={exit}><ScanLine aria-hidden="true" /> Incident series</button>
              </div>
            </div>
          </aside>

          <section className="incident-leaderboard-panel" aria-labelledby="incident-leaderboard-title">
            <p className="incident-kicker">Live leaderboard</p>
            {leaderboardStatus === "joined" && leaderboardEntry ? (
              <>
                <div className="incident-leaderboard-panel__heading">
                  <div>
                    <h2 id="incident-leaderboard-title">You’re #{leaderboardEntry.rank}.</h2>
                    <p>Your best run keeps one place on the board. A higher score—or a faster tied score—moves it up.</p>
                  </div>
                  <span><strong>{leaderboardEntry.score}</strong>/100 · {leaderboardEntry.elapsedSeconds}s</span>
                </div>
                <LeaderboardRows entries={leaderboardEntries} currentEntryId={leaderboardEntry.id} compact />
                <a className="incident-leaderboard-panel__link" href="/2026alpha/leaderboard">
                  See all live standings <ArrowRight aria-hidden="true" />
                </a>
              </>
            ) : leaderboardStatus === "verifying" || leaderboardStatus === "submitting" ? (
              <div className="incident-leaderboard-progress" role="status">
                <Trophy aria-hidden="true" />
                <div>
                  <h2 id="incident-leaderboard-title">
                    {leaderboardStatus === "verifying" ? "Verifying your run…" : "Updating your place…"}
                  </h2>
                  <p>Score leads. Fastest verified time breaks a tie.</p>
                </div>
              </div>
            ) : (
              <form
                className="incident-leaderboard-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void addCurrentRunToLeaderboard(leaderboardName);
                }}
              >
                <h2 id="incident-leaderboard-title">Put your best run on the board.</h2>
                <p>Score leads. Fastest verified time breaks a tie. Better runs update your one place automatically.</p>
                <label htmlFor="incident-leaderboard-name">Leaderboard name</label>
                <div>
                  <input
                    id="incident-leaderboard-name"
                    value={leaderboardName}
                    onChange={(event) => setLeaderboardName(event.target.value)}
                    maxLength={18}
                    autoComplete="off"
                    placeholder="Nickname or initials"
                    aria-describedby="incident-leaderboard-name-help"
                  />
                  <button className="incident-primary" type="submit" disabled={!leaderboardName.trim() || !resultToken}>
                    Join leaderboard <Trophy aria-hidden="true" />
                  </button>
                </div>
                <small id="incident-leaderboard-name-help">Use a nickname or initials. It will appear publicly.</small>
                {leaderboardError && <p className="incident-leaderboard-error" role="status">{leaderboardError}</p>}
              </form>
            )}
          </section>

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
