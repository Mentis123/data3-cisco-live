/**
 * Decision Room API — Riverbend edition.
 *
 * The live room instrument for "When the agent attacks" (Richard's deck). Six
 * rounds — Triage then Injects 1–5 — each voted A–D on one phone per table.
 * Flow per round, as agreed on the 12 October call: tables lock → Adam closes
 * the round → Richard walks the option slide → Adam publishes the split → the
 * room discusses. Consequences and meters are only revealed on publish.
 *
 * Facilitator key: any of DECISION_ROOM_ADMIN_KEY, WORKSHOP_FACILITATOR_SECRET
 * or the legacy ADMIN_KEY opens the room, so a key set under one name is never
 * shadowed by an older one under another. The console uses a room-scoped
 * display token. Each table holds a random token; only its hash is stored.
 */

import type { Express, Request, Response } from "express";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "./db.js";
import {
  INITIAL_METERS,
  LAUNCH,
  METERS,
  ORGANISATION,
  ROUND_COUNT,
  STAGES,
  consequenceFor,
  metersFor,
  publicRound,
  roundContent,
} from "./decisionRoomContent.js";

type TeamState = "not_joined" | "reading" | "debating" | "locked";
type RoundState = "lobby" | "launched" | "open" | "closed" | "published" | "ended";

type Session = {
  id: string; joinCode: string; name: string; variant: string; status: string;
  activeRound: number; resultsVisible: boolean; revision: number; displayTokenHash: string;
  roundStartedAt: string | null; roundClosedAt: string | null; launchedAt: string | null;
};
type Team = { id: string; sessionId: string; teamCode: string; displayName: string; tokenHash: string | null; state: TeamState; lastSeenAt: string | null; pendingHash: string | null; pendingName: string | null; pendingAt: string | null; pendingState: string | null; pendingPolledAt: string | null; pendingReleaseId: string | null; pendingReleaseHash: string | null };
type Decision = { id: string; sessionId: string; teamId: string; roundNo: number; optionKey: string | null; rationale: string; confidence: number | null; isLocked: boolean; isFeatured: boolean; updatedAt: string };

const MAX_FEATURED = 2;
const VARIANT = "riverbend";

const memory = { sessions: new Map<string, Session>(), teams: new Map<string, Team>(), decisions: new Map<string, Decision>() };
let tablesReady: Promise<void> | null = null;

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(24).toString("base64url");
const code = () => randomBytes(4).toString("base64url").replace(/[-_]/g, "X").slice(0, 6).toUpperCase();
const rows = <T>(result: unknown) => (((result as { rows?: T[] })?.rows ?? result) as T[]);
const databaseRequiredButMissing = () => Boolean(process.env.VERCEL && !db);

function safeEqualPlain(value: string, expected: string) {
  const a = Buffer.from(sha(value), "hex"); const b = Buffer.from(sha(expected), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function matchesHash(value: string, expectedHash: string) {
  const a = Buffer.from(sha(value), "hex"); const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
const FACILITATOR_KEY_NAMES = ["DECISION_ROOM_ADMIN_KEY", "WORKSHOP_FACILITATOR_SECRET", "ADMIN_KEY"] as const;
/** Names of the facilitator-key variables that carry a value in this deployment (never the values). */
function configuredKeyNames() {
  return FACILITATOR_KEY_NAMES.filter((name) => (process.env[name] ?? "").trim());
}
/** Every configured facilitator key, trimmed; the local default only when nothing is configured in development. */
function facilitatorSecrets() {
  const keys = configuredKeyNames().map((name) => (process.env[name] ?? "").trim());
  if (keys.length === 0 && process.env.NODE_ENV === "development") keys.push("decision-room-local");
  return keys;
}
function ensureAdmin(req: Request, res: Response) {
  const provided = String(req.headers["x-admin-key"] ?? "").trim();
  if (!provided || !facilitatorSecrets().some((key) => safeEqualPlain(provided, key))) {
    // Logged so an operator can see which variable names the function actually received.
    console.warn(`[decision-room] facilitator key rejected; configured: ${configuredKeyNames().join(", ") || "none"}`);
    res.status(401).json({ message: "Facilitator access required" });
    return false;
  }
  return true;
}
function rejectMissingDatabase(res: Response) {
  if (!databaseRequiredButMissing()) return false;
  res.status(503).json({ message: "Decision Room requires the production database connection" });
  return true;
}

/**
 * Creates the four workshop tables when missing and relaxes the three-round
 * limits the September schema carried, so the same production tables serve the
 * six-round Riverbend flow without a destructive migration.
 */
async function ensureTables() {
  if (!db) return;
  if (!tablesReady) tablesReady = (async () => {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_sessions (id uuid PRIMARY KEY, join_code varchar(8) NOT NULL UNIQUE, name text NOT NULL, variant varchar(16) NOT NULL, status varchar(16) NOT NULL DEFAULT 'lobby', active_round integer NOT NULL DEFAULT 1, results_visible boolean NOT NULL DEFAULT false, revision integer NOT NULL DEFAULT 1, display_token_hash text NOT NULL, round_started_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz)`);
    await db.execute(sql`ALTER TABLE workshop_sessions ADD COLUMN IF NOT EXISTS round_started_at timestamptz`);
    await db.execute(sql`ALTER TABLE workshop_sessions ADD COLUMN IF NOT EXISTS round_closed_at timestamptz`);
    await db.execute(sql`ALTER TABLE workshop_sessions ADD COLUMN IF NOT EXISTS launched_at timestamptz`);
    await db.execute(sql`ALTER TABLE workshop_sessions DROP CONSTRAINT IF EXISTS workshop_sessions_variant_check`);
    await db.execute(sql`ALTER TABLE workshop_sessions DROP CONSTRAINT IF EXISTS workshop_sessions_active_round_check`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_teams (id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE, team_code varchar(12) NOT NULL, display_name text NOT NULL, token_hash text, state varchar(16) NOT NULL DEFAULT 'not_joined', last_seen_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(session_id, team_code))`);
    // Handover requests: a second phone asking to take over an occupied table waits for the first phone to approve.
    await db.execute(sql`ALTER TABLE workshop_teams ADD COLUMN IF NOT EXISTS pending_token_hash text, ADD COLUMN IF NOT EXISTS pending_name text, ADD COLUMN IF NOT EXISTS pending_at timestamptz, ADD COLUMN IF NOT EXISTS pending_state varchar(12), ADD COLUMN IF NOT EXISTS pending_polled_at timestamptz, ADD COLUMN IF NOT EXISTS pending_release_id uuid, ADD COLUMN IF NOT EXISTS pending_release_hash text`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_decisions (id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE, team_id uuid NOT NULL REFERENCES workshop_teams(id) ON DELETE CASCADE, round_no integer NOT NULL, option_key varchar(4), action text NOT NULL DEFAULT '', accepted_tradeoff text NOT NULL DEFAULT '', reversal_evidence text NOT NULL DEFAULT '', confidence integer, is_locked boolean NOT NULL DEFAULT false, is_featured boolean NOT NULL DEFAULT false, locked_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(team_id, round_no))`);
    await db.execute(sql`ALTER TABLE workshop_decisions DROP CONSTRAINT IF EXISTS workshop_decisions_round_no_check`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS workshop_events (id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE, event_type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now())`);
  })().catch((error) => { tablesReady = null; throw error; });
  return tablesReady;
}

function mapSession(r: any): Session {
  return { id: r.id, joinCode: r.join_code, name: r.name, variant: r.variant, status: r.status, activeRound: r.active_round, resultsVisible: r.results_visible, revision: r.revision, displayTokenHash: r.display_token_hash, roundStartedAt: r.round_started_at, roundClosedAt: r.round_closed_at ?? null, launchedAt: r.launched_at ?? null };
}
function mapTeam(r: any): Team {
  return { id: r.id, sessionId: r.session_id, teamCode: r.team_code, displayName: r.display_name, tokenHash: r.token_hash, state: r.state, lastSeenAt: r.last_seen_at, pendingHash: r.pending_token_hash ?? null, pendingName: r.pending_name ?? null, pendingAt: r.pending_at ?? null, pendingState: r.pending_state ?? null, pendingPolledAt: r.pending_polled_at ?? null, pendingReleaseId: r.pending_release_id ?? null, pendingReleaseHash: r.pending_release_hash ?? null };
}
function mapDecision(r: any): Decision {
  return { id: r.id, sessionId: r.session_id, teamId: r.team_id, roundNo: r.round_no, optionKey: r.option_key, rationale: r.action, confidence: r.confidence, isLocked: r.is_locked, isFeatured: r.is_featured, updatedAt: r.updated_at };
}

async function findSession(identifier: string) {
  if (!db) return Array.from(memory.sessions.values()).find((s) => s.id === identifier || s.joinCode === identifier.toUpperCase()) ?? null;
  await ensureTables();
  const result = rows<any>(await db.execute(sql`SELECT * FROM workshop_sessions WHERE id::text=${identifier} OR join_code=${identifier.toUpperCase()} LIMIT 1`));
  return result[0] ? mapSession(result[0]) : null;
}
async function getTeams(sessionId: string) {
  if (!db) return Array.from(memory.teams.values()).filter((t) => t.sessionId === sessionId);
  return rows<any>(await db.execute(sql`SELECT * FROM workshop_teams WHERE session_id=${sessionId}::uuid ORDER BY created_at`)).map(mapTeam);
}
async function getDecisions(sessionId: string) {
  if (!db) return Array.from(memory.decisions.values()).filter((d) => d.sessionId === sessionId);
  return rows<any>(await db.execute(sql`SELECT * FROM workshop_decisions WHERE session_id=${sessionId}::uuid ORDER BY round_no, updated_at`)).map(mapDecision);
}
async function bump(sessionId: string) {
  if (!db) { const s = memory.sessions.get(sessionId); if (s) s.revision++; return; }
  await db.execute(sql`UPDATE workshop_sessions SET revision=revision+1 WHERE id=${sessionId}::uuid`);
}
async function event(sessionId: string, eventType: string, payload: unknown = {}) {
  if (!db) return;
  await db.execute(sql`INSERT INTO workshop_events(id,session_id,event_type,payload) VALUES(${randomUUID()}::uuid,${sessionId}::uuid,${eventType},${JSON.stringify(payload)}::jsonb)`);
}
async function setTeamState(team: Team, state: TeamState) {
  team.state = state;
  if (db) await db.execute(sql`UPDATE workshop_teams SET state=${state},last_seen_at=now() WHERE id=${team.id}::uuid`);
}

/* ------------------------------------------------------------ handover
 * A device that joins a table another device already holds does not take it
 * over silently. If the holding device is active (polled within ONLINE seconds;
 * 90 by default because browsers throttle background tabs to about one timer a
 * minute) the new device files a request and waits; the holding device gets a
 * pop-up to approve or decline that exact request. If the holding device has gone
 * quiet the new device gets straight in, so a table is never locked out. Adam can
 * approve from his page. A request only counts while the asking device is still
 * polling for it (WAITER seconds), so an abandoned or cancelled request can never
 * be approved into a device that has gone. One live request per table at a time.
 */
const onlineMs = () => (Number(process.env.DECISION_ROOM_ONLINE_SECONDS) || 90) * 1000;
const waiterMs = () => (Number(process.env.DECISION_ROOM_WAITER_SECONDS) || 15) * 1000;
const handoverSeconds = () => Number(process.env.DECISION_ROOM_HANDOVER_SECONDS) || 60;
const ageMs = (at: string | null) => (at ? Date.now() - new Date(at).getTime() : Infinity);
const isOnline = (team: Team) => Boolean(team.tokenHash) && ageMs(team.lastSeenAt) < onlineMs();
const requestIdOf = (team: Team) => (team.pendingHash ? team.pendingHash.slice(0, 16) : null);
/** A pending request whose asking device is still polling for an answer. */
const isLive = (team: Team) => team.pendingState === "pending" && Boolean(team.pendingHash) && ageMs(team.pendingPolledAt ?? team.pendingAt) < waiterMs();
function pendingStatus(team: Team) {
  if (!team.pendingState) return null;
  if (team.pendingState === "pending" && !isLive(team)) return "abandoned";
  if (team.pendingState === "pending" && ageMs(team.pendingAt) > handoverSeconds() * 1000) return "expired";
  return team.pendingState;
}
const CLEAR_PENDING = { pendingHash: null, pendingName: null, pendingAt: null, pendingState: null, pendingPolledAt: null, pendingReleaseId: null, pendingReleaseHash: null };
async function openRequest(team: Team, hash: string, name: string | null, release: Team | null) {
  const now = new Date();
  if (db) await db.execute(sql`UPDATE workshop_teams SET pending_token_hash=${hash},pending_name=${name},pending_at=${now},pending_polled_at=${now},pending_state='pending',pending_release_id=${release ? release.id : null},pending_release_hash=${release ? release.tokenHash : null} WHERE id=${team.id}::uuid`);
  Object.assign(team, { pendingHash: hash, pendingName: name, pendingAt: now.toISOString(), pendingPolledAt: now.toISOString(), pendingState: "pending", pendingReleaseId: release?.id ?? null, pendingReleaseHash: release?.tokenHash ?? null });
}
async function closeRequest(team: Team, state: "declined" | null) {
  const hash = team.pendingHash;
  if (db) await db.execute(sql`UPDATE workshop_teams SET pending_state=${state},pending_token_hash=${state ? hash : null},pending_name=${state ? team.pendingName : null},pending_at=${state ? (team.pendingAt ? new Date(team.pendingAt) : null) : null},pending_polled_at=NULL,pending_release_id=NULL,pending_release_hash=NULL WHERE id=${team.id}::uuid AND pending_token_hash=${hash}`);
  if (state) Object.assign(team, { pendingState: state, pendingPolledAt: null, pendingReleaseId: null, pendingReleaseHash: null });
  else Object.assign(team, CLEAR_PENDING);
}
/** Moves the table to the asking device, only if `expectedHash` is still the open request; frees the table that device is leaving. */
async function completeHandover(team: Team, teams: Team[], expectedHash: string | null) {
  if (!expectedHash || !isLive(team) || team.pendingHash !== expectedHash) return false;
  const name = team.pendingName || team.displayName;
  const state: TeamState = team.state === "not_joined" ? "reading" : team.state;
  const releaseId = team.pendingReleaseId, releaseHash = team.pendingReleaseHash;
  if (db) {
    const done = rows<any>(await db.execute(sql`UPDATE workshop_teams SET token_hash=pending_token_hash,display_name=${name},state=${state},last_seen_at=now(),pending_token_hash=NULL,pending_name=NULL,pending_at=NULL,pending_state=NULL,pending_polled_at=NULL,pending_release_id=NULL,pending_release_hash=NULL WHERE id=${team.id}::uuid AND pending_state='pending' AND pending_token_hash=${expectedHash} RETURNING id`));
    if (!done.length) return false;
    if (releaseId && releaseHash) await db.execute(sql`UPDATE workshop_teams SET token_hash=NULL,state='not_joined' WHERE id=${releaseId}::uuid AND token_hash=${releaseHash}`);
  }
  Object.assign(team, { tokenHash: expectedHash, displayName: name, state, lastSeenAt: new Date().toISOString(), ...CLEAR_PENDING });
  if (!db && releaseId) { const left = teams.find((t) => t.id === releaseId && t.tokenHash === releaseHash); if (left) Object.assign(left, { tokenHash: null, state: "not_joined" }); }
  return true;
}

function roundState(session: Session): RoundState {
  if (session.status === "ended") return "ended";
  if (session.status === "lobby") return "lobby";
  if (session.status === "launched") return "launched";
  if (session.resultsVisible) return "published";
  if (session.roundClosedAt) return "closed";
  return "open";
}
function teamOf(teams: Team[], req: Request) {
  const provided = String(req.headers["x-team-token"] ?? "");
  return provided ? teams.find((t) => t.tokenHash && matchesHash(provided, t.tokenHash)) ?? null : null;
}
/** Choices this table has locked in rounds whose results the room has seen. */
function publishedChoices(session: Session, decisions: Decision[], teamId: string) {
  const choices = new Map<number, string>();
  for (const d of decisions) {
    if (d.teamId !== teamId || !d.isLocked || !d.optionKey) continue;
    const published = d.roundNo < session.activeRound || (d.roundNo === session.activeRound && session.resultsVisible);
    if (published) choices.set(d.roundNo, d.optionKey);
  }
  return choices;
}
function splitFor(decisions: Decision[], roundNo: number) {
  const current = decisions.filter((d) => d.roundNo === roundNo && d.isLocked);
  const options = Object.fromEntries(["A", "B", "C", "D"].map((k) => [k, current.filter((d) => d.optionKey === k).length]));
  const confidence = current.map((d) => d.confidence).filter((v): v is number => v !== null).sort((a, b) => a - b);
  return {
    locked: current.length,
    options,
    confidence: { low: confidence[0] ?? null, high: confidence.at(-1) ?? null, median: confidence.length ? confidence[Math.floor(confidence.length / 2)] : null },
    featured: current.filter((d) => d.isFeatured && d.rationale).map((d) => ({ id: d.id, rationale: d.rationale, confidence: d.confidence })),
  };
}
function sessionPayload(session: Session) {
  const round = roundContent(session.activeRound);
  return {
    id: session.id, joinCode: session.joinCode, name: session.name, status: session.status, revision: session.revision,
    activeRound: session.activeRound, roundCount: ROUND_COUNT, roundState: roundState(session),
    roundStartedAt: session.roundStartedAt, roundClosedAt: session.roundClosedAt, launchedAt: session.launchedAt,
    durationSeconds: round?.durationSeconds ?? 240,
  };
}
const SECURE_PATH = STAGES.map(() => "secure" as const);

function participantPayload(session: Session, team: Team, decisions: Decision[]) {
  const state = roundState(session);
  const round = roundContent(session.activeRound);
  const showRound = Boolean(round) && (state === "open" || state === "closed" || state === "published");
  const decision = decisions.find((d) => d.teamId === team.id && d.roundNo === session.activeRound) ?? null;
  const choices = publishedChoices(session, decisions, team.id);
  const meters = metersFor(choices, session.activeRound);
  const consequence = state === "published" && decision?.isLocked && decision.optionKey ? consequenceFor(session.activeRound, decision.optionKey, choices) : null;
  return {
    session: sessionPayload(session),
    team: { id: team.id, displayName: team.displayName, state: team.state },
    handover: pendingStatus(team) === "pending" ? { requestId: requestIdOf(team), name: team.pendingName, requestedAt: team.pendingAt, expiresInSeconds: handoverSeconds() } : null,
    organisation: ORGANISATION,
    round: showRound && round ? publicRound(round) : null,
    decision: decision ? { id: decision.id, optionKey: decision.optionKey, rationale: decision.rationale, confidence: decision.confidence, isLocked: decision.isLocked } : null,
    dashboard: { meters, path: showRound && round ? round.path : SECURE_PATH, stages: STAGES, meterKeys: METERS },
    results: state === "published" ? { ...splitFor(decisions, session.activeRound), consequence } : null,
  };
}
function consolePayload(session: Session, teams: Team[], decisions: Decision[]) {
  const state = roundState(session);
  const round = roundContent(session.activeRound);
  const counts = { notJoined: 0, joined: 0, locked: 0 };
  for (const t of teams) { if (t.state === "not_joined") counts.notJoined++; else if (t.state === "locked") counts.locked++; else counts.joined++; }
  const showRound = Boolean(round) && (state === "open" || state === "closed" || state === "published");
  return {
    session: sessionPayload(session),
    organisation: ORGANISATION,
    launch: LAUNCH,
    round: showRound && round ? publicRound(round) : null,
    counts: { ...counts, total: teams.length },
    teams: teams.map((t) => ({ id: t.id, displayName: t.displayName, state: t.state, handover: isLive(t) })),
    results: state === "published" ? splitFor(decisions, session.activeRound) : null,
    initialMeters: INITIAL_METERS,
    stages: STAGES,
    meterKeys: METERS,
  };
}
/** Validation problems are the caller's fault: answer 400 with the first message, never a 500 with a stack. */
function fail(e: unknown, res: Response, next: (e: unknown) => void) {
  if (e instanceof ZodError) { res.status(400).json({ message: e.issues[0]?.message ?? "Invalid request" }); return; }
  next(e);
}

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  // A rationale or team name starting with = + - @ would run as a formula when the CSV opens in Excel.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const createSchema = z.object({ name: z.string().trim().min(2).max(80).default("When the agent attacks"), tableCount: z.number().int().min(2).max(50).default(8), variant: z.string().optional() });
const joinSchema = z.object({ joinCode: z.string().trim().min(4).max(8), teamCode: z.string().trim().min(1).max(12), teamName: z.string().trim().max(40).optional() });
const decisionSchema = z.object({ roundNo: z.number().int().min(1).max(ROUND_COUNT), optionKey: z.enum(["A", "B", "C", "D"]), rationale: z.string().trim().max(240).default(""), confidence: z.number().int().min(1).max(5).nullable().optional(), lock: z.boolean().default(false) });
const handoverSchema = z.object({ decision: z.enum(["approve", "decline"]), requestId: z.string().min(8).max(64) });
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("launch") }), z.object({ action: z.literal("start") }), z.object({ action: z.literal("close") }),
  z.object({ action: z.literal("publish") }), z.object({ action: z.literal("advance") }), z.object({ action: z.literal("end") }), z.object({ action: z.literal("reset") }),
  z.object({ action: z.literal("reopen"), teamId: z.string().uuid() }), z.object({ action: z.literal("handover"), teamId: z.string().uuid() }), z.object({ action: z.literal("feature"), decisionId: z.string().uuid(), featured: z.boolean() }),
]);

export function registerDecisionRoomRoutes(app: Express) {
  app.post("/api/decision-room/sessions", async (req, res, next) => { try {
    if (!ensureAdmin(req, res) || rejectMissingDatabase(res)) return;
    const input = createSchema.parse(req.body ?? {}); await ensureTables();
    const sessionId = randomUUID(), joinCode = code(), displayToken = token();
    const session: Session = { id: sessionId, joinCode, name: input.name, variant: VARIANT, status: "lobby", activeRound: 1, resultsVisible: false, revision: 1, displayTokenHash: sha(displayToken), roundStartedAt: null, roundClosedAt: null, launchedAt: null };
    if (db) {
      await db.execute(sql`INSERT INTO workshop_sessions(id,join_code,name,variant,display_token_hash) VALUES(${sessionId}::uuid,${joinCode},${input.name},${VARIANT},${session.displayTokenHash})`);
      for (let i = 1; i <= input.tableCount; i++) await db.execute(sql`INSERT INTO workshop_teams(id,session_id,team_code,display_name) VALUES(${randomUUID()}::uuid,${sessionId}::uuid,${String(i)},${`Table ${i}`})`);
    } else {
      memory.sessions.set(sessionId, session);
      for (let i = 1; i <= input.tableCount; i++) { const id = randomUUID(); memory.teams.set(id, { id, sessionId, teamCode: String(i), displayName: `Table ${i}`, tokenHash: null, state: "not_joined", lastSeenAt: null, pendingHash: null, pendingName: null, pendingAt: null, pendingState: null, pendingPolledAt: null, pendingReleaseId: null, pendingReleaseHash: null }); }
    }
    await event(sessionId, "created", { tableCount: input.tableCount });
    res.status(201).json({ sessionId, joinCode, displayToken });
  } catch (e) { fail(e, res, next); } });

  // Public, by room code: which tables are free and which are already joined, so a phone picks its own table.
  app.get("/api/decision-room/rooms/:code/tables", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const session = await findSession(req.params.code);
    if (!session || session.joinCode !== req.params.code.toUpperCase()) { res.status(404).json({ message: "Room not found" }); return; }
    if (session.status === "ended") { res.status(409).json({ message: "This room has ended" }); return; }
    const tables = (await getTeams(session.id)).map((t) => ({ teamCode: t.teamCode, displayName: t.displayName, taken: Boolean(t.tokenHash) }));
    tables.sort((a, b) => (Number(a.teamCode) - Number(b.teamCode)) || a.teamCode.localeCompare(b.teamCode));
    res.json({ joinCode: session.joinCode, tables });
  } catch (e) { fail(e, res, next); } });

  app.post("/api/decision-room/join", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const input = joinSchema.parse(req.body ?? {});
    const session = await findSession(input.joinCode);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    if (session.status === "ended") { res.status(409).json({ message: "This room has ended" }); return; }
    const teams = await getTeams(session.id);
    const team = teams.find((t) => t.teamCode.toLowerCase() === input.teamCode.toLowerCase());
    if (!team) { res.status(404).json({ message: "Table code not found" }); return; }
    const teamToken = token(), hash = sha(teamToken);
    // A table names itself on first join ("The Night Shift"); a rejoin keeps the name unless a new one is given.
    const cleanName = (input.teamName ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 40);
    // The device may already hold a table in this room (its own table, or the one it is leaving).
    const current = teamOf(teams, req);
    if (team.tokenHash && isOnline(team) && current?.id !== team.id) {
      // Another device is active at this table: ask it first instead of signing it out. One live request at a time.
      if (isLive(team)) { res.status(409).json({ message: "Another device is already asking for this table. Try again in a moment." }); return; }
      await openRequest(team, hash, cleanName || null, current);
      await event(session.id, "handover-requested", { teamId: team.id });
      await bump(session.id);
      res.status(202).json({ pending: true, teamToken, sessionId: session.id, joinCode: session.joinCode, displayName: team.displayName, expiresInSeconds: handoverSeconds() });
      return;
    }
    // Free table, a quiet device (closed, asleep, dead), or this device rejoining its own table: in straight away.
    if (current && current.id !== team.id) {
      if (db) await db.execute(sql`UPDATE workshop_teams SET token_hash=NULL,state='not_joined' WHERE id=${current.id}::uuid`);
      else { current.tokenHash = null; current.state = "not_joined"; }
    }
    const state: TeamState = team.state === "not_joined" ? "reading" : team.state;
    const displayName = cleanName || team.displayName;
    if (db) await db.execute(sql`UPDATE workshop_teams SET token_hash=${hash},state=${state},display_name=${displayName},last_seen_at=now(),pending_token_hash=NULL,pending_name=NULL,pending_at=NULL,pending_state=NULL,pending_polled_at=NULL,pending_release_id=NULL,pending_release_hash=NULL WHERE id=${team.id}::uuid`);
    else Object.assign(team, { tokenHash: hash, state, displayName, lastSeenAt: new Date().toISOString(), ...CLEAR_PENDING });
    await bump(session.id);
    res.json({ teamToken, sessionId: session.id, joinCode: session.joinCode, displayName });
  } catch (e) { fail(e, res, next); } });

  app.get("/api/decision-room/sessions/:identifier/participant", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const team = teamOf(await getTeams(session.id), req);
    if (!team) { res.status(401).json({ message: "Rejoin your table to continue" }); return; }
    if (db) await db.execute(sql`UPDATE workshop_teams SET last_seen_at=now() WHERE id=${team.id}::uuid`);
    else team.lastSeenAt = new Date().toISOString();
    res.json(participantPayload(session, team, await getDecisions(session.id)));
  } catch (e) { fail(e, res, next); } });

  app.put("/api/decision-room/sessions/:identifier/decision", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const input = decisionSchema.parse(req.body ?? {});
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    if (roundState(session) !== "open" || input.roundNo !== session.activeRound) { res.status(409).json({ message: "This round is not accepting responses" }); return; }
    const team = teamOf(await getTeams(session.id), req);
    if (!team) { res.status(401).json({ message: "Rejoin your table to continue" }); return; }
    const existing = (await getDecisions(session.id)).find((d) => d.teamId === team.id && d.roundNo === input.roundNo);
    if (existing?.isLocked) { res.status(409).json({ message: "This response is locked. Ask Adam to reopen your table if it must change." }); return; }
    if (input.lock && !input.confidence) { res.status(400).json({ message: "Pick a confidence from 1 to 5 before you lock" }); return; }
    const id = existing?.id ?? randomUUID();
    const confidence = input.confidence ?? null;
    if (db) await db.execute(sql`INSERT INTO workshop_decisions(id,session_id,team_id,round_no,option_key,action,confidence,is_locked,locked_at,updated_at) VALUES(${id}::uuid,${session.id}::uuid,${team.id}::uuid,${input.roundNo},${input.optionKey},${input.rationale},${confidence},${input.lock},${input.lock ? new Date() : null},now()) ON CONFLICT(team_id,round_no) DO UPDATE SET option_key=excluded.option_key,action=excluded.action,confidence=excluded.confidence,is_locked=excluded.is_locked,locked_at=excluded.locked_at,updated_at=now()`);
    else memory.decisions.set(id, { id, sessionId: session.id, teamId: team.id, roundNo: input.roundNo, optionKey: input.optionKey, rationale: input.rationale, confidence, isLocked: input.lock, isFeatured: false, updatedAt: new Date().toISOString() });
    await setTeamState(team, input.lock ? "locked" : "debating");
    await bump(session.id);
    if (input.lock) await event(session.id, "locked", { teamId: team.id, roundNo: input.roundNo });
    res.json({ saved: true, locked: input.lock });
  } catch (e) { fail(e, res, next); } });

  // The waiting device polls this with the token it was given: pending, expired, declined, approved, abandoned or superseded.
  app.get("/api/decision-room/sessions/:identifier/handover", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const provided = String(req.headers["x-team-token"] ?? "");
    if (!provided) { res.status(401).json({ message: "Rejoin your table to continue" }); return; }
    const teams = await getTeams(session.id);
    const holder = teams.find((t) => t.tokenHash && matchesHash(provided, t.tokenHash));
    if (holder) { res.json({ status: "approved", displayName: holder.displayName }); return; }
    const asked = teams.find((t) => t.pendingHash && matchesHash(provided, t.pendingHash));
    if (!asked) { res.json({ status: "superseded" }); return; }
    if (asked.pendingState === "pending" && isLive(asked)) {
      // Still asking: keep the request alive.
      const now = new Date();
      if (db) await db.execute(sql`UPDATE workshop_teams SET pending_polled_at=${now} WHERE id=${asked.id}::uuid AND pending_token_hash=${asked.pendingHash}`);
      asked.pendingPolledAt = now.toISOString();
      // The device being asked went quiet while the request was open: hand the table over rather than strand it.
      if (!isOnline(asked) && await completeHandover(asked, teams, asked.pendingHash)) {
        await event(session.id, "handover", { teamId: asked.id, by: "timeout" }); await bump(session.id);
        res.json({ status: "approved", displayName: asked.displayName }); return;
      }
    }
    res.json({ status: pendingStatus(asked) });
  } catch (e) { fail(e, res, next); } });

  // The waiting device withdraws its request (Cancel).
  app.delete("/api/decision-room/sessions/:identifier/handover", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const provided = String(req.headers["x-team-token"] ?? "");
    const asked = provided ? (await getTeams(session.id)).find((t) => t.pendingHash && matchesHash(provided, t.pendingHash)) : null;
    if (asked) { await closeRequest(asked, null); await bump(session.id); }
    res.json({ ok: true });
  } catch (e) { fail(e, res, next); } });

  // The device holding the table answers the pop-up for one specific request.
  app.post("/api/decision-room/sessions/:identifier/handover", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const input = handoverSchema.parse(req.body ?? {});
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const teams = await getTeams(session.id);
    const team = teamOf(teams, req);
    if (!team) { res.status(401).json({ message: "Rejoin your table to continue" }); return; }
    if (!isLive(team) || requestIdOf(team) !== input.requestId) { res.status(409).json({ message: "That request is no longer waiting" }); return; }
    if (input.decision === "approve") { if (!(await completeHandover(team, teams, team.pendingHash))) { res.status(409).json({ message: "That request is no longer waiting" }); return; } }
    else await closeRequest(team, "declined");
    await event(session.id, input.decision === "approve" ? "handover" : "handover-declined", { teamId: team.id, by: "table" });
    await bump(session.id);
    res.json({ ok: true, decision: input.decision });
  } catch (e) { fail(e, res, next); } });

  app.get("/api/decision-room/sessions/:identifier/console", async (req, res, next) => { try {
    if (rejectMissingDatabase(res)) return;
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const displayToken = String(req.query.displayToken ?? "");
    if (!displayToken || !matchesHash(displayToken, session.displayTokenHash)) { res.status(401).json({ message: "Display access required" }); return; }
    res.json(consolePayload(session, await getTeams(session.id), await getDecisions(session.id)));
  } catch (e) { fail(e, res, next); } });

  app.get("/api/decision-room/sessions/:identifier/admin", async (req, res, next) => { try {
    if (!ensureAdmin(req, res) || rejectMissingDatabase(res)) return;
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const teams = await getTeams(session.id); const decisions = await getDecisions(session.id);
    const names = new Map(teams.map((t) => [t.id, t.displayName]));
    res.json({
      ...consolePayload(session, teams, decisions),
      decisions: decisions.filter((d) => d.roundNo === session.activeRound).map((d) => ({ id: d.id, teamId: d.teamId, table: names.get(d.teamId) ?? d.teamId, optionKey: d.optionKey, rationale: d.rationale, confidence: d.confidence, isLocked: d.isLocked, isFeatured: d.isFeatured })),
    });
  } catch (e) { fail(e, res, next); } });

  app.get("/api/decision-room/sessions/:identifier/export", async (req, res, next) => { try {
    if (!ensureAdmin(req, res) || rejectMissingDatabase(res)) return;
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const teams = await getTeams(session.id); const decisions = await getDecisions(session.id);
    const names = new Map(teams.map((t) => [t.id, t.displayName]));
    const header = ["room", "round", "seat", "table", "option", "rationale", "confidence", "locked", "featured", "updated_at"];
    const lines = [header.map(csvCell).join(","), ...decisions.map((d) => [session.joinCode, d.roundNo, roundContent(d.roundNo)?.seat ?? "", names.get(d.teamId) ?? d.teamId, d.optionKey, d.rationale, d.confidence, d.isLocked, d.isFeatured, d.updatedAt].map(csvCell).join(","))];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="decision-room-${session.joinCode}.csv"`);
    res.send(`﻿${lines.join("\r\n")}`);
  } catch (e) { fail(e, res, next); } });

  app.post("/api/decision-room/sessions/:identifier/actions", async (req, res, next) => { try {
    if (!ensureAdmin(req, res) || rejectMissingDatabase(res)) return;
    const input = actionSchema.parse(req.body ?? {});
    const session = await findSession(req.params.identifier);
    if (!session) { res.status(404).json({ message: "Room not found" }); return; }
    const teams = await getTeams(session.id);
    const state = roundState(session);

    if (input.action === "feature") {
      const decisions = await getDecisions(session.id);
      const target = decisions.find((d) => d.id === input.decisionId);
      if (!target || target.roundNo !== session.activeRound) { res.status(404).json({ message: "Response not found in this round" }); return; }
      const featured = decisions.filter((d) => d.roundNo === session.activeRound && d.isFeatured && d.id !== target.id).length;
      if (input.featured && featured >= MAX_FEATURED) { res.status(409).json({ message: `Deselect one first: at most ${MAX_FEATURED} rationales go on the screen` }); return; }
      if (db) await db.execute(sql`UPDATE workshop_decisions SET is_featured=${input.featured} WHERE id=${input.decisionId}::uuid AND session_id=${session.id}::uuid`);
      else target.isFeatured = input.featured;
    } else if (input.action === "handover") {
      const team = teams.find((t) => t.id === input.teamId);
      if (!team) { res.status(404).json({ message: "Table not found" }); return; }
      if (!(await completeHandover(team, teams, team.pendingHash))) { res.status(409).json({ message: "No device is waiting to take over that table any more" }); return; }
    } else if (input.action === "reopen") {
      if (state === "published") { res.status(409).json({ message: "The split is already on the screen for this round" }); return; }
      const team = teams.find((t) => t.id === input.teamId);
      if (!team) { res.status(404).json({ message: "Table not found" }); return; }
      if (db) await db.execute(sql`UPDATE workshop_decisions SET is_locked=false,locked_at=NULL WHERE team_id=${team.id}::uuid AND round_no=${session.activeRound}`);
      else for (const d of Array.from(memory.decisions.values())) if (d.teamId === team.id && d.roundNo === session.activeRound) d.isLocked = false;
      await setTeamState(team, "debating");
    } else {
      let { status, activeRound: round, resultsVisible: visible, roundStartedAt: started, roundClosedAt: closed, launchedAt: launched } = session;
      const now = new Date().toISOString();
      switch (input.action) {
        case "launch": if (status !== "lobby") { res.status(409).json({ message: "The room has already launched" }); return; } status = "launched"; launched = now; break;
        case "start": if (status === "live" || status === "ended") { res.status(409).json({ message: "The room is already running" }); return; } status = "live"; started = now; closed = null; visible = false; if (!launched) launched = now; break;
        case "close": if (state !== "open") { res.status(409).json({ message: "No open round to close" }); return; } closed = now; break;
        case "publish": if (state !== "open" && state !== "closed") { res.status(409).json({ message: "No round to publish" }); return; } visible = true; closed = closed ?? now; break;
        case "advance":
          if (status !== "live") { res.status(409).json({ message: "Start the room first" }); return; }
          if (round >= ROUND_COUNT) { res.status(409).json({ message: "This is the final round" }); return; }
          round += 1; visible = false; closed = null; started = now; break;
        case "end": status = "ended"; break;
        case "reset": status = "lobby"; round = 1; visible = false; started = null; closed = null; launched = null; break;
      }
      if (db) {
        await db.execute(sql`UPDATE workshop_sessions SET status=${status},active_round=${round},results_visible=${visible},round_started_at=${started ? new Date(started) : null},round_closed_at=${closed ? new Date(closed) : null},launched_at=${launched ? new Date(launched) : null},ended_at=${status === "ended" ? new Date() : null} WHERE id=${session.id}::uuid`);
        if (input.action === "advance") await db.execute(sql`UPDATE workshop_teams SET state='reading' WHERE session_id=${session.id}::uuid AND token_hash IS NOT NULL`);
        if (input.action === "reset") { await db.execute(sql`DELETE FROM workshop_decisions WHERE session_id=${session.id}::uuid`); await db.execute(sql`UPDATE workshop_teams SET state='not_joined',token_hash=NULL,last_seen_at=NULL,pending_token_hash=NULL,pending_name=NULL,pending_at=NULL,pending_state=NULL,pending_polled_at=NULL,pending_release_id=NULL,pending_release_hash=NULL WHERE session_id=${session.id}::uuid`); }
      } else {
        Object.assign(session, { status, activeRound: round, resultsVisible: visible, roundStartedAt: started, roundClosedAt: closed, launchedAt: launched });
        if (input.action === "advance") for (const t of teams) if (t.tokenHash) t.state = "reading";
        if (input.action === "reset") { for (const t of teams) Object.assign(t, { state: "not_joined", tokenHash: null, lastSeenAt: null, ...CLEAR_PENDING }); for (const [id, d] of Array.from(memory.decisions.entries())) if (d.sessionId === session.id) memory.decisions.delete(id); }
      }
    }
    await event(session.id, input.action, input);
    await bump(session.id);
    res.json({ ok: true });
  } catch (e) { fail(e, res, next); } });
}
