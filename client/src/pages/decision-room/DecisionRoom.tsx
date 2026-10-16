/**
 * Decision Room — Riverbend edition.
 *
 * Four views on one route family:
 *   /decision-room                     landing: join a table / facilitate / open console
 *   /decision-room/session/:code       one device per table: dashboard, vote A–D, lock
 *   /decision-room/console/:id         the projector: launch, timer, who's locked, the split
 *   /decision-room/admin/:id           Adam's private controls
 *
 * Nothing here ranks tables or declares a winner. The "best move" lives on
 * Richard's slide and is never sent to a device.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, ArrowRight, Check, Copy, Download, Eye, FileText, Printer, LockKeyhole, Monitor, Play, Radio, RotateCcw, ShieldCheck, Square, Users, Zap } from "lucide-react";
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
type ParticipantData = { session: SessionInfo; team: { id: string; displayName: string; state: string }; handover: { requestId: string; name: string | null; requestedAt: string; expiresInSeconds: number } | null; organisation: Organisation; round: Round | null; decision: Decision | null; dashboard: { meters: Meters; path: string[]; stages: Stage[]; meterKeys: MeterKey[] }; results: (Split & { consequence: Consequence | null }) | null };
type Launch = { profile: { label: string; value: string; mirrors: string }[]; lines: { t: string; text: string; tone: string }[] };
type ConsoleData = { session: SessionInfo; organisation: Organisation; launch: Launch; round: Round | null; counts: { notJoined: number; joined: number; locked: number; total: number }; teams: { id: string; displayName: string; state: string; handover?: boolean }[]; results: Split | null; initialMeters: Meters; stages: Stage[]; meterKeys: MeterKey[]; decisions?: { id: string; teamId: string; table: string; optionKey: string | null; rationale: string; confidence: number | null; isLocked: boolean; isFeatured: boolean }[] };

const API = "/api/decision-room";
/** What people type to reach the join page. The short link redirects to the d3smbmxdr domain, so it is only shown there. */
const SHORT_JOIN: Record<string, string> = { "d3smbmxdr.vercel.app": "bit.ly/4evinZE" };
const joinAddress = () => SHORT_JOIN[location.host] ?? `${location.host}/decision-room`;
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
  useEffect(() => {
    if (!url) return; void load(); const id = setInterval(() => void load(), POLL_MS);
    // A woken device or a tab brought back to the front checks in straight away rather than waiting for the next tick.
    const wake = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", wake);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", wake); };
  }, [url]);
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

/** Microsoft four-square mark with wordmark, white on the dark shell. */
function MicrosoftMark() {
  return <div className="dr-partner" aria-label="Microsoft"><svg viewBox="0 0 23 23" width="20" height="20" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#f25022" /><rect x="12" y="1" width="10" height="10" fill="#7fba00" /><rect x="1" y="12" width="10" height="10" fill="#00a4ef" /><rect x="12" y="12" width="10" height="10" fill="#ffb900" /></svg><span>Microsoft</span></div>;
}
function Frame({ children, wide = false, className = "" }: { children: ReactNode; wide?: boolean; className?: string }) {
  return <main className={`dr-shell ${wide ? "dr-wide" : ""} ${className}`.trim()}><header className="dr-brand"><div className="dr-mark" aria-label="Data#3">Data<sup>#</sup>3</div><div><strong>DECISION ROOM</strong><small>WHEN THE AGENT ATTACKS · RIVERBEND</small></div><MicrosoftMark /></header>{children}<footer>Observe · govern · secure · no scores, no ranking</footer></main>;
}
function ErrorText({ message }: { message: string }) { return message ? <p className="dr-error"><AlertTriangle size={18} />{message}</p> : null; }
function Status({ tone, label }: { tone: string; label: string }) { return <span className={`dr-live dr-live--${tone}`}><i />{label}</span>; }

/** Live telemetry feel: each meter drifts gently around its true value and keeps a short history for a sparkline.
 *  Bounded values (0 or 100) keep their printed number fixed; only the trace breathes. Honours reduced-motion. */
function useTelemetry(meters: Meters) {
  const metersRef = useRef(meters); metersRef.current = meters;
  const [frame, setFrame] = useState<{ live: Meters; hist: Record<string, number[]> }>(() => ({ live: meters, hist: {} }));
  useEffect(() => {
    const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let n = 0; const hist: Record<string, number[]> = {};
    const id = setInterval(() => {
      n += 1; const t = n * 0.7; const live: Meters = {};
      for (const [k, base] of Object.entries(metersRef.current)) {
        const seed = Array.from(k).reduce((a, c) => a + c.charCodeAt(0), 0);
        const amp = still ? 0 : base <= 0 || base >= 100 ? 0.45 : 1;
        const v = base + amp * (0.6 * Math.sin(t * 1.3 + seed) + 0.4 * Math.sin(t * 3.1 + seed * 0.37));
        live[k] = Math.max(0, Math.min(100, v));
        const h = hist[k] ?? (hist[k] = []); h.push(live[k]); if (h.length > 40) h.shift();
      }
      setFrame({ live, hist: { ...hist } });
    }, 700);
    return () => clearInterval(id);
  }, []);
  return frame;
}
function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return <svg className="spark" viewBox="0 0 60 16" preserveAspectRatio="none" aria-hidden="true" />;
  const min = Math.min(...points), max = Math.max(...points), range = Math.max(2, max - min), mid = (max + min) / 2;
  const d = points.map((v, i) => `${(i / (points.length - 1)) * 60},${8 - ((v - mid) / range) * 12}`).join(" ");
  return <svg className="spark" viewBox="0 0 60 16" preserveAspectRatio="none" aria-hidden="true"><polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>;
}
/** `standby` meters have nothing to measure yet (no incident in the lobby): shown neutral, not as a red alarm. */
function MetersPanel({ meters, keys, flash, standby }: { meters: Meters; keys: MeterKey[]; flash?: string[]; standby?: string[] }) {
  const { live, hist } = useTelemetry(meters);
  return <div className="dr-meters">{keys.map((m) => { const base = meters[m.id] ?? 0; const v = live[m.id] ?? base; const fixed = base <= 0 || base >= 100; const tone = meterTone(m.good, base); if (standby?.includes(m.id)) return <div className="dr-meter dr-meter--idle" key={m.id} title="Rises as your table boxes the attacker in. Nothing to contain until the incident starts."><div className="top"><span>{m.name}</span><strong>standby</strong></div><span className="bar"><i style={{ width: 0 }} /></span></div>;
    return <div className={`dr-meter dr-meter--${tone} ${flash?.includes(m.id) ? "flash" : ""}`} key={m.id} title={m.id === "containment" ? "How much of the attacker your table has boxed in. It starts low because the attacker is already inside; good calls push it up." : undefined}><div className="top"><span>{m.name}</span><Spark points={hist[m.id] ?? []} /><strong>{fixed ? base : v.toFixed(1)}{m.id === "cover" ? "%" : ""}</strong></div><span className="bar"><i style={{ width: `${v}%` }} /></span></div>; })}</div>;
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
  const [joinCode, setJoinCode] = useState(presetCode || ""); const [teamCode, setTeamCode] = useState(""); const [teamName, setTeamName] = useState("");
  const [tables, setTables] = useState<{ teamCode: string; displayName: string; taken: boolean }[] | null>(null);
  const [tablesError, setTablesError] = useState("");
  // Live table picker: once a room code is typed (or arrives from the QR), show which tables are free and which are taken.
  useEffect(() => {
    if (mode !== "join" || joinCode.trim().length < 6) { setTables(null); setTablesError(""); return; }
    let alive = true;
    const load = async () => {
      try { const data = await request<{ tables: { teamCode: string; displayName: string; taken: boolean }[] }>(`${API}/rooms/${encodeURIComponent(joinCode.trim())}/tables`); if (alive) { setTables(data.tables); setTablesError(""); } }
      catch (e) { if (alive) { setTables(null); setTablesError((e as Error).message); } }
    };
    const first = setTimeout(load, 250); const id = setInterval(load, POLL_MS);
    return () => { alive = false; clearTimeout(first); clearInterval(id); };
  }, [joinCode, mode]);
  const picked = tables?.find((t) => t.teamCode === teamCode) ?? null;
  const pickedTaken = Boolean(picked?.taken);
  const freeCount = tables ? tables.filter((t) => !t.taken).length : 0;
  // Waiting for the device already signed in as the table to approve a handover.
  const [waiting, setWaiting] = useState<{ code: string; table: string; token: string; status: string } | null>(null);
  useEffect(() => {
    if (!waiting || waiting.status === "declined" || waiting.status === "superseded" || waiting.status === "abandoned") return;
    let alive = true;
    const id = setInterval(async () => {
      try {
        const r = await request<{ status: string }>(`${API}/sessions/${waiting.code}/handover`, { headers: { "x-team-token": waiting.token } });
        if (!alive) return;
        if (r.status === "approved") {
          try { localStorage.setItem(`decision-room-team:${waiting.code}`, waiting.token); localStorage.removeItem(`decision-room-prev:${waiting.code}`); } catch { /* ignore */ }
          navigate(`/decision-room/session/${waiting.code}`); return;
        }
        if (r.status !== waiting.status) setWaiting((w) => (w ? { ...w, status: r.status } : w));
      } catch { /* keep asking */ }
    }, 2000);
    return () => { alive = false; clearInterval(id); };
  }, [waiting?.token, waiting?.status, navigate]);
  const [adminKey, setAdminKey] = useState(() => { try { return localStorage.getItem("decision-room-admin-key") || ""; } catch { return ""; } });
  const [tableCount, setTableCount] = useState(8);
  const [sessionId, setSessionId] = useState(""); const [displayToken, setDisplayToken] = useState("");

  async function join() {
    setBusy(true); setError("");
    const code = joinCode.trim().toUpperCase();
    // A device that already holds a table here (its own, or one it is leaving) says so, so it is never asked to approve itself.
    let previous = ""; try { previous = localStorage.getItem(`decision-room-prev:${code}`) || localStorage.getItem(`decision-room-team:${code}`) || ""; } catch { /* ignore */ }
    try {
      const data = await request<{ teamToken: string; joinCode: string; pending?: boolean }>(`${API}/join`, json({ joinCode, teamCode, teamName: teamName.trim() || undefined }, previous ? { "x-team-token": previous } : {}));
      if (data.pending) { setWaiting({ code: data.joinCode, table: teamCode, token: data.teamToken, status: "pending" }); return; }
      try { localStorage.setItem(`decision-room-team:${data.joinCode}`, data.teamToken); localStorage.removeItem(`decision-room-prev:${data.joinCode}`); } catch { /* private mode: the table rejoins on reload */ }
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

  return <Frame className="dr-landing dr-one">
    <div className="dr-landing-grid">
      <section className="dr-hero"><span className="dr-kicker">LIVE TABLETOP INSTRUMENT</span><h1>Make the room’s decisions visible.</h1><p>One device per table — a laptop or a phone. Six rounds, from the SOC floor to the boardroom. Vote A–D, say why, lock it — then see where the room landed.</p></section>
      <div className="dr-landing-side">
        <nav className="dr-tabs" aria-label="Choose view"><button className={mode === "join" ? "active" : ""} onClick={() => setMode("join")}><Users />Join a table</button><button className={mode === "facilitate" ? "active" : ""} onClick={() => setMode("facilitate")}><ShieldCheck />Facilitate</button><button className={mode === "display" ? "active" : ""} onClick={() => setMode("display")}><Monitor />Open console</button></nav>
        <section className="dr-card dr-form">
          {mode === "join" && waiting && <div className="dr-handover-wait" aria-live="polite"><h2>Asking Table {waiting.table}…</h2>
            {waiting.status === "pending" ? <><p>The device already signed in as Table {waiting.table} now shows a pop-up asking it to hand over. As soon as someone there selects <b>Approve</b>, you are in.</p><p className="dr-hint"><span className="dr-pulse" />Waiting for approval. If that device has been closed or switched off, you get in by yourself within about a minute and a half.</p></>
              : waiting.status === "expired" ? <><p>No answer from that device yet.</p><p className="dr-hint"><span className="dr-pulse" />Ask Adam to approve the handover from his screen. This page carries on by itself.</p></>
              : waiting.status === "abandoned" ? <p>This request timed out. Pick your table again to ask once more.</p>
              : waiting.status === "declined" ? <p>The device signed in as Table {waiting.table} declined the handover. If that is not right, ask Adam.</p>
              : <p>Another device asked for this table after you, so this request was replaced.</p>}
            <div className="dr-actions"><button onClick={() => { if (waiting.status === "pending" || waiting.status === "expired") void fetch(`${API}/sessions/${waiting.code}/handover`, { method: "DELETE", headers: { "x-team-token": waiting.token }, keepalive: true }).catch(() => undefined); setWaiting(null); }}>{waiting.status === "pending" || waiting.status === "expired" ? "Cancel" : "Back"}</button></div></div>}
          {mode === "join" && !waiting && <><h2>Join your table</h2><p className="dr-hint">The room code is on the big screen. Pick a free table and give it a name — it is what the room will see.</p><label>Room code<input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={8} autoCapitalize="characters" autoCorrect="off" /></label>{tables ? <div className="dr-tablepick"><span className="dr-label">Pick your table</span><div className="dr-tablegrid" role="group" aria-label="Tables in this room">{tables.map((t) => { const named = t.displayName !== `Table ${t.teamCode}`; return <button type="button" key={t.teamCode} className={`dr-tablechip ${t.taken ? "taken" : "free"} ${teamCode === t.teamCode ? "selected" : ""}`} aria-pressed={teamCode === t.teamCode} aria-label={`Table ${t.teamCode}, ${t.taken ? `taken${named ? ` by ${t.displayName}` : ""}` : "free"}`} onClick={() => { setTeamCode(t.teamCode); if (t.taken) setTeamName(""); }}><b>{t.teamCode}</b><small>{t.taken ? (named ? t.displayName : "taken") : "free"}</small></button>; })}</div><p className="dr-tablelegend"><span className="free">free</span><span className="taken">taken</span><span>{freeCount} of {tables.length} free</span></p></div>
            : <><label>Table number<input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} placeholder="1" maxLength={12} inputMode="numeric" /></label>{tablesError && joinCode.trim().length >= 6 ? <p className="dr-hint">{/not found/i.test(tablesError) ? "No room with that code yet. Check the code on the big screen." : tablesError}</p> : null}</>}
          {pickedTaken && picked ? <div className="dr-banner dr-banner--warn">Table {picked.teamCode} is already joined{picked.displayName !== `Table ${picked.teamCode}` ? <> as <b>{picked.displayName}</b></> : null}. If this is your table, we will ask that device to approve the handover. If it has been closed or switched off, you get straight in.</div> : null}
          <label>Team name<input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder={pickedTaken && picked ? `${picked.displayName} (keep)` : "e.g. The Night Shift"} maxLength={40} autoComplete="off" /></label><button className="dr-primary" disabled={busy || !joinCode || !teamCode} onClick={join}>{pickedTaken ? "Ask to take over" : "Join room"} <ArrowRight /></button></>}
          {mode === "facilitate" && <><h2>Create a live room</h2><p className="dr-hint">Adam only. One room per session; never reuse the morning room for the afternoon.</p><label>Facilitator key<input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} autoComplete="off" /></label><label>Tables in the room<input type="number" min={2} max={50} value={tableCount} onChange={(e) => setTableCount(Number(e.target.value))} /></label><button className="dr-primary" disabled={busy || !adminKey} onClick={create}>Create room <ArrowRight /></button></>}
          {mode === "display" && <><h2>Open a presenter console</h2><p className="dr-hint">Normally you open the console from the facilitator page with one click. This is the recovery path.</p><label>Session ID<input value={sessionId} onChange={(e) => setSessionId(e.target.value)} /></label><label>Display token<input type="password" value={displayToken} onChange={(e) => setDisplayToken(e.target.value)} /></label><button className="dr-primary" disabled={!sessionId || !displayToken} onClick={openDisplay}>Open console <Monitor /></button></>}
          <ErrorText message={error} />
        </section>
      </div>
    </div>
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
  const [handedOver, setHandedOver] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => { if (!token) navigate(`/decision-room/join/${code}`); }, [token, code, navigate]);
  const roundKey = data ? `${data.session.activeRound}:${data.session.roundState}:${data.decision?.isLocked ? 1 : 0}` : "";
  useEffect(() => {
    if (!data || dirty) return;
    setOptionKey(data.decision?.optionKey ?? null); setRationale(data.decision?.rationale ?? ""); setConfidence(data.decision?.confidence ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);
  useEffect(() => { setDirty(false); setConfirming(false); setSaveError(""); }, [data?.session.activeRound]);
  useEffect(() => { if (error && /rejoin/i.test(error) && !handedOver) navigate(`/decision-room/join/${code}`); }, [error, code, navigate, handedOver]);

  async function save(lock: boolean) {
    if (!data || !optionKey) return;
    setSaving(true); setSaveError("");
    try {
      await request(`${API}/sessions/${code}/decision`, { ...json({ roundNo: data.session.activeRound, optionKey, rationale: rationale.trim(), confidence, lock }, headers), method: "PUT" });
      setDirty(false); setConfirming(false); await refresh();
    } catch (e) { setSaveError((e as Error).message); } finally { setSaving(false); }
  }

  async function respond(decision: "approve" | "decline") {
    setResponding(true); setSaveError("");
    try {
      await request(`${API}/sessions/${code}/handover`, json({ decision, requestId: data?.handover?.requestId }, headers));
      if (decision === "approve") { try { localStorage.removeItem(`decision-room-team:${code}`); } catch { /* ignore */ } setHandedOver(true); }
      else await refresh();
    } catch (e) { setSaveError((e as Error).message); await refresh(); } finally { setResponding(false); }
  }

  if (!token) return null;
  if (handedOver) return <Frame className="dr-one"><section className="dr-card dr-wait"><Check className="dr-wait-icon" /><h2>Table handed over.</h2><p>This device is signed out. The other device carries on with your table and everything you have saved.</p><div className="dr-actions" style={{ justifyContent: "center" }}><button onClick={() => navigate(`/decision-room/join/${code}`)}>Join a different table</button></div></section></Frame>;
  if (!data) return <Frame><section className="dr-card"><h2>Connecting to Riverbend…</h2><ErrorText message={error} /></section></Frame>;

  const { session, round, decision, dashboard, results } = data;
  const state = session.roundState;
  const locked = Boolean(decision?.isLocked);
  const clock = countdown(session.roundStartedAt, session.durationSeconds, now);
  const connection = stale(lastUpdated, now);
  const canLock = Boolean(optionKey) && Boolean(confidence) && state === "open";
  const changedMeters = results?.consequence ? Object.keys(results.consequence.meters) : [];

  const inRound = Boolean(round) && (state === "open" || state === "closed" || state === "published");
  const briefCard = round && inRound
    ? <section className="dr-card dr-brief" key={`brief-${round.roundNo}`}><div className="dr-panel-head"><span>Incoming</span></div><FeedPanel feed={round.feed} />
        <div className="dr-situation">{round.situation.map((line, i) => <p key={i} style={{ animationDelay: `${0.4 + i * 0.14}s` }}><b>{String(i + 1).padStart(2, "0")}</b>{line}</p>)}</div>
        <h2 className="dr-task">{round.prompt}</h2>
      </section>
    : state === "lobby" ? <section className="dr-card dr-wait"><Radio className="dr-wait-icon" /><h2>Monitoring mode</h2><p>{data.organisation.estate}</p><p className="dr-hint">Read the printed brief. Agree who speaks for the table. Adam will open the first round.</p></section>
    : state === "launched" ? <section className="dr-card dr-wait"><Zap className="dr-wait-icon" /><h2>Something tripped a faint signal in the SOC.</h2><p>Nothing is confirmed. Stand by for triage.</p></section>
    : state === "ended" ? <section className="dr-card dr-wait"><h2>The room has closed.</h2><p>Thank you. Take one control to test, an owner and a date back with you.</p></section>
    : null;
  const actCard = !round || !inRound ? null
    : state === "published" && results ? <section className="dr-card dr-reveal" key={`reveal-${round.roundNo}`}>
        <div className="dr-panel-head"><span>Where the room landed</span><span className="dr-chain-note">{results.locked} tables locked</span></div>
        <SplitBars split={results} options={round.options} />
        {results.confidence.median !== null ? <p className="dr-hint">Confidence median {results.confidence.median}, range {results.confidence.low}–{results.confidence.high}.</p> : null}
        {results.consequence ? <div className="dr-conseq"><span className="tag">Your call · {decision?.optionKey}</span><strong>{results.consequence.you}</strong><p>{results.consequence.body}</p><div className="dr-changes">{results.consequence.changes.map((ch) => <span className={`chg chg--${ch.d}`} key={ch.t}>{ch.t}</span>)}</div></div> : <p className="dr-hint">Your table did not lock a call this round, so there is no consequence to show.</p>}
      </section>
    : state === "closed" ? <section className="dr-card dr-wait"><Square className="dr-wait-icon" /><h2>Round closed.</h2><p>Richard is walking the options on the screen. Your call{locked ? ` was ${decision?.optionKey}` : " was not locked"}.</p></section>
    : locked ? <section className="dr-card dr-locked-card"><h2><LockKeyhole /> Locked: {decision?.optionKey}</h2>{decision?.rationale ? <p>“{decision.rationale}”</p> : null}<p className="dr-hint">Confidence {decision?.confidence} of 5. Keep talking — the reveal will not wait for perfect certainty. Ask Adam if this must change.</p></section>
    : <section className="dr-card dr-form dr-vote">
        <div className="dr-options">{round.options.map((o) => <button key={o.key} className={optionKey === o.key ? "selected" : ""} aria-pressed={optionKey === o.key} disabled={saving} onClick={() => { setOptionKey(o.key); setDirty(true); }}><b>{o.key}</b><span>{o.label}</span></button>)}</div>
        <label>Because… (one sentence)<textarea value={rationale} maxLength={240} disabled={saving} onChange={(e) => { setRationale(e.target.value); setDirty(true); }} placeholder="The reason we would defend out loud." /><span className="dr-counter">{rationale.length}/240</span></label>
        <span className="dr-label">Confidence</span>
        <div className="dr-scale" role="group" aria-label="Confidence from 1 to 5">{[1, 2, 3, 4, 5].map((v) => <button key={v} type="button" aria-pressed={confidence === v} disabled={saving} onClick={() => { setConfidence(v); setDirty(true); }}>{v}</button>)}</div>
        <div className="dr-scale-hint"><small>1 · we’d change this quickly</small><small>5 · we’d defend this</small></div>
        <ErrorText message={saveError} />
        {confirming ? <div className="dr-banner"><p>Lock <b>{optionKey}</b>? It’s final unless Adam reopens your table.</p><div className="dr-actions"><button className="dr-primary" disabled={saving} onClick={() => save(true)}>{saving ? "Locking…" : "Yes, lock it"}</button><button onClick={() => setConfirming(false)}>Keep talking</button></div></div>
          : <div className="dr-actions"><button disabled={saving || !optionKey} onClick={() => save(false)}>{saving ? "Saving…" : "Save draft"}</button><button className="dr-primary" disabled={!canLock || saving} onClick={() => setConfirming(true)}>Lock response <LockKeyhole /></button></div>}
      </section>;

  return <Frame className="dr-table dr-one">
    <div className="dr-session-head">
      <div><span className="dr-kicker">{data.team.displayName.toUpperCase()}{round ? ` · ${round.seat.toUpperCase()}` : ""}</span><h1 className="dr-h1-small">{round ? round.title : data.organisation.name}</h1>{round ? <p className="dr-when">{round.when}</p> : <p className="dr-when">{data.organisation.tagline}</p>}</div>
      <div className="dr-head-right">{state === "open" ? <span className={`dr-mini-clock ${clock.over ? "over" : clock.low ? "low" : ""}`}>{clock.label}</span> : null}<Status tone={connection} label={connection} /></div>
    </div>

    {connection === "offline" ? <div className="dr-banner dr-banner--warn">No connection. Your last saved response is safe — use the printed lock card and hand it to Adam. The exercise continues.</div> : null}

    <div className="dr-table-grid">
      <section className="dr-card dr-dash">
        <div className="dr-panel-head"><span>Riverbend · attack path</span><span className="dr-chain-note">{state === "lobby" ? "all systems nominal" : state === "launched" ? "something is moving" : round?.when ?? ""}</span></div>
        <div className="dr-dash-grid"><PathPanel path={dashboard.path} stages={dashboard.stages} /><div><div className="dr-panel-head"><span>Live state</span></div><MetersPanel meters={dashboard.meters} keys={dashboard.meterKeys} flash={changedMeters} standby={state === "lobby" ? ["containment"] : undefined} /></div></div>
      </section>
      <div className="dr-table-work">
        <div className={`dr-slot dr-slot--brief ${actCard ? "" : "dr-slot--span"}`.trim()}>{briefCard}</div>
        {actCard ? <div className="dr-slot dr-slot--act">{actCard}</div> : null}
      </div>
    </div>

    <p className="dr-switch">Wrong table? <button onClick={() => { try { const t = localStorage.getItem(`decision-room-team:${code}`); if (t) localStorage.setItem(`decision-room-prev:${code}`, t); localStorage.removeItem(`decision-room-team:${code}`); } catch { /* ignore */ } navigate(`/decision-room/join/${code}`); }}>Rejoin</button></p>

    {data.handover ? (() => { const left = Math.max(0, Math.ceil(data.handover.expiresInSeconds - (now - new Date(data.handover.requestedAt).getTime()) / 1000)); return <div className="dr-modal" role="alertdialog" aria-modal="true" aria-labelledby="dr-handover-title"><div className="dr-modal-card">
      <span className="dr-kicker">HANDOVER REQUEST</span>
      <h2 id="dr-handover-title">Another device wants to take over {data.team.displayName}.</h2>
      <p>Approve if your table is moving to that device: this one signs out and that one carries on with your answers{data.handover.name ? <>, renaming the table <b>{data.handover.name}</b></> : null}.</p>
      <p>Decline if you do not recognise it. You stay as you are.</p>
      <ErrorText message={saveError} />
      <div className="dr-actions"><button disabled={responding} onClick={() => respond("decline")}>Decline</button><button className="dr-primary" disabled={responding} onClick={() => respond("approve")}>{responding ? "…" : "Approve handover"}</button></div>
      <p className="dr-hint">{left > 0 ? `Closes in ${left}s. Adam can still approve it after that.` : "Closing…"}</p>
    </div></div>; })() : null}
  </Frame>;
}

/* --------------------------------------------------------------- console */

function Terminal({ launch, launchedAt, now }: { launch: Launch; launchedAt: string | null; now: number }) {
  const elapsed = launchedAt ? (now - new Date(launchedAt).getTime()) / 1000 : 0;
  const visible = launchedAt ? Math.min(launch.lines.length, Math.floor(elapsed / 1.4) + 1) : 0;
  return <div className="dr-term"><div className="bar"><i /><i /><i /><span>agent@riverbend — autonomous</span></div><div className="body">{launch.lines.slice(0, visible).map((l, i) => <div className={`ln ln--${l.tone}`} key={i}><span className="ts">[{l.t}]</span> {l.text}</div>)}{visible < launch.lines.length && launchedAt ? <div className="ln ln--cursor">▌</div> : null}</div></div>;
}

/** The projector's attack path during the launch: stages light up in step with the attacker terminal. */
function launchPath(visible: number): string[] {
  const p = ["secure", "secure", "secure", "secure", "secure", "secure", "secure"];
  if (visible >= 1) p[0] = "compromised";
  if (visible >= 2) p[1] = "compromised";
  if (visible >= 4) { p[2] = "at risk"; p[3] = "at risk"; p[4] = "at risk"; p[5] = "at risk"; }
  if (visible >= 5) p[2] = "compromised";
  if (visible >= 6) p[4] = "compromised";
  return p;
}
const LAUNCH_NOTES = ["", "foothold taken", "credentials harvested", "planning, no human in the loop", "target path mapped", "beacon running", "customer data staged", "a faint signal in the SOC"];

function Console({ id }: { id: string }) {
  const displayToken = useMemo(() => { const q = new URLSearchParams(location.search).get("displayToken"); if (q) return q; try { return localStorage.getItem(`decision-room-display:${id}`) || ""; } catch { return ""; } }, [id]);
  const { data, error, lastUpdated } = usePoll<ConsoleData>(`${API}/sessions/${id}/console?displayToken=${encodeURIComponent(displayToken)}`);
  const joinUrl = data ? `${location.origin}/decision-room/join/${data.session.joinCode}` : "";
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

    {(state === "lobby" || state === "launched") && (() => {
      const visible = state === "launched" && session.launchedAt ? Math.min(data.launch.lines.length, Math.floor((now - new Date(session.launchedAt).getTime()) / 1400) + 1) : 0;
      return <section className="dr-console-grid dr-console-grid--three">
      <div className="dr-card"><div className="dr-panel-head"><span>The adversary</span></div><div className="dr-profile">{data.launch.profile.map((p) => <div key={p.label}><small>{p.label}</small><strong>{p.value}</strong><em>mirrors {p.mirrors}</em></div>)}</div><p className="dr-hint">Fictional and narrative only. No tools, no code, no exploit steps — this exists to show how cheap and modular these choices have become.</p></div>
      <div className={`dr-card dr-instruments ${state === "launched" ? "is-under-attack" : ""}`}><div className="dr-panel-head"><span>Riverbend · live systems</span><span className="dr-chain-note">{state === "lobby" ? "all systems nominal" : LAUNCH_NOTES[visible] ?? ""}</span></div><PathPanel path={state === "launched" ? launchPath(visible) : data.stages.map(() => "secure")} stages={data.stages} /><div className="dr-panel-head dr-instruments-meters"><span>Live state</span></div><MetersPanel meters={data.initialMeters} keys={data.meterKeys} standby={state === "lobby" ? ["containment"] : undefined} /></div>
      <div className="dr-card"><div className="dr-panel-head"><span>{state === "lobby" ? "Standing by" : "T-0 · the operation runs"}</span></div>{state === "launched" ? <Terminal launch={data.launch} launchedAt={session.launchedAt} now={now} /> : <div className="dr-standby"><div className="dr-standby-qr" aria-label="QR code to join this room"><QRCodeSVG value={joinUrl} size={224} bgColor="#ffffff" fgColor="#000025" level="M" /></div><p>{data.organisation.tagline}</p><p className="dr-hint">Scan, or go to <strong>{joinAddress()}</strong> · room code <span className="dr-join-code">{session.joinCode}</span></p></div>}</div>
    </section>; })()}

    {(state === "open" || state === "closed" || state === "published" || state === "ended") && <>
      <section className="dr-metrics"><div className="dr-metric"><small>Joined</small><strong>{counts.joined + counts.locked}<em>/{counts.total}</em></strong></div><div className="dr-metric"><small>Drafting</small><strong>{counts.joined}</strong></div><div className="dr-metric accent"><small>Locked</small><strong>{counts.locked}</strong></div></section>
      <div className="dr-team-grid dr-team-grid--wide">{data.teams.map((t) => <div className={`dr-team ${t.state}`} key={t.id}><strong>{t.displayName}</strong><small>{TEAM_LABEL[t.state] ?? t.state}</small></div>)}</div>
      {state === "published" && results ? <section className="dr-results-wide">
        <div className="dr-card"><div className="dr-panel-head"><span>Where the room landed</span><span className="dr-chain-note">{results.locked} of {counts.total} tables</span></div><SplitBars split={results} options={round?.options} />{results.confidence.median !== null ? <p className="dr-confidence">Confidence median <strong>{results.confidence.median}</strong> · range <strong>{results.confidence.low}–{results.confidence.high}</strong></p> : null}</div>
        {results.featured.length ? <div className="dr-quotes">{results.featured.map((f) => <blockquote className="dr-quote" key={f.id}><span>From the room</span><strong>{f.rationale}</strong><small>confidence {f.confidence ?? "–"}</small></blockquote>)}</div> : null}
      </section> : state === "open" || state === "closed" ? <section className="dr-card"><div className="dr-panel-head"><span>{round?.prompt ?? "What is your priority?"}</span></div><div className="dr-option-list">{round?.options.map((o) => <div key={o.key}><b>{o.key}</b><span>{o.label}</span></div>)}</div><p className="dr-console-note">{state === "closed" ? "Round closed. Responses stay private until Adam shows the split." : "Tables are deciding. Responses stay private until the split is shown."}</p></section> : null}
    </>}

    <footer className="dr-console-footer"><span>Join at <strong>{joinAddress()}</strong> · code <span className="dr-join-code">{session.joinCode}</span></span><Status tone={connection} label={connection === "live" ? "Live" : `Last updated ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"}`} /></footer>
    <ErrorText message={error} />
  </Frame>;
}

/* ----------------------------------------------------------------- admin */

/* -------------------------------------------------------------- run clock
 * Facilitator-only: where the room is against the 90-minute plan from Richard's
 * deck notes (9:30–11:00 by default, editable for rehearsals). Position comes from
 * the room state, so the clock knows which segment you are in without extra taps.
 */
type Segment = { key: string; label: string; from: number; to: number; slides: string };
// Minutes from the start. Deck timings, with Inject 5's overlap with the debrief normalised.
const PLAN: Segment[] = [
  { key: "open", label: "Opening", from: 0, to: 17, slides: "slides 1–8" },
  { key: "launch", label: "Riverbend · launch", from: 17, to: 18, slides: "slide 9" },
  { key: "r1", label: "Triage", from: 18, to: 25, slides: "slides 10–11" },
  { key: "r2", label: "Inject 1", from: 25, to: 33, slides: "slides 12–13" },
  { key: "r3", label: "Inject 2", from: 33, to: 41, slides: "slides 14–15" },
  { key: "r4", label: "Inject 3", from: 41, to: 50, slides: "slides 16–17" },
  { key: "r5", label: "Inject 4", from: 50, to: 59, slides: "slides 18–19" },
  { key: "r6", label: "Inject 5", from: 59, to: 68, slides: "slides 20–21" },
  { key: "close", label: "Debrief & close", from: 68, to: 90, slides: "slides 22–27" },
];
const SITUATION_MINUTES = 4; // each round: 4 minutes to decide, then Richard's option review and discussion
const pad2 = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${d.getHours() % 12 || 12}:${pad2(d.getMinutes())}`;
function span(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${pad2(m)}:${pad2(r)}` : `${m}:${pad2(r)}`;
}
/** The planned window for where the room actually is. */
function plannedWindow(state: RoundState, round: number): { seg: Segment; from: number; to: number; part: string } {
  if (state === "lobby") return { seg: PLAN[0], from: PLAN[0].from, to: PLAN[0].to, part: "" };
  if (state === "launched") return { seg: PLAN[1], from: PLAN[1].from, to: PLAN[1].to, part: "" };
  if (state === "ended") return { seg: PLAN[8], from: PLAN[8].from, to: PLAN[8].to, part: "" };
  const seg = PLAN[1 + Math.min(Math.max(round, 1), 6)];
  return state === "open" ? { seg, from: seg.from, to: seg.from + SITUATION_MINUTES, part: "tables deciding" } : { seg, from: seg.from + SITUATION_MINUTES, to: seg.to, part: state === "closed" ? "option review" : "split and discussion" };
}
function RunClock({ state, round, now, launchedAt }: { state: RoundState; round: number; now: number; launchedAt: string | null }) {
  const [start, setStart] = useState(() => { try { return localStorage.getItem("decision-room-run-start") || "09:30"; } catch { return "09:30"; } });
  const [editing, setEditing] = useState(false);
  const [h, m] = start.split(":").map(Number);
  const t0 = new Date(now); t0.setHours(h || 9, m || 0, 0, 0);
  const end = t0.getTime() + 90 * 60000;
  // Once the attack is launched, everything after it is re-fitted between the real launch time and 11:00.
  const LAUNCH_AT = PLAN[1].from;
  const launched = launchedAt ? new Date(launchedAt).getTime() : null;
  const fit = launched && launched < end ? (end - launched) / ((90 - LAUNCH_AT) * 60000) : 1;
  const at = (min: number) => (launched && min >= LAUNCH_AT ? launched + (min - LAUNCH_AT) * fit * 60000 : t0.getTime() + min * 60000);
  const roundMinutes = Math.round(8 * fit * 10) / 10;
  const win = plannedWindow(state, round);
  const elapsedMin = (now - t0.getTime()) / 60000;
  const before = now < t0.getTime();
  // Positive = behind plan, negative = ahead.
  const drift = before ? 0 : now > at(win.to) ? (now - at(win.to)) / 60000 : now < at(win.from) ? -(at(win.from) - now) / 60000 : 0;
  const lateMin = Math.round(drift);
  const over = now > end;
  const tone = before ? "idle" : over || lateMin >= 5 ? "red" : lateMin >= 2 ? "amber" : "green";
  const inSlot = !before && drift <= 0 ? Math.max(0, at(win.to) - now) : 0;
  const advice = before ? `Starts at ${hhmm(t0)}. Open the room, test the console, breathe.`
    : over ? `Over by ${span(now - end)}. Thank the room and close now.`
    : lateMin >= 5 ? (win.seg.key === "open" || win.seg.key === "launch" ? `Push: ${lateMin} min behind. Move through the opening slides faster and launch.` : win.seg.key === "close" || round >= 5 ? `Push: ${lateMin} min behind. Cut the table discussion (slide 25) and go to the close.` : `Push: ${lateMin} min behind. Keep option reviews to 2 minutes and move on after one comment from the room.`)
    : lateMin >= 2 ? (win.seg.key === "open" ? `Tighten: ${lateMin} min behind. Shorten the landscape slides and get to Riverbend.` : `Tighten: ${lateMin} min behind. Take one comment per round, then Next.`)
    : drift < -1.5 ? `Relaxed: ${Math.round(-drift)} min ahead. Let the discussion breathe or take an extra question.`
    : win.seg.key === "close" ? (now < at(77) ? `On schedule. Protect (slide 24) by ${hhmm(new Date(at(74)))}, table discussion by ${hhmm(new Date(at(77)))}, close by ${hhmm(new Date(at(83)))}.` : now < at(83) ? `On schedule. Move to the close (slide 26) by ${hhmm(new Date(at(83)))}.` : `On the close. ${span(end - now)} to finish on time.`)
    : `On schedule${fit < 0.97 ? ` (re-fitted to finish ${hhmm(new Date(end))}: about ${roundMinutes} min per round, ${Math.max(2, Math.round(SITUATION_MINUTES * fit * 2) / 2)} to decide)` : ""}. ${span(inSlot)} left for ${win.seg.label.toLowerCase()}${win.part ? ` (${win.part})` : ""}.`;
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - t0.getTime()) / (end - t0.getTime())) * 100));
  const nowPct = pct(now);
  const posPct = pct(at(win.from));
  void elapsedMin;
  return <section className={`dr-runclock dr-runclock--${tone}`} aria-label="Run of show">
    <div className="dr-runclock-main">
      <span className="dr-runclock-light" aria-hidden="true" />
      <div><small>{before ? "Starts in" : over ? "Over time" : "Remaining"}</small><strong>{before ? span(t0.getTime() - now) : over ? `+${span(now - end)}` : span(end - now)}</strong></div>
      <div><small>Now</small><b>{hhmm(new Date(now))}</b></div>
      <div><small>Where we are</small><b>{win.seg.label}{win.part ? ` · ${win.part}` : ""}</b><em>planned {hhmm(new Date(at(win.from)))}–{hhmm(new Date(at(win.to)))} · {win.seg.slides}</em></div>
      <p className="dr-runclock-advice">{advice}</p>
      {editing ? <label className="dr-runclock-edit">Start<input type="time" value={start} onChange={(e) => { setStart(e.target.value); try { localStorage.setItem("decision-room-run-start", e.target.value); } catch { /* ignore */ } }} onBlur={() => setEditing(false)} autoFocus /></label>
        : <button className="dr-runclock-edit" onClick={() => setEditing(true)} title="Change the start time (for rehearsals)">{hhmm(t0)}–{hhmm(new Date(end))}</button>}
    </div>
    <div className="dr-runclock-track" aria-hidden="true">
      {PLAN.map((s) => <span key={s.key} className={`seg ${s.key === win.seg.key ? "is-here" : ""}`} style={{ left: `${pct(at(s.from))}%`, width: `${pct(at(s.to)) - pct(at(s.from))}%` }} title={`${s.label} ${hhmm(new Date(at(s.from)))}`}><i>{s.label}</i></span>)}
      <b className="pos" style={{ left: `${posPct}%` }} title="Where the room is" />
      {!before ? <b className="now" style={{ left: `${nowPct}%` }} title="Now" /> : null}
    </div>
  </section>;
}

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
    state === "closed" ? { label: "Reopen round", action: "unclose", enabled: true, icon: <RotateCcw /> } : { label: "Close round", action: "close", enabled: state === "open", icon: <Square />, primary: state === "open" },
    { label: "Show the split", action: "publish", enabled: state === "open" || state === "closed", icon: <Eye />, primary: state === "closed" },
    { label: session.activeRound >= session.roundCount ? "Final round" : `Next · round ${session.activeRound + 1}`, action: "advance", enabled: session.status === "live" && session.activeRound < session.roundCount, icon: <ArrowRight />, primary: state === "published" && session.activeRound < session.roundCount },
  ];

  return <Frame wide className="dr-admin dr-one">
    <section className="dr-admin-head"><div><span className="dr-kicker">FACILITATOR CONTROLS · NOT FOR PROJECTION</span><h1 className="dr-h1-small">Room <span className="dr-join-code">{session.joinCode}</span></h1><p className="dr-when">{round ? `${round.seat} · ${round.title}` : state} · {state === "open" ? `clock ${clock.label}` : state}</p></div><div className="dr-qr"><QRCodeSVG value={joinUrl} size={118} bgColor="#ffffff" fgColor="#000025" /><button onClick={() => navigator.clipboard?.writeText(joinUrl)}><Copy />Copy join link</button></div></section>

    <RunClock state={state} round={session.activeRound} now={now} launchedAt={session.launchedAt} />

    <section className="dr-card"><div className="dr-panel-head"><span>Run the room, in order</span><Status tone={stale(lastUpdated, now)} label={stale(lastUpdated, now)} /></div>
      <div className="dr-steps">{steps.map((s, i) => <button key={s.action} className={s.primary ? "dr-primary" : ""} disabled={busy || !s.enabled} onClick={() => act({ action: s.action })}><b>{i + 1}</b>{s.icon}{s.label}</button>)}</div>
      <div className="dr-run-foot"><p className="dr-hint">Flow per round: tables lock → <b>Close round</b> → Richard walks the option slide → <b>Show the split</b> → discuss → <b>Next</b>. The timer is advisory; nothing closes on its own.</p>
      <div className="dr-control-bar"><a className="dr-button" target="_blank" rel="noreferrer" href={consoleUrl}><Monitor />Open console (projector)</a><a className="dr-button" target="_blank" rel="noreferrer" href={`/decision-room/report/${id}`}><FileText />After-action report</a><button onClick={exportCsv}><Download />Export CSV</button><button onClick={() => confirm("End this room? Table devices can no longer submit.") && act({ action: "end" })} disabled={busy || session.status === "ended"}>End room</button><button className="danger" onClick={() => confirm("Reset this room and remove every response and table login?") && act({ action: "reset" })} disabled={busy}><RotateCcw />Reset</button></div></div>
      <ErrorText message={actionError} />
    </section>

    <section className="dr-metrics"><div className="dr-metric"><small>Not joined</small><strong>{counts.notJoined}</strong></div><div className="dr-metric"><small>Drafting</small><strong>{counts.joined}</strong></div><div className="dr-metric accent"><small>Locked</small><strong>{counts.locked}</strong></div><div className="dr-metric"><small>On screen</small><strong>{featured}<em>/2</em></strong></div></section>

    <section className="dr-admin-grid">
      <div className="dr-card"><h2>Tables</h2>{data.teams.map((t) => <div className="dr-admin-row" key={t.id}><span><strong>{t.displayName}</strong><small className={t.handover ? "dr-flag" : ""}>{t.handover ? "handover requested" : TEAM_LABEL[t.state] ?? t.state}</small></span>{t.handover ? <button className="dr-primary" onClick={() => confirm(`Hand ${t.displayName} to the device that is asking? The current device is signed out.`) && act({ action: "handover", teamId: t.id })} disabled={busy}>Approve handover</button> : null}{t.state === "locked" && state !== "published" ? <button onClick={() => confirm(`Reopen ${t.displayName}? Their lock is cleared.`) && act({ action: "reopen", teamId: t.id })} disabled={busy}>Reopen</button> : null}</div>)}</div>
      <div className="dr-card"><h2>This round’s responses</h2><p className="dr-hint">Private to you until you show the split. Pick up to two rationales for the screen.</p>{(data.decisions ?? []).length === 0 ? <p>No responses yet.</p> : (data.decisions ?? []).map((d) => <div className="dr-response" key={d.id}><strong><b className="dr-key">{d.optionKey ?? "–"}</b> {d.table} · {d.isLocked ? "locked" : "draft"} · confidence {d.confidence ?? "–"}</strong><p>{d.rationale || <em>no rationale</em>}</p>{d.rationale ? <button onClick={() => act({ action: "feature", decisionId: d.id, featured: !d.isFeatured })} disabled={busy || (!d.isFeatured && featured >= 2)}>{d.isFeatured ? "Remove from screen" : "Put on screen"}</button> : null}</div>)}</div>
    </section>
    <ErrorText message={error} />
  </Frame>;
}

/* ---------------------------------------------------------------- report */

type ReportData = {
  room: { joinCode: string; name: string; status: string; launchedAt: string | null };
  rounds: { roundNo: number; seat: string; title: string; options: { key: string; label: string }[]; locked: number; counts: Record<string, number>; roomCall: string[]; best: string | null; agreement: number | null; confidence: { median: number | null; low: number | null; high: number | null }; quotes: { table: string; option: string; confidence: number | null; rationale: string; featured: boolean }[] }[];
  tables: { name: string; choices: (string | null)[]; meters: Meters; confidence: number | null }[];
  meterKeys: MeterKey[]; initialMeters: Meters; generatedAt: string;
};

/** One-page after-action report for the facilitator: print or save as PDF. */
function Report({ id }: { id: string }) {
  const key = useMemo(() => { try { return localStorage.getItem("decision-room-admin-key") || ""; } catch { return ""; } }, []);
  const [data, setData] = useState<ReportData | null>(null); const [error, setError] = useState("");
  useEffect(() => { request<ReportData>(`${API}/sessions/${id}/report`, { headers: { "x-admin-key": key } }).then(setData).catch((e) => setError((e as Error).message)); }, [id, key]);
  if (!data) return <Frame wide><section className="dr-card"><h2>Preparing the report…</h2><ErrorText message={error || (!key ? "Open this from your facilitator page so the key is available." : "")} /></section></Frame>;
  const played = data.rounds.filter((r) => r.locked > 0);
  const matched = played.filter((r) => r.best && r.roomCall.includes(r.best)).length;
  const divided = [...played].filter((r) => r.locked >= 2 && r.agreement !== null).sort((a, b) => (a.agreement ?? 1) - (b.agreement ?? 1))[0];
  const aligned = [...played].filter((r) => r.agreement !== null).sort((a, b) => (b.agreement ?? 0) - (a.agreement ?? 0))[0];
  const medians = played.map((r) => r.confidence.median);
  const pick = (r: ReportData["rounds"][number]) => r.quotes.find((q) => q.featured) ?? [...r.quotes].sort((a, b) => b.rationale.length - a.rationale.length)[0];
  const showMeters = data.meterKeys.filter((m) => ["containment", "service", "exposure", "otsafety", "trust", "cover"].includes(m.id));
  const date = new Date(data.room.launchedAt ?? data.generatedAt);
  return <Frame wide className="dr-report">
    <section className="dr-report-head">
      <div><span className="dr-kicker">AFTER-ACTION REPORT · ROOM {data.room.joinCode} · {date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</span><h1>When the agent attacked Riverbend</h1><p>{data.tables.length} tables · {played.length} of {data.rounds.length} rounds decided · Richard’s best move is from the deck; tables are shown as journeys, never ranked.</p></div>
      <button className="dr-report-print" onClick={() => window.print()}><Printer />Print or save PDF</button>
    </section>
    <section className="dr-report-tiles">
      <div><small>Room matched the best move</small><strong>{matched}<em>/{played.length}</em></strong><span>rounds where the room’s most common call was Richard’s</span></div>
      <div><small>Most divided</small><strong>{divided ? divided.seat.split(" · ")[0] : "—"}</strong><span>{divided ? `${Object.entries(divided.counts).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(" · ")}` : "not enough locks"}</span></div>
      <div><small>Most aligned</small><strong>{aligned ? aligned.seat.split(" · ")[0] : "—"}</strong><span>{aligned && aligned.agreement !== null ? `${Math.round(aligned.agreement * 100)}% on ${aligned.roomCall.join(" / ")}` : ""}</span></div>
      <div><small>Confidence by round</small><strong className="dr-report-trend">{medians.map((m, i) => <b key={i} style={{ height: `${((m ?? 0) / 5) * 100}%` }} title={`Round ${i + 1}: ${m ?? "–"}`} />)}</strong><span>median {medians.map((m) => m ?? "–").join(" → ")}</span></div>
    </section>
    <section className="dr-report-rounds">
      {data.rounds.map((r) => { const q = pick(r); const max = Math.max(1, ...Object.values(r.counts)); return <article key={r.roundNo} className={r.locked ? "" : "is-empty"}>
        <header><small>{r.seat}</small><strong>{r.title}</strong></header>
        <div className="dr-report-split">{r.options.map((o) => <div key={o.key} className={`${r.best === o.key ? "is-best" : ""} ${r.roomCall.includes(o.key) ? "is-call" : ""}`} title={o.label}><b>{o.key}</b><span><i style={{ width: `${(r.counts[o.key] / max) * 100}%` }} /></span><em>{r.counts[o.key] || ""}</em></div>)}</div>
        <p className="dr-report-verdict">{!r.locked ? "No locked calls." : r.best && r.roomCall.includes(r.best) ? `Room landed on Richard’s ${r.best}.` : `Room went ${r.roomCall.join("/")}; Richard’s best was ${r.best}.`} {r.confidence.median !== null ? `Confidence ${r.confidence.median} (${r.confidence.low}–${r.confidence.high}).` : ""}</p>
        {q ? <blockquote>“{q.rationale}”<cite>{q.table} · {q.option}</cite></blockquote> : null}
      </article>; })}
    </section>
    <section className="dr-report-tables">
      <table><thead><tr><th>Table</th>{data.rounds.map((r) => <th key={r.roundNo}>{r.seat.split(" · ")[0].replace("Inject", "Inj")}</th>)}<th>Conf.</th>{showMeters.map((m) => <th key={m.id}>{m.name}</th>)}</tr></thead>
        <tbody>{data.tables.map((t) => <tr key={t.name}><td>{t.name}</td>{t.choices.map((c, i) => <td key={i}><span className="dr-report-chip">{c ?? "·"}</span></td>)}<td>{t.confidence ?? "–"}</td>{showMeters.map((m) => { const v = t.meters[m.id] ?? 0; return <td key={m.id} className={`dr-report-meter dr-meter--${meterTone(m.good, v)}`}><span><i style={{ width: `${v}%` }} /></span>{v}</td>; })}</tr>)}</tbody></table>
      <p className="dr-hint">Where each table’s Riverbend finished after replaying its six calls through the Crisis Room consequences. Started at: {showMeters.map((m) => `${m.name} ${data.initialMeters[m.id]}`).join(" · ")}.</p>
    </section>
  </Frame>;
}

export default function DecisionRoom() {
  const [path] = useLocation();
  const parts = path.split("/").filter(Boolean);
  if (parts[1] === "join") return <Landing presetCode={parts[2]} />;
  if (parts[1] === "session" && parts[2]) return <Participant code={parts[2].toUpperCase()} />;
  if (parts[1] === "console" && parts[2]) return <Console id={parts[2]} />;
  if (parts[1] === "admin" && parts[2]) return <Admin id={parts[2]} />;
  if (parts[1] === "report" && parts[2]) return <Report id={parts[2]} />;
  return <Landing />;
}
