/**
 * Decision Room — Riverbend edition.
 *
 * Four views on one route family:
 *   /decision-room                     landing: join a table / facilitate / open console
 *   /decision-room/session/:code       one phone per table: dashboard, vote A–D, lock
 *   /decision-room/console/:id         the projector: launch, timer, who's locked, the split
 *   /decision-room/admin/:id           Adam's private controls
 *
 * Nothing here ranks tables or declares a winner. The "best move" lives on
 * Richard's slide and is never sent to a device.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, ArrowRight, Check, Copy, Download, Eye, LockKeyhole, Monitor, Play, Radio, RotateCcw, ShieldCheck, Square, Users, Zap } from "lucide-react";
import "./decision-room.css";

/* ------------------------------------------------------------------ types */

type RoundState = "lobby" | "launched" | "open" | "closed" | "published" | "ended";
type SessionInfo = { id: string; joinCode: string; name: string; status: string; revision: number; activeRound: number; roundCount: number; roundState: RoundState; roundStartedAt: string | null; roundClosedAt: string | null; launchedAt: string | null; durationSeconds: number };
type Organisation = { name: string; tagline: string; estate: string; holds: string; reach: string; objective: string };
type Feed = { kind: string; who: string; text: string };
type Round = { roundNo: number; id: string; seat: string; when: string; title: string; prompt: string; situation: string[]; feed: Feed[]; options: { key: string; label: string }[]; path: string[]; durationSeconds: number };
type Meters = Record<string, number>;
type MeterKey = { id: string; name: string; good: boolean };
type Stage = { id: string; name: string; sub: string };
type Split = { locked: number; options: Record<string, number>; confidence: { low: number | null; high: number | null; median: number | null }; featured: { id: string; rationale: string; confidence: number | null }[] };
type Consequence = { you: string; body: string; changes: { t: string; d: "up" | "down" | "flag" }[]; meters: Record<string, number> };
type Decision = { id: string; optionKey: string | null; rationale: string; confidence: number | null; isLocked: boolean };
type ParticipantData = { session: SessionInfo; team: { id: string; displayName: string; state: string }; organisation: Organisation; round: Round | null; decision: Decision | null; dashboard: { meters: Meters; path: string[]; stages: Stage[]; meterKeys: MeterKey[] }; results: (Split & { consequence: Consequence | null }) | null };
type Launch = { profile: { label: string; value: string; mirrors: string }[]; lines: { t: string; text: string; tone: string }[] };
type ConsoleData = { session: SessionInfo; organisation: Organisation; launch: Launch; round: Round | null; counts: { notJoined: number; joined: number; locked: number; total: number }; teams: { id: string; displayName: string; state: string }[]; results: Split | null; initialMeters: Meters; decisions?: { id: string; teamId: string; table: string; optionKey: string | null; rationale: string; confidence: number | null; isLocked: boolean; isFeatured: boolean }[] };

const API = "/api/decision-room";
const POLL_MS = 5000;

/* ---------------------------------------------------------------- helpers */

async function request<T>(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({ message: response.statusText }));
  if (!response.ok) throw new Error(body.message || "Request failed");
  return body as T;
}
const json = (body: unknown, headers: Record<string, string> = {}) => ({ method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!active) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [active]);
  return now;
}
function countdown(startedAt: string | null, durationSeconds: number, now: number) {
  if (!startedAt) return { label: "--:--", over: false, low: false };
  const left = durationSeconds - Math.floor((now - new Date(startedAt).getTime()) / 1000);
  const abs = Math.abs(left);
  return { label: `${left < 0 ? "+" : ""}${Math.floor(abs / 60).toString().padStart(2, "0")}:${(abs % 60).toString().padStart(2, "0")}`, over: left < 0, low: left >= 0 && left <= 60 };
}
function usePoll<T>(url: string | null, headers?: Record<string, string>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const headersRef = useRef(headers); headersRef.current = headers;
  const load = async () => {
    if (!url) return;
    try { setData(await request<T>(url, { headers: headersRef.current })); setError(""); setLastUpdated(Date.now()); }
    catch (e) { setError((e as Error).message); }
  };
  useEffect(() => { if (!url) return; void load(); const id = setInterval(() => void load(), POLL_MS); return () => clearInterval(id); }, [url]);
  return { data, error, lastUpdated, refresh: load };
}
function stale(lastUpdated: number | null, now: number) {
  if (!lastUpdated) return "connecting";
  const age = now - lastUpdated;
  return age > 30000 ? "offline" : age > 15000 ? "reconnecting" : "live";
}
function meterTone(good: boolean, value: number) {
  if (good) return value >= 66 ? "good" : value >= 33 ? "warn" : "bad";
  return value <= 33 ? "good" : value <= 66 ? "warn" : "bad";
}
const STAGE_PILL: Record<string, string> = { secure: "secure", watched: "watched", "at risk": "at risk", compromised: "compromised", contained: "contained", blind: "blind", "safe state": "safe state" };
const STAGE_CLASS: Record<string, string> = { secure: "ok", watched: "watch", "at risk": "risk", compromised: "hit", contained: "contained", blind: "blind", "safe state": "safe" };
const TEAM_LABEL: Record<string, string> = { not_joined: "not joined", reading: "joined", debating: "drafting", locked: "locked" };

/* -------------------------------------------------------------- building blocks */

function Frame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={`dr-shell ${wide ? "dr-wide" : ""}`}><header className="dr-brand"><div className="dr-mark" aria-label="Data#3">D<sup>#</sup>3</div><div><strong>DECISION ROOM</strong><small>WHEN THE AGENT ATTACKS · RIVERBEND</small></div></header>{children}<footer>Observe · govern · secure · no scores, no ranking</footer></main>;
}
function ErrorText({ message }: { message: string }) { return message ? <p className="dr-error"><AlertTriangle size={18} />{message}</p> : null; }
function Status({ tone, label }: { tone: string; label: string }) { return <span className={`dr-live dr-live--${tone}`}><i />{label}</span>; }

function MetersPanel({ meters, keys, flash }: { meters: Meters; keys: MeterKey[]; flash?: string[] }) {
  return <div className="dr-meters">{keys.map((m) => { const v = meters[m.id] ?? 0; const tone = meterTone(m.good, v); return <div className={`dr-meter dr-meter--${tone} ${flash?.includes(m.id) ? "flash" : ""}`} key={m.id}><div className="top"><span>{m.name}</span><strong>{v}{m.id === "cover" ? "%" : ""}</strong></div><span className="bar"><i style={{ width: `${v}%` }} /></span></div>; })}</div>;
}
function PathPanel({ path, stages }: { path: string[]; stages: Stage[] }) {
  return <div className="dr-chain">{stages.map((s, i) => { const status = path[i] ?? "secure"; return <div className={`dr-stage dr-stage--${STAGE_CLASS[status] ?? "ok"}`} key={s.id}><span className="node" /><span className="name">{s.name}<small>{s.sub}</small></span><span className="pill">{STAGE_PILL[status] ?? status}</span></div>; })}</div>;
}
function FeedPanel({ feed }: { feed: Feed[] }) {
  return <div className="dr-feed">{feed.map((m, i) => <div className={`dr-msg dr-msg--${m.kind}`} key={i}><span className="ava">{m.who.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "··"}</span><div><small>{m.who}</small><p>{m.text}</p></div></div>)}</div>;
}
function SplitBars({ split, options }: { split: Split; options?: { key: string; label: string }[] }) {
  const max = Math.max(1, ...Object.values(split.options));
  return <div className="dr-bars">{["A", "B", "C", "D"].map((k) => { const v = split.options[k] ?? 0; const label = options?.find((o) => o.key === k)?.label; return <div key={k}><b>{k}</b><span className="track"><i style={{ width: `${Math.round((v / max) * 100)}%` }} /></span><strong>{v}</strong>{label ? <small>{label}</small> : null}</div>; })}</div>;
}

/* --------------------------------------------------------------- landing */

function Landing({ presetCode }: { presetCode?: string }) {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"join" | "facilitate" | "display">("join");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState(presetCode || ""); const [teamCode, setTeamCode] = useState("");
  const [adminKey, setAdminKey] = useState(() => { try { return localStorage.getItem("decision-room-admin-key") || ""; } catch { return ""; } });
  const [tableCount, setTableCount] = useState(8);
  const [sessionId, setSessionId] = useState(""); const [displayToken, setDisplayToken] = useState("");

  async function join() {
    setBusy(true); setError("");
    try {
      const data = await request<{ teamToken: string; joinCode: string }>(`${API}/join`, json({ joinCode, teamCode }));
      try { localStorage.setItem(`decision-room-team:${data.joinCode}`, data.teamToken); } catch { /* private mode: the table rejoins on reload */ }
      navigate(`/decision-room/session/${data.joinCode}`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function create() {
    setBusy(true); setError("");
    try {
      const data = await request<{ sessionId: string; joinCode: string; displayToken: string }>(`${API}/sessions`, json({ tableCount }, { "x-admin-key": adminKey }));
      try { localStorage.setItem("decision-room-admin-key", adminKey); localStorage.setItem(`decision-room-display:${data.sessionId}`, data.displayToken); } catch { /* ignore */ }
      navigate(`/decision-room/admin/${data.sessionId}`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function openDisplay() { try { localStorage.setItem(`decision-room-display:${sessionId}`, displayToken); } catch { /* ignore */ } navigate(`/decision-room/console/${sessionId}?displayToken=${encodeURIComponent(displayToken)}`); }

  return <Frame>
    <section className="dr-hero"><span className="dr-kicker">LIVE TABLETOP INSTRUMENT</span><h1>Make the room’s decisions visible.</h1><p>One phone per table. Six rounds, from the SOC floor to the boardroom. Vote A–D, say why, lock it — then see where the room landed.</p></section>
    <nav className="dr-tabs" aria-label="Choose view"><button className={mode === "join" ? "active" : ""} onClick={() => setMode("join")}><Users />Join a table</button><button className={mode === "facilitate" ? "active" : ""} onClick={() => setMode("facilitate")}><ShieldCheck />Facilitate</button><button className={mode === "display" ? "active" : ""} onClick={() => setMode("display")}><Monitor />Open console</button></nav>
    <section className="dr-card dr-form">
      {mode === "join" && <><h2>Join your table</h2><p className="dr-hint">The room code is on the big screen. Your table code is your table number.</p><label>Room code<input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={8} autoCapitalize="characters" autoCorrect="off" /></label><label>Table code<input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} placeholder="1" maxLength={12} inputMode="numeric" /></label><button className="dr-primary" disabled={busy || !joinCode || !teamCode} onClick={join}>Join room <ArrowRight /></button></>}
      {mode === "facilitate" && <><h2>Create a live room</h2><p className="dr-hint">Adam only. One room per session; never reuse the morning room for the afternoon.</p><label>Facilitator key<input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} autoComplete="off" /></label><label>Tables in the room<input type="number" min={2} max={50} value={tableCount} onChange={(e) => setTableCount(Number(e.target.value))} /></label><button className="dr-primary" disabled={busy || !adminKey} onClick={create}>Create room <ArrowRight /></button></>}
      {mode === "display" && <><h2>Open a presenter console</h2><p className="dr-hint">Normally you open the console from the facilitator page with one click. This is the recovery path.</p><label>Session ID<input value={sessionId} onChange={(e) => setSessionId(e.target.value)} /></label><label>Display token<input type="password" value={displayToken} onChange={(e) => setDisplayToken(e.target.value)} /></label><button className="dr-primary" disabled={!sessionId || !displayToken} onClick={openDisplay}>Open console <Monitor /></button></>}
      <ErrorText message={error} />
    </section>
  </Frame>;
}

/* ----------------------------------------------------------- participant */

function Participant({ code }: { code: string }) {
  const [, navigate] = useLocation();
  const token = useMemo(() => { try { return localStorage.getItem(`decision-room-team:${code}`) || ""; } catch { return ""; } }, [code]);
  const headers = useMemo(() => ({ "x-team-token": token }), [token]);
  const { data, error, lastUpdated, refresh } = usePoll<ParticipantData>(token ? `${API}/sessions/${code}/participant` : null, headers);
  const now = useNow();
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => { if (!token) navigate(`/decision-room/join/${code}`); }, [token, code, navigate]);
  const roundKey = data ? `${data.session.activeRound}:${data.session.roundState}:${data.decision?.isLocked ? 1 : 0}` : "";
  useEffect(() => {
    if (!data || dirty) return;
    setOptionKey(data.decision?.optionKey ?? null); setRationale(data.decision?.rationale ?? ""); setConfidence(data.decision?.confidence ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);
  useEffect(() => { setDirty(false); setConfirming(false); setSaveError(""); }, [data?.session.activeRound]);
  useEffect(() => { if (error && /rejoin/i.test(error)) navigate(`/decision-room/join/${code}`); }, [error, code, navigate]);

  async function save(lock: boolean) {
    if (!data || !optionKey) return;
    setSaving(true); setSaveError("");
    try {
      await request(`${API}/sessions/${code}/decision`, { ...json({ roundNo: data.session.activeRound, optionKey, rationale: rationale.trim(), confidence, lock }, headers), method: "PUT" });
      setDirty(false); setConfirming(false); await refresh();
    } catch (e) { setSaveError((e as Error).message); } finally { setSaving(false); }
  }

  if (!token) return null;
  if (!data) return <Frame><section className="dr-card"><h2>Connecting to Riverbend…</h2><ErrorText message={error} /></section></Frame>;

  const { session, round, decision, dashboard, results } = data;
  const state = session.roundState;
  const locked = Boolean(decision?.isLocked);
  const clock = countdown(session.roundStartedAt, session.durationSeconds, now);
  const connection = stale(lastUpdated, now);
  const canLock = Boolean(optionKey) && Boolean(confidence) && state === "open";
  const changedMeters = results?.consequence ? Object.keys(results.consequence.meters) : [];

  return <Frame>
    <div className="dr-session-head">
      <div><span className="dr-kicker">{data.team.displayName.toUpperCase()}{round ? ` · ${round.seat.toUpperCase()}` : ""}</span><h1 className="dr-h1-small">{round ? round.title : data.organisation.name}</h1>{round ? <p className="dr-when">{round.when}</p> : <p className="dr-when">{data.organisation.tagline}</p>}</div>
      <div className="dr-head-right">{state === "open" ? <span className={`dr-mini-clock ${clock.over ? "over" : clock.low ? "low" : ""}`}>{clock.label}</span> : null}<Status tone={connection} label={connection} /></div>
    </div>

    {connection === "offline" ? <div className="dr-banner dr-banner--warn">No connection. Your last saved response is safe — use the printed lock card and hand it to Adam. The exercise continues.</div> : null}

    <section className="dr-card dr-dash">
      <div className="dr-panel-head"><span>Riverbend · attack path</span><span className="dr-chain-note">{state === "lobby" ? "all systems nominal" : state === "launched" ? "something is moving" : round?.when ?? ""}</span></div>
      <div className="dr-dash-grid"><PathPanel path={dashboard.path} stages={dashboard.stages} /><div><div className="dr-panel-head"><span>Live state</span></div><MetersPanel meters={dashboard.meters} keys={dashboard.meterKeys} flash={changedMeters} /></div></div>
    </section>

    {state === "lobby" && <section className="dr-card dr-wait"><Radio className="dr-wait-icon" /><h2>Monitoring mode</h2><p>{data.organisation.estate}</p><p className="dr-hint">Read the printed brief. Agree who speaks for the table. Adam will open the first round.</p></section>}
    {state === "launched" && <section className="dr-card dr-wait"><Zap className="dr-wait-icon" /><h2>Something tripped a faint signal in the SOC.</h2><p>Nothing is confirmed. Stand by for triage.</p></section>}
    {state === "ended" && <section className="dr-card dr-wait"><h2>The room has closed.</h2><p>Thank you. Take one control to test, an owner and a date back with you.</p></section>}

    {round && (state === "open" || state === "closed" || state === "published") && <>
      <section className="dr-card"><div className="dr-panel-head"><span>Incoming</span></div><FeedPanel feed={round.feed} />
        <div className="dr-situation">{round.situation.map((line, i) => <p key={i}><b>{String(i + 1).padStart(2, "0")}</b>{line}</p>)}</div>
        <h2 className="dr-task">{round.prompt}</h2>
      </section>

      {state === "published" && results ? <section className="dr-card dr-reveal">
        <div className="dr-panel-head"><span>Where the room landed</span><span className="dr-chain-note">{results.locked} tables locked</span></div>
        <SplitBars split={results} options={round.options} />
        {results.confidence.median !== null ? <p className="dr-hint">Confidence median {results.confidence.median}, range {results.confidence.low}–{results.confidence.high}.</p> : null}
        {results.consequence ? <div className="dr-conseq"><span className="tag">Your call · {decision?.optionKey}</span><strong>{results.consequence.you}</strong><p>{results.consequence.body}</p><div className="dr-changes">{results.consequence.changes.map((ch) => <span className={`chg chg--${ch.d}`} key={ch.t}>{ch.t}</span>)}</div></div> : <p className="dr-hint">Your table did not lock a call this round, so there is no consequence to show.</p>}
      </section> : null}

      {state === "closed" && !results ? <section className="dr-card dr-wait"><Square className="dr-wait-icon" /><h2>Round closed.</h2><p>Richard is walking the options on the screen. Your call{locked ? ` was ${decision?.optionKey}` : " was not locked"}.</p></section> : null}

      {state === "open" && locked ? <section className="dr-card dr-locked-card"><h2><LockKeyhole /> Locked: {decision?.optionKey}</h2>{decision?.rationale ? <p>“{decision.rationale}”</p> : null}<p className="dr-hint">Confidence {decision?.confidence} of 5. Keep talking — the reveal will not wait for perfect certainty. Ask Adam if this must change.</p></section> : null}

      {state === "open" && !locked ? <section className="dr-card dr-form dr-vote">
        <div className="dr-options">{round.options.map((o) => <button key={o.key} className={optionKey === o.key ? "selected" : ""} aria-pressed={optionKey === o.key} disabled={saving} onClick={() => { setOptionKey(o.key); setDirty(true); }}><b>{o.key}</b><span>{o.label}</span></button>)}</div>
        <label>Because… (one sentence)<textarea value={rationale} maxLength={240} disabled={saving} onChange={(e) => { setRationale(e.target.value); setDirty(true); }} placeholder="The reason we would defend out loud." /><span className="dr-counter">{rationale.length}/240</span></label>
        <span className="dr-label">Confidence</span>
        <div className="dr-scale" role="group" aria-label="Confidence from 1 to 5">{[1, 2, 3, 4, 5].map((v) => <button key={v} type="button" aria-pressed={confidence === v} disabled={saving} onClick={() => { setConfidence(v); setDirty(true); }}>{v}</button>)}</div>
        <div className="dr-scale-hint"><small>1 · we’d change this quickly</small><small>5 · we’d defend this</small></div>
        <ErrorText message={saveError} />
        {confirming ? <div className="dr-banner"><p>Lock <b>{optionKey}</b>? It’s final unless Adam reopens your table.</p><div className="dr-actions"><button className="dr-primary" disabled={saving} onClick={() => save(true)}>{saving ? "Locking…" : "Yes, lock it"}</button><button onClick={() => setConfirming(false)}>Keep talking</button></div></div>
          : <div className="dr-actions"><button disabled={saving || !optionKey} onClick={() => save(false)}>{saving ? "Saving…" : "Save draft"}</button><button className="dr-primary" disabled={!canLock || saving} onClick={() => setConfirming(true)}>Lock response <LockKeyhole /></button></div>}
      </section> : null}
    </>}

    <p className="dr-switch">Wrong table? <button onClick={() => { try { localStorage.removeItem(`decision-room-team:${code}`); } catch { /* ignore */ } navigate(`/decision-room/join/${code}`); }}>Rejoin</button></p>
  </Frame>;
}

/* --------------------------------------------------------------- console */

function Terminal({ launch, launchedAt, now }: { launch: Launch; launchedAt: string | null; now: number }) {
  const elapsed = launchedAt ? (now - new Date(launchedAt).getTime()) / 1000 : 0;
  const visible = launchedAt ? Math.min(launch.lines.length, Math.floor(elapsed / 1.4) + 1) : 0;
  return <div className="dr-term"><div className="bar"><i /><i /><i /><span>agent@riverbend — autonomous</span></div><div className="body">{launch.lines.slice(0, visible).map((l, i) => <div className={`ln ln--${l.tone}`} key={i}><span className="ts">[{l.t}]</span> {l.text}</div>)}{visible < launch.lines.length && launchedAt ? <div className="ln ln--cursor">▌</div> : null}</div></div>;
}

function Console({ id }: { id: string }) {
  const displayToken = useMemo(() => { const q = new URLSearchParams(location.search).get("displayToken"); if (q) return q; try { return localStorage.getItem(`decision-room-display:${id}`) || ""; } catch { return ""; } }, [id]);
  const { data, error, lastUpdated } = usePoll<ConsoleData>(`${API}/sessions/${id}/console?displayToken=${encodeURIComponent(displayToken)}`);
  const now = useNow();
  if (!data) return <Frame wide><section className="dr-card"><h2>Opening presenter console…</h2><ErrorText message={error} /><p className="dr-hint">If this stays here, run the round from the printed pack. The exercise does not depend on this screen.</p></section></Frame>;
  const { session, round, counts, results } = data;
  const state = session.roundState;
  const clock = countdown(session.roundStartedAt, session.durationSeconds, now);
  const connection = stale(lastUpdated, now);

  return <Frame wide>
    <section className="dr-console-head">
      <div><span className="dr-kicker">{data.organisation.name.toUpperCase()}{round ? ` · ${round.seat.toUpperCase()} · ${round.when.toUpperCase()}` : ""}</span><h1>{state === "lobby" ? "All systems nominal." : state === "launched" ? "Machine speed." : round ? round.title : "Decision Room"}</h1></div>
      {state === "open" ? <div className={`dr-clock ${clock.over ? "over" : clock.low ? "low" : ""}`}><small>TABLE CLOCK</small><strong>{clock.label}</strong></div> : <div className="dr-clock muted"><small>ROUND</small><strong>{state === "lobby" || state === "launched" ? "—" : `${session.activeRound} / ${session.roundCount}`}</strong><em>{state === "closed" ? "closed" : state === "published" ? "the split" : state === "ended" ? "ended" : state}</em></div>}
    </section>

    {(state === "lobby" || state === "launched") && <section className="dr-console-grid">
      <div className="dr-card"><div className="dr-panel-head"><span>The adversary</span></div><div className="dr-profile">{data.launch.profile.map((p) => <div key={p.label}><small>{p.label}</small><strong>{p.value}</strong><em>mirrors {p.mirrors}</em></div>)}</div><p className="dr-hint">Fictional and narrative only. No tools, no code, no exploit steps — this exists to show how cheap and modular these choices have become.</p></div>
      <div className="dr-card"><div className="dr-panel-head"><span>{state === "lobby" ? "Standing by" : "T-0 · the operation runs"}</span></div>{state === "launched" ? <Terminal launch={data.launch} launchedAt={session.launchedAt} now={now} /> : <div className="dr-standby"><Radio /><p>{data.organisation.tagline}</p><p className="dr-hint">Join at <strong>{location.host}/decision-room</strong> · room code <span className="dr-join-code">{session.joinCode}</span></p></div>}</div>
    </section>}

    {(state === "open" || state === "closed" || state === "published" || state === "ended") && <>
      <section className="dr-metrics"><div className="dr-metric"><small>Joined</small><strong>{counts.joined + counts.locked}<em>/{counts.total}</em></strong></div><div className="dr-metric"><small>Drafting</small><strong>{counts.joined}</strong></div><div className="dr-metric accent"><small>Locked</small><strong>{counts.locked}</strong></div></section>
      <div className="dr-team-grid dr-team-grid--wide">{data.teams.map((t) => <div className={`dr-team ${t.state}`} key={t.id}><strong>{t.displayName}</strong><small>{TEAM_LABEL[t.state] ?? t.state}</small></div>)}</div>
      {state === "published" && results ? <section className="dr-results-wide">
        <div className="dr-card"><div className="dr-panel-head"><span>Where the room landed</span><span className="dr-chain-note">{results.locked} of {counts.total} tables</span></div><SplitBars split={results} options={round?.options} />{results.confidence.median !== null ? <p className="dr-confidence">Confidence median <strong>{results.confidence.median}</strong> · range <strong>{results.confidence.low}–{results.confidence.high}</strong></p> : null}</div>
        {results.featured.length ? <div className="dr-quotes">{results.featured.map((f) => <blockquote className="dr-quote" key={f.id}><span>From the room</span><strong>{f.rationale}</strong><small>confidence {f.confidence ?? "–"}</small></blockquote>)}</div> : null}
      </section> : state === "open" || state === "closed" ? <section className="dr-card"><div className="dr-panel-head"><span>{round?.prompt ?? "What is your priority?"}</span></div><div className="dr-option-list">{round?.options.map((o) => <div key={o.key}><b>{o.key}</b><span>{o.label}</span></div>)}</div><p className="dr-console-note">{state === "closed" ? "Round closed. Responses stay private until Adam shows the split." : "Tables are deciding. Responses stay private until the split is shown."}</p></section> : null}
    </>}

    <footer className="dr-console-footer"><span>Join at <strong>{location.host}/decision-room</strong> · code <span className="dr-join-code">{session.joinCode}</span></span><Status tone={connection} label={connection === "live" ? "Live" : `Last updated ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"}`} /></footer>
    <ErrorText message={error} />
  </Frame>;
}

/* ----------------------------------------------------------------- admin */

function Admin({ id }: { id: string }) {
  const [key, setKey] = useState(() => { try { return localStorage.getItem("decision-room-admin-key") || ""; } catch { return ""; } });
  const [draftKey, setDraftKey] = useState("");
  const displayToken = useMemo(() => { try { return localStorage.getItem(`decision-room-display:${id}`) || ""; } catch { return ""; } }, [id]);
  const headers = useMemo(() => ({ "x-admin-key": key }), [key]);
  const { data, error, lastUpdated, refresh } = usePoll<ConsoleData>(key ? `${API}/sessions/${id}/admin` : null, headers);
  const now = useNow();
  const [busy, setBusy] = useState(false); const [actionError, setActionError] = useState("");

  async function act(body: unknown) { setBusy(true); setActionError(""); try { await request(`${API}/sessions/${id}/actions`, json(body, headers)); await refresh(); } catch (e) { setActionError((e as Error).message); } finally { setBusy(false); } }
  async function exportCsv() { setActionError(""); try { const response = await fetch(`${API}/sessions/${id}/export`, { headers }); if (!response.ok) { const body = await response.json(); throw new Error(body.message || "Export failed"); } const url = URL.createObjectURL(await response.blob()); const a = document.createElement("a"); a.href = url; a.download = `decision-room-${data?.session.joinCode || "export"}.csv`; a.click(); URL.revokeObjectURL(url); } catch (e) { setActionError((e as Error).message); } }

  if (!key) return <Frame><section className="dr-card dr-form"><h2>Facilitator access</h2><label>Facilitator key<input type="password" value={draftKey} onChange={(e) => setDraftKey(e.target.value)} autoComplete="off" /></label><button className="dr-primary" disabled={!draftKey.trim()} onClick={() => { try { localStorage.setItem("decision-room-admin-key", draftKey.trim()); } catch { /* ignore */ } setKey(draftKey.trim()); }}>Continue</button></section></Frame>;
  if (!data) return <Frame><section className="dr-card"><h2>Opening facilitator controls…</h2><ErrorText message={error} />{/unauthor|facilitator access/i.test(error) ? <button onClick={() => { try { localStorage.removeItem("decision-room-admin-key"); } catch { /* ignore */ } setKey(""); }}>Use a different key</button> : null}</section></Frame>;

  const { session, counts, round } = data;
  const state = session.roundState;
  const joinUrl = `${location.origin}/decision-room/join/${session.joinCode}`;
  const consoleUrl = `/decision-room/console/${id}?displayToken=${encodeURIComponent(displayToken)}`;
  const clock = countdown(session.roundStartedAt, session.durationSeconds, now);
  const featured = (data.decisions ?? []).filter((d) => d.isFeatured).length;
  const steps: { label: string; action: string; enabled: boolean; primary?: boolean; icon: ReactNode }[] = [
    { label: "Launch the attack", action: "launch", enabled: state === "lobby", icon: <Zap /> },
    { label: state === "lobby" || state === "launched" ? "Start · open triage" : "Started", action: "start", enabled: state === "lobby" || state === "launched", icon: <Play />, primary: state === "launched" },
    { label: "Close round", action: "close", enabled: state === "open", icon: <Square />, primary: state === "open" },
    { label: "Show the split", action: "publish", enabled: state === "open" || state === "closed", icon: <Eye />, primary: state === "closed" },
    { label: session.activeRound >= session.roundCount ? "Final round" : `Next · round ${session.activeRound + 1}`, action: "advance", enabled: session.status === "live" && session.activeRound < session.roundCount, icon: <ArrowRight />, primary: state === "published" && session.activeRound < session.roundCount },
  ];

  return <Frame wide>
    <section className="dr-admin-head"><div><span className="dr-kicker">FACILITATOR CONTROLS · NOT FOR PROJECTION</span><h1 className="dr-h1-small">Room <span className="dr-join-code">{session.joinCode}</span></h1><p className="dr-when">{round ? `${round.seat} · ${round.title}` : state} · {state === "open" ? `clock ${clock.label}` : state}</p></div><div className="dr-qr"><QRCodeSVG value={joinUrl} size={118} bgColor="#ffffff" fgColor="#000025" /><button onClick={() => navigator.clipboard?.writeText(joinUrl)}><Copy />Copy join link</button></div></section>

    <section className="dr-card"><div className="dr-panel-head"><span>Run the room, in order</span><Status tone={stale(lastUpdated, now)} label={stale(lastUpdated, now)} /></div>
      <div className="dr-steps">{steps.map((s, i) => <button key={s.action} className={s.primary ? "dr-primary" : ""} disabled={busy || !s.enabled} onClick={() => act({ action: s.action })}><b>{i + 1}</b>{s.icon}{s.label}</button>)}</div>
      <p className="dr-hint">Flow per round: tables lock → <b>Close round</b> → Richard walks the option slide → <b>Show the split</b> → discuss → <b>Next</b>. The timer is advisory; nothing closes on its own.</p>
      <div className="dr-control-bar"><a className="dr-button" target="_blank" rel="noreferrer" href={consoleUrl}><Monitor />Open console (projector)</a><button onClick={exportCsv}><Download />Export CSV</button><button onClick={() => confirm("End this room? Table devices can no longer submit.") && act({ action: "end" })} disabled={busy || session.status === "ended"}>End room</button><button className="danger" onClick={() => confirm("Reset this room and remove every response and table login?") && act({ action: "reset" })} disabled={busy}><RotateCcw />Reset</button></div>
      <ErrorText message={actionError} />
    </section>

    <section className="dr-metrics"><div className="dr-metric"><small>Not joined</small><strong>{counts.notJoined}</strong></div><div className="dr-metric"><small>Drafting</small><strong>{counts.joined}</strong></div><div className="dr-metric accent"><small>Locked</small><strong>{counts.locked}</strong></div><div className="dr-metric"><small>On screen</small><strong>{featured}<em>/2</em></strong></div></section>

    <section className="dr-admin-grid">
      <div className="dr-card"><h2>Tables</h2>{data.teams.map((t) => <div className="dr-admin-row" key={t.id}><span><strong>{t.displayName}</strong><small>{TEAM_LABEL[t.state] ?? t.state}</small></span>{t.state === "locked" && state !== "published" ? <button onClick={() => confirm(`Reopen ${t.displayName}? Their lock is cleared.`) && act({ action: "reopen", teamId: t.id })} disabled={busy}>Reopen</button> : null}</div>)}</div>
      <div className="dr-card"><h2>This round’s responses</h2><p className="dr-hint">Private to you until you show the split. Pick up to two rationales for the screen.</p>{(data.decisions ?? []).length === 0 ? <p>No responses yet.</p> : (data.decisions ?? []).map((d) => <div className="dr-response" key={d.id}><strong><b className="dr-key">{d.optionKey ?? "–"}</b> {d.table} · {d.isLocked ? "locked" : "draft"} · confidence {d.confidence ?? "–"}</strong><p>{d.rationale || <em>no rationale</em>}</p>{d.rationale ? <button onClick={() => act({ action: "feature", decisionId: d.id, featured: !d.isFeatured })} disabled={busy || (!d.isFeatured && featured >= 2)}>{d.isFeatured ? "Remove from screen" : "Put on screen"}</button> : null}</div>)}</div>
    </section>
    <ErrorText message={error} />
  </Frame>;
}

export default function DecisionRoom() {
  const [path] = useLocation();
  const parts = path.split("/").filter(Boolean);
  if (parts[1] === "join") return <Landing presetCode={parts[2]} />;
  if (parts[1] === "session" && parts[2]) return <Participant code={parts[2].toUpperCase()} />;
  if (parts[1] === "console" && parts[2]) return <Console id={parts[2]} />;
  if (parts[1] === "admin" && parts[2]) return <Admin id={parts[2]} />;
  return <Landing />;
}
