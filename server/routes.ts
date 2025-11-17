
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, storageKind } from "./storage/index.js";
import { createDatabaseFeedbackStorage, createJSONFeedbackStorage } from "./storage/feedback.js";
import { db, hasDatabase, warmupDatabase, withRetry } from "./db.js";
import { log } from "./logging.js";
import { setupWebSocket, broadcastScoreUpdate, broadcastRingEntry, broadcastRingExit, broadcastRaffleQualified, broadcastRaffleWinner, getLatestRaffleWinnerBroadcast } from "./ws.js";
import { chatWithAssistant, evaluateSolution, categorizeProposal } from "./openai.js";
import {
  acceptTncSchema,
  startSessionSchema,
  chatSchema,
  submitSolutionSchema,
  submissions,
  participants,
  users,
  chatSessions,
  attempts,
} from "../shared/schema.js";
import { createHash } from "crypto";
import path from "path";
import { z } from "zod";
import archiver from "archiver";
import { eq, and, gte, lte, sql } from 'drizzle-orm';

/**
 * Get the current date in Melbourne timezone (Australia/Melbourne) as YYYY-MM-DD string.
 * This ensures daily resets happen at midnight Melbourne time, not UTC.
 */
function getMelbourneDate(date: Date = new Date()): string {
  // Convert to Melbourne timezone using Intl.DateTimeFormat
  const melbourneTime = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

  // Format is DD/MM/YYYY, convert to YYYY-MM-DD
  const [day, month, year] = melbourneTime.split('/');
  return `${year}-${month}-${day}`;
}

log(
  `Using ${storageKind} storage backend${storageKind === "memory" ? " (no database connection string configured)" : ""}`,
);

// Initialize feedback storage (DB or JSON fallback)
const feedbackStorage = hasDatabase && db
  ? createDatabaseFeedbackStorage(db)
  : createJSONFeedbackStorage();
const feedbackStorageKind = hasDatabase ? "database" : "json";
log(`Using ${feedbackStorageKind} storage for feedback`);

const DEFAULT_ADMIN_KEY = "cisco-live-melbourne-2025";
const ADMIN_KEY = process.env.ADMIN_KEY || DEFAULT_ADMIN_KEY;

function extractAdminKey(req: Request): string {
  const header = req.headers["x-admin-key"];
  if (Array.isArray(header)) {
    return header[0] ?? "";
  }
  return header ?? "";
}

function ensureAdminAccess(req: Request, res: Response): boolean {
  const providedKey = extractAdminKey(req);

  if (!providedKey || providedKey !== ADMIN_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }

  return true;
}

// Rate limiting map (sessionToken -> last submission timestamp)
const rateLimits = new Map<string, number>();

const CATEGORIES = [
  { key: "NETWORKING", name: "Networking", description: "Network infrastructure, switches, routers, SD-WAN, wireless networking, network automation, bandwidth optimization, network performance, Catalyst, Meraki, network segmentation, QoS" },
  { key: "SECURITY", name: "Security", description: "Cybersecurity, firewalls, threat detection, identity management, zero trust, SASE, Secure Access Service Edge, security operations, compliance, endpoint protection, vulnerability management, Duo, Umbrella, SecureX, hypershield, SSE, Secure Service Edge" },
  { key: "COLLABORATION", name: "Collaboration", description: "Team collaboration, unified communications, video conferencing, contact center, Webex, customer experience, customer service, messaging platforms, voice services, meeting solutions, hybrid work enablement" },
  { key: "DATA_CENTER", name: "Cloud & AI", description: "Data centre infrastructure, cloud integration, virtualization, compute resources, storage systems, hyperconverged infrastructure, hybrid cloud solutions, UCS, HyperFlex, ACI, infrastructure automation, capacity planning, virtualisation, datacenter, datacentre" },
];

const startTriviaAttemptSchema = z.object({
  category: z.string(),
  mode: z.enum(["dojo", "ring"]),
  email: z.string().email().optional(),
  marketingOptIn: z.boolean().optional(),
  playerProfile: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      company: z.string().optional(),
      role: z.string().optional(),
    })
    .optional(),
});

const completeTriviaAttemptSchema = z.object({
  attemptId: z.string(),
  answers: z
    .array(
      z.object({
        itemId: z.string(),
        choiceIndex: z.number(),
        elapsedMs: z.number().min(0).max(60_000),
      }),
    )
    .min(1),
});

const submitFeedbackSchema = z.object({
  category: z.enum([
    "ui-ux",
    "gameplay",
    "trivia",
    "technical",
    "feature-request",
    "other",
  ]),
  rating: z.number().min(1).max(5),
  message: z.string().min(10).max(1000),
  page: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  emailHash: z.string().optional(),
  sessionToken: z.string().optional(),
});

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

type MetricValueKey = "value" | "target";
type MetricEntry<K extends MetricValueKey> = { name: string } & Record<K, string>;

function parsePossibleJson(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

function ensureStringArray(value: unknown): string[] {
  const parsed = parsePossibleJson(value);

  if (Array.isArray(parsed)) {
    return parsed
      .flat()
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }
        if (typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }
        return "";
      })
      .filter((item): item is string => item.length > 0);
  }

  if (typeof parsed === "string" || typeof parsed === "number" || typeof parsed === "boolean") {
    const text = String(parsed).trim();
    return text ? [text] : [];
  }

  return [];
}

function ensureMetricArray<K extends MetricValueKey>(
  value: unknown,
  key: K,
): MetricEntry<K>[] {
  const parsed = parsePossibleJson(value);

  const normalize = (input: unknown): MetricEntry<K> | null => {
    if (input == null) {
      return null;
    }

    if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
      const text = String(input).trim();
      if (!text) {
        return null;
      }
      return { name: text, [key]: text } as MetricEntry<K>;
    }

    if (typeof input === "object" && !Array.isArray(input)) {
      const record = input as Record<string, unknown>;
      const name = record.name != null ? String(record.name).trim() : "";
      const metricValue = record[key] != null ? String(record[key]).trim() : "";

      if (!name && !metricValue) {
        return null;
      }

      return {
        name,
        [key]: metricValue,
      } as MetricEntry<K>;
    }

    return null;
  };

  if (Array.isArray(parsed)) {
    const result: MetricEntry<K>[] = [];
    const flattened = parsed.flat(Infinity) as unknown[];
    for (const item of flattened) {
      const normalized = normalize(item);
      if (normalized) {
        result.push(normalized);
      }
    }
    return result;
  }

  const single = normalize(parsed);
  return single ? [single] : [];
}

export interface RegisterRoutesOptions {
  server?: Server | null;
  enableWebSocket?: boolean;
}

export async function registerRoutes(
  app: Express,
  options: RegisterRoutesOptions = {},
): Promise<Server | null> {
  const { server = null, enableWebSocket = true } = options;
  const httpServer = server ?? (enableWebSocket ? createServer(app) : null);

  log(`[Routes] Registering routes - enableWebSocket: ${enableWebSocket}, httpServer: ${!!httpServer}`);

  if (enableWebSocket && httpServer) {
    log('[Routes] Setting up WebSocket server...');
    setupWebSocket(httpServer);
  } else {
    log('[Routes] Skipping WebSocket setup');
  }

  // Warm up database connection on startup to prevent cold start issues
  if (hasDatabase) {
    log("[db] Warming up database connection...");
    const warmedUp = await warmupDatabase();
    if (!warmedUp) {
      log("[db] Warning: Database warmup failed, may experience connection issues");
    }
  }

  // Serve static files
  app.use('/static', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'static', req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        next();
      }
    });
  });

  // Public routes
  app.post("/api/accept-tnc", async (req, res) => {
    try {
      const { accepted } = acceptTncSchema.parse(req.body);
      res.json({ success: accepted });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/start", async (req, res) => {
    try {
      const { firstName, lastName, email } = startSessionSchema.parse(req.body);

      const participant = await storage.createParticipant({ firstName, lastName });

      let emailHash: string | undefined;

      // If email provided, create/lookup user and hash email
      if (email) {
        const user = await storage.ensureUser({
          email,
          firstName,
          lastName,
        });
        emailHash = user.emailHash;
      }

      const session = await storage.createChatSession({
        participantId: participant.id,
        emailHash,
      });

      res.json({
        participantId: participant.id,
        sessionToken: session.token,
        emailHash
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get("/api/categories", (req, res) => {
    res.json(CATEGORIES);
  });

  app.get("/api/trivia/categories", async (req, res) => {
    try {
      const categories = await storage.getTriviaCategories();
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trivia categories" });
    }
  });

  app.get("/api/trivia/practice", async (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const deckSizeParam = typeof req.query.deckSize === "string" ? Number.parseInt(req.query.deckSize, 10) : undefined;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    try {
      const { cards } = await storage.getPracticeTriviaDeck(category, Number.isFinite(deckSizeParam) ? deckSizeParam : undefined);
      res.json({ cards });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch practice trivia deck";
      res.status(400).json({ message });
    }
  });

  app.post("/api/trivia/attempts", async (req, res) => {
    try {
      // Validate request payload first
      const payload = startTriviaAttemptSchema.parse(req.body);
      if (payload.mode === "ring" && !payload.email) {
        return res.status(400).json({ message: "Email is required for ring attempts" });
      }

      // Wrap database operations in retry logic
      const result = await withRetry(async () => {
        // Check for existing raffle entry for this email + category + day
        if (payload.email && payload.mode === "ring") {
          const emailHash = hashEmail(payload.email);
          const today = getMelbourneDate();

          // Check if storage method exists before calling
          if (storage.checkExistingRaffleEntry) {
            const hasRaffleEntry = await storage.checkExistingRaffleEntry(
              emailHash,
              payload.category,
              today
            );

            if (hasRaffleEntry) {
              // Throw a special error that we'll catch and handle with 409
              const err = new Error("You have already completed your run for this category today. Please select a different technology track if available.");
              (err as any).code = 'ALREADY_SUBMITTED';
              throw err;
            }
          }
        }

        const playerProfile = payload.playerProfile
          ? {
              firstName: payload.playerProfile.firstName ?? null,
              lastName: payload.playerProfile.lastName ?? null,
              company: payload.playerProfile.company ?? null,
              role: payload.playerProfile.role ?? null,
            }
          : undefined;

        const { attempt, cards } = await storage.startTriviaAttempt({
          ...payload,
          playerProfile,
        });

        log(`[Trivia] Created attempt ${attempt.id} for category ${attempt.category} in ${payload.mode} mode`);

        // Broadcast ring entry if it's a ring mode attempt
        if (payload.mode === "ring" && playerProfile) {
          const firstName = playerProfile.firstName || '';
          const lastInitial = playerProfile.lastName?.[0]?.toUpperCase() || '';
          const displayName = `${firstName} ${lastInitial}`.trim() + (lastInitial ? '.' : '');
          log(`[Trivia] Broadcasting ring entry for attempt ${attempt.id} with name ${displayName}`);
          broadcastRingEntry({
            attemptId: attempt.id,
            initials: displayName,
            category: attempt.category
          });
        } else {
          log(`[Trivia] Skipping ring entry broadcast: mode=${payload.mode}, hasPlayerProfile=${!!playerProfile}`);
        }

        return {
          attemptId: attempt.id,
          category: attempt.category,
          mode: attempt.mode,
          cards,
        };
      }, 3, "start trivia attempt");

      res.json(result);
    } catch (error: any) {
      // Handle validation errors (from zod)
      if (error instanceof z.ZodError) {
        log(`[Trivia] Validation error starting trivia attempt: ${error.message}`);
        return res.status(400).json({ message: "Invalid request data" });
      }

      // Handle duplicate submission
      if (error?.code === 'ALREADY_SUBMITTED') {
        log(`[Trivia] Duplicate submission attempt: ${error.message}`);
        return res.status(409).json({
          message: error.message,
          alreadySubmitted: true
        });
      }

      // Log database errors with more detail
      const message = error instanceof Error ? error.message : "Failed to start trivia attempt";
      const errorDetails = {
        message: message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
      };

      console.error('[Trivia] Error starting trivia attempt:', errorDetails);
      log(`[Trivia] Error starting trivia attempt: ${message}`);

      // Return 503 for database connectivity issues, 500 for other errors
      const isConnectivityError =
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout');

      if (isConnectivityError) {
        return res.status(503).json({
          message: "Database temporarily unavailable, please try again",
          retryable: true
        });
      }

      // Return error message in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development'
        ? message
        : "Failed to start trivia attempt";

      res.status(500).json({ message: errorMessage });
    }
  });

  app.post("/api/trivia/attempts/:attemptId/complete", async (req, res) => {
    try {
      const payload = completeTriviaAttemptSchema.parse({
        attemptId: req.params.attemptId,
        answers: req.body.answers,
      });

      const result = await storage.completeTriviaAttempt(payload);

      // Broadcast ring exit immediately after trivia completion
      // Everyone who completes trivia moves to Pitch stage (qualified: true)
      // Pass/fail only matters at the end when comparing combined score to bot bar
      broadcastRingExit({
        attemptId: result.attempt.id,
        qualified: true // Always move to Pitch after completing trivia
      });

      res.json({
        attemptId: result.attempt.id,
        totalScore: result.totalScore,
        passed: result.attempt.passed,
        eligible: result.attempt.eligible,
        avgCorrectTimeMs: result.attempt.avgCorrectTimeMs,
        summary: result.summary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete trivia attempt";
      res.status(400).json({ message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { sessionToken, messages, sprintStep, category } = chatSchema.parse(req.body);
      const session = await storage.getChatSession(sessionToken);

      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const updatedMessages = [...(session.messages ?? []), ...messages];

      // Pass sprintStep to AI for context-aware responses
      const response = await chatWithAssistant(
        updatedMessages,
        sprintStep,
        category ?? session.category ?? undefined
      );

      // Add assistant response to session
      updatedMessages.push({ role: "assistant", content: response });

      await storage.updateChatSession(sessionToken, { messages: updatedMessages });

      res.json({ content: response });
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat: " + (error as Error).message });
    }
  });

  app.post("/api/submit", async (req, res) => {
    try {
      const now = Date.now();

      // Pre-process structuredFields to fix array fields before validation
      if (req.body.structuredFields) {
        if (typeof req.body.structuredFields === "string") {
          try {
            req.body.structuredFields = JSON.parse(req.body.structuredFields);
          } catch {
            // Leave as-is and let schema validation surface a helpful error message
          }
        }

        if (req.body.structuredFields && typeof req.body.structuredFields === "object") {
          const structured = req.body.structuredFields as Record<string, unknown>;

          const stringFields = ["problem_summary", "impact_summary", "chosen_category"] as const;
          for (const field of stringFields) {
            const value = structured[field];
            if (value == null) {
              continue;
            }

            if (typeof value === "string") {
              structured[field] = value.trim();
              continue;
            }

            if (typeof value === "number" || typeof value === "boolean") {
              structured[field] = String(value);
              continue;
            }

            try {
              structured[field] = JSON.stringify(value);
            } catch {
              structured[field] = String(value);
            }
          }

          structured["baseline_metrics"] = ensureMetricArray(structured["baseline_metrics"], "value");
          structured["target_metrics"] = ensureMetricArray(structured["target_metrics"], "target");

          const arrayFields = ["action_plan", "success_checks", "risks"] as const;
          for (const field of arrayFields) {
            structured[field] = ensureStringArray(structured[field]);
          }
        }
      }

      const { sessionToken, solutionText, structuredFields, triviaAttemptId } = submitSolutionSchema.parse(req.body);
      const session = await storage.getChatSession(sessionToken);

      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Rate limiting: 60 second cooldown per session
      const lastSubmission = rateLimits.get(sessionToken);
      if (lastSubmission && now - lastSubmission < 60000) {
        return res.status(429).json({ message: "Please wait before submitting again" });
      }

      // Get participant
      const participant = await storage.getParticipant(session.participantId);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }

      // Prepare structured submission for evaluation
      let structuredSubmission = structuredFields;
      const conversation = session.messages ?? [];

      if (!structuredSubmission) {
        // Extract from chat messages if not provided
        const lastMessage = conversation[conversation.length - 1];
        if (!lastMessage) {
          return res.status(400).json({ message: "No structured solution provided" });
        }
        try {
          structuredSubmission = JSON.parse(lastMessage.content);
        } catch {
          return res.status(400).json({ message: "No structured solution provided" });
        }
      }

      // Check if structuredSubmission exists
      if (!structuredSubmission) {
        return res.status(400).json({ message: "No structured solution available" });
      }

      const persistedTriviaAttemptId = session.triviaAttemptId ?? triviaAttemptId ?? null;

      console.log('[express] Trivia attempt ID resolution:', {
        sessionTriviaAttemptId: session.triviaAttemptId,
        requestTriviaAttemptId: triviaAttemptId,
        persistedTriviaAttemptId,
      });

      // Retrieve trivia attempt if linked (we'll reuse this later)
      let triviaAttempt = null;
      if (persistedTriviaAttemptId && storage.getTriviaAttempt) {
        triviaAttempt = await storage.getTriviaAttempt(persistedTriviaAttemptId);
        console.log('[express] Retrieved trivia attempt:', {
          attemptId: persistedTriviaAttemptId,
          found: !!triviaAttempt,
          totalScore: triviaAttempt?.totalScore,
          triviaScore: triviaAttempt?.triviaScore,
          endedAt: triviaAttempt?.endedAt,
          passed: triviaAttempt?.passed,
        });
      } else {
        console.log('[express] Skipping trivia attempt retrieval:', {
          persistedTriviaAttemptId,
          hasGetTriviaAttempt: !!storage.getTriviaAttempt,
        });
      }

      // Determine category: prioritize trivia attempt category, then session category, then auto-categorize
      let category: string;
      if (triviaAttempt && triviaAttempt.category) {
        // If this submission is linked to a trivia attempt, use the trivia attempt's category
        category = triviaAttempt.category;
        console.log('[express] Using category from trivia attempt:', category);
      } else if (session.category) {
        // Use session category if available
        category = session.category;
        console.log('[express] Using session category:', category);
      } else {
        // Otherwise auto-categorize
        category = await categorizeProposal(
          structuredSubmission.problem_summary,
          conversation.map(m => m.content).join(" "),
          JSON.stringify(structuredSubmission)
        );
        console.log('[express] Auto-categorized submission:', category);
      }

      // Evaluate solution (pass category for Technology Fit scoring)
      console.log('[express] Evaluating solution with structured data:', JSON.stringify(structuredSubmission, null, 2));
      const evaluation = await evaluateSolution(
        structuredSubmission.problem_summary,
        conversation.map(m => m.content).join(" "),
        JSON.stringify(structuredSubmission),
        category
      );
      console.log('[express] Evaluation result:', JSON.stringify(evaluation, null, 2));

      // Create submission with evaluation notes (pitch score only, 0-40 points)
      const pitchScore = evaluation.total;
      const submission = await storage.createSubmission({
        participantId: session.participantId,
        category,
        solutionText,
        structuredJson: JSON.stringify(structuredSubmission),
        subScores: JSON.stringify(evaluation.subscores),
        totalScore: pitchScore,
        evaluationNotes: evaluation.notes_short,
        announcedOnLeaderboard: false, // Will be set to true when user clicks "DISMISS" on results page
      });
      log(`[submit] ✅ Submission created: ${submission.id} | announcedOnLeaderboard: false | Participant: ${session.participantId}`);

      // Calculate combined score and handle raffle eligibility
      let triviaScore = 0;
      let combinedScore = pitchScore; // Default to pitch only
      let botBar: number | null = null;
      let isEligible = false;
      let raffleResult: { success: boolean; alreadyExists?: boolean } | null = null;

      // Get today's date in Melbourne timezone (needed for leaderboard filtering)
      const today = getMelbourneDate();

      if (persistedTriviaAttemptId) {
        try {
          // Use the trivia attempt we retrieved earlier
          if (triviaAttempt) {
            // Check if the trivia attempt has been completed
            if (triviaAttempt.totalScore !== null && triviaAttempt.totalScore !== undefined) {
              triviaScore = triviaAttempt.totalScore;
              combinedScore = triviaScore + pitchScore;
              console.log('[express] Using trivia score in combined calculation:', {
                triviaScore,
                pitchScore,
                combinedScore,
              });
            } else {
              console.warn('[express] Trivia attempt found but not completed (totalScore is null):', {
                attemptId: persistedTriviaAttemptId,
                endedAt: triviaAttempt.endedAt,
                triviaScore: triviaAttempt.triviaScore,
                totalScore: triviaAttempt.totalScore,
              });
              // Trivia not completed - use pitch score only
              triviaScore = 0;
              combinedScore = pitchScore;
            }

            // Calculate bot bar for this category and today (Melbourne timezone)
            // IMPORTANT: Calculate BEFORE attaching the current submission so the bot bar
            // represents the threshold from previous submissions only
            botBar = await storage.calculateBotBar(category, today);

            // Attach submission to trivia attempt
            await storage.attachSubmissionToTriviaAttempt(persistedTriviaAttemptId, submission.id);

            // Check eligibility: combined score >= bot bar
            // CRITICAL: This is the ONLY criterion for raffle qualification
            isEligible = combinedScore >= botBar;

            // Safety validation: ensure no legacy 24-point rule is interfering
            if (isEligible && triviaScore !== null && triviaScore < 24) {
              console.log('[express] ✅ User qualified with low trivia score:', {
                triviaScore,
                pitchScore,
                combinedScore,
                botBar,
                note: 'Legacy 24-point rule NOT blocking qualification'
              });
            }

            // Detailed logging for failures to help debug
            if (!isEligible) {
              console.warn('[express] ⚠️ User did NOT qualify for raffle:', {
                triviaScore,
                pitchScore,
                combinedScore,
                botBar,
                difference: botBar - combinedScore,
                category,
                date: today,
                attemptId: persistedTriviaAttemptId
              });
            }

            // Update attempt with bot bar and eligibility
            if (typeof (storage as any).updateTriviaAttemptBotBar === "function") {
              await (storage as any).updateTriviaAttemptBotBar(
                persistedTriviaAttemptId,
                botBar,
                isEligible,
                combinedScore,
              );
            }

            if (triviaAttempt.mode === 'ring' && session.emailHash) {
              // Only create raffle entry if eligible and in ring mode with email
              if (isEligible) {
                raffleResult = await storage.createRaffleEntry({
                  emailHash: session.emailHash,
                  category,
                  attemptId: persistedTriviaAttemptId,
                  raffleDate: today,
                });
              }
            }

            console.log('[express] Combined scoring:', {
              triviaScore,
              pitchScore,
              combinedScore,
              botBar,
              isEligible,
              raffleCreated: raffleResult?.success,
              alreadyEntered: raffleResult?.alreadyExists
            });
          } else {
            console.warn('[express] Trivia attempt not found in database:', {
              attemptId: persistedTriviaAttemptId,
              message: 'This means the trivia was never completed or the attempt ID is incorrect',
            });
          }
        } catch (error) {
          console.error(
            `[trivia] Failed to process trivia attempt ${persistedTriviaAttemptId}:`,
            {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              attemptId: persistedTriviaAttemptId,
              triviaAttemptExists: !!triviaAttempt,
              triviaAttemptTotalScore: triviaAttempt?.totalScore,
            }
          );
          // On error, ensure we don't lose the combined score calculation
          // The score remains as it was set before the error occurred
        }
      }

      if (typeof (storage as any).updateSubmissionTotalScore === "function") {
        await (storage as any).updateSubmissionTotalScore(submission.id, combinedScore);
      }

      // Get current leaderboard to calculate rank (based on combined score)
      // Include unannounced submissions for accurate rank calculation
      // Filter by today's date (Melbourne time) to show daily rank
      const leaderboard = await storage.getLeaderboard(1000, undefined, today, true);
      const targetRank = leaderboard.findIndex(entry => entry.totalScore <= combinedScore) + 1;

      // Broadcast ring exit if this was a ring attempt
      // After pitch submission, remove from active ring (qualified: false removes from all lists)
      if (persistedTriviaAttemptId) {
        broadcastRingExit({
          attemptId: persistedTriviaAttemptId,
          qualified: false // Remove from active ring after submission
        });

        // Broadcast raffle qualification announcement (only if they qualified)
        if (isEligible) {
          broadcastRaffleQualified({
            category
          });
        }
      }

      // DO NOT broadcast WebSocket update here - it will be broadcast when user clicks "DISMISS"
      // on the results page, via the /api/submission/:id/announce endpoint
      // broadcastScoreUpdate({
      //   id: submission.id,
      //   name: `${participant.firstName} ${participant.lastName.charAt(0)}.`,
      //   category,
      //   targetRank: targetRank || leaderboard.length + 1,
      //   finalScore: combinedScore,
      //   totalScore: combinedScore,
      //   pitchScore,
      //   triviaScore,
      //   botBar,
      //   isEligible,
      // });

      await storage.updateChatSession(sessionToken, {
        category,
        triviaAttemptId: persistedTriviaAttemptId,
      });

      // Update rate limit
      rateLimits.set(sessionToken, now);

      const responseData = {
        submissionId: submission.id, // Include the real submission ID for announcement
        triviaScore,
        pitchScore,
        finalScore: combinedScore,
        subscores: evaluation.subscores,
        evaluationNotes: evaluation.notes_short,
        rank: targetRank || leaderboard.length + 1,
        category,
        botBar,
        isEligible,
        raffleEntered: raffleResult?.success || false,
        alreadyEntered: raffleResult?.alreadyExists || false,
        leaderboardUrl: "/leaderboard"
      };

      console.log('[express] Sending submission response:', {
        triviaScore: responseData.triviaScore,
        pitchScore: responseData.pitchScore,
        finalScore: responseData.finalScore,
        rank: responseData.rank,
        botBar: responseData.botBar,
        isEligible: responseData.isEligible,
      });

      res.json(responseData);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit solution: " + (error as Error).message });
    }
  });

  app.post("/api/submission/:id/announce", async (req, res) => {
    try {
      const { id } = req.params;
      log(`[announce] 🎯 Announcement request received for submission: ${id}`);

      // Get the submission details
      const submission = await storage.getSubmission(id);
      if (!submission) {
        log(`[announce] ❌ Submission not found: ${id}`);
        return res.status(404).json({ message: "Submission not found" });
      }

      log(`[announce] Submission details:`, {
        id: submission.id,
        totalScore: submission.totalScore,
        combinedScore: submission.combinedScore,
        pitchScore: submission.pitchScore,
        triviaScore: submission.triviaScore,
        category: submission.category,
        createdAt: submission.createdAt,
        announcedOnLeaderboard: submission.announcedOnLeaderboard
      });

      // SAFETY CHECK: Prevent duplicate announcements
      if (submission.announcedOnLeaderboard) {
        log(`[announce] ⚠️  Submission ${id} has already been announced - skipping duplicate`);
        return res.json({ success: true, alreadyAnnounced: true });
      }

      // Get participant details
      const participant = await storage.getParticipant(submission.participantId);
      if (!participant) {
        log(`[announce] ❌ Participant not found for submission: ${id}`);
        return res.status(404).json({ message: "Participant not found" });
      }

      // Get trivia attempt to retrieve botBar and isEligible
      let botBar: number | null = null;
      let isEligible = false;
      const triviaAttempts = await storage.getTriviaAttemptsByParticipant(submission.participantId);
      const triviaAttempt = triviaAttempts.find((attempt: any) => attempt.submissionId === id);

      if (triviaAttempt) {
        botBar = triviaAttempt.botBar ?? null;
        isEligible = triviaAttempt.eligible ?? false;
      }

      // Get today's date in Melbourne timezone
      const today = getMelbourneDate();

      // Calculate rank
      const leaderboard = await storage.getLeaderboard(1000, undefined, today, true);
      const targetRank = leaderboard.findIndex(entry => entry.totalScore <= submission.totalScore) + 1;

      // Mark submission as announced
      await storage.markSubmissionAsAnnounced(id);
      log(`[announce] ✅ Submission ${id} marked as announced in database`);

      // Only broadcast if user beat the bot (to avoid embarrassing low scores)
      if (isEligible) {
        log(`[announce] 📊 Announcing submission: ${id} | Participant: ${participant.firstName} ${participant.lastName.charAt(0)}. | Score: ${submission.totalScore} | Rank: ${targetRank} | Beat bot ✅`);

        // Broadcast WebSocket update to leaderboard
        broadcastScoreUpdate({
          id: submission.id,
          name: `${participant.firstName} ${participant.lastName.charAt(0)}.`,
          category: submission.category,
          targetRank: targetRank || leaderboard.length + 1,
          finalScore: submission.totalScore,
          totalScore: submission.totalScore,
          pitchScore: submission.pitchScore ?? null,
          triviaScore: submission.triviaScore ?? null,
          botBar,
          isEligible,
        });
        log(`[announce] 📡 WebSocket broadcast sent for submission: ${id}`);
      } else {
        log(`[announce] 🤫 Silently adding to leaderboard: ${id} | Participant: ${participant.firstName} ${participant.lastName.charAt(0)}. | Score: ${submission.totalScore} | Did not beat bot (${botBar}) - no announcement`);
      }

      res.json({ success: true });
    } catch (error) {
      log(`[announce] ❌ Failed to announce submission: ${error}`);
      console.error('[express] Failed to announce submission:', error);
      res.status(500).json({ message: "Failed to announce submission: " + (error as Error).message });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const category = req.query.category as string | undefined;
      // Default to today's date in Melbourne timezone, or use the provided date
      const filterDate = req.query.date as string | undefined || getMelbourneDate();
      const leaderboard = await storage.getLeaderboard(limit, category, filterDate);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // New dashboard data endpoint
  app.get("/api/dashboard-data", async (req, res) => {
    try {
      log("[dashboard-data] Starting to fetch dashboard data");

      // Default to today's date in Melbourne timezone, or use the provided date
      const filterDate = req.query.date as string | undefined || getMelbourneDate();

      // Fetch data with individual error handling to identify which call fails
      let leaderboard, wordCloud, categoryStats, recentSubmission, data3Stats, activeChallengers;

      try {
        log("[dashboard-data] Fetching leaderboard");
        leaderboard = await storage.getLeaderboard(10, undefined, filterDate);
      } catch (error) {
        log(`[dashboard-data] Error fetching leaderboard: ${error}`);
        throw new Error(`Failed to fetch leaderboard: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        log("[dashboard-data] Fetching word cloud");
        wordCloud = await storage.getWordCloudData();
      } catch (error) {
        log(`[dashboard-data] Error fetching word cloud: ${error}`);
        throw new Error(`Failed to fetch word cloud: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        log("[dashboard-data] Fetching category stats");
        categoryStats = await storage.getCategoryStats(filterDate);
      } catch (error) {
        log(`[dashboard-data] Error fetching category stats: ${error}`);
        throw new Error(`Failed to fetch category stats: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        log("[dashboard-data] Fetching recent submission");
        recentSubmission = await storage.getRecentSubmission();
      } catch (error) {
        log(`[dashboard-data] Error fetching recent submission: ${error}`);
        throw new Error(`Failed to fetch recent submission: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        log("[dashboard-data] Fetching data3 stats");
        data3Stats = await storage.getData3Stats();
      } catch (error) {
        log(`[dashboard-data] Error fetching data3 stats: ${error}`);
        throw new Error(`Failed to fetch data3 stats: ${error instanceof Error ? error.message : String(error)}`);
      }

      let triviaChallengers, projectPitchChallengers;
      try {
        log("[dashboard-data] Fetching active challengers by stage");
        const challengersByStage = await storage.getActiveRingAttemptsByStage();
        triviaChallengers = challengersByStage.triviaChallengers;
        projectPitchChallengers = challengersByStage.projectPitchChallengers;
        // Keep backwards compatibility
        activeChallengers = await storage.getActiveRingAttempts();
      } catch (error) {
        log(`[dashboard-data] Error fetching active challengers: ${error}`);
        throw new Error(`Failed to fetch active challengers: ${error instanceof Error ? error.message : String(error)}`);
      }

      let topCategory;
      try {
        log("[dashboard-data] Fetching top category");
        topCategory = await storage.getTopProblemCategory();
      } catch (error) {
        log(`[dashboard-data] Error fetching top category: ${error}`);
        throw new Error(`Failed to fetch top category: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Use recent submission's category for stats if available, otherwise use top category
      const categoryForStats = recentSubmission?.category || topCategory;

      let topCategoryData3Stats;
      try {
        log(`[dashboard-data] Fetching top category data3 stats for category: ${categoryForStats}`);
        topCategoryData3Stats = await storage.getData3Stats(
          categoryForStats === "SECURE_CONNECTIVITY" ? "SECURE_CONNECTIVITY" :
          categoryForStats === "HYBRID_DC" ? "HYBRID_DC" :
          categoryForStats === "OBSERVABILITY" ? "OBSERVABILITY" :
          categoryForStats === "COLLAB_CX" ? "COLLAB_CX" :
          categoryForStats === "EDGE_IOT" ? "EDGE_IOT" :
          "GENERAL" // Default to GENERAL instead of EXPERTISE
        );
      } catch (error) {
        log(`[dashboard-data] Error fetching top category data3 stats: ${error}`);
        throw new Error(`Failed to fetch top category data3 stats: ${error instanceof Error ? error.message : String(error)}`);
      }

      log("[dashboard-data] Successfully fetched all dashboard data");
      res.json({
        leaderboard,
        wordCloud,
        categoryStats,
        recentSubmission,
        data3Stats,
        topCategoryStats: topCategoryData3Stats,
        topCategory: categoryForStats, // Use the category that matches the stats being shown
        activeChallengers,
        triviaChallengers,
        projectPitchChallengers,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get dashboard data";
      log(`[dashboard-data] Error: ${errorMessage}`);
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  // Public endpoint to get Data#3 stats (read-only)
  app.get("/api/public/stats", async (req, res) => {
    try {
      const stats = await storage.getData3Stats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Public endpoint to get categories (read-only)
  app.get("/api/public/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Admin endpoint to get all Data#3 stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const stats = await storage.getData3Stats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Admin endpoint to update Data#3 stats
  app.post("/api/admin/stats/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { title, value, description, category, displayOrder } = req.body;
      const id = req.params.id;

      await storage.updateData3Stat(id, {
        title,
        value,
        description,
        category,
        displayOrder
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update stat" });
    }
  });

  // Admin endpoint to create new Data#3 stat
  app.post("/api/admin/stats", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { title, value, description, category, displayOrder } = req.body;

      const stat = await storage.createData3Stat({
        title,
        value,
        description,
        category,
        displayOrder
      });

      res.json(stat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create stat" });
    }
  });

  // Admin endpoint to delete Data#3 stat
  app.delete("/api/admin/stats/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      await storage.deleteData3Stat(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete stat" });
    }
  });

  // Admin endpoint to get all categories
  app.get("/api/admin/categories", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Admin endpoint to create new category
  app.post("/api/admin/categories", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { name, displayName, color } = req.body;
      const category = await storage.createCategory({
        name,
        displayName,
        color
      });

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Admin endpoint to update category
  app.put("/api/admin/categories/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { displayName, color } = req.body;
      await storage.updateCategory(req.params.id, {
        displayName,
        color
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Admin endpoint to delete category (reassigns orphaned stats to GENERAL)
  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const result = await storage.deleteCategory(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin endpoint to get full submission details
  app.get("/api/admin/submission/:id", async (req, res) => {
    try {
      const submission = await storage.getSubmissionDetails(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to get submission details" });
    }
  });

  // Admin endpoint to get full leaderboard with details
  app.get("/api/admin/leaderboard", async (req, res) => {
    try {
      // If date=all is passed, don't filter by date
      // Otherwise, default to today's date in Melbourne timezone, or use the provided date
      const dateParam = req.query.date as string | undefined;
      const filterDate = dateParam === 'all' ? undefined : (dateParam || getMelbourneDate());
      const leaderboard = await storage.getDetailedLeaderboard(100, filterDate);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get detailed leaderboard" });
    }
  });

  // Admin endpoint to delete a submission
  app.delete("/api/admin/submission/:id", async (req, res) => {
    try {
      await storage.deleteSubmission(req.params.id);
      res.json({ message: "Submission deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });

  // Leaderboard admin endpoints
  app.get("/api/admin/leaderboard/active-challengers", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const challengers = await storage.getActiveRingAttemptsDetailed();
      res.json(challengers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active challengers" });
    }
  });

  app.delete("/api/admin/leaderboard/active-challenger/:attemptId", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      await storage.forceEndRingAttempt(req.params.attemptId);
      res.json({ message: "Challenger removed successfully" });
    } catch (error) {
      console.error('[remove-challenger] Error:', error);
      res.status(500).json({ message: "Failed to remove challenger", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/admin/leaderboard/clear-stale", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const count = await storage.clearStaleRingAttempts();
      res.json({ message: `Cleared ${count} stale challengers`, count });
    } catch (error) {
      console.error('[clear-stale] Error:', error);
      res.status(500).json({ message: "Failed to clear stale challengers", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/admin/leaderboard/clear-all-active", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const count = await storage.clearAllActiveRingAttempts();
      res.json({ message: `Cleared ${count} active challengers`, count });
    } catch (error) {
      console.error('[clear-all-active] Error:', error);
      res.status(500).json({ message: "Failed to clear all active challengers", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Admin routes
  app.post("/api/admin/reset", async (req, res) => {
    try {
      const adminKey = (req.query.key as string) || "";
      if (!adminKey || adminKey !== ADMIN_KEY) {
        return res.status(403).json({ message: "Invalid admin key" });
      }

      await storage.clearDatabase();
      rateLimits.clear();

      res.json({ message: "Database reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset database" });
    }
  });

  // Beta Admin routes
  app.get("/api/beta-admin/overview", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const data = await storage.getBetaAdminOverview();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to get beta admin overview" });
    }
  });

  app.get("/api/leaderboard/latest-raffle-winner", async (_req, res) => {
    try {
      // Check in-memory cache first (includes manual entries)
      const cachedWinner = getLatestRaffleWinnerBroadcast();

      // Also check database for automatic entries
      const dbWinner = await storage.getLatestRaffleWinner();

      // Determine which winner is more recent
      let winnerToReturn: any = null;

      if (cachedWinner && dbWinner) {
        // Compare announcedAt timestamps
        const cachedTime = new Date(cachedWinner.announcedAt).getTime();
        const dbAnnouncedAtValue = dbWinner.announcedAt as unknown;
        let dbAnnouncedAt: string;
        if (dbAnnouncedAtValue instanceof Date) {
          dbAnnouncedAt = dbAnnouncedAtValue.toISOString();
        } else if (typeof dbAnnouncedAtValue === "string") {
          dbAnnouncedAt = dbAnnouncedAtValue;
        } else {
          dbAnnouncedAt = new Date(dbAnnouncedAtValue as string | number | Date).toISOString();
        }
        const dbTime = new Date(dbAnnouncedAt).getTime();

        // Use the most recent one
        if (cachedTime >= dbTime) {
          winnerToReturn = cachedWinner;
          log(`[latest-raffle-winner] Returning cached winner (more recent): ${cachedWinner.initials}`);
        } else {
          winnerToReturn = dbWinner;
          log(`[latest-raffle-winner] Returning DB winner (more recent): ${dbWinner.firstName} ${dbWinner.lastName}`);
        }
      } else if (cachedWinner) {
        winnerToReturn = cachedWinner;
        log(`[latest-raffle-winner] Returning cached winner (only source): ${cachedWinner.initials}`);
      } else if (dbWinner) {
        winnerToReturn = dbWinner;
        log(`[latest-raffle-winner] Returning DB winner (only source): ${dbWinner.firstName} ${dbWinner.lastName}`);
      }

      if (!winnerToReturn) {
        res.status(204).end();
        return;
      }

      // If it's from cache, it's already formatted
      if (cachedWinner && winnerToReturn === cachedWinner) {
        res.json({
          drawId: cachedWinner.drawId,
          raffleDate: cachedWinner.announcedAt.split('T')[0], // Extract date from timestamp
          announcedAt: cachedWinner.announcedAt,
          initials: cachedWinner.initials,
          totalScore: cachedWinner.totalScore,
          category: cachedWinner.category,
        });
        return;
      }

      // Format DB winner
      const firstName = winnerToReturn.firstName ?? "";
      const lastInitial = winnerToReturn.lastName?.charAt(0)?.toUpperCase() ?? "";
      const formattedInitials = firstName && lastInitial ? `${firstName} ${lastInitial}.` : firstName || "";

      const raffleDateValue = winnerToReturn.raffleDate as unknown;
      let raffleDate: string;
      if (raffleDateValue instanceof Date) {
        raffleDate = raffleDateValue.toISOString().split("T")[0] ?? "";
      } else if (typeof raffleDateValue === "string") {
        raffleDate = raffleDateValue;
      } else {
        raffleDate = new Date(raffleDateValue as string | number | Date).toISOString().split("T")[0] ?? "";
      }

      const announcedAtValue = winnerToReturn.announcedAt as unknown;
      let announcedAt: string;
      if (announcedAtValue instanceof Date) {
        announcedAt = announcedAtValue.toISOString();
      } else if (typeof announcedAtValue === "string") {
        announcedAt = announcedAtValue;
      } else {
        announcedAt = new Date(announcedAtValue as string | number | Date).toISOString();
      }

      res.json({
        drawId: winnerToReturn.drawId,
        raffleDate,
        announcedAt,
        initials: formattedInitials || "WINNER",
        totalScore: Number(winnerToReturn.combinedScore ?? 0),
        category: winnerToReturn.category,
      });
    } catch (error: any) {
      log(`[latest-raffle-winner] Error fetching latest winner: ${error}`);
      res.status(500).json({ message: error.message || "Failed to fetch latest raffle winner" });
    }
  });

  app.get("/api/beta-admin/trivia-items", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const items = await storage.getBetaAdminTriviaItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trivia items" });
    }
  });

  app.post("/api/beta-admin/trivia-items", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { category, stem, choices, correctIndex, dropIndex, hint9s, tags, explanation, active, version } = req.body;

      const item = await storage.createTriviaItem({
        category,
        stem,
        choices,
        correctIndex,
        dropIndex,
        hint9s,
        tags,
        explanation: explanation || null,
        active: active ?? true,
        version: version ?? 1,
      });

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create trivia item" });
    }
  });

  app.put("/api/beta-admin/trivia-items/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { category, stem, choices, correctIndex, dropIndex, hint9s, tags, explanation, active, version } = req.body;

      await storage.updateTriviaItem(req.params.id, {
        category,
        stem,
        choices,
        correctIndex,
        dropIndex,
        hint9s,
        tags,
        explanation,
        active,
        version,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update trivia item" });
    }
  });

  app.delete("/api/beta-admin/trivia-items/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      await storage.deleteTriviaItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete trivia item" });
    }
  });

  app.get("/api/beta-admin/raffle-entries", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const entries = await storage.getBetaAdminRaffleEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to get raffle entries" });
    }
  });

  app.delete("/api/beta-admin/raffle-entries/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      await storage.deleteRaffleEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete raffle entry" });
    }
  });

  app.get("/api/beta-admin/bot-bar-stats", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const stats = await storage.getBotBarStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bot bar stats" });
    }
  });

  // Word Cloud Management endpoints
  app.get("/api/beta-admin/word-cloud", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const entries = await storage.getWordCloudEntries();
      res.json(entries);
    } catch (error) {
      log(`Error getting word cloud entries: ${error}`);
      res.status(500).json({ message: "Failed to get word cloud entries" });
    }
  });

  app.post("/api/beta-admin/word-cloud", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { word, count } = req.body;
      if (!word || typeof word !== 'string') {
        res.status(400).json({ message: "Word is required" });
        return;
      }

      const entry = await storage.createWordCloudEntry({
        word: word.trim(),
        count: count || 1,
        source: 'manual',
        active: true,
      });
      res.json(entry);
    } catch (error) {
      log(`Error creating word cloud entry: ${error}`);
      res.status(500).json({ message: "Failed to create word cloud entry" });
    }
  });

  app.put("/api/beta-admin/word-cloud/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { id } = req.params;
      const { word, count, active } = req.body;

      const entry = await storage.updateWordCloudEntry(id, {
        word: word?.trim(),
        count,
        active,
      });

      if (!entry) {
        res.status(404).json({ message: "Word cloud entry not found" });
        return;
      }

      res.json(entry);
    } catch (error) {
      log(`Error updating word cloud entry: ${error}`);
      res.status(500).json({ message: "Failed to update word cloud entry" });
    }
  });

  app.delete("/api/beta-admin/word-cloud/:id", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { id } = req.params;
      await storage.deleteWordCloudEntry(id);
      res.json({ success: true });
    } catch (error) {
      log(`Error deleting word cloud entry: ${error}`);
      res.status(500).json({ message: "Failed to delete word cloud entry" });
    }
  });

  app.post("/api/beta-admin/word-cloud/batch-delete", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid or empty ids array" });
      }

      log(`[word-cloud-batch-delete] Deleting ${ids.length} entries`);
      await storage.batchDeleteWordCloudEntries(ids);
      log(`[word-cloud-batch-delete] Successfully deleted ${ids.length} entries`);

      res.json({ success: true, deletedCount: ids.length });
    } catch (error) {
      log(`Error batch deleting word cloud entries: ${error}`);
      res.status(500).json({ message: "Failed to batch delete word cloud entries" });
    }
  });

  app.post("/api/beta-admin/word-cloud/sync", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      log("[word-cloud-sync] Starting sync from submissions (since reset)...");
      const result = await storage.syncWordCloudFromSubmissions(false);
      log(`[word-cloud-sync] ${result.message}`);
      res.json(result);
    } catch (error) {
      log(`Error syncing word cloud: ${error}`);
      res.status(500).json({ message: "Failed to sync word cloud from submissions" });
    }
  });

  app.post("/api/beta-admin/word-cloud/sync-all", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      log("[word-cloud-sync-all] Starting sync from ALL submissions (ignoring reset)...");
      const result = await storage.syncWordCloudFromSubmissions(true);
      log(`[word-cloud-sync-all] ${result.message}`);
      res.json(result);
    } catch (error) {
      log(`Error syncing word cloud: ${error}`);
      res.status(500).json({ message: "Failed to sync word cloud from all submissions" });
    }
  });

  // DB Admin endpoints
  app.get("/api/beta-admin/db-stats", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const stats = await storage.getDBStats();
      res.json(stats);
    } catch (error) {
      log(`Error fetching DB stats: ${error}`);
      res.status(500).json({ message: "Failed to fetch DB stats" });
    }
  });

  app.post("/api/beta-admin/clear-leaderboard-cache", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const deletedCount = await storage.clearLeaderboardCache();
      log(`Cleared ${deletedCount} leaderboard cache entries`);
      res.json({ success: true, deletedCount });
    } catch (error) {
      log(`Error clearing leaderboard cache: ${error}`);
      res.status(500).json({ message: "Failed to clear leaderboard cache" });
    }
  });

  app.get("/api/beta-admin/raffle-draw/:raffleDate", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { raffleDate } = req.params;
      if (!raffleDate) {
        res.status(400).json({ message: "raffleDate is required" });
        return;
      }

      const result = await storage.getRaffleDrawByDate(raffleDate);
      res.json(result);
    } catch (error: any) {
      log(`Error getting raffle draw: ${error}`);
      res.status(500).json({ message: error.message || "Failed to get raffle draw" });
    }
  });

  app.post("/api/beta-admin/select-raffle-winner", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { raffleDate } = req.body;
      if (!raffleDate) {
        res.status(400).json({ message: "raffleDate is required" });
        return;
      }

      const result = await storage.selectRaffleWinner(raffleDate);
      log(`Selected raffle winner for ${raffleDate}: ${result.winner.emailHash}`);
      res.json(result);
    } catch (error: any) {
      log(`Error selecting raffle winner: ${error}`);
      res.status(500).json({ message: error.message || "Failed to select raffle winner" });
    }
  });

  app.post("/api/beta-admin/broadcast-raffle-winner", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { firstName, lastName, combinedScore, category, drawId, raffleDate, isManual } = req.body;

      log(`[broadcast-raffle-winner] Received request: ${JSON.stringify({ firstName, lastName, combinedScore, category, isManual })}`);

      if (!firstName || !lastName || !category) {
        res.status(400).json({ message: "firstName, lastName, and category are required" });
        return;
      }

      // Format name as firstName + last initial
      const initials = `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
      const score = combinedScore ?? 1000; // Default to 1000 for manual entries (better than 0 for display)

      log(`[broadcast-raffle-winner] Formatted data: initials="${initials}", score=${score}, category="${category}"`);

      let winnerDrawId: string | null = typeof drawId === "string" && drawId.length > 0 ? drawId : null;

      // Only try to resolve drawId if not a manual entry
      if (!isManual) {
        if (!winnerDrawId && raffleDate) {
          try {
            const drawForDate = await storage.getRaffleDrawByDate(raffleDate);
            if (drawForDate?.draw?.id) {
              winnerDrawId = drawForDate.draw.id;
            }
          } catch (error) {
            log(`[broadcast-raffle-winner] Failed to resolve drawId for ${raffleDate}: ${error}`);
          }
        }

        // Only require drawId for non-manual entries
        if (!winnerDrawId) {
          res.status(400).json({ message: "Unable to determine raffle draw id for announcement" });
          return;
        }
      } else {
        // Generate a unique ID for manual entries to ensure they're trackable
        if (!winnerDrawId) {
          winnerDrawId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          log(`[broadcast-raffle-winner] Generated manual entry ID: ${winnerDrawId}`);
        }
      }

      let announcedAtIso: string = new Date().toISOString();

      // Only mark as announced in DB if we have a database drawId (non-manual entries)
      if (winnerDrawId && !winnerDrawId.startsWith('manual-')) {
        try {
          const announcedAt = await storage.markRaffleWinnerAnnounced(winnerDrawId);
          announcedAtIso = announcedAt instanceof Date ? announcedAt.toISOString() : new Date(announcedAt as string).toISOString();
        } catch (error) {
          log(`[broadcast-raffle-winner] Failed to mark draw ${winnerDrawId} as announced: ${error}`);
        }
      }

      // Broadcast to all connected WebSocket clients
      log(`[broadcast-raffle-winner] About to broadcast: initials="${initials}", score=${score}, category="${category}", drawId="${winnerDrawId}", announcedAt="${announcedAtIso}"`);

      broadcastRaffleWinner({
        initials,
        totalScore: score,
        category,
        drawId: winnerDrawId, // Now always has a value (either from DB or generated)
        announcedAt: announcedAtIso,
      });

      const entryType = isManual ? "manual" : "automatic";
      log(`✅ Broadcast ${entryType} raffle winner complete: ${initials} (${category}) - ${score} points [drawId: ${winnerDrawId}]`);
      log(`🔍 Check connected clients' browser consoles for WebSocket reception logs`);
      res.json({
        success: true,
        initials,
        totalScore: score,
        category,
        drawId: winnerDrawId,
        announcedAt: announcedAtIso,
      });
    } catch (error: any) {
      log(`Error broadcasting raffle winner: ${error}`);
      res.status(500).json({ message: error.message || "Failed to broadcast raffle winner" });
    }
  });

  app.post("/api/beta-admin/clear-old-raffle-entries", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { daysOld } = req.body;
      if (!daysOld || typeof daysOld !== "number") {
        res.status(400).json({ message: "daysOld (number) is required" });
        return;
      }

      const deletedCount = await storage.clearOldRaffleEntries(daysOld);
      log(`Cleared ${deletedCount} raffle entries older than ${daysOld} days`);
      res.json({ success: true, deletedCount });
    } catch (error) {
      log(`Error clearing old raffle entries: ${error}`);
      res.status(500).json({ message: "Failed to clear old raffle entries" });
    }
  });

  // Reset Console endpoints
  app.get("/api/beta-admin/reset/status", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const resetStates = await storage.getAllResetTimestamps();

      // Get current counts for each system
      const melbourneDate = getMelbourneDate(new Date());
      const leaderboardCount = await storage.getScoredSubmissionsCount();
      const raffleCount = await storage.getRaffleEntriesCount(melbourneDate);
      const wordCloudCount = await storage.getWordCloudEntriesCount();

      res.json({
        resetTimestamps: resetStates,
        currentCounts: {
          leaderboard: leaderboardCount,
          raffle: raffleCount,
          wordCloud: wordCloudCount,
          scoredSubmissions: leaderboardCount,
        },
      });
    } catch (error) {
      log(`Error getting reset status: ${error}`);
      res.status(500).json({ message: "Failed to get reset status" });
    }
  });

  app.post("/api/beta-admin/reset/big-reset", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { adminUser, notes } = req.body;
      if (!adminUser) {
        res.status(400).json({ message: "adminUser is required" });
        return;
      }

      // Set global reset timestamp - this affects all systems
      const resetTimestamp = await storage.setResetTimestamp('global', adminUser, notes);

      // Also set individual resets for all systems
      await storage.setResetTimestamp('leaderboard', adminUser, 'Via big reset');
      await storage.setResetTimestamp('raffle', adminUser, 'Via big reset');
      await storage.setResetTimestamp('scored_submissions', adminUser, 'Via big reset');
      await storage.setResetTimestamp('bot_bar', adminUser, 'Via big reset');
      await storage.setResetTimestamp('word_cloud', adminUser, 'Via big reset');

      // Permanently delete word cloud entries
      const wordsCleaned = await storage.deleteAllWordCloudEntries();

      log(`BIG RESET executed by ${adminUser} at ${resetTimestamp.resetAt}`);

      res.json({
        success: true,
        resetAt: resetTimestamp.resetAt,
        affectedSystems: ['leaderboard', 'raffle', 'word_cloud', 'scored_submissions', 'bot_bar'],
        wordsCleaned,
      });
    } catch (error) {
      log(`Error executing big reset: ${error}`);
      res.status(500).json({ message: "Failed to execute big reset" });
    }
  });

  app.post("/api/beta-admin/reset/leaderboard", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { adminUser, notes } = req.body;
      if (!adminUser) {
        res.status(400).json({ message: "adminUser is required" });
        return;
      }

      const currentCount = await storage.getScoredSubmissionsCount();
      const resetTimestamp = await storage.setResetTimestamp('leaderboard', adminUser, notes);

      log(`Leaderboard reset by ${adminUser} - ${currentCount} entries hidden`);

      res.json({
        success: true,
        resetAt: resetTimestamp.resetAt,
        entriesHidden: currentCount,
      });
    } catch (error) {
      log(`Error resetting leaderboard: ${error}`);
      res.status(500).json({ message: "Failed to reset leaderboard" });
    }
  });

  app.post("/api/beta-admin/reset/raffle", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { adminUser, notes } = req.body;
      if (!adminUser) {
        res.status(400).json({ message: "adminUser is required" });
        return;
      }

      const melbourneDate = getMelbourneDate(new Date());
      const currentCount = await storage.getRaffleEntriesCount(melbourneDate);
      const resetTimestamp = await storage.setResetTimestamp('raffle', adminUser, notes);

      log(`Raffle reset by ${adminUser} - ${currentCount} entries hidden`);

      res.json({
        success: true,
        resetAt: resetTimestamp.resetAt,
        entriesHidden: currentCount,
      });
    } catch (error) {
      log(`Error resetting raffle: ${error}`);
      res.status(500).json({ message: "Failed to reset raffle" });
    }
  });

  app.post("/api/beta-admin/reset/word-cloud", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { adminUser, notes } = req.body;
      if (!adminUser) {
        res.status(400).json({ message: "adminUser is required" });
        return;
      }

      const currentCount = await storage.getWordCloudEntriesCount();
      const wordsCleared = await storage.deleteAllWordCloudEntries();
      await storage.setResetTimestamp('word_cloud', adminUser, notes);

      log(`Word cloud reset by ${adminUser} - ${wordsCleared} words permanently deleted`);

      res.json({
        success: true,
        wordsCleared,
      });
    } catch (error) {
      log(`Error resetting word cloud: ${error}`);
      res.status(500).json({ message: "Failed to reset word cloud" });
    }
  });

  app.post("/api/beta-admin/reset/scored-submissions", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { adminUser, notes } = req.body;
      if (!adminUser) {
        res.status(400).json({ message: "adminUser is required" });
        return;
      }

      const currentCount = await storage.getScoredSubmissionsCount();
      const resetTimestamp = await storage.setResetTimestamp('scored_submissions', adminUser, notes);

      log(`Scored submissions reset by ${adminUser} - ${currentCount} submissions hidden`);

      res.json({
        success: true,
        resetAt: resetTimestamp.resetAt,
        submissionsHidden: currentCount,
      });
    } catch (error) {
      log(`Error resetting scored submissions: ${error}`);
      res.status(500).json({ message: "Failed to reset scored submissions" });
    }
  });

  app.post("/api/beta-admin/reset/bot-bar", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { adminUser, notes } = req.body;
      if (!adminUser) {
        res.status(400).json({ message: "adminUser is required" });
        return;
      }

      const resetTimestamp = await storage.setResetTimestamp('bot_bar', adminUser, notes);

      log(`Bot bar reset by ${adminUser} - all categories will return to 50`);

      res.json({
        success: true,
        resetAt: resetTimestamp.resetAt,
        message: 'Bot bar reset to seed average (50) for all categories',
      });
    } catch (error) {
      log(`Error resetting bot bar: ${error}`);
      res.status(500).json({ message: "Failed to reset bot bar" });
    }
  });

  // Feedback endpoints
  app.post("/api/feedback", async (req, res) => {
    try {
      const data = submitFeedbackSchema.parse(req.body);

      // Hash email if provided
      let emailHash: string | undefined = data.emailHash;
      if (data.email && data.email.trim() !== "") {
        emailHash = hashEmail(data.email);
      }

      // Remove email field before storing (we only store the hash for privacy)
      const { email, ...feedbackData } = data;

      const feedback = await feedbackStorage.submitFeedback({
        ...feedbackData,
        emailHash,
        status: "pending",
      });

      log(`Feedback submitted: ${feedback.id} - Rating: ${feedback.rating}/5${emailHash ? ' (with email)' : ''}`);
      res.json({ success: true, id: feedback.id });
    } catch (error) {
      log(`Error submitting feedback: ${error}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Invalid feedback data" });
      } else {
        res.status(500).json({ success: false, error: "Failed to submit feedback" });
      }
    }
  });

  app.get("/api/admin/feedback", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { status } = req.query;
      const feedback = status
        ? await feedbackStorage.getFeedbackByStatus(status as string)
        : await feedbackStorage.getAllFeedback();

      res.json(feedback);
    } catch (error) {
      log(`Error getting feedback: ${error}`);
      res.status(500).json({ error: "Failed to get feedback" });
    }
  });

  app.patch("/api/admin/feedback/:id/status", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "reviewed", "implemented"].includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      await feedbackStorage.updateFeedbackStatus(id, status);
      log(`Feedback ${id} status updated to: ${status}`);
      res.json({ success: true });
    } catch (error) {
      log(`Error updating feedback status: ${error}`);
      res.status(500).json({ error: "Failed to update feedback status" });
    }
  });

  // Export submissions as ZIP file
  app.get("/api/admin/export-submissions", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      if (!db) {
        res.status(500).json({ error: "Database connection not available" });
        return;
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: "Both startDate and endDate are required (format: YYYY-MM-DD)" });
        return;
      }

      log(`[export] Starting submissions export from ${startDate} to ${endDate}`);

      // Query all submissions within the date range
      const submissionsData = await db
        .select({
          submissionId: submissions.id,
          submissionDate: submissions.createdAt,
          participantId: submissions.participantId,
          category: submissions.category,
          solutionText: submissions.solutionText,
          structuredJson: submissions.structuredJson,
          totalScore: submissions.totalScore,
          subScores: submissions.subScores,
          firstName: participants.firstName,
          lastName: participants.lastName,
          emailHash: sql<string>`COALESCE(${users.emailHash}, ${attempts.emailHash})`,
          email: users.email,
        })
        .from(submissions)
        .innerJoin(participants, eq(submissions.participantId, participants.id))
        .leftJoin(attempts, eq(submissions.id, attempts.submissionId))
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .where(
          and(
            gte(submissions.createdAt, new Date(`${startDate}T00:00:00.000Z`)),
            lte(submissions.createdAt, new Date(`${endDate}T23:59:59.999Z`))
          )
        )
        .orderBy(submissions.createdAt);

      log(`[export] Found ${submissionsData.length} submissions`);

      if (submissionsData.length === 0) {
        res.status(404).json({ error: "No submissions found in the specified date range" });
        return;
      }

      // Set headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=submissions_${startDate}_to_${endDate}.zip`);

      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => {
        log(`[export] Archive error: ${err.message}`);
        throw err;
      });

      archive.pipe(res);

      // Create CSV summary
      const csvLines = [
        'Submission ID,Date,First Name,Last Name,Email,Category,Total Score,Clarity Score,Impact Score,Technology Fit Score,Feasibility Score,Business Value Score',
      ];

      const exportData: Array<any> = [];

      for (const submission of submissionsData) {
        // Get chat session for this participant
        let chatTranscript: Array<{ role: string; content: string }> = [];

        try {
          const chatSession = await db
            .select()
            .from(chatSessions)
            .where(
              and(
                eq(chatSessions.participantId, submission.participantId),
                eq(chatSessions.category, submission.category)
              )
            )
            .limit(1);

          if (chatSession.length > 0 && chatSession[0].messages) {
            chatTranscript = chatSession[0].messages as Array<{ role: string; content: string }>;
          }
        } catch (error) {
          log(`[export] Error fetching chat session for participant ${submission.participantId}: ${error}`);
        }

        const subScores = submission.subScores ? JSON.parse(submission.subScores) : {};
        const structuredData = submission.structuredJson ? JSON.parse(submission.structuredJson) : {};

        // Add to CSV
        csvLines.push(
          [
            submission.submissionId,
            submission.submissionDate.toISOString(),
            submission.firstName,
            submission.lastName,
            submission.email || 'Not available',
            submission.category,
            submission.totalScore,
            subScores.clarity || '',
            subScores.impact || '',
            subScores.technology_fit || '',
            subScores.feasibility || '',
            subScores.business_value || '',
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(',')
        );

        exportData.push({
          submission,
          subScores,
          structuredData,
          chatTranscript,
        });

        // Create individual text file for this submission
        const fileName = `${submission.submissionDate.toISOString().split('T')[0]}_${submission.lastName}_${submission.firstName}_${submission.category}.txt`
          .replace(/[^a-zA-Z0-9_\-\.]/g, '_');

        const chatTranscriptText = chatTranscript.length > 0
          ? chatTranscript
              .map((msg, index) => {
                const role = msg.role === 'user' ? 'PARTICIPANT' : 'SPRINT COACH';
                return `\n[${index + 1}] ${role}:\n${msg.content}\n${'='.repeat(80)}`;
              })
              .join('\n')
          : 'No chat transcript available';

        const fileContent = `
================================================================================
SUBMISSION DETAILS
================================================================================

Submission ID: ${submission.submissionId}
Date of Submission: ${submission.submissionDate.toISOString()}
First Name: ${submission.firstName}
Last Name: ${submission.lastName}
Email: ${submission.email || 'Not available'}
Category: ${submission.category}
Total Score: ${submission.totalScore}

--------------------------------------------------------------------------------
SUB-SCORES
--------------------------------------------------------------------------------
${Object.entries(subScores).length > 0
  ? Object.entries(subScores)
      .map(([key, value]) => `${key.replace(/_/g, ' ').toUpperCase()}: ${value}`)
      .join('\n')
  : 'Not available'}

--------------------------------------------------------------------------------
PROJECT SUBMISSION DETAILS
--------------------------------------------------------------------------------

PROBLEM SUMMARY:
${structuredData.problem_summary || 'Not available'}

IMPACT SUMMARY:
${structuredData.impact_summary || 'Not available'}

BASELINE METRICS:
${structuredData.baseline_metrics
  ? structuredData.baseline_metrics.map((m: any) => `- ${m.name}: ${m.value}`).join('\n')
  : 'Not available'}

TARGET METRICS:
${structuredData.target_metrics
  ? structuredData.target_metrics.map((m: any) => `- ${m.name}: ${m.target}`).join('\n')
  : 'Not available'}

ACTION PLAN:
${structuredData.action_plan
  ? structuredData.action_plan.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')
  : 'Not available'}

SUCCESS CHECKS:
${structuredData.success_checks
  ? structuredData.success_checks.map((check: string, i: number) => `${i + 1}. ${check}`).join('\n')
  : 'Not available'}

RISKS:
${structuredData.risks
  ? structuredData.risks.map((risk: string, i: number) => `${i + 1}. ${risk}`).join('\n')
  : 'Not available'}

FULL SOLUTION TEXT:
${submission.solutionText}

================================================================================
SPRINT COACH CHAT TRANSCRIPT
================================================================================
${chatTranscriptText}

================================================================================
END OF SUBMISSION
================================================================================
`.trim();

        archive.append(fileContent, { name: `individual_submissions/${fileName}` });
      }

      // Add CSV summary to archive
      archive.append(csvLines.join('\n'), { name: 'submissions_summary.csv' });

      // Add detailed JSON to archive
      archive.append(JSON.stringify(exportData, null, 2), { name: 'submissions_detailed.json' });

      // Finalize the archive
      await archive.finalize();

      log(`[export] Export completed successfully - ${submissionsData.length} submissions exported`);
    } catch (error) {
      log(`[export] Error during export: ${error}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to export submissions" });
      }
    }
  });

  // Get all submissions with participant data as JSON
  app.get("/api/admin/all-submissions", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      if (!db) {
        res.status(500).json({ error: "Database connection not available" });
        return;
      }

      log(`[all-submissions] Fetching all submissions`);

      // Query all submissions with participant data
      const submissionsData = await db
        .select({
          submissionId: submissions.id,
          submissionDate: submissions.createdAt,
          participantId: submissions.participantId,
          category: submissions.category,
          solutionText: submissions.solutionText,
          structuredJson: submissions.structuredJson,
          totalScore: submissions.totalScore,
          subScores: submissions.subScores,
          evaluationNotes: submissions.evaluationNotes,
          announcedOnLeaderboard: submissions.announcedOnLeaderboard,
          firstName: participants.firstName,
          lastName: participants.lastName,
          emailHash: sql<string>`COALESCE(${users.emailHash}, ${attempts.emailHash})`,
          email: users.email,
        })
        .from(submissions)
        .innerJoin(participants, eq(submissions.participantId, participants.id))
        .leftJoin(attempts, eq(submissions.id, attempts.submissionId))
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .orderBy(submissions.createdAt);

      log(`[all-submissions] Found ${submissionsData.length} submissions`);

      // Fetch chat transcripts and format data for each submission
      const formattedData = await Promise.all(submissionsData.map(async (submission) => {
        // Get chat session for this participant
        let chatTranscript: Array<{ role: string; content: string }> = [];

        try {
          const chatSession = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.participantId, submission.participantId))
            .orderBy(sql`${chatSessions.createdAt} DESC`)
            .limit(1);

          if (chatSession.length > 0 && chatSession[0].messages) {
            chatTranscript = chatSession[0].messages as Array<{ role: string; content: string }>;
          }
        } catch (error) {
          log(`[all-submissions] Error fetching chat session for participant ${submission.participantId}: ${error}`);
        }

        const subScores = submission.subScores ? JSON.parse(submission.subScores) : {};
        const structuredData = submission.structuredJson ? JSON.parse(submission.structuredJson) : {};

        return {
          ...submission,
          subScores,
          structuredData,
          chatTranscript,
        };
      }));

      res.json(formattedData);
    } catch (error) {
      log(`[all-submissions] Error: ${error}`);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Download all submissions as CSV with participant data
  app.get("/api/admin/download-submissions-csv", async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) return;

      if (!db) {
        res.status(500).json({ error: "Database connection not available" });
        return;
      }

      log(`[csv-download] Starting CSV download for all submissions`);

      // Query all submissions with participant data
      const submissionsData = await db
        .select({
          submissionId: submissions.id,
          submissionDate: submissions.createdAt,
          participantId: submissions.participantId,
          category: submissions.category,
          solutionText: submissions.solutionText,
          structuredJson: submissions.structuredJson,
          totalScore: submissions.totalScore,
          subScores: submissions.subScores,
          evaluationNotes: submissions.evaluationNotes,
          announcedOnLeaderboard: submissions.announcedOnLeaderboard,
          firstName: participants.firstName,
          lastName: participants.lastName,
          emailHash: sql<string>`COALESCE(${users.emailHash}, ${attempts.emailHash})`,
          email: users.email,
        })
        .from(submissions)
        .innerJoin(participants, eq(submissions.participantId, participants.id))
        .leftJoin(attempts, eq(submissions.id, attempts.submissionId))
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .orderBy(submissions.createdAt);

      log(`[csv-download] Found ${submissionsData.length} submissions`);

      if (submissionsData.length === 0) {
        res.status(404).json({ error: "No submissions found" });
        return;
      }

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=all_submissions_${new Date().toISOString().split('T')[0]}.csv`);

      // Create CSV header
      const csvLines = [
        'Submission ID,Submission Date,Participant ID,First Name,Last Name,Email,Category,Total Score,Clarity Score,Impact Score,Technology Fit Score,Feasibility Score,Business Value Score,Problem Summary,Impact Summary,Evaluation Notes,Solution Text,Chat Transcript',
      ];

      // Add each submission as a CSV row
      for (const submission of submissionsData) {
        const subScores = submission.subScores ? JSON.parse(submission.subScores) : {};
        const structuredData = submission.structuredJson ? JSON.parse(submission.structuredJson) : {};

        // Get chat transcript for this participant
        let chatTranscriptText = 'No chat transcript available';
        try {
          const chatSession = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.participantId, submission.participantId))
            .orderBy(sql`${chatSessions.createdAt} DESC`)
            .limit(1);

          if (chatSession.length > 0 && chatSession[0].messages) {
            const messages = chatSession[0].messages as Array<{ role: string; content: string }>;
            chatTranscriptText = messages
              .map((msg, index) => {
                const role = msg.role === 'user' ? 'PARTICIPANT' : 'SPRINT COACH';
                return `[${index + 1}] ${role}: ${msg.content}`;
              })
              .join(' | ');
          }
        } catch (error) {
          log(`[csv-download] Error fetching chat for participant ${submission.participantId}: ${error}`);
        }

        csvLines.push(
          [
            submission.submissionId,
            submission.submissionDate?.toISOString() || '',
            submission.participantId,
            submission.firstName,
            submission.lastName,
            submission.email || 'Not available',
            submission.category,
            submission.totalScore,
            subScores.clarity || '',
            subScores.impact || '',
            subScores.technology_fit || '',
            subScores.feasibility || '',
            subScores.business_value || '',
            structuredData.problem_summary || '',
            structuredData.impact_summary || '',
            submission.evaluationNotes || '',
            submission.solutionText || '',
            chatTranscriptText,
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(',')
        );
      }

      // Send CSV
      res.send(csvLines.join('\n'));

      log(`[csv-download] CSV download completed successfully - ${submissionsData.length} submissions exported`);
    } catch (error) {
      log(`[csv-download] Error during CSV download: ${error}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to download submissions CSV" });
      }
    }
  });

  return httpServer;
}
