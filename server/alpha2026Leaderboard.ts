import type { Express } from "express";
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db.js";
import { alpha2026LeaderboardEntries } from "../shared/schema.js";
import {
  incidents,
  responseProfiles,
} from "../client/src/pages/alpha2026/incident-v04-data.js";
import type { ResponseStyle } from "../client/src/pages/alpha2026/incident-v03-data.js";

type StoredRun = typeof alpha2026LeaderboardEntries.$inferSelect;

export type Alpha2026LeaderboardEntry = {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  elapsedSeconds: number;
  incidentId: string;
  incidentTitle: string;
  responseStyle: ResponseStyle;
  responseTitle: string;
  completedCount: number;
};

type RankedEntry = Alpha2026LeaderboardEntry & { playerId: string };

type RunTokenPayload = {
  kind: "run";
  version: 2;
  gameVersion: "v0.4";
  incidentId: string;
  startedAt: number;
  nonce: string;
};

type ResultTokenPayload = {
  kind: "result";
  version: 2;
  gameVersion: "v0.4";
  incidentId: string;
  score: number;
  elapsedSeconds: number;
  responseStyle: ResponseStyle;
  choiceIds: string[];
  completedAt: number;
  nonce: string;
};

const MAX_RUN_AGE_MS = 30 * 60 * 1000;
const CURRENT_GAME_VERSION = "v0.4" as const;
const memoryRuns = new Map<string, StoredRun>();
let tableReady: Promise<void> | null = null;

const stableSecret =
  process.env.ALPHA_2026_RUN_SECRET ||
  process.env.ADMIN_KEY ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "data3-alpha-2026-local-development";
const runSecret = createHash("sha256").update(stableSecret).digest();

const startRunSchema = z.object({
  incidentId: z.string().refine((value) => incidents.some((incident) => incident.id === value), {
    message: "Unknown incident",
  }),
});

const leaderboardSubmissionSchema = z.object({
  playerId: z.string().uuid(),
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(18)
    .refine(
      (value) => !/[<>{}[\]\\/\u0000-\u001f\u007f]/.test(value),
      "Use a short nickname or initials without symbols",
    ),
  resultToken: z.string().min(20).max(4096),
});

const completeRunSchema = z.object({
  incidentId: z.string().refine((value) => incidents.some((incident) => incident.id === value), {
    message: "Unknown incident",
  }),
  choiceIds: z.array(z.string().min(1).max(12)).length(5),
  runToken: z.string().min(20).max(2048),
});

function signPayload(payload: RunTokenPayload | ResultTokenPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", runSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function readSignedPayload(token: string): unknown | null {
  const [encoded, providedSignature, extra] = token.split(".");
  if (!encoded || !providedSignature || extra) return null;

  const expectedSignature = createHmac("sha256", runSecret).update(encoded).digest("base64url");
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as unknown;
  } catch {
    return null;
  }
}

function verifyRunToken(token: string, incidentId: string): RunTokenPayload | null {
  const payload = readSignedPayload(token) as RunTokenPayload | null;
  if (!payload) return null;
  const age = Date.now() - payload.startedAt;
  if (
    payload.kind !== "run" ||
    payload.version !== 2 ||
    payload.gameVersion !== CURRENT_GAME_VERSION ||
    payload.incidentId !== incidentId ||
    !Number.isFinite(payload.startedAt) ||
    age < -5_000 ||
    age > MAX_RUN_AGE_MS
  ) {
    return null;
  }
  return payload;
}

function responseStyleFor(styles: ResponseStyle[]): ResponseStyle {
  const counts = styles.reduce<Record<ResponseStyle, number>>(
    (result, style) => ({ ...result, [style]: result[style] + 1 }),
    { adaptive: 0, rapid: 0, evidence: 0, controlled: 0 },
  );
  const highestCount = Math.max(...Object.values(counts));
  if (highestCount <= 2) return "adaptive";

  const tied = (Object.keys(counts) as ResponseStyle[]).filter((style) => counts[style] === highestCount);
  const finalStyle = styles.at(-1);
  return finalStyle && tied.includes(finalStyle) ? finalStyle : tied[0];
}

function evaluateChoices(incidentId: string, choiceIds: string[]) {
  const incident = incidents.find((candidate) => candidate.id === incidentId);
  if (!incident || choiceIds.length !== incident.stages.length || new Set(choiceIds).size !== choiceIds.length) {
    return null;
  }

  const options = incident.stages.map((stage, index) =>
    stage.options.find((option) => option.id === choiceIds[index]),
  );
  if (options.some((option) => !option)) return null;

  const verifiedOptions = options.filter((option): option is NonNullable<typeof option> => Boolean(option));
  return {
    score: verifiedOptions.reduce((total, option) => total + option.points, 0),
    responseStyle: responseStyleFor(verifiedOptions.map((option) => option.style)),
  };
}

function verifyResultToken(token: string): ResultTokenPayload | null {
  const payload = readSignedPayload(token) as ResultTokenPayload | null;
  if (!payload) return null;
  const age = Date.now() - payload.completedAt;
  if (
    payload.kind !== "result" ||
    payload.version !== 2 ||
    payload.gameVersion !== CURRENT_GAME_VERSION ||
    !incidents.some((incident) => incident.id === payload.incidentId) ||
    !Number.isInteger(payload.score) ||
    payload.score < 0 ||
    payload.score > 100 ||
    !Number.isInteger(payload.elapsedSeconds) ||
    payload.elapsedSeconds < 1 ||
    payload.elapsedSeconds > MAX_RUN_AGE_MS / 1_000 ||
    !Array.isArray(payload.choiceIds) ||
    payload.choiceIds.length !== 5 ||
    !responseProfiles[payload.responseStyle] ||
    age < -5_000 ||
    age > 24 * 60 * 60 * 1_000
  ) {
    return null;
  }

  const evaluated = evaluateChoices(payload.incidentId, payload.choiceIds);
  if (!evaluated || evaluated.score !== payload.score || evaluated.responseStyle !== payload.responseStyle) {
    return null;
  }
  return payload;
}

async function ensureTable() {
  if (!db) return;
  if (!tableReady) {
    tableReady = (async () => {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS "alpha_2026_leaderboard_entries" (
          "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
          "game_version" text NOT NULL DEFAULT 'v0.4',
          "player_id" text NOT NULL,
          "display_name" text NOT NULL,
          "incident_id" text NOT NULL,
          "score" integer NOT NULL CHECK ("score" BETWEEN 0 AND 100),
          "elapsed_seconds" integer NOT NULL CHECK ("elapsed_seconds" BETWEEN 1 AND 1800),
          "response_style" text NOT NULL,
          "choice_ids" text[] NOT NULL,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz NOT NULL DEFAULT now()
        )
      `));
      await db.execute(sql.raw(`
        ALTER TABLE "alpha_2026_leaderboard_entries"
          ADD COLUMN IF NOT EXISTS "game_version" text NOT NULL DEFAULT 'v0.3'
      `));
      await db.execute(sql.raw(`
        ALTER TABLE "alpha_2026_leaderboard_entries"
          ALTER COLUMN "game_version" SET DEFAULT 'v0.4'
      `));
      await db.execute(sql.raw(`DROP INDEX IF EXISTS "alpha_2026_player_incident_idx"`));
      await db.execute(sql.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS "alpha_2026_version_player_incident_idx"
          ON "alpha_2026_leaderboard_entries" ("game_version", "player_id", "incident_id")
      `));
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
}

function isBetterRun(score: number, elapsedSeconds: number, current: StoredRun) {
  return score > current.score || (score === current.score && elapsedSeconds < current.elapsedSeconds);
}

async function saveRun(input: {
  playerId: string;
  displayName: string;
  incidentId: string;
  score: number;
  elapsedSeconds: number;
  responseStyle: ResponseStyle;
  choiceIds: string[];
}) {
  const now = new Date();
  const memoryKey = `${CURRENT_GAME_VERSION}:${input.playerId}:${input.incidentId}`;

  if (!db) {
    const current = memoryRuns.get(memoryKey);
    const best = !current || isBetterRun(input.score, input.elapsedSeconds, current);
    memoryRuns.set(memoryKey, {
      id: current?.id ?? randomUUID(),
      gameVersion: CURRENT_GAME_VERSION,
      playerId: input.playerId,
      displayName: input.displayName,
      incidentId: input.incidentId,
      score: best ? input.score : current.score,
      elapsedSeconds: best ? input.elapsedSeconds : current.elapsedSeconds,
      responseStyle: best ? input.responseStyle : current.responseStyle,
      choiceIds: best ? input.choiceIds : current.choiceIds,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    });
    return;
  }

  await ensureTable();
  const [current] = await db
    .select()
    .from(alpha2026LeaderboardEntries)
    .where(
      and(
        eq(alpha2026LeaderboardEntries.gameVersion, CURRENT_GAME_VERSION),
        eq(alpha2026LeaderboardEntries.playerId, input.playerId),
        eq(alpha2026LeaderboardEntries.incidentId, input.incidentId),
      ),
    )
    .limit(1);

  if (!current) {
    await db.insert(alpha2026LeaderboardEntries).values({
      ...input,
      gameVersion: CURRENT_GAME_VERSION,
      updatedAt: now,
    });
    return;
  }

  const best = isBetterRun(input.score, input.elapsedSeconds, current);
  await db
    .update(alpha2026LeaderboardEntries)
    .set({
      displayName: input.displayName,
      score: best ? input.score : current.score,
      elapsedSeconds: best ? input.elapsedSeconds : current.elapsedSeconds,
      responseStyle: best ? input.responseStyle : current.responseStyle,
      choiceIds: best ? input.choiceIds : current.choiceIds,
      updatedAt: now,
    })
    .where(eq(alpha2026LeaderboardEntries.id, current.id));
}

async function getRuns(): Promise<StoredRun[]> {
  if (!db) return Array.from(memoryRuns.values());
  await ensureTable();
  return db
    .select()
    .from(alpha2026LeaderboardEntries)
    .where(eq(alpha2026LeaderboardEntries.gameVersion, CURRENT_GAME_VERSION))
    .limit(5_000);
}

function rankRuns(runs: StoredRun[]): RankedEntry[] {
  const grouped = new Map<string, StoredRun[]>();
  for (const run of runs) {
    grouped.set(run.playerId, [...(grouped.get(run.playerId) ?? []), run]);
  }

  const entries = Array.from(grouped.entries()).map(([playerId, playerRuns]) => {
    const latest = [...playerRuns].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )[0];
    const best = [...playerRuns].sort(
      (a, b) =>
        b.score - a.score ||
        a.elapsedSeconds - b.elapsedSeconds ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    )[0];
    const incident = incidents.find((candidate) => candidate.id === best.incidentId) ?? incidents[0];
    const responseStyle = best.responseStyle as ResponseStyle;

    return {
      id: best.id,
      playerId,
      rank: 0,
      displayName: latest.displayName,
      score: best.score,
      elapsedSeconds: best.elapsedSeconds,
      incidentId: best.incidentId,
      incidentTitle: incident.title,
      responseStyle,
      responseTitle: responseProfiles[responseStyle]?.title ?? "Adaptive responder",
      completedCount: new Set(playerRuns.map((run) => run.incidentId)).size,
      createdAt: best.createdAt,
    };
  });

  return entries
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.elapsedSeconds - b.elapsedSeconds ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    )
    .map(({ createdAt: _createdAt, ...entry }, index) => ({ ...entry, rank: index + 1 }));
}

function publicEntry({ playerId: _playerId, ...entry }: RankedEntry): Alpha2026LeaderboardEntry {
  return entry;
}

export function registerAlpha2026LeaderboardRoutes(app: Express) {
  app.post("/api/2026alpha/runs", (req, res) => {
    const parsed = startRunSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Choose a valid incident." });
      return;
    }

    const payload: RunTokenPayload = {
      kind: "run",
      version: 2,
      gameVersion: CURRENT_GAME_VERSION,
      incidentId: parsed.data.incidentId,
      startedAt: Date.now(),
      nonce: randomBytes(12).toString("base64url"),
    };
    res.json({ runToken: signPayload(payload) });
  });

  app.post("/api/2026alpha/runs/complete", (req, res) => {
    const parsed = completeRunSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "This run could not be verified." });
      return;
    }

    const { incidentId, choiceIds, runToken } = parsed.data;
    const run = verifyRunToken(runToken, incidentId);
    const evaluated = evaluateChoices(incidentId, choiceIds);
    if (!run || !evaluated) {
      res.status(400).json({ message: "This run could not be verified. Replay the incident to join the board." });
      return;
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - run.startedAt) / 1_000));
    const result: ResultTokenPayload = {
      kind: "result",
      version: 2,
      gameVersion: CURRENT_GAME_VERSION,
      incidentId,
      score: evaluated.score,
      elapsedSeconds,
      responseStyle: evaluated.responseStyle,
      choiceIds,
      completedAt: Date.now(),
      nonce: randomBytes(12).toString("base64url"),
    };
    res.json({
      resultToken: signPayload(result),
      score: result.score,
      elapsedSeconds: result.elapsedSeconds,
      responseStyle: result.responseStyle,
    });
  });

  app.get("/api/2026alpha/leaderboard", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const requestedLimit = Number.parseInt(String(req.query.limit ?? "20"), 10);
      const limit = Math.max(3, Math.min(100, Number.isFinite(requestedLimit) ? requestedLimit : 20));
      const ranked = rankRuns(await getRuns());
      res.json({
        entries: ranked.slice(0, limit).map(publicEntry),
        totalPlayers: ranked.length,
        persistent: Boolean(db),
        version: CURRENT_GAME_VERSION,
      });
    } catch (error) {
      console.error("[2026alpha] Failed to load leaderboard", error);
      res.status(500).json({ message: "The leaderboard is temporarily unavailable." });
    }
  });

  app.post("/api/2026alpha/leaderboard", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const parsed = leaderboardSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Check your leaderboard entry." });
      return;
    }

    const { playerId, displayName, resultToken } = parsed.data;
    const result = verifyResultToken(resultToken);
    if (!result) {
      res.status(400).json({ message: "This run could not be verified. Replay the incident to join the board." });
      return;
    }

    try {
      await saveRun({
        playerId,
        displayName,
        incidentId: result.incidentId,
        score: result.score,
        elapsedSeconds: result.elapsedSeconds,
        responseStyle: result.responseStyle,
        choiceIds: result.choiceIds,
      });
      const ranked = rankRuns(await getRuns());
      const yourEntry = ranked.find((entry) => entry.playerId === playerId);
      if (!yourEntry) throw new Error("Saved leaderboard entry was not returned");

      res.json({
        entry: publicEntry(yourEntry),
        entries: ranked.slice(0, 10).map(publicEntry),
        totalPlayers: ranked.length,
        persistent: Boolean(db),
        version: CURRENT_GAME_VERSION,
      });
    } catch (error) {
      console.error("[2026alpha] Failed to save leaderboard result", error);
      res.status(500).json({ message: "Your result is safe on this device, but the leaderboard could not update." });
    }
  });
}
