/**
 * Facilitator controls. Adam's private device, never projected.
 *
 * One row of round controls, one list of tables, and the two recovery actions
 * (reopen a table, reset the session). The console URL and join QR live here so
 * a lost tab is not a lost session.
 */

import { useMemo, useState } from "react";
import { useParams } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import {
  freshness,
  readFacilitatorKey,
  requestJson,
  storeFacilitatorKey,
  useNow,
  usePoll,
  type AdminState,
} from "./decisionRoomApi";
import "./decision-room.css";

type Variant = "enterprise" | "government";

function KeyGate({ onSaved }: { onSaved: (key: string) => void }) {
  const [key, setKey] = useState("");

  return (
    <main className="dr">
      <div className="dr-shell">
        <p className="dr-eyebrow">Decision Room</p>
        <h1>Facilitator controls</h1>
        <p className="dr-lede">Enter the facilitator key. It is held for this browser session only.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = key.trim();
            if (!trimmed) return;
            storeFacilitatorKey(trimmed);
            onSaved(trimmed);
          }}
        >
          <div className="dr-field">
            <label className="dr-label" htmlFor="dr-key">
              Facilitator key
            </label>
            <input
              id="dr-key"
              className="dr-input"
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              autoComplete="off"
            />
          </div>
          <button className="dr-btn dr-btn--primary" type="submit" disabled={!key.trim()}>
            Unlock
          </button>
        </form>
      </div>
    </main>
  );
}

function CreateSession({ facilitatorKey }: { facilitatorKey: string }) {
  const [variant, setVariant] = useState<Variant>("enterprise");
  const [tableCount, setTableCount] = useState(6);
  const [lookupCode, setLookupCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const result = await requestJson<{ id: string }>("/api/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-workshop-key": facilitatorKey },
        body: JSON.stringify({ variant, tableCount }),
      });
      window.location.assign(`/workshop/admin/${result.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the session");
      setBusy(false);
    }
  }

  async function lookup() {
    setBusy(true);
    setError(null);
    try {
      const result = await requestJson<{ id: string }>(
        `/api/workshops/lookup/${lookupCode.trim().toUpperCase()}`,
        { headers: { "x-workshop-key": facilitatorKey } },
      );
      window.location.assign(`/workshop/admin/${result.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not find that session");
      setBusy(false);
    }
  }

  return (
    <main className="dr">
      <div className="dr-shell">
        <p className="dr-eyebrow">Decision Room</p>
        <h1>New session</h1>
        <p className="dr-lede">
          Create a fresh session for each audience. Never reuse the morning session for the afternoon room.
        </p>

        {error ? <div className="dr-banner dr-banner--error">{error}</div> : null}

        <div className="dr-field">
          <span className="dr-label" id="dr-variant-label">
            Variant
          </span>
          <div className="dr-options" role="group" aria-labelledby="dr-variant-label">
            {(["enterprise", "government"] as Variant[]).map((option) => (
              <button
                key={option}
                type="button"
                className="dr-option"
                aria-pressed={variant === option}
                onClick={() => setVariant(option)}
              >
                <span className="dr-option-key">{option === "enterprise" ? "E" : "G"}</span>
                <span>
                  {option === "enterprise" ? "Enterprise · Project Atlas" : "Government · Civic Assist"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="dr-field">
          <label className="dr-label" htmlFor="dr-table-count">
            Tables in the room
          </label>
          <input
            id="dr-table-count"
            className="dr-input"
            type="number"
            min={2}
            max={12}
            value={tableCount}
            onChange={(event) => setTableCount(Number(event.target.value))}
          />
        </div>

        <button className="dr-btn dr-btn--primary" type="button" disabled={busy} onClick={() => void create()}>
          {busy ? "Working…" : "Create session"}
        </button>

        <div className="dr-panel" style={{ marginTop: 34 }}>
          <h2>Back to a session</h2>
          <p className="dr-muted">Lost the tab? Enter the join code shown on the console.</p>
          <div className="dr-field">
            <label className="dr-label" htmlFor="dr-lookup">
              Join code
            </label>
            <input
              id="dr-lookup"
              className="dr-input"
              value={lookupCode}
              onChange={(event) => setLookupCode(event.target.value.toUpperCase())}
              maxLength={12}
            />
          </div>
          <button className="dr-btn" type="button" disabled={busy || !lookupCode.trim()} onClick={() => void lookup()}>
            Open session
          </button>
        </div>
      </div>
    </main>
  );
}

export default function DecisionRoomAdmin() {
  const params = useParams<{ sessionId?: string }>();
  const sessionId = params.sessionId ?? "";
  const [facilitatorKey, setFacilitatorKey] = useState(() => readFacilitatorKey());
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const headers = useMemo(
    () => (facilitatorKey ? { "x-workshop-key": facilitatorKey } : undefined),
    [facilitatorKey],
  );
  const { data, error, lastUpdated, refresh } = usePoll<AdminState>(
    facilitatorKey && sessionId ? `/api/workshops/${sessionId}/admin` : null,
    headers,
  );
  const now = useNow();

  if (!facilitatorKey) return <KeyGate onSaved={setFacilitatorKey} />;
  if (!sessionId) return <CreateSession facilitatorKey={facilitatorKey} />;

  async function act(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await requestJson(`/api/workshops/${sessionId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(headers ?? {}) },
        body: JSON.stringify({ action, ...extra }),
      });
      refresh();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "That control did not apply");
    } finally {
      setBusy(false);
    }
  }

  const status = freshness(lastUpdated, now);
  const session = data?.session;
  const activeRound = data?.rounds.find((round) => round.roundNumber === session?.activeRound);
  const consoleUrl = session ? `${window.location.origin}/workshop/console/${session.consoleKey}` : "";
  const joinUrl = session ? `${window.location.origin}/workshop/${session.joinCode}` : "";
  const selectedCount = data?.tables.filter((table) => table.decision?.selectedForDisplay).length ?? 0;

  return (
    <main className="dr">
      <div className="dr-shell dr-shell--wide">
        <header className="dr-header">
          <div>
            <p className="dr-eyebrow">Facilitator controls · not for projection</p>
            <strong>{session?.name ?? "Loading…"}</strong>
          </div>
          <span className="dr-status">
            <span className={`dr-dot dr-dot--${status.tone}`} aria-hidden="true" />
            {status.label}
          </span>
        </header>

        {error ? <div className="dr-banner dr-banner--warn">{error}</div> : null}
        {actionError ? <div className="dr-banner dr-banner--error">{actionError}</div> : null}

        {session ? (
          <>
            <section className="dr-panel">
              <h2>Room</h2>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                <dl className="dr-kv" style={{ flex: "1 1 320px" }}>
                  <dt>Join code</dt>
                  <dd className="dr-join-code">{session.joinCode}</dd>
                  <dt>Join link</dt>
                  <dd>{joinUrl}</dd>
                  <dt>Console</dt>
                  <dd>
                    <a href={consoleUrl} target="_blank" rel="noreferrer" style={{ color: "var(--dr-blue)" }}>
                      Open the projected console
                    </a>
                  </dd>
                  <dt>Round</dt>
                  <dd>
                    {session.activeRound} of {session.roundCount} · {activeRound?.state ?? "pending"}
                  </dd>
                  <dt>Status</dt>
                  <dd>{session.status}</dd>
                </dl>
                <div className="dr-qr">
                  <QRCodeSVG value={joinUrl} size={132} />
                </div>
              </div>
            </section>

            <section className="dr-panel">
              <h2>Round controls</h2>
              <div className="dr-actions">
                <button
                  className="dr-btn dr-btn--primary"
                  type="button"
                  disabled={busy || activeRound?.state === "open" || activeRound?.state === "published"}
                  onClick={() => void act("open")}
                >
                  {activeRound?.state === "closed" ? "Reopen round" : "Open round"} {session.activeRound}
                </button>
                <button
                  className="dr-btn"
                  type="button"
                  disabled={busy || activeRound?.state !== "open"}
                  onClick={() => void act("close")}
                >
                  Close round
                </button>
                <button
                  className="dr-btn"
                  type="button"
                  disabled={busy || activeRound?.state !== "closed"}
                  onClick={() => void act("publish")}
                >
                  Publish results
                </button>
                <button
                  className="dr-btn dr-btn--quiet"
                  type="button"
                  disabled={busy || activeRound?.state !== "published"}
                  onClick={() => void act("hide")}
                >
                  Hide results
                </button>
                <button
                  className="dr-btn"
                  type="button"
                  disabled={busy || session.activeRound >= session.roundCount}
                  onClick={() => void act("advance")}
                >
                  Next round
                </button>
              </div>
              <p className="dr-muted" style={{ marginTop: 14, marginBottom: 0 }}>
                Close before you publish. Closing with tables unlocked is fine — they show as not locked and you can
                still publish.
              </p>
            </section>

            <section className="dr-panel">
              <h2>Tables</h2>
              <p className="dr-muted">
                Rationales are private until you select them. At most two are projected per round ({selectedCount} of 2
                selected).
              </p>
              <div className="dr-scroll">
                <table className="dr-admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Table</th>
                      <th scope="col">State</th>
                      <th scope="col">Call</th>
                      <th scope="col">Conf.</th>
                      <th scope="col">Rationale</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tables.map((table) => (
                      <tr key={table.id}>
                        <td>{table.displayName}</td>
                        <td>
                          <span
                            className={`dr-pill${
                              table.state === "locked"
                                ? " dr-pill--locked"
                                : table.state === "drafting"
                                  ? " dr-pill--drafting"
                                  : ""
                            }`}
                          >
                            {table.state === "waiting" ? "not joined" : table.state}
                          </span>
                        </td>
                        <td>
                          {table.decision?.optionKey
                            ? table.decision.optionKey
                            : table.decision?.ownAction || <span className="dr-muted">—</span>}
                        </td>
                        <td>{table.decision?.confidence ?? <span className="dr-muted">—</span>}</td>
                        <td>{table.decision?.rationale || <span className="dr-muted">—</span>}</td>
                        <td>
                          <div className="dr-actions">
                            {table.decision?.rationale ? (
                              <button
                                className="dr-btn"
                                style={{ padding: "6px 12px", fontSize: 13 }}
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void act("select", {
                                    decisionId: table.decision?.id,
                                    selected: !table.decision?.selectedForDisplay,
                                  })
                                }
                              >
                                {table.decision.selectedForDisplay ? "Unselect" : "Project"}
                              </button>
                            ) : null}
                            {table.decision?.isLocked ? (
                              <button
                                className="dr-btn dr-btn--quiet"
                                style={{ padding: "6px 12px", fontSize: 13 }}
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  if (window.confirm(`Reopen ${table.displayName}? Their lock is cleared.`)) {
                                    void act("reopen", { teamId: table.id });
                                  }
                                }}
                              >
                                Reopen
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dr-panel">
              <h2>After the session</h2>
              <div className="dr-actions">
                <a
                  className="dr-btn"
                  href={`/api/workshops/${sessionId}/export`}
                  onClick={(event) => {
                    // The export route is authenticated, so fetch it with the key and save the blob.
                    event.preventDefault();
                    void (async () => {
                      try {
                        const response = await fetch(`/api/workshops/${sessionId}/export`, { headers });
                        if (!response.ok) throw new Error(`Export failed (${response.status})`);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `decision-room-${session.joinCode}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      } catch (caught) {
                        setActionError(caught instanceof Error ? caught.message : "Export failed");
                      }
                    })();
                  }}
                >
                  Export decisions (JSON)
                </a>
                <button
                  className="dr-btn dr-btn--quiet"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Reset this session? Every response is deleted and rounds return to pending.")) {
                      void act("reset");
                    }
                  }}
                >
                  Reset session
                </button>
                <button
                  className="dr-btn dr-btn--danger"
                  type="button"
                  disabled={busy || session.status === "ended"}
                  onClick={() => {
                    if (window.confirm("End this session? Table devices can no longer submit.")) {
                      void act("end");
                    }
                  }}
                >
                  End session
                </button>
              </div>
              <p className="dr-muted" style={{ marginTop: 14, marginBottom: 0 }}>
                Export first, then end. Ending the session stops every table token immediately.
              </p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
