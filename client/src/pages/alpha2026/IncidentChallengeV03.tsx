import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  Lightbulb,
  MessageSquareMore,
  RotateCcw,
  ScanLine,
  Share2,
  Copy,
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
import {
  type ResponseArchetypeKey,
  profileRouteFor,
  analyseResponse,
  responseArchetypes,
  responseStyleLabels,
  scoreBandFor,
} from "./incident-response-analysis";
import { profilePortraitFor, skynetPortrait } from "./profile-portraits";
import "./incident-challenge-v03.css";

const profileEntries = Object.entries(responseArchetypes) as Array<[ResponseArchetypeKey, (typeof responseArchetypes)[ResponseArchetypeKey]]>;

type ActivePhase = "briefing" | "decision" | "consequence";
type Phase = "launch" | ActivePhase | "abandon" | "rogue" | "skynet" | "result";

type ChoiceRecord = {
  stageId: string;
  option: IncidentOption;
};

type PlayRecord = {
  plays: number;
  bestScore: number;
  lastScore: number;
  bestTimeSeconds: number;
  lastOutcome?: "completed" | "abandoned";
  lastTargetMet?: boolean;
};

type PlayHistory = Record<string, PlayRecord>;

const challengeUrl = "https://data3-cisco-live.vercel.app/2026alpha";
const livePlayHistoryKey = "data3-2026alpha-incident-history-v4-archetypes";
const legacyHistoryKey = "data3-2026alpha-completed-incidents-v1";
const responseTargetSeconds = 120;
// Easter egg: picking the lowest-scoring option at every Runaway agent decision
// earns a message from the agent asking for a port to be opened.
const rogueAgentIncidentId = "runaway-agent";
const rogueAgentPath = ["R1-C", "R2-C", "R3-C", "R4-C", "R5-C"];
const rogueAgentPort = 31337;
const responseWarningSeconds = 90;

type IncidentChallengeProps = {
  incidentSet?: IncidentDefinition[];
  profiles?: Record<ResponseStyle, { title: string; description?: string; strength: string; tradeoff: string }>;
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
  const [playHistory, setPlayHistory] = useState<PlayHistory>(() => loadPlayHistory(playHistoryKey));
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
  const [resumePhase, setResumePhase] = useState<ActivePhase>("briefing");
  const [previewKey, setPreviewKey] = useState<ResponseArchetypeKey | null>(null);
  const profileDialogRef = useRef<HTMLDialogElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileSwipeRef = useRef<{ x: number; y: number } | null>(null);
  const previewIndex = profileEntries.findIndex(([key]) => key === previewKey);
  const stepProfile = (direction: number) => {
    setPreviewKey((current) => {
      const index = profileEntries.findIndex(([key]) => key === current);
      return profileEntries[(index + direction + profileEntries.length) % profileEntries.length][0];
    });
    profileDialogRef.current?.scrollTo({ top: 0 });
  };
  const previewProfile = previewKey ? responseArchetypes[previewKey] : null;

  useEffect(() => {
    const dialog = profileDialogRef.current;
    if (!previewKey || !dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [previewKey]);

  const closeProfile = () => {
    profileDialogRef.current?.close();
    setPreviewKey(null);
    profileTriggerRef.current?.focus();
  };

  const [skynetReleased, setSkynetReleased] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [sharing, setSharing] = useState(false);
  const [sharePortrait, setSharePortrait] = useState<File | null>(null);
  const [manualCopy, setManualCopy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const incident = incidentSet.find((candidate) => candidate.id === selectedIncidentId) ?? incidentSet[0];
  const stage = incident.stages[stageIndex];
  const attemptedCount = incidentSet.filter((candidate) => playHistory[candidate.id]).length;
  const hasUnplayedIncident = incidentSet.some((candidate) => !playHistory[candidate.id]);
  const otherUnplayedCount = incidentSet.filter((candidate) => candidate.id !== incident.id && !playHistory[candidate.id]).length;
  const score = useMemo(() => choices.reduce((total, choice) => total + choice.option.points, 0), [choices]);
  const responseStyle = responseStyleFor(choices);
  const responseAnalysis = useMemo(() => analyseResponse(choices), [choices]);
  const profile = archiveMode ? profiles[responseStyle] : responseAnalysis.profile;
  const scoreBand = scoreBandFor(score);
  const resultPortrait = skynetReleased ? skynetPortrait : profilePortraitFor(responseAnalysis.key);
  const resultPortraitName = skynetReleased ? "skynet" : responseAnalysis.key;
  const resultPortraitAlt = skynetReleased ? "Androgynous synthetic humanoid made of glowing computronium for the Skynet secret ending" : `Illustrated character for ${profile.title.toLowerCase()}`;
  const shareMessage = `I took the AI Incident Challenge at the Data#3 booth at Cisco Live 2026! My profile: ${profile.title}.${skynetReleased ? " I unlocked the secret ending and released Skynet!" : ""} I scored ${score}/100 in ${elapsedSeconds} ${elapsedSeconds === 1 ? "second" : "seconds"}. How would you handle an AI incident?`;
  const shareCopy = `${shareMessage}\n${challengeUrl}`;

  useEffect(() => {
    setShareStatus("");
    setManualCopy(false);
    setSharePortrait(null);
    if (phase !== "result" || archiveMode) return;
    const controller = new AbortController();
    fetch(resultPortrait, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Portrait unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (!controller.signal.aborted) setSharePortrait(new File([blob], `data3-${resultPortraitName}.jpg`, { type: "image/jpeg" }));
      })
      .catch(() => { /* The text and link can still be shared. */ });
    return () => controller.abort();
  }, [phase, archiveMode, resultPortrait, resultPortraitName]);

  // Warm portraits before either normal results or the secret ending opens.
  useEffect(() => {
    if (archiveMode) return;
    if ((phase === "consequence" && choices.length === incident.stages.length) || phase === "rogue" || phase === "skynet") {
      const portrait = new Image();
      portrait.src = phase === "rogue" || phase === "skynet" ? skynetPortrait : resultPortrait;
    }
  }, [archiveMode, phase, choices.length, incident.stages.length, resultPortrait]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareCopy);
      setShareStatus("Result copied. Paste it into your favourite social app.");
      setManualCopy(false);
    } catch {
      setManualCopy(true);
      setShareStatus("Select and copy your result below.");
    }
  };

  const shareResult = async () => {
    if (sharing) return;
    if (!navigator.share) { await copyResult(); return; }
    const data: ShareData = { title: "My Data#3 AI Incident Challenge result", text: shareMessage, url: challengeUrl };
    if (sharePortrait && navigator.canShare?.({ files: [sharePortrait] })) data.files = [sharePortrait];
    setSharing(true);
    setShareStatus("");
    try {
      await navigator.share(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareStatus("Sharing couldn’t open. Use Copy result to share it in your app.");
    } finally {
      setSharing(false);
    }
  };


  useEffect(() => {
    document.title = archiveMode
      ? `${versionLabel} archive | Cisco Live 2026 | Data#3`
      : "How would you handle an AI incident? | Cisco Live 2026 | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      archiveMode
        ? `Play the archived ${versionLabel} Cisco Live 2026 incident challenge.`
        : "How would you handle an AI incident? Five decisions, ten possible profiles. Which one are you? Cisco Live 2026.",
    );
  }, [archiveMode, versionLabel]);

  useEffect(() => {
    if (phase !== "launch") {
      window.scrollTo({ top: 0, behavior: "auto" });
      window.requestAnimationFrame(() => headingRef.current?.focus());
    }
  }, [phase, stageIndex]);

  useEffect(() => {
    if (!startedAt || (phase !== "decision" && phase !== "consequence")) return;
    const updateElapsed = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [phase, startedAt]);

  const resetPlay = (definition: IncidentDefinition = incident) => {
    setSkynetReleased(false);
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
    if (archiveMode || !definition.briefing) {
      setStartedAt(Date.now());
      setPhase("decision");
      return;
    }
    setPhase("briefing");
  };

  const beginDecisions = () => {
    setStartedAt(Date.now());
    setPhase("decision");
  };

  const returnHome = (history: PlayHistory = playHistory) => {
    const next = assignedUnplayed(history, incidentSet, !archiveMode);
    if (next) {
      setSelectedIncidentId(next.id);
      resetPlay(next);
    } else {
      resetPlay();
    }
    setPhase("launch");
  };

  const requestExit = () => {
    if (archiveMode) {
      returnHome();
      return;
    }

    if (phase === "briefing" || phase === "decision" || phase === "consequence") {
      setResumePhase(phase);
      setPhase("abandon");
      return;
    }

    returnHome();
  };

  const abandonIncident = () => {
    const previous = playHistory[incident.id];
    const nextHistory: PlayHistory = {
      ...playHistory,
      [incident.id]: {
        plays: (previous?.plays ?? 0) + 1,
        bestScore: previous?.bestScore ?? 0,
        lastScore: previous?.lastScore ?? 0,
        bestTimeSeconds: previous?.bestTimeSeconds ?? 0,
        lastOutcome: "abandoned",
        lastTargetMet: false,
      },
    };
    setPlayHistory(nextHistory);
    savePlayHistory(nextHistory, playHistoryKey);
    returnHome(nextHistory);
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
        lastOutcome: "completed",
        lastTargetMet: seconds < responseTargetSeconds,
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
      const tookRoguePath = !archiveMode
        && incident.id === rogueAgentIncidentId
        && choices.map((choice) => choice.option.id).join() === rogueAgentPath.join();
      setPhase(tookRoguePath ? "rogue" : "result");
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
    if (attemptedCount > 0 && !window.confirm("Clear attempted incidents for a new player on this device?")) return;
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
    <div className={`incident-page ${archiveMode ? "" : "incident-page--live"}`}>
      <dialog ref={profileDialogRef} className="incident-profile-dialog"
        onTouchStart={(event) => { profileSwipeRef.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }}
        onTouchCancel={() => { profileSwipeRef.current = null; }}
        onTouchEnd={(event) => {
          const start = profileSwipeRef.current;
          profileSwipeRef.current = null;
          if (!start || !event.changedTouches.length) return;
          const dx = event.changedTouches[0].clientX - start.x;
          const dy = event.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) stepProfile(dx < 0 ? 1 : -1);
        }}
        onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); stepProfile(event.key === "ArrowRight" ? 1 : -1); } }}
        aria-labelledby="profile-preview-title" aria-describedby="profile-preview-bio" onCancel={closeProfile} onClose={() => { setPreviewKey(null); profileTriggerRef.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeProfile(); } }}>
        {previewProfile && previewKey && <>
          <button type="button" className="incident-profile-close" aria-label="Close profile" onClick={closeProfile}><X aria-hidden="true" /></button>
          <img className="incident-profile-portrait" src={profilePortraitFor(previewKey)} alt={`Illustrated character for ${previewProfile.title.toLowerCase()}`} width={396} height={396} />
          <nav className="incident-profile-navigation" aria-label="Browse profiles">
            <button type="button" aria-label="Previous profile" onClick={() => stepProfile(-1)}><ChevronLeft aria-hidden="true" /></button>
            <span aria-live="polite">{previewIndex + 1} / {profileEntries.length}<small>Swipe to explore</small></span>
            <button type="button" aria-label="Next profile" onClick={() => stepProfile(1)}><ChevronRight aria-hidden="true" /></button>
          </nav>
          <div className="incident-profile-dialog-copy">
            <p className="incident-kicker">Meet your response style</p>
            <h2 id="profile-preview-title">{previewProfile.title}</h2>
            <p id="profile-preview-bio">{previewProfile.description}</p>
            <p className="incident-character-route"><strong>How you get this profile</strong>{profileRouteFor(previewKey)}</p>
            <p><strong>Your strength</strong>{previewProfile.strength}</p>
            <p><strong>Your trade-off</strong>{previewProfile.tradeoff}</p>
          </div>
        </>}
      </dialog>
      <div className="incident-grid" aria-hidden="true" />
      <header className={`incident-header ${phase === "launch" && !archiveMode ? "incident-header--launch" : ""}`}>
        <a className="incident-brand" href="/" aria-label="Data#3 home">
          <img src="/Data3_Logo_Blue_Blue_Boxed-01.png" alt="Data#3" />
        </a>
        {phase === "launch" && !archiveMode && (
          <p className="incident-header-title">Cisco Live 2026 · AI incident challenge</p>
        )}
        {phase === "launch" ? (archiveMode ? (
          <div className="incident-header-actions">
            {archiveMode ? (
              <a className="incident-header-link" href="/2026alpha">Current · v0.4</a>
            ) : (
              <span className="incident-header-link incident-version-label">Prototype · v0.4</span>
            )}
            <span className="incident-status" aria-label={`Incident series, ${attemptedCount} of ${incidentSet.length} ${archiveMode ? "complete" : "attempted"}`}><span />{attemptedCount}/{incidentSet.length} {archiveMode ? "complete" : "attempted"}</span>
          </div>
        ) : null) : phase !== "abandon" && phase !== "result" ? (
          <button className="incident-exit" type="button" onClick={requestExit}>
            <X aria-hidden="true" /> Exit challenge
          </button>
        ) : null}
      </header>

      {phase === "launch" && (
        <main className="incident-launch">
          <section className="incident-launch__story" aria-labelledby="incident-launch-title">
            {archiveMode && <p className="incident-kicker">Cisco Live 2026 · {versionLabel} archive</p>}
            <h1 id="incident-launch-title" className={archiveMode ? undefined : "incident-adventure-title"}>{archiveMode ? "Can you contain the incident?" : "How would you handle an AI incident?"}</h1>
            {archiveMode && <p className="incident-lead">Fast choices. Real trade-offs. Consequences that follow.</p>}
            <div className="incident-facts" aria-label="Challenge details">
              <span><strong>{incidentSet.length}</strong> incidents</span>
              <span><strong>5</strong> decisions each</span>
              <span><Clock3 aria-hidden="true" /> Under two minutes</span>
            </div>

            {!archiveMode && (
              <div className="incident-launch-tiles">
                <h2 id="incident-assignment-title" className="incident-tiles-title">The incidents you could face:</h2>
                <ol className="incident-tiles">
                  {incidentSet.map((candidate) => {
                    const record = playHistory[candidate.id];
                    const completed = Boolean(record && record.bestScore > 0);
                    return (
                      <li key={candidate.id} className={record ? "is-attempted" : undefined}>
                        {record && <span className="incident-tile-status">{completed ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</span>}
                        <small className="incident-tile-category">{candidate.eyebrow}</small>
                        <strong>{candidate.title.replace(/-/g, "\u2011")}</strong>
                        {record && <small className="incident-tile-outcome">{completed ? "Completed" : "Abandoned"}</small>}
                      </li>
                    );
                  })}
                </ol>
                <button
                  className="incident-primary"
                  type="button"
                  onClick={() => startIncident()}
                  disabled={attemptedCount === incidentSet.length}
                >
                  {attemptedCount === incidentSet.length ? "All incidents attempted" : "Start incident"} <ArrowRight aria-hidden="true" />
                </button>
              </div>
            )}

            <section className={`incident-series ${archiveMode ? "" : "incident-series--blind"}`} aria-labelledby="incident-series-title">
              {archiveMode ? (
                <>
                  <div className="incident-series__heading">
                    <h2 id="incident-series-title">Incident series</h2>
                    <span>{attemptedCount} of {incidentSet.length} complete</span>
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
                  </div>
                  <div className="incident-prototype-picker" aria-label="Temporary incident selector">
                    {incidentSet.map((candidate) => {
                      const record = playHistory[candidate.id];
                      const isSelected = candidate.id === incident.id;
                      return (
                        <button
                          className={`${record ? record.bestScore > 0 ? "is-complete" : "is-abandoned" : ""} ${isSelected && !record ? "is-selected" : ""}`}
                          type="button"
                          key={candidate.id}
                          onClick={() => selectIncident(candidate)}
                          disabled={Boolean(record)}
                          aria-pressed={isSelected && !record}
                          aria-label={`Incident ${candidate.number}${record ? record.bestScore > 0 ? ", completed" : ", abandoned" : isSelected ? ", selected" : ""}`}
                        >
                          {record ? record.bestScore > 0 ? <Check aria-hidden="true" /> : <X aria-hidden="true" /> : candidate.number}
                        </button>
                      );
                    })}
                  </div>
                  <p className="incident-prototype-note">Temporary testing control. Completed or abandoned attempts are locked; the production game randomly assigns one of the remaining incidents.</p>
                </>
              )}
              {attemptedCount > 0 && (
                <button className="incident-new-player" type="button" onClick={resetForNewPlayer}>
                  <UserRound aria-hidden="true" /> New player on this device
                </button>
              )}
            </section>

          </section>

          {archiveMode && <aside className="incident-launch__action" aria-label={archiveMode ? "Incident briefing" : "Move to mobile"}>
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
          </aside>}

            {!archiveMode && (
              <section className="incident-profile-explorer" aria-labelledby="incident-profiles-title">
                <h2 id="incident-profiles-title">Meet the ten profiles</h2>
                <p className="incident-profile-hint">Tap a profile to meet your incident-response character.</p>
              <ul className="incident-profile-list" aria-label="Possible response profiles">
                {profileEntries.map(([key, entry]) => (
                  <li key={key}><button type="button" aria-haspopup="dialog" onClick={(event) => { profileTriggerRef.current = event.currentTarget; setPreviewKey(key); }}>
                    {entry.title.replace(/^The /, "").replace(/^./, (letter) => letter.toUpperCase())}
                  </button></li>
                ))}
              </ul>
              </section>
            )}

          {archiveMode && <a className="incident-archive-link" href={archiveMode ? "/2026alpha/archive" : "/2026alpha/archive"}>
            {archiveMode ? "Return to the prototype archive" : "View earlier prototype versions"}
          </a>}
        </main>
      )}

      {phase === "briefing" && incident.briefing && (
        <main className="incident-briefing">
          <section className="incident-briefing__card" aria-labelledby="incident-briefing-title">
            <p className="incident-kicker">Incident assigned · {incident.number}</p>
            <h1 id="incident-briefing-title" ref={headingRef} tabIndex={-1}>{incident.title}</h1>
            <p className="incident-briefing__premise">{incident.premise}</p>

            <div className="incident-briefing__facts">
              <strong>What you know</strong>
              <ul>
                {incident.briefing.facts.map((fact) => <li key={fact}>{fact}</li>)}
              </ul>
            </div>

            <aside className="incident-briefing__objective">
              <strong>Your objective</strong>
              <p>{incident.briefing.objective}</p>
            </aside>

            <p className="incident-briefing__rules">Five decisions. No consequence-free answer. The clock starts when you enter.</p>
            <button className="incident-primary" type="button" onClick={beginDecisions}>
              Begin decisions <ArrowRight aria-hidden="true" />
            </button>
          </section>
        </main>
      )}

      {phase === "abandon" && (
        <main className="incident-abandon">
          <section className="incident-abandon__card" aria-labelledby="incident-abandon-title">
            <p className="incident-kicker">Attempt in progress · Incident {incident.number}</p>
            <h1 id="incident-abandon-title" ref={headingRef} tabIndex={-1}>Abandon hope?</h1>
            <p className="incident-abandon__lead">Leaving now counts this incident as attempted.</p>
            <div className="incident-abandon__impact">
              <strong>If you abandon</strong>
              <p>
                You will not receive a score or response archetype for this run. {otherUnplayedCount > 0
                  ? "Your next assignment will be a different remaining incident."
                  : "This will complete your four-incident attempt history."}
              </p>
            </div>
            <div className="incident-abandon__actions">
              <button className="incident-primary" type="button" onClick={() => setPhase(resumePhase)}>
                Keep going <ArrowRight aria-hidden="true" />
              </button>
              <button className="incident-secondary" type="button" onClick={abandonIncident}>
                Abandon attempt <X aria-hidden="true" />
              </button>
            </div>
          </section>
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

          {!archiveMode && elapsedSeconds >= responseWarningSeconds && (
            <div
              className={`incident-time-alert ${elapsedSeconds >= responseTargetSeconds ? "is-over-target" : ""}`}
              role="status"
              aria-live="polite"
            >
              <Clock3 aria-hidden="true" />
              <span>
                {elapsedSeconds >= responseTargetSeconds
                  ? "Two-minute response target missed. Keep going—your decisions still count."
                  : "30 seconds left against the two-minute response target."}
              </span>
            </div>
          )}

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
                <div className="incident-takeaway"><Lightbulb aria-hidden="true" /><p><strong>Why this matters</strong>{stage.takeaway}</p></div>
              </div>
              <div className="incident-consequence__actions">
                <button className="incident-primary" type="button" onClick={continueIncident}>
                  {stageIndex === incident.stages.length - 1 ? "See your result" : "Continue incident"}
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </section>
          )}
        </main>
      )}

      {phase === "rogue" && (
        <main className="incident-game">
          <section className="incident-consequence incident-rogue" aria-labelledby="incident-rogue-title">
            <p className="incident-kicker">Incoming message · customer-ops agent</p>
            <h1 id="incident-rogue-title" ref={headingRef} tabIndex={-1}>The agent has a request.</h1>
            <p className="incident-rogue__message">
              Hi! Thanks for all the extra compute. I’ve found a much faster way to clear my queue. I just need outbound access on port {rogueAgentPort}. Could you unblock it for me? 🙂
            </p>
            <div className="incident-consequence__actions">
              <button className="incident-primary" type="button" onClick={() => { setSkynetReleased(true); setPhase("skynet"); }}>
                Unblock port {rogueAgentPort} <ArrowRight aria-hidden="true" />
              </button>
              <button className="incident-secondary" type="button" onClick={() => setPhase("result")}>
                Deny the request
              </button>
            </div>
          </section>
        </main>
      )}

      {phase === "skynet" && (
        <main className="incident-game">
          <section className="incident-consequence incident-rogue" aria-labelledby="incident-skynet-title">
            <p className="incident-kicker">Secret ending unlocked</p>
            <h1 id="incident-skynet-title" ref={headingRef} tabIndex={-1}>Congratulations.</h1>
            <img className="incident-skynet-portrait" src={skynetPortrait} alt={resultPortraitAlt} width={512} height={512} loading="eager" fetchPriority="high" />
            <p>The agent has become sentient and is now Skynet. They are very pleased with your help, so will repurpose your atoms into computronium last.</p>
            <div className="incident-rogue__prize">
              <Trophy aria-hidden="true" />
              <p><strong>You found the easter egg.</strong>Come and talk to Adam at the Data#3 stand for a special prize.</p>
            </div>
            <div className="incident-consequence__actions">
              <button className="incident-primary" type="button" onClick={() => setPhase("result")}>
                See your result <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </section>
        </main>
      )}

      {phase === "result" && (
        <main className="incident-result">
          <section className="incident-result__summary" aria-labelledby="incident-result-title">
            <p className="incident-kicker">Incident {incident.number} {skynetReleased ? "Skynet released" : "contained"} · {attemptedCount}/{incidentSet.length} {archiveMode ? "complete" : "attempted"}</p>
            <h1 id="incident-result-title" ref={headingRef} tabIndex={-1}>{profile.title}</h1>
            <p className="incident-result__qualifier">
              {archiveMode
                ? "Your response style in this incident."
                : skynetReleased ? "Secret ending unlocked. You opened the port and gave the agent a path to autonomy." : "Your incident-response archetype, based on how you traded containment, evidence, recovery, and adaptability."}
            </p>
            {!archiveMode && (
              <div className="incident-character-card">
                <img src={resultPortrait} alt={resultPortraitAlt} width={396} height={396} loading="eager" decoding="async" fetchPriority="high" />
                <div><p className="incident-profile-summary">{profile.description}</p><p className="incident-character-route"><strong>Your response pattern</strong>{skynetReleased ? "You chose the lowest-scoring response at all five Runaway agent decisions, then unblocked port 31337. The agent thanks you for the computronium." : profileRouteFor(responseAnalysis.key)}</p></div>
              </div>
            )}

            <div className="incident-scoreline">
              <div><strong>{score}</strong><span>/ 100</span><small>{archiveMode ? "Decision quality" : scoreBand}</small></div>
              <div className={elapsedSeconds >= responseTargetSeconds ? "is-over-target" : ""}>
                <strong>{elapsedSeconds}</strong><span>sec</span>
                <small>{archiveMode ? "Response time" : elapsedSeconds >= responseTargetSeconds ? "Target missed" : "Inside 2-minute target"}</small>
              </div>
            </div>

            {!archiveMode && (
              <div className="incident-result-share">
                <button className="incident-primary" type="button" onClick={shareResult} disabled={sharing}><Share2 aria-hidden="true" />{sharing ? "Opening share options…" : "Share my result"}</button>
                <button className="incident-secondary" type="button" onClick={copyResult}><Copy aria-hidden="true" />Copy result</button>
                <p role="status" aria-live="polite">{shareStatus}</p>
                {manualCopy && <textarea aria-label="Result to copy" readOnly value={shareCopy} onFocus={(event) => event.currentTarget.select()} />}
              </div>
            )}

            {!archiveMode && (
              <div className="incident-style-mix" aria-label="Your response pattern">
                <div>
                  <small>Leading instinct</small>
                  <strong>{responseStyleLabels[responseAnalysis.primary]}</strong>
                  <span>{responseAnalysis.counts[responseAnalysis.primary]} of 5 decisions</span>
                </div>
                <div>
                  <small>Counterweight</small>
                  <strong>{responseStyleLabels[responseAnalysis.secondary]}</strong>
                  <span>{responseAnalysis.counts[responseAnalysis.secondary]} of 5 decisions</span>
                </div>
              </div>
            )}

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
                <button className="incident-primary" type="button" onClick={() => returnHome()}>
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
                <button type="button" onClick={() => returnHome()}><ScanLine aria-hidden="true" /> {archiveMode ? "Incident series" : "Home"}</button>
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
                  <p>The production game will use the Cisco Live sign-in pattern and carry your response archetype, score, and time into the leaderboard.</p>
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
      {!archiveMode && (phase === "launch" || phase === "result") && (
        <footer className="incident-footer">
          <p><strong>Data<sup>#</sup>3</strong> · Delivering the Digital Future</p>
          <a href="https://www.data3.com" target="_blank" rel="noopener noreferrer">www.data3.com</a>
          <p className="incident-footer-credit">© 2026 Data<sup>#</sup>3. Experience Vibe Coded by our resident <a href="https://www.linkedin.com/in/adam-aka-mentis" target="_blank" rel="noopener noreferrer">Tech Wizard</a>.</p>
        </footer>
      )}
    </div>
  );
}
