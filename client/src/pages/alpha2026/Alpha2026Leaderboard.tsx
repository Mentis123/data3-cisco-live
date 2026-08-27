import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Gauge, RefreshCw, Trophy } from "lucide-react";
import {
  getLeaderboard,
  loadPlayerProfile,
  type LeaderboardEntry,
} from "./alpha2026-leaderboard";
import "./incident-challenge-v03.css";

export function LeaderboardRows({
  entries,
  currentEntryId,
  compact = false,
}: {
  entries: LeaderboardEntry[];
  currentEntryId?: string;
  compact?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="alpha-leaderboard-empty">
        <Trophy aria-hidden="true" />
        <strong>First response sets the pace.</strong>
        <span>Complete an incident to take the first place.</span>
      </div>
    );
  }

  const visibleEntries = compact ? entries.slice(0, 5) : entries;

  return (
    <ol className={`alpha-leaderboard-list ${compact ? "is-compact" : ""}`} aria-label="Incident challenge rankings">
      {visibleEntries.map((entry) => {
        const isCurrent = entry.id === currentEntryId;
        return (
          <li
            className={`${entry.rank <= 3 ? `is-podium is-rank-${entry.rank}` : ""} ${isCurrent ? "is-current" : ""}`}
            key={entry.id}
            aria-label={`${entry.rank}. ${entry.displayName}, ${entry.score} points in ${entry.elapsedSeconds} seconds, ${entry.responseTitle}, ${entry.incidentTitle}`}
          >
            <span className="alpha-leaderboard-rank">
              {entry.rank === 1 ? <Trophy aria-hidden="true" /> : entry.rank}
            </span>
            <span className="alpha-leaderboard-player">
              <strong>{entry.displayName}{isCurrent ? <small>You</small> : null}</strong>
              <span>{entry.responseTitle} · {entry.incidentTitle}</span>
            </span>
            <span className="alpha-leaderboard-result">
              <strong>{entry.score}<small>/100</small></strong>
              <span>{entry.elapsedSeconds}s · {entry.completedCount}/4</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Alpha2026Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentEntryId] = useState(() => loadPlayerProfile().entryId);

  const refresh = async (showActivity = false) => {
    if (showActivity) setRefreshing(true);
    try {
      const result = await getLeaderboard(30);
      setEntries(result.entries);
      setTotalPlayers(result.totalPlayers);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The leaderboard is temporarily unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    document.title = "Live challenge leaderboard | Cisco Live 2026 | Data#3";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "See the leading scores and response styles from the Data#3 Cisco Live 2026 incident challenge.",
    );
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="incident-page alpha-leaderboard-page">
      <div className="incident-grid" aria-hidden="true" />
      <header className="incident-header alpha-leaderboard-header">
        <a className="incident-brand" href="/" aria-label="Data#3 home">
          <img src="/Data3_Logo_Blue_Blue_Boxed-01.png" alt="Data#3" />
        </a>
        <a className="incident-exit" href="/2026alpha">
          <ArrowLeft aria-hidden="true" /> Incident series
        </a>
      </header>

      <main className="alpha-leaderboard-main">
        <section className="alpha-leaderboard-intro" aria-labelledby="alpha-leaderboard-title">
          <div>
            <p className="incident-kicker">Cisco Live 2026 · Live leaderboard</p>
            <h1 id="alpha-leaderboard-title">Best decisions. Fastest response.</h1>
            <p>Each player keeps one place: their best result across all four incidents.</p>
          </div>
          <div className="alpha-leaderboard-rules" aria-label="Ranking rules">
            <span><Gauge aria-hidden="true" /><strong>Score first</strong>Decision quality leads</span>
            <span><Clock3 aria-hidden="true" /><strong>Time breaks ties</strong>Fastest verified run wins</span>
          </div>
        </section>

        <section className="alpha-leaderboard-board" aria-labelledby="alpha-leaderboard-board-title" aria-busy={loading || refreshing}>
          <div className="alpha-leaderboard-board__heading">
            <div>
              <p className="incident-kicker">Live standings</p>
              <h2 id="alpha-leaderboard-board-title">Top responders</h2>
            </div>
            <div>
              <span>{totalPlayers} {totalPlayers === 1 ? "player" : "players"}</span>
              <button type="button" onClick={() => void refresh(true)} disabled={refreshing}>
                <RefreshCw aria-hidden="true" /> {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="alpha-leaderboard-error" role="status">
              <strong>Leaderboard paused.</strong>
              <span>{error}</span>
              <button type="button" onClick={() => void refresh(true)}>Try again</button>
            </div>
          ) : loading ? (
            <p className="alpha-leaderboard-loading" role="status">Loading live standings…</p>
          ) : (
            <LeaderboardRows entries={entries} currentEntryId={currentEntryId} />
          )}
        </section>

        <a className="alpha-leaderboard-play" href="/2026alpha">
          Think you can take the lead? Choose an incident <ArrowRight aria-hidden="true" />
        </a>
      </main>
    </div>
  );
}
