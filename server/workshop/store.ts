/**
 * Decision Room persistence.
 *
 * Neon/Postgres through Drizzle when a connection string is configured, with an
 * in-memory store as the fallback so the room can be rehearsed locally without a
 * database. Every mutation bumps the session revision: clients poll every five
 * seconds and use the revision to tell a real change from a quiet tick.
 */

import { and, asc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db, hasDatabase } from "../db.js";
import {
  workshopDecisions,
  workshopEvents,
  workshopRounds,
  workshopSessions,
  workshopTeams,
} from "../../shared/schema.js";

export type SessionRow = typeof workshopSessions.$inferSelect;
export type TeamRow = typeof workshopTeams.$inferSelect;
export type RoundRow = typeof workshopRounds.$inferSelect;
export type DecisionRow = typeof workshopDecisions.$inferSelect;

export type NewSession = typeof workshopSessions.$inferInsert;
export type NewTeam = typeof workshopTeams.$inferInsert;
export type NewRound = typeof workshopRounds.$inferInsert;

export type DecisionPatch = {
  optionKey?: string | null;
  ownAction?: string | null;
  confidence?: number | null;
  rationale?: string | null;
  isLocked?: boolean;
  selectedForDisplay?: boolean;
  displayOrder?: number | null;
  lockedAt?: Date | null;
};

export interface WorkshopStore {
  readonly kind: "database" | "memory";
  createSession(session: NewSession, teams: NewTeam[], rounds: NewRound[]): Promise<SessionRow>;
  getSessionById(id: string): Promise<SessionRow | null>;
  getSessionByJoinCode(joinCode: string): Promise<SessionRow | null>;
  getSessionByConsoleKey(consoleKey: string): Promise<SessionRow | null>;
  updateSession(id: string, patch: Partial<SessionRow>): Promise<SessionRow | null>;
  listTeams(sessionId: string): Promise<TeamRow[]>;
  getTeam(id: string): Promise<TeamRow | null>;
  updateTeam(id: string, patch: Partial<TeamRow>): Promise<TeamRow | null>;
  listRounds(sessionId: string): Promise<RoundRow[]>;
  updateRound(id: string, patch: Partial<RoundRow>): Promise<RoundRow | null>;
  listDecisions(sessionId: string): Promise<DecisionRow[]>;
  getDecision(teamId: string, roundId: string): Promise<DecisionRow | null>;
  upsertDecision(sessionId: string, teamId: string, roundId: string, patch: DecisionPatch): Promise<DecisionRow>;
  clearDecisions(sessionId: string): Promise<void>;
  recordEvent(input: {
    sessionId: string;
    actorType: string;
    actorId?: string | null;
    eventType: string;
    payload?: unknown;
  }): Promise<void>;
}

function randomId() {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Database store
// ---------------------------------------------------------------------------

let tablesReady: Promise<void> | null = null;

/**
 * Creates the workshop tables when they are missing. The repository also ships a
 * reviewed migration; this keeps a fresh Vercel deployment usable if the
 * migration has not been applied yet, which matters on event day.
 */
async function ensureTables() {
  if (!db) return;
  if (!tablesReady) {
    tablesReady = (async () => {
      await db!.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS "workshop_sessions" (
          "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
          "join_code" text NOT NULL UNIQUE,
          "console_key" text NOT NULL UNIQUE,
          "name" text NOT NULL,
          "variant" text NOT NULL,
          "status" text NOT NULL DEFAULT 'live',
          "active_round" integer NOT NULL DEFAULT 1,
          "results_visible" boolean NOT NULL DEFAULT false,
          "revision" integer NOT NULL DEFAULT 1,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "ended_at" timestamptz
        )
      `));
      await db!.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS "workshop_teams" (
          "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
          "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
          "table_code" text NOT NULL,
          "display_name" text NOT NULL,
          "claimed_at" timestamptz,
          "last_seen_at" timestamptz,
          "created_at" timestamptz NOT NULL DEFAULT now()
        )
      `));
      await db!.execute(sql.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS "workshop_teams_session_code_idx"
          ON "workshop_teams" ("session_id", "table_code")
      `));
      await db!.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS "workshop_rounds" (
          "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
          "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
          "round_number" integer NOT NULL,
          "content_key" text NOT NULL,
          "state" text NOT NULL DEFAULT 'pending',
          "duration_seconds" integer NOT NULL,
          "opened_at" timestamptz,
          "closed_at" timestamptz
        )
      `));
      await db!.execute(sql.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS "workshop_rounds_session_number_idx"
          ON "workshop_rounds" ("session_id", "round_number")
      `));
      await db!.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS "workshop_decisions" (
          "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
          "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
          "team_id" text NOT NULL REFERENCES "workshop_teams"("id") ON DELETE CASCADE,
          "round_id" text NOT NULL REFERENCES "workshop_rounds"("id") ON DELETE CASCADE,
          "option_key" text,
          "own_action" text,
          "confidence" integer CHECK ("confidence" BETWEEN 1 AND 5),
          "rationale" text,
          "is_locked" boolean NOT NULL DEFAULT false,
          "selected_for_display" boolean NOT NULL DEFAULT false,
          "display_order" integer,
          "locked_at" timestamptz,
          "updated_at" timestamptz NOT NULL DEFAULT now()
        )
      `));
      await db!.execute(sql.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS "workshop_decisions_team_round_idx"
          ON "workshop_decisions" ("team_id", "round_id")
      `));
      await db!.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS "workshop_events" (
          "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
          "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
          "actor_type" text NOT NULL,
          "actor_id" text,
          "event_type" text NOT NULL,
          "payload" jsonb,
          "created_at" timestamptz NOT NULL DEFAULT now()
        )
      `));
    })().catch((error) => {
      tablesReady = null;
      throw error;
    });
  }
  await tablesReady;
}

function createDatabaseStore(): WorkshopStore {
  const client = db!;

  async function bumpRevision(sessionId: string) {
    await client
      .update(workshopSessions)
      .set({ revision: sql`${workshopSessions.revision} + 1` })
      .where(eq(workshopSessions.id, sessionId));
  }

  return {
    kind: "database",

    async createSession(session, teams, rounds) {
      await ensureTables();
      const [created] = await client.insert(workshopSessions).values(session).returning();
      if (teams.length) {
        await client.insert(workshopTeams).values(teams.map((team) => ({ ...team, sessionId: created.id })));
      }
      if (rounds.length) {
        await client.insert(workshopRounds).values(rounds.map((round) => ({ ...round, sessionId: created.id })));
      }
      return created;
    },

    async getSessionById(id) {
      await ensureTables();
      const [row] = await client.select().from(workshopSessions).where(eq(workshopSessions.id, id)).limit(1);
      return row ?? null;
    },

    async getSessionByJoinCode(joinCode) {
      await ensureTables();
      const [row] = await client
        .select()
        .from(workshopSessions)
        .where(eq(workshopSessions.joinCode, joinCode))
        .limit(1);
      return row ?? null;
    },

    async getSessionByConsoleKey(consoleKey) {
      await ensureTables();
      const [row] = await client
        .select()
        .from(workshopSessions)
        .where(eq(workshopSessions.consoleKey, consoleKey))
        .limit(1);
      return row ?? null;
    },

    async updateSession(id, patch) {
      await ensureTables();
      const [row] = await client
        .update(workshopSessions)
        .set({ ...patch, revision: sql`${workshopSessions.revision} + 1` })
        .where(eq(workshopSessions.id, id))
        .returning();
      return row ?? null;
    },

    async listTeams(sessionId) {
      await ensureTables();
      return client
        .select()
        .from(workshopTeams)
        .where(eq(workshopTeams.sessionId, sessionId))
        .orderBy(asc(workshopTeams.tableCode));
    },

    async getTeam(id) {
      await ensureTables();
      const [row] = await client.select().from(workshopTeams).where(eq(workshopTeams.id, id)).limit(1);
      return row ?? null;
    },

    async updateTeam(id, patch) {
      await ensureTables();
      const [row] = await client.update(workshopTeams).set(patch).where(eq(workshopTeams.id, id)).returning();
      if (row) await bumpRevision(row.sessionId);
      return row ?? null;
    },

    async listRounds(sessionId) {
      await ensureTables();
      return client
        .select()
        .from(workshopRounds)
        .where(eq(workshopRounds.sessionId, sessionId))
        .orderBy(asc(workshopRounds.roundNumber));
    },

    async updateRound(id, patch) {
      await ensureTables();
      const [row] = await client.update(workshopRounds).set(patch).where(eq(workshopRounds.id, id)).returning();
      if (row) await bumpRevision(row.sessionId);
      return row ?? null;
    },

    async listDecisions(sessionId) {
      await ensureTables();
      return client.select().from(workshopDecisions).where(eq(workshopDecisions.sessionId, sessionId));
    },

    async getDecision(teamId, roundId) {
      await ensureTables();
      const [row] = await client
        .select()
        .from(workshopDecisions)
        .where(and(eq(workshopDecisions.teamId, teamId), eq(workshopDecisions.roundId, roundId)))
        .limit(1);
      return row ?? null;
    },

    async upsertDecision(sessionId, teamId, roundId, patch) {
      await ensureTables();
      const [row] = await client
        .insert(workshopDecisions)
        .values({ sessionId, teamId, roundId, ...patch, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [workshopDecisions.teamId, workshopDecisions.roundId],
          set: { ...patch, updatedAt: new Date() },
        })
        .returning();
      await bumpRevision(sessionId);
      return row;
    },

    async clearDecisions(sessionId) {
      await ensureTables();
      await client.delete(workshopDecisions).where(eq(workshopDecisions.sessionId, sessionId));
      await bumpRevision(sessionId);
    },

    async recordEvent(input) {
      await ensureTables();
      await client.insert(workshopEvents).values({
        sessionId: input.sessionId,
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        eventType: input.eventType,
        payload: (input.payload ?? null) as never,
      });
    },
  };
}

// ---------------------------------------------------------------------------
// In-memory store (local rehearsal, and a soft landing if Neon is unreachable)
// ---------------------------------------------------------------------------

function createMemoryStore(): WorkshopStore {
  const sessions = new Map<string, SessionRow>();
  const teams = new Map<string, TeamRow>();
  const rounds = new Map<string, RoundRow>();
  const decisions = new Map<string, DecisionRow>();

  function bump(sessionId: string) {
    const session = sessions.get(sessionId);
    if (session) sessions.set(sessionId, { ...session, revision: session.revision + 1 });
  }

  return {
    kind: "memory",

    async createSession(session, newTeams, newRounds) {
      const now = new Date();
      const row: SessionRow = {
        id: session.id ?? randomId(),
        joinCode: session.joinCode!,
        consoleKey: session.consoleKey!,
        name: session.name!,
        variant: session.variant!,
        status: session.status ?? "live",
        activeRound: session.activeRound ?? 1,
        resultsVisible: session.resultsVisible ?? false,
        revision: 1,
        createdAt: now,
        endedAt: null,
      };
      sessions.set(row.id, row);
      for (const team of newTeams) {
        const id = team.id ?? randomId();
        teams.set(id, {
          id,
          sessionId: row.id,
          tableCode: team.tableCode!,
          displayName: team.displayName!,
          claimedAt: null,
          lastSeenAt: null,
          createdAt: now,
        });
      }
      for (const round of newRounds) {
        const id = round.id ?? randomId();
        rounds.set(id, {
          id,
          sessionId: row.id,
          roundNumber: round.roundNumber!,
          contentKey: round.contentKey!,
          state: round.state ?? "pending",
          durationSeconds: round.durationSeconds!,
          openedAt: null,
          closedAt: null,
        });
      }
      return row;
    },

    async getSessionById(id) {
      return sessions.get(id) ?? null;
    },

    async getSessionByJoinCode(joinCode) {
      return Array.from(sessions.values()).find((session) => session.joinCode === joinCode) ?? null;
    },

    async getSessionByConsoleKey(consoleKey) {
      return Array.from(sessions.values()).find((session) => session.consoleKey === consoleKey) ?? null;
    },

    async updateSession(id, patch) {
      const current = sessions.get(id);
      if (!current) return null;
      const next = { ...current, ...patch, revision: current.revision + 1 };
      sessions.set(id, next);
      return next;
    },

    async listTeams(sessionId) {
      return Array.from(teams.values())
        .filter((team) => team.sessionId === sessionId)
        .sort((a, b) => a.tableCode.localeCompare(b.tableCode));
    },

    async getTeam(id) {
      return teams.get(id) ?? null;
    },

    async updateTeam(id, patch) {
      const current = teams.get(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      teams.set(id, next);
      bump(next.sessionId);
      return next;
    },

    async listRounds(sessionId) {
      return Array.from(rounds.values())
        .filter((round) => round.sessionId === sessionId)
        .sort((a, b) => a.roundNumber - b.roundNumber);
    },

    async updateRound(id, patch) {
      const current = rounds.get(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      rounds.set(id, next);
      bump(next.sessionId);
      return next;
    },

    async listDecisions(sessionId) {
      return Array.from(decisions.values()).filter((decision) => decision.sessionId === sessionId);
    },

    async getDecision(teamId, roundId) {
      return decisions.get(`${teamId}:${roundId}`) ?? null;
    },

    async upsertDecision(sessionId, teamId, roundId, patch) {
      const key = `${teamId}:${roundId}`;
      const current = decisions.get(key);
      const next: DecisionRow = {
        id: current?.id ?? randomId(),
        sessionId,
        teamId,
        roundId,
        optionKey: current?.optionKey ?? null,
        ownAction: current?.ownAction ?? null,
        confidence: current?.confidence ?? null,
        rationale: current?.rationale ?? null,
        isLocked: current?.isLocked ?? false,
        selectedForDisplay: current?.selectedForDisplay ?? false,
        displayOrder: current?.displayOrder ?? null,
        lockedAt: current?.lockedAt ?? null,
        ...patch,
        updatedAt: new Date(),
      };
      decisions.set(key, next);
      bump(sessionId);
      return next;
    },

    async clearDecisions(sessionId) {
      for (const [key, decision] of Array.from(decisions.entries())) {
        if (decision.sessionId === sessionId) decisions.delete(key);
      }
      bump(sessionId);
    },

    async recordEvent() {
      // Audit events are not retained by the in-memory store; rehearsal only.
    },
  };
}

export const workshopStore: WorkshopStore = hasDatabase && db ? createDatabaseStore() : createMemoryStore();
