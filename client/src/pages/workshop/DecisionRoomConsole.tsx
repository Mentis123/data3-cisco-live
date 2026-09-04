/**
 * Presenter console. Projectable, dark, read only.
 *
 * It reports the state of the room: the timer, how many tables are joined,
 * drafting and locked, and — only once the facilitator publishes — the option
 * distribution, the confidence spread and up to two selected rationales.
 *
 * It never shows a lock time, an order of arrival, a rank, a score, a
 * correctness colour or a winner. Rationales are shown unattributed.
 */

import { useParams } from "wouter";
import {
  formatCountdown,
  freshness,
  useNow,
  usePoll,
  type ConsoleState,
  type TableState,
} from "./decisionRoomApi";
import "./decision-room.css";

const STATE_LABEL: Record<TableState, string> = {
  waiting: "Not joined",
  joined: "Joined",
  drafting: "Drafting",
  locked: "Locked",
};

export default function DecisionRoomConsole() {
  const params = useParams<{ consoleKey?: string }>();
  const consoleKey = params.consoleKey ?? "";
  const { data, error, lastUpdated, loading } = usePoll<ConsoleState>(
    consoleKey ? `/api/workshops/console/${consoleKey}` : null,
  );
  const now = useNow();

  const status = freshness(lastUpdated, now);
  const round = data?.round ?? null;
  const timer = round?.timer ?? null;
  const remaining = timer ? new Date(timer.endsAt).getTime() - now : null;
  const results = data?.results ?? null;
  const showResults = Boolean(data?.resultsVisible && results);

  const timerClass =
    remaining === null
      ? ""
      : remaining <= 0
        ? " dr-timer--done"
        : remaining <= 120_000
          ? " dr-timer--low"
          : "";

  const maxCount = Math.max(1, ...(results?.distribution.map((entry) => entry.count) ?? [1]));

  return (
    <main className="dr">
      <div className="dr-console">
        <div className="dr-console-top">
          <div>
            <p className="dr-eyebrow">
              {data ? `${data.session.variantLabel} · ${data.session.system}` : "Decision Room"}
            </p>
            <h1 className="dr-console-title">
              {round ? round.heading : data ? "Waiting for the next round" : "Decision Room"}
            </h1>
          </div>
          {timer && round?.state === "open" ? (
            <div className={`dr-timer${timerClass}`} aria-live="off">
              {formatCountdown(remaining ?? 0)}
            </div>
          ) : (
            <div className="dr-timer" style={{ fontSize: 34, color: "var(--dr-muted)" }}>
              {round?.state === "closed"
                ? "Round closed"
                : round?.state === "published"
                  ? "Results"
                  : "Standing by"}
            </div>
          )}
        </div>

        {loading && !data ? <p className="dr-muted">Connecting to the room…</p> : null}
        {!loading && !data && error ? (
          <div className="dr-banner dr-banner--error">
            {error}. Run the round from the printed pack; the exercise does not depend on this screen.
          </div>
        ) : null}

        {data ? (
          <>
            <div className="dr-counts">
              <div>
                <div className="dr-count-value">
                  {data.counts.joined}
                  <span style={{ fontSize: 26, color: "var(--dr-muted)" }}>/{data.counts.total}</span>
                </div>
                <div className="dr-count-label">Joined</div>
              </div>
              <div>
                <div className="dr-count-value" style={{ color: "var(--dr-blue)" }}>
                  {data.counts.drafting}
                </div>
                <div className="dr-count-label">Drafting</div>
              </div>
              <div>
                <div className="dr-count-value" style={{ color: "var(--dr-aqua)" }}>
                  {data.counts.locked}
                </div>
                <div className="dr-count-label">Locked</div>
              </div>
            </div>

            <div className="dr-tiles">
              {data.tables.map((table) => (
                <div key={table.tableCode} className={`dr-tile dr-tile--${table.state}`}>
                  <div className="dr-tile-name">{table.displayName}</div>
                  <div className="dr-tile-state">{STATE_LABEL[table.state]}</div>
                </div>
              ))}
            </div>

            {showResults && results ? (
              <>
                {results.distribution.length ? (
                  <>
                    <h2>Where the room landed</h2>
                    <div className="dr-bars">
                      {results.distribution.map((entry) => (
                        <div className="dr-bar-row" key={entry.key}>
                          <span>
                            {entry.key === "own" ? "Own action" : `${entry.key} · ${entry.label}`}
                          </span>
                          <span className="dr-bar-track">
                            <span
                              className="dr-bar-fill"
                              style={{ width: `${Math.round((entry.count / maxCount) * 100)}%` }}
                            />
                          </span>
                          <span className="dr-bar-count">{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {results.confidence && results.confidence.median !== null ? (
                  <p className="dr-lede" style={{ fontSize: 21 }}>
                    Confidence across {results.lockedCount} locked {results.lockedCount === 1 ? "response" : "responses"}
                    : median {results.confidence.median}, range {results.confidence.min} to {results.confidence.max}.
                  </p>
                ) : null}

                {results.rationales.length ? (
                  <>
                    <h2>Two reasons from the room</h2>
                    <div className="dr-quotes">
                      {results.rationales.map((rationale, index) => (
                        <blockquote className="dr-quote" key={index}>
                          {rationale.text}
                        </blockquote>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            ) : null}

            <div className="dr-console-footer">
              <span>
                Join at <strong>{window.location.host}/workshop</strong> with code{" "}
                <span className="dr-join-code">{data.session.joinCode}</span>
              </span>
              <span>
                Round {data.session.activeRound} of {data.session.roundCount} · no scores, no ranking
              </span>
              <span className="dr-status">
                <span className={`dr-dot dr-dot--${status.tone}`} aria-hidden="true" />
                {status.tone === "live"
                  ? "Live"
                  : `Last updated ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"}`}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
