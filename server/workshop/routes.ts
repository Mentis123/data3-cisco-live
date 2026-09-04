/**
 * Decision Room API.
 *
 * A room instrument for the "When the agent acts" tabletop. It reports what the
 * room is doing; it never ranks tables, scores answers or exposes a correct
 * option. Every state transition is server authoritative.
 *
 * Security boundaries:
 *  - Facilitator routes require WORKSHOP_FACILITATOR_SECRET. There is no
 *    default and no fallback: without the variable the admin routes refuse.
 *  - Participant routes require a table token, an HMAC bound to session and
 *    table. Tokens stop working the moment the session is ended.
 *  - Participant payloads carry only the open round and that table's own
 *    response. Reveal text never reaches a device: it is projected and read.
 */

import type { Express, Request, Response } from "express";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import { log } from "../logging.js";
import {
  createWorkshopSchema,
  joinWorkshopSchema,
  workshopActionSchema,
  workshopDecisionSchema,
} from "../../shared/schema.js";
import { WORKSHOP_ROUND_COUNT, roundContent, variantContent } from "./content.js";
import type { DecisionRow, RoundRow, SessionRow, TeamRow } from "./store.js";
import { workshopStore } from "./store.js";

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_SELECTED_RATIONALES = 2;
const DEFAULT_TABLE_COUNT = 8;

const facilitatorSecret = process.env.WORKSHOP_FACILITATOR_SECRET ?? "";
const tokenSecret = process.env.WORKSHOP_TOKEN_SECRET || facilitatorSecret;

type TableState = "waiting" | "joined" | "drafting" | "locked";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

function facilitatorConfigured() {
  return facilitatorSecret.length >= 16;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireFacilitator(req: Request, res: Response): boolean {
  if (!facilitatorConfigured()) {
    res.status(503).json({
      message:
        "Decision Room facilitator controls are disabled: set WORKSHOP_FACILITATOR_SECRET (at least 16 characters) in the deployment environment.",
    });
    return false;
  }

  const header = req.headers["x-workshop-key"];
  const provided = Array.isArray(header) ? header[0] ?? "" : header ?? "";
  if (!provided || !safeEqual(provided, facilitatorSecret)) {
    res.status(401).json({ message: "Unauthorised" });
    return false;
  }

  return true;
}

function issueTableToken(sessionId: string, teamId: string) {
  const payload = Buffer.from(JSON.stringify({ sessionId, teamId })).toString("base64url");
  const signature = createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readTableToken(token: string): { sessionId: string; teamId: string } | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sessionId?: unknown;
      teamId?: unknown;
    };
    if (typeof parsed.sessionId !== "string" || typeof parsed.teamId !== "string") return null;
    return { sessionId: parsed.sessionId, teamId: parsed.teamId };
  } catch {
    return null;
  }
}

function tableTokenFrom(req: Request): string {
  const header = req.headers["x-table-token"];
  return Array.isArray(header) ? header[0] ?? "" : header ?? "";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newJoinCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length]).join("");
}

function decisionHasContent(decision: DecisionRow | null | undefined) {
  if (!decision) return false;
  return Boolean(decision.optionKey || decision.ownAction || decision.rationale || decision.confidence);
}

function stateForTable(team: TeamRow, decision: DecisionRow | null | undefined): TableState {
  if (decision?.isLocked) return "locked";
  if (decisionHasContent(decision)) return "drafting";
  return team.claimedAt ? "joined" : "waiting";
}

function timerFor(round: RoundRow | null) {
  if (!round?.openedAt || round.state !== "open") return null;
  const openedAt = new Date(round.openedAt).getTime();
  return {
    openedAt: new Date(openedAt).toISOString(),
    endsAt: new Date(openedAt + round.durationSeconds * 1000).toISOString(),
    durationSeconds: round.durationSeconds,
  };
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 10) / 10;
}

function activeRoundOf(rounds: RoundRow[], session: SessionRow) {
  return rounds.find((round) => round.roundNumber === session.activeRound) ?? null;
}

/**
 * Aggregate view of a round, with no per-table attribution. Used by the
 * projected console, so it must never carry a lock time, an order of arrival or
 * anything a viewer could read as a ranking.
 */
function summariseRound(session: SessionRow, round: RoundRow | null, decisions: DecisionRow[], published: boolean) {
  if (!round) return null;
  const forRound = decisions.filter((decision) => decision.roundId === round.id && decision.isLocked);
  const content = roundContent(session.variant, round.roundNumber);

  const distribution = (content?.options ?? []).map((option) => ({
    key: option.key,
    label: option.label,
    count: forRound.filter((decision) => decision.optionKey === option.key).length,
  }));
  if (content?.options.length) {
    distribution.push({
      key: "own",
      label: "Own action",
      count: forRound.filter((decision) => Boolean(decision.ownAction)).length,
    });
  }

  const confidences = forRound
    .map((decision) => decision.confidence)
    .filter((value): value is number => typeof value === "number");

  return {
    roundNumber: round.roundNumber,
    lockedCount: forRound.length,
    distribution: published ? distribution : [],
    confidence: published
      ? {
          median: median(confidences),
          min: confidences.length ? Math.min(...confidences) : null,
          max: confidences.length ? Math.max(...confidences) : null,
          counts: [1, 2, 3, 4, 5].map((value) => ({
            value,
            count: confidences.filter((entry) => entry === value).length,
          })),
        }
      : null,
    rationales: published
      ? forRound
          .filter((decision) => decision.selectedForDisplay && decision.rationale)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((decision) => ({ text: decision.rationale as string }))
      : [],
  };
}

function participantRoundPayload(session: SessionRow, round: RoundRow | null) {
  if (!round || round.state === "pending") return null;
  const content = roundContent(session.variant, round.roundNumber);
  if (!content) return null;
  return {
    roundNumber: round.roundNumber,
    state: round.state,
    heading: content.heading,
    task: content.task,
    options: content.options,
    lockHint: content.lockHint,
    timer: timerFor(round),
  };
}

function ownDecisionPayload(decision: DecisionRow | null) {
  if (!decision) return null;
  return {
    optionKey: decision.optionKey,
    ownAction: decision.ownAction,
    confidence: decision.confidence,
    rationale: decision.rationale,
    isLocked: decision.isLocked,
    lockedAt: decision.lockedAt,
  };
}

function badRequest(res: Response, error: z.ZodError) {
  res.status(400).json({ message: error.issues[0]?.message ?? "Invalid request" });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function registerWorkshopRoutes(app: Express) {
  log(
    `Decision Room using ${workshopStore.kind} storage; facilitator controls ${
      facilitatorConfigured() ? "enabled" : "disabled (WORKSHOP_FACILITATOR_SECRET not set)"
    }`,
  );

  // --- Facilitator: create a session -------------------------------------
  app.post("/api/workshops", async (req: Request, res: Response) => {
    if (!requireFacilitator(req, res)) return;

    const parsed = createWorkshopSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error);

    const content = variantContent(parsed.data.variant);
    if (!content) return res.status(400).json({ message: "Unknown variant" });

    const tableCount = parsed.data.tableCount ?? DEFAULT_TABLE_COUNT;

    try {
      const session = await workshopStore.createSession(
        {
          joinCode: newJoinCode(),
          consoleKey: randomBytes(16).toString("hex"),
          name: parsed.data.name?.trim() || `${content.label} · When the agent acts`,
          variant: parsed.data.variant,
          status: "live",
          activeRound: 1,
          resultsVisible: false,
        },
        Array.from({ length: tableCount }, (_, index) => ({
          sessionId: "",
          tableCode: String(index + 1),
          displayName: `Table ${index + 1}`,
        })),
        content.rounds.map((round) => ({
          sessionId: "",
          roundNumber: round.roundNumber,
          contentKey: round.contentKey,
          state: "pending",
          durationSeconds: round.durationSeconds,
        })),
      );

      await workshopStore.recordEvent({
        sessionId: session.id,
        actorType: "facilitator",
        eventType: "session.created",
        payload: { variant: session.variant, tableCount },
      });

      res.status(201).json({
        id: session.id,
        joinCode: session.joinCode,
        consoleKey: session.consoleKey,
        name: session.name,
        variant: session.variant,
      });
    } catch (error) {
      console.error("[workshop] create session failed:", error);
      res.status(500).json({ message: "Could not create the session" });
    }
  });

  // --- Facilitator: find a session again by join code ---------------------
  app.get("/api/workshops/lookup/:joinCode", async (req: Request, res: Response) => {
    if (!requireFacilitator(req, res)) return;
    const session = await workshopStore.getSessionByJoinCode(String(req.params.joinCode).toUpperCase());
    if (!session) return res.status(404).json({ message: "No session with that code" });
    res.json({
      id: session.id,
      joinCode: session.joinCode,
      consoleKey: session.consoleKey,
      name: session.name,
      variant: session.variant,
      status: session.status,
    });
  });

  // --- Participant: join a table -----------------------------------------
  app.post("/api/workshops/:joinCode/join", async (req: Request, res: Response) => {
    const parsed = joinWorkshopSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error);

    const session = await workshopStore.getSessionByJoinCode(String(req.params.joinCode).toUpperCase());
    if (!session) return res.status(404).json({ message: "No session with that code" });
    if (session.status === "ended") return res.status(410).json({ message: "This session has ended" });

    const teams = await workshopStore.listTeams(session.id);
    const team = teams.find((candidate) => candidate.tableCode === parsed.data.tableCode.trim());
    if (!team) return res.status(404).json({ message: "That table is not part of this session" });

    const now = new Date();
    await workshopStore.updateTeam(team.id, { claimedAt: team.claimedAt ?? now, lastSeenAt: now });
    if (!team.claimedAt) {
      await workshopStore.recordEvent({
        sessionId: session.id,
        actorType: "table",
        actorId: team.id,
        eventType: "table.joined",
        payload: { tableCode: team.tableCode },
      });
    }

    res.json({
      token: issueTableToken(session.id, team.id),
      table: { id: team.id, tableCode: team.tableCode, displayName: team.displayName },
      session: { joinCode: session.joinCode, name: session.name },
    });
  });

  // --- Participant: current state ----------------------------------------
  app.get("/api/workshops/:joinCode/state", async (req: Request, res: Response) => {
    const session = await workshopStore.getSessionByJoinCode(String(req.params.joinCode).toUpperCase());
    if (!session) return res.status(404).json({ message: "No session with that code" });

    const rounds = await workshopStore.listRounds(session.id);
    const round = activeRoundOf(rounds, session);
    const teams = await workshopStore.listTeams(session.id);

    const token = readTableToken(tableTokenFrom(req));
    const team =
      token && token.sessionId === session.id ? teams.find((candidate) => candidate.id === token.teamId) ?? null : null;

    let decision: DecisionRow | null = null;
    if (team && round) {
      decision = await workshopStore.getDecision(team.id, round.id);
      await workshopStore.updateTeam(team.id, { lastSeenAt: new Date() });
    }

    res.json({
      session: {
        name: session.name,
        variantLabel: variantContent(session.variant)?.label ?? session.variant,
        system: variantContent(session.variant)?.system ?? "",
        status: session.status,
        activeRound: session.activeRound,
        roundCount: WORKSHOP_ROUND_COUNT,
        revision: session.revision,
      },
      table: team ? { tableCode: team.tableCode, displayName: team.displayName } : null,
      round: participantRoundPayload(session, round),
      decision: ownDecisionPayload(decision),
      availableTables: team
        ? []
        : teams.map((candidate) => ({
            tableCode: candidate.tableCode,
            displayName: candidate.displayName,
            claimed: Boolean(candidate.claimedAt),
          })),
      serverTime: new Date().toISOString(),
    });
  });

  // --- Participant: draft and lock ---------------------------------------
  app.put("/api/workshops/:joinCode/decision", async (req: Request, res: Response) => {
    const parsed = workshopDecisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error);

    const session = await workshopStore.getSessionByJoinCode(String(req.params.joinCode).toUpperCase());
    if (!session) return res.status(404).json({ message: "No session with that code" });
    if (session.status === "ended") return res.status(410).json({ message: "This session has ended" });

    const token = readTableToken(tableTokenFrom(req));
    if (!token || token.sessionId !== session.id) {
      return res.status(401).json({ message: "Rejoin this table to continue" });
    }

    const team = await workshopStore.getTeam(token.teamId);
    if (!team || team.sessionId !== session.id) {
      return res.status(401).json({ message: "Rejoin this table to continue" });
    }

    const rounds = await workshopStore.listRounds(session.id);
    const round = activeRoundOf(rounds, session);
    if (!round || round.state !== "open") {
      return res.status(409).json({ message: "This round is not open" });
    }

    const existing = await workshopStore.getDecision(team.id, round.id);
    if (existing?.isLocked) {
      return res.status(409).json({
        message: "Your response is locked. Ask the facilitator to reopen this table if it must change.",
        decision: ownDecisionPayload(existing),
      });
    }

    const wantsLock = parsed.data.lock === true;
    if (wantsLock) {
      const hasChoice = Boolean(parsed.data.optionKey || parsed.data.ownAction);
      if (!hasChoice || !parsed.data.confidence) {
        return res.status(400).json({ message: "Lock needs a choice or own action, and a confidence from 1 to 5" });
      }
    }

    const content = roundContent(session.variant, round.roundNumber);
    if (parsed.data.optionKey && !content?.options.some((option) => option.key === parsed.data.optionKey)) {
      return res.status(400).json({ message: "Unknown option for this round" });
    }

    const decision = await workshopStore.upsertDecision(session.id, team.id, round.id, {
      optionKey: parsed.data.optionKey ?? null,
      ownAction: parsed.data.ownAction ?? null,
      confidence: parsed.data.confidence ?? null,
      rationale: parsed.data.rationale ?? null,
      isLocked: wantsLock,
      lockedAt: wantsLock ? new Date() : null,
    });

    if (wantsLock) {
      await workshopStore.recordEvent({
        sessionId: session.id,
        actorType: "table",
        actorId: team.id,
        eventType: "decision.locked",
        payload: { round: round.roundNumber },
      });
    }

    res.json({ decision: ownDecisionPayload(decision) });
  });

  // --- Console: projected room state --------------------------------------
  app.get("/api/workshops/console/:consoleKey", async (req: Request, res: Response) => {
    const session = await workshopStore.getSessionByConsoleKey(String(req.params.consoleKey));
    if (!session) return res.status(404).json({ message: "No console for that key" });

    const [teams, rounds, decisions] = await Promise.all([
      workshopStore.listTeams(session.id),
      workshopStore.listRounds(session.id),
      workshopStore.listDecisions(session.id),
    ]);
    const round = activeRoundOf(rounds, session);
    const published = session.resultsVisible && round?.state === "published";

    const tiles = teams.map((team) => {
      const decision = round ? decisions.find((entry) => entry.teamId === team.id && entry.roundId === round.id) : null;
      return { tableCode: team.tableCode, displayName: team.displayName, state: stateForTable(team, decision) };
    });

    res.json({
      session: {
        name: session.name,
        variantLabel: variantContent(session.variant)?.label ?? session.variant,
        system: variantContent(session.variant)?.system ?? "",
        status: session.status,
        activeRound: session.activeRound,
        roundCount: WORKSHOP_ROUND_COUNT,
        joinCode: session.joinCode,
        revision: session.revision,
      },
      round: round
        ? {
            roundNumber: round.roundNumber,
            state: round.state,
            heading: roundContent(session.variant, round.roundNumber)?.heading ?? "",
            timer: timerFor(round),
          }
        : null,
      counts: {
        total: tiles.length,
        joined: tiles.filter((tile) => tile.state !== "waiting").length,
        drafting: tiles.filter((tile) => tile.state === "drafting").length,
        locked: tiles.filter((tile) => tile.state === "locked").length,
      },
      tables: tiles,
      results: summariseRound(session, round, decisions, Boolean(published)),
      resultsVisible: Boolean(published),
      serverTime: new Date().toISOString(),
    });
  });

  // --- Facilitator: admin view --------------------------------------------
  app.get("/api/workshops/:id/admin", async (req: Request, res: Response) => {
    if (!requireFacilitator(req, res)) return;

    const session = await workshopStore.getSessionById(String(req.params.id));
    if (!session) return res.status(404).json({ message: "No such session" });

    const [teams, rounds, decisions] = await Promise.all([
      workshopStore.listTeams(session.id),
      workshopStore.listRounds(session.id),
      workshopStore.listDecisions(session.id),
    ]);
    const round = activeRoundOf(rounds, session);

    res.json({
      session: {
        id: session.id,
        name: session.name,
        variant: session.variant,
        variantLabel: variantContent(session.variant)?.label ?? session.variant,
        status: session.status,
        activeRound: session.activeRound,
        roundCount: WORKSHOP_ROUND_COUNT,
        joinCode: session.joinCode,
        consoleKey: session.consoleKey,
        resultsVisible: session.resultsVisible,
        revision: session.revision,
      },
      rounds: rounds.map((entry) => ({
        roundNumber: entry.roundNumber,
        state: entry.state,
        durationSeconds: entry.durationSeconds,
        timer: timerFor(entry),
      })),
      tables: teams.map((team) => {
        const decision = round
          ? decisions.find((entry) => entry.teamId === team.id && entry.roundId === round.id) ?? null
          : null;
        return {
          id: team.id,
          tableCode: team.tableCode,
          displayName: team.displayName,
          state: stateForTable(team, decision),
          decision: decision
            ? {
                id: decision.id,
                optionKey: decision.optionKey,
                ownAction: decision.ownAction,
                confidence: decision.confidence,
                rationale: decision.rationale,
                isLocked: decision.isLocked,
                selectedForDisplay: decision.selectedForDisplay,
              }
            : null,
        };
      }),
      serverTime: new Date().toISOString(),
    });
  });

  // --- Facilitator: state transitions -------------------------------------
  app.post("/api/workshops/:id/actions", async (req: Request, res: Response) => {
    if (!requireFacilitator(req, res)) return;

    const parsed = workshopActionSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error);

    const session = await workshopStore.getSessionById(String(req.params.id));
    if (!session) return res.status(404).json({ message: "No such session" });

    const rounds = await workshopStore.listRounds(session.id);
    const round = activeRoundOf(rounds, session);
    const { action } = parsed.data;

    try {
      switch (action) {
        case "open": {
          if (!round) return res.status(409).json({ message: "No round to open" });
          if (round.state === "published") {
            return res.status(409).json({ message: "Hide the results before reopening this round" });
          }
          await workshopStore.updateRound(round.id, { state: "open", openedAt: new Date(), closedAt: null });
          await workshopStore.updateSession(session.id, { resultsVisible: false });
          break;
        }
        case "close": {
          if (!round || round.state !== "open") {
            return res.status(409).json({ message: "This round is not open" });
          }
          await workshopStore.updateRound(round.id, { state: "closed", closedAt: new Date() });
          break;
        }
        case "publish": {
          if (!round || round.state !== "closed") {
            return res.status(409).json({ message: "Close the round before publishing results" });
          }
          await workshopStore.updateRound(round.id, { state: "published" });
          await workshopStore.updateSession(session.id, { resultsVisible: true });
          break;
        }
        case "hide": {
          if (!round || round.state !== "published") {
            return res.status(409).json({ message: "Nothing is published for this round" });
          }
          await workshopStore.updateRound(round.id, { state: "closed" });
          await workshopStore.updateSession(session.id, { resultsVisible: false });
          break;
        }
        case "advance": {
          if (session.activeRound >= WORKSHOP_ROUND_COUNT) {
            return res.status(409).json({ message: "This is the final round" });
          }
          await workshopStore.updateSession(session.id, {
            activeRound: session.activeRound + 1,
            resultsVisible: false,
          });
          break;
        }
        case "reopen": {
          if (!parsed.data.teamId) return res.status(400).json({ message: "Name the table to reopen" });
          if (!round) return res.status(409).json({ message: "No active round" });
          if (round.state === "published") {
            return res.status(409).json({ message: "Hide the results before reopening a table" });
          }
          const team = await workshopStore.getTeam(parsed.data.teamId);
          if (!team || team.sessionId !== session.id) {
            return res.status(404).json({ message: "No such table in this session" });
          }
          const decision = await workshopStore.getDecision(team.id, round.id);
          if (!decision) return res.status(409).json({ message: "That table has nothing locked" });
          await workshopStore.upsertDecision(session.id, team.id, round.id, { isLocked: false, lockedAt: null });
          break;
        }
        case "select": {
          if (!parsed.data.decisionId) return res.status(400).json({ message: "Name the response to select" });
          if (!round) return res.status(409).json({ message: "No active round" });
          const decisions = await workshopStore.listDecisions(session.id);
          const decision = decisions.find(
            (entry) => entry.id === parsed.data.decisionId && entry.roundId === round.id,
          );
          if (!decision) return res.status(404).json({ message: "No such response in this round" });

          const selected = parsed.data.selected ?? !decision.selectedForDisplay;
          const alreadySelected = decisions.filter(
            (entry) => entry.roundId === round.id && entry.selectedForDisplay && entry.id !== decision.id,
          );
          if (selected && alreadySelected.length >= MAX_SELECTED_RATIONALES) {
            return res
              .status(409)
              .json({ message: `Deselect one first: at most ${MAX_SELECTED_RATIONALES} rationales are projected` });
          }
          await workshopStore.upsertDecision(session.id, decision.teamId, round.id, {
            selectedForDisplay: selected,
            displayOrder: selected ? alreadySelected.length + 1 : null,
          });
          break;
        }
        case "end": {
          await workshopStore.updateSession(session.id, { status: "ended", endedAt: new Date(), resultsVisible: false });
          break;
        }
        case "reset": {
          await workshopStore.clearDecisions(session.id);
          for (const entry of rounds) {
            await workshopStore.updateRound(entry.id, { state: "pending", openedAt: null, closedAt: null });
          }
          await workshopStore.updateSession(session.id, { activeRound: 1, resultsVisible: false, status: "live" });
          break;
        }
        default:
          return res.status(400).json({ message: "Unknown action" });
      }

      await workshopStore.recordEvent({
        sessionId: session.id,
        actorType: "facilitator",
        eventType: `session.${action}`,
        payload: { round: session.activeRound, teamId: parsed.data.teamId, decisionId: parsed.data.decisionId },
      });

      const updated = await workshopStore.getSessionById(session.id);
      res.json({ ok: true, revision: updated?.revision ?? session.revision });
    } catch (error) {
      console.error(`[workshop] action ${action} failed:`, error);
      res.status(500).json({ message: "That control did not apply. The room can continue on paper." });
    }
  });

  // --- Facilitator: export -------------------------------------------------
  app.get("/api/workshops/:id/export", async (req: Request, res: Response) => {
    if (!requireFacilitator(req, res)) return;

    const session = await workshopStore.getSessionById(String(req.params.id));
    if (!session) return res.status(404).json({ message: "No such session" });

    const [teams, rounds, decisions] = await Promise.all([
      workshopStore.listTeams(session.id),
      workshopStore.listRounds(session.id),
      workshopStore.listDecisions(session.id),
    ]);
    const roundsById = new Map(rounds.map((round) => [round.id, round]));
    const teamsById = new Map(teams.map((team) => [team.id, team]));

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="decision-room-${session.joinCode}.json"`);
    res.send(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          session: {
            name: session.name,
            variant: session.variant,
            joinCode: session.joinCode,
            createdAt: session.createdAt,
            endedAt: session.endedAt,
          },
          note: "Table labels only. No participant names, emails or scores are collected.",
          rounds: rounds.map((round) => ({ roundNumber: round.roundNumber, state: round.state })),
          decisions: decisions.map((decision) => ({
            round: roundsById.get(decision.roundId)?.roundNumber ?? null,
            table: teamsById.get(decision.teamId)?.displayName ?? null,
            optionKey: decision.optionKey,
            ownAction: decision.ownAction,
            confidence: decision.confidence,
            rationale: decision.rationale,
            locked: decision.isLocked,
          })),
        },
        null,
        2,
      ),
    );
  });
}
