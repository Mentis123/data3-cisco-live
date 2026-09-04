/**
 * Participant view. One table, one device, one task at a time.
 *
 * Mobile first and deliberately thin: the printed brief carries the facts, this
 * screen carries the lock. It never shows another table's response, a reveal, a
 * score or a rank.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import {
  RATIONALE_LIMIT,
  clearStoredToken,
  formatCountdown,
  freshness,
  readStoredToken,
  requestJson,
  storeToken,
  useNow,
  usePoll,
  type ParticipantState,
} from "./decisionRoomApi";
import "./decision-room.css";

function JoinCodeEntry() {
  const [code, setCode] = useState("");

  return (
    <main className="dr">
      <div className="dr-shell">
        <p className="dr-eyebrow">Decision Room</p>
        <h1>When the agent acts</h1>
        <p className="dr-lede">
          Enter the session code from the card on your table. One device per table is enough; everything else is on
          paper.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = code.trim().toUpperCase();
            if (trimmed) window.location.assign(`/workshop/${trimmed}`);
          }}
        >
          <div className="dr-field">
            <label className="dr-label" htmlFor="dr-join-code">
              Session code
            </label>
            <input
              id="dr-join-code"
              className="dr-input"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={12}
              placeholder="ABC123"
            />
          </div>
          <button className="dr-btn dr-btn--primary dr-btn--block" type="submit" disabled={!code.trim()}>
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}

export default function DecisionRoomTable() {
  const params = useParams<{ joinCode?: string }>();
  const joinCode = (params.joinCode ?? "").toUpperCase();

  const [token, setToken] = useState<string | null>(() => (joinCode ? readStoredToken(joinCode) : null));
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [optionKey, setOptionKey] = useState<string | null>(null);
  const [ownAction, setOwnAction] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [rationale, setRationale] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmingLock, setConfirmingLock] = useState(false);

  const headers = useMemo(() => (token ? { "x-table-token": token } : undefined), [token]);
  const { data, error, lastUpdated, loading, refresh } = usePoll<ParticipantState>(
    joinCode ? `/api/workshops/${joinCode}/state` : null,
    headers,
  );
  const now = useNow();

  const round = data?.round ?? null;
  const decision = data?.decision ?? null;
  const locked = Boolean(decision?.isLocked);
  const roundKey = round ? `${round.roundNumber}:${round.state}` : "none";

  // Pull the server's copy into the form whenever the round changes, or whenever
  // the table has not started editing this round yet.
  useEffect(() => {
    if (!dirty) {
      setOptionKey(decision?.optionKey ?? null);
      setOwnAction(decision?.ownAction ?? "");
      setConfidence(decision?.confidence ?? null);
      setRationale(decision?.rationale ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, decision?.isLocked]);

  useEffect(() => {
    setDirty(false);
    setConfirmingLock(false);
    setSaveError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);

  if (!joinCode) return <JoinCodeEntry />;

  async function join(tableCode: string) {
    setJoining(true);
    setJoinError(null);
    try {
      const result = await requestJson<{ token: string }>(`/api/workshops/${joinCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableCode }),
      });
      storeToken(joinCode, result.token);
      setToken(result.token);
      refresh();
    } catch (caught) {
      setJoinError(caught instanceof Error ? caught.message : "Could not join");
    } finally {
      setJoining(false);
    }
  }

  async function save(lock: boolean) {
    if (!round) return;
    setSaving(true);
    setSaveError(null);
    try {
      await requestJson(`/api/workshops/${joinCode}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(headers ?? {}) },
        body: JSON.stringify({
          optionKey: optionKey || null,
          ownAction: optionKey ? null : ownAction.trim() || null,
          confidence,
          rationale: rationale.trim() || null,
          lock,
        }),
      });
      setDirty(false);
      setConfirmingLock(false);
      refresh();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const status = freshness(lastUpdated, now);
  const hasChoice = Boolean(optionKey || ownAction.trim());
  const canLock = hasChoice && Boolean(confidence) && round?.state === "open";
  const countdown = round?.timer ? new Date(round.timer.endsAt).getTime() - now : null;

  return (
    <main className="dr">
      <div className="dr-shell">
        <header className="dr-header">
          <div>
            <p className="dr-eyebrow">{data?.session.variantLabel ?? "Decision Room"}</p>
            <strong>{data?.table?.displayName ?? "Not joined"}</strong>
          </div>
          <div className="dr-header-meta">
            {countdown !== null && round?.state === "open" ? (
              <span aria-label="Time remaining in this round">{formatCountdown(countdown)}</span>
            ) : null}
            <span className="dr-status">
              <span className={`dr-dot dr-dot--${status.tone}`} aria-hidden="true" />
              {status.label}
            </span>
          </div>
        </header>

        {loading && !data ? <p className="dr-muted">Loading the room…</p> : null}

        {status.tone === "offline" ? (
          <div className="dr-banner dr-banner--warn">
            No connection. Your last saved response is safe. Use the printed round lock card and hand it to the
            facilitator — the exercise continues unchanged.
          </div>
        ) : null}

        {error && status.tone !== "offline" ? <div className="dr-banner dr-banner--warn">{error}</div> : null}

        {data?.session.status === "ended" ? (
          <div className="dr-banner">This session has ended. Thank you.</div>
        ) : null}

        {/* --- join --- */}
        {data && !data.table ? (
          <section>
            <h1>Choose your table</h1>
            <p className="dr-lede">One scribe per table. Everyone else can leave their phone in their pocket.</p>
            {joinError ? <div className="dr-banner dr-banner--error">{joinError}</div> : null}
            <div className="dr-options">
              {data.availableTables.map((table) => (
                <button
                  key={table.tableCode}
                  type="button"
                  className="dr-option"
                  disabled={joining}
                  onClick={() => void join(table.tableCode)}
                >
                  <span className="dr-option-key">{table.tableCode}</span>
                  <span>
                    {table.displayName}
                    {table.claimed ? <span className="dr-muted"> · already joined on another device</span> : null}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- waiting for the round --- */}
        {data?.table && !round ? (
          <section>
            <h1>You are in</h1>
            <p className="dr-lede">
              Round {data.session.activeRound} has not opened yet. Read the printed brief, agree your roles and name
              your first two unknowns.
            </p>
          </section>
        ) : null}

        {/* --- locked --- */}
        {data?.table && round && locked ? (
          <section className="dr-locked">
            <h2>Response locked</h2>
            <dl>
              <dt>Call</dt>
              <dd>
                {decision?.optionKey
                  ? `${decision.optionKey} · ${
                      round.options.find((option) => option.key === decision.optionKey)?.label ?? ""
                    }`
                  : decision?.ownAction}
              </dd>
              <dt>Confidence</dt>
              <dd>{decision?.confidence} of 5</dd>
              {decision?.rationale ? (
                <>
                  <dt>Because</dt>
                  <dd>{decision.rationale}</dd>
                </>
              ) : null}
            </dl>
            <p className="dr-muted" style={{ marginTop: 16, marginBottom: 0 }}>
              Locked. Keep talking — the reveal will not wait for perfect certainty. Ask the facilitator if this must
              change.
            </p>
          </section>
        ) : null}

        {/* --- active round --- */}
        {data?.table && round && !locked ? (
          <section>
            <h1>{round.heading}</h1>
            <p className="dr-lede">{round.task}</p>

            {round.state !== "open" ? (
              <div className="dr-banner">
                This round is closed. The facilitator will move the room on.
              </div>
            ) : null}

            {round.options.length ? (
              <>
                <h2>Your call</h2>
                <div className="dr-options">
                  {round.options.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className="dr-option"
                      aria-pressed={optionKey === option.key}
                      disabled={round.state !== "open" || saving}
                      onClick={() => {
                        setOptionKey(optionKey === option.key ? null : option.key);
                        setOwnAction("");
                        setDirty(true);
                      }}
                    >
                      <span className="dr-option-key">{option.key}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className="dr-field">
              <label className="dr-label" htmlFor="dr-own-action">
                {round.options.length ? "Or our own action, stated precisely" : "Our call, in one sentence"}
              </label>
              <textarea
                id="dr-own-action"
                className="dr-textarea"
                value={ownAction}
                maxLength={RATIONALE_LIMIT}
                disabled={round.state !== "open" || saving}
                onChange={(event) => {
                  setOwnAction(event.target.value);
                  if (event.target.value) setOptionKey(null);
                  setDirty(true);
                }}
              />
              <div className="dr-counter">
                {ownAction.length}/{RATIONALE_LIMIT}
              </div>
            </div>

            <div className="dr-field">
              <span className="dr-label" id="dr-confidence-label">
                Confidence
              </span>
              <div className="dr-scale" role="group" aria-labelledby="dr-confidence-label">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="dr-scale-btn"
                    aria-pressed={confidence === value}
                    aria-label={`Confidence ${value} of 5`}
                    disabled={round.state !== "open" || saving}
                    onClick={() => {
                      setConfidence(value);
                      setDirty(true);
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="dr-scale-hint">
                <span>1 · we would change this quickly</span>
                <span>5 · we would defend this</span>
              </div>
            </div>

            <div className="dr-field">
              <label className="dr-label" htmlFor="dr-rationale">
                Because… (one sentence)
              </label>
              <textarea
                id="dr-rationale"
                className="dr-textarea"
                value={rationale}
                maxLength={RATIONALE_LIMIT}
                disabled={round.state !== "open" || saving}
                onChange={(event) => {
                  setRationale(event.target.value);
                  setDirty(true);
                }}
              />
              <div className="dr-counter">
                {rationale.length}/{RATIONALE_LIMIT}
              </div>
            </div>

            <p className="dr-muted">{round.lockHint}</p>

            {saveError ? <div className="dr-banner dr-banner--error">{saveError}</div> : null}

            {confirmingLock ? (
              <div className="dr-banner">
                <p style={{ marginBottom: 12 }}>
                  Lock this response? It becomes final unless the facilitator reopens your table.
                </p>
                <div className="dr-actions">
                  <button
                    type="button"
                    className="dr-btn dr-btn--primary"
                    disabled={saving}
                    onClick={() => void save(true)}
                  >
                    {saving ? "Locking…" : "Yes, lock it"}
                  </button>
                  <button type="button" className="dr-btn dr-btn--quiet" onClick={() => setConfirmingLock(false)}>
                    Keep editing
                  </button>
                </div>
              </div>
            ) : (
              <div className="dr-actions">
                <button
                  type="button"
                  className="dr-btn"
                  disabled={saving || round.state !== "open"}
                  onClick={() => void save(false)}
                >
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  className="dr-btn dr-btn--primary"
                  disabled={!canLock || saving}
                  onClick={() => setConfirmingLock(true)}
                >
                  Lock response
                </button>
              </div>
            )}
          </section>
        ) : null}

        {data?.table ? (
          <p className="dr-muted" style={{ marginTop: 40 }}>
            Wrong table?{" "}
            <button
              type="button"
              className="dr-btn dr-btn--quiet"
              style={{ padding: "4px 10px", fontSize: 13 }}
              onClick={() => {
                clearStoredToken(joinCode);
                setToken(null);
                refresh();
              }}
            >
              Switch table
            </button>
          </p>
        ) : null}
      </div>
    </main>
  );
}
