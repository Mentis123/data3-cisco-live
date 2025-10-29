
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, storageKind } from "./storage/index.js";
import { createDatabaseFeedbackStorage, createJSONFeedbackStorage } from "./storage/feedback.js";
import { db, hasDatabase } from "./db.js";
import { log } from "./logging.js";
import { setupWebSocket, broadcastScoreUpdate, broadcastRingEntry, broadcastRingExit, broadcastRaffleQualified } from "./ws.js";
import { chatWithAssistant, evaluateSolution, categorizeProposal } from "./openai.js";
import {
  acceptTncSchema,
  startSessionSchema,
  chatSchema,
  submitSolutionSchema,
} from "../shared/schema.js";
import { createHash } from "crypto";
import path from "path";
import { z } from "zod";

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

// Rate limiting map (IP -> last submission timestamp)
const rateLimits = new Map<string, number>();

const CATEGORIES = [
  { key: "SECURE_CONNECTIVITY", name: "Zero Trust & Secure Connectivity", description: "Zero Trust security, network security, firewalls, VPN, secure remote access, identity management, threat detection" },
  { key: "HYBRID_DC", name: "Data Centre & Hybrid Cloud", description: "Data center infrastructure, cloud integration, virtualization, storage, compute, hybrid cloud solutions" },
  { key: "COLLAB_CX", name: "Collaboration & Contact Centre", description: "Video conferencing, team collaboration, contact center, communication platforms, unified communications" },
  { key: "OBSERVABILITY", name: "Observability & Performance", description: "Network monitoring, analytics, performance management, troubleshooting, visibility tools, automation" },
  { key: "EDGE_IOT", name: "Edge & IoT Solutions", description: "IoT solutions, edge computing, industrial networks, smart building technologies, sensor networks" },
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

  if (enableWebSocket && httpServer) {
    setupWebSocket(httpServer);
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
      const payload = startTriviaAttemptSchema.parse(req.body);
      if (payload.mode === "ring" && !payload.email) {
        return res.status(400).json({ message: "Email is required for ring attempts" });
      }

      // Check for existing submission for this email + category + day
      if (payload.email) {
        const emailHash = hashEmail(payload.email);
        const today = new Date().toISOString().split('T')[0];
        const existingAttempt = await storage.checkExistingDailyAttempt(
          emailHash,
          payload.category,
          today
        );

        if (existingAttempt) {
          return res.status(409).json({
            message: "You have already submitted for this category today",
            alreadySubmitted: true,
            existingAttemptId: existingAttempt.id
          });
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

      // Broadcast ring entry if it's a ring mode attempt
      if (payload.mode === "ring" && playerProfile) {
        const initials = `${playerProfile.firstName?.[0] || ''}${playerProfile.lastName?.[0] || ''}`.toUpperCase();
        broadcastRingEntry({
          attemptId: attempt.id,
          initials,
          category: attempt.category
        });
      }

      res.json({
        attemptId: attempt.id,
        category: attempt.category,
        mode: attempt.mode,
        cards,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start trivia attempt";
      res.status(400).json({ message });
    }
  });

  app.post("/api/trivia/attempts/:attemptId/complete", async (req, res) => {
    try {
      const payload = completeTriviaAttemptSchema.parse({
        attemptId: req.params.attemptId,
        answers: req.body.answers,
      });

      const result = await storage.completeTriviaAttempt(payload);
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
      const { sessionToken, messages, sprintStep } = chatSchema.parse(req.body);
      const session = await storage.getChatSession(sessionToken);

      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const updatedMessages = [...(session.messages ?? []), ...messages];

      // Pass sprintStep to AI for context-aware responses
      const response = await chatWithAssistant(updatedMessages, sprintStep);

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
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();

      // Rate limiting: 60 second cooldown
      const lastSubmission = rateLimits.get(clientIP);
      if (lastSubmission && now - lastSubmission < 60000) {
        return res.status(429).json({ message: "Please wait before submitting again" });
      }

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

      // Use session category if available (from trivia selection), otherwise auto-categorize
      let category = session.category;
      if (!category) {
        category = await categorizeProposal(
          structuredSubmission.problem_summary,
          conversation.map(m => m.content).join(" "),
          JSON.stringify(structuredSubmission)
        );
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

      const persistedTriviaAttemptId = session.triviaAttemptId ?? triviaAttemptId ?? null;

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
      });

      // Calculate combined score and handle raffle eligibility
      let triviaScore = 0;
      let combinedScore = pitchScore; // Default to pitch only
      let botBar: number | null = null;
      let isEligible = false;
      let raffleResult: { success: boolean; alreadyExists?: boolean } | null = null;

      if (triviaAttemptId) {
        try {
          // Attach submission to trivia attempt
          await storage.attachSubmissionToTriviaAttempt(triviaAttemptId, submission.id);

          // Get trivia attempt to retrieve trivia score
          const attempt = await storage.getTriviaAttempt?.(triviaAttemptId);
          if (attempt) {
            triviaScore = attempt.totalScore || 0;
            combinedScore = triviaScore + pitchScore;

            // Calculate bot bar for this category and today
            const today = new Date().toISOString().split('T')[0];
            botBar = await storage.calculateBotBar(category, today);

            // Check eligibility: combined score >= bot bar
            isEligible = combinedScore >= botBar;

            // Update attempt with bot bar and eligibility
            if (attempt.mode === 'ring' && session.emailHash) {
              // Only create raffle entry if eligible and in ring mode with email
              if (isEligible) {
                raffleResult = await storage.createRaffleEntry({
                  emailHash: session.emailHash,
                  category,
                  attemptId: triviaAttemptId,
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
          }
        } catch (error) {
          console.warn(
            `[trivia] Failed to process trivia attempt ${triviaAttemptId}:`,
            error,
          );
        }
      }

      // Get current leaderboard to calculate rank (based on combined score)
      const leaderboard = await storage.getLeaderboard();
      const targetRank = leaderboard.findIndex(entry => entry.totalScore <= combinedScore) + 1;

      // Broadcast ring exit if this was a ring attempt
      if (persistedTriviaAttemptId) {
        broadcastRingExit({
          attemptId: persistedTriviaAttemptId,
          qualified: isEligible
        });

        // Broadcast raffle qualification announcement (only if they qualified)
        if (isEligible) {
          broadcastRaffleQualified({
            category
          });
        }
      }

      // Broadcast WebSocket update
      broadcastScoreUpdate({
        id: submission.id,
        name: `${participant.firstName} ${participant.lastName.charAt(0)}.`,
        category,
        targetRank: targetRank || leaderboard.length + 1,
        finalScore: combinedScore,
      });

      await storage.updateChatSession(sessionToken, {
        category,
        triviaAttemptId: persistedTriviaAttemptId,
      });

      // Update rate limit
      rateLimits.set(clientIP, now);

      res.json({
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
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit solution: " + (error as Error).message });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const category = req.query.category as string | undefined;
      const leaderboard = await storage.getLeaderboard(limit, category);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // New dashboard data endpoint
  app.get("/api/dashboard-data", async (req, res) => {
    try {
      const [leaderboard, wordCloud, categoryStats, recentSubmission, data3Stats] = await Promise.all([
        storage.getLeaderboard(10),
        storage.getWordCloudData(),
        storage.getCategoryStats(),
        storage.getRecentSubmission(),
        storage.getData3Stats()
      ]);

      const topCategory = await storage.getTopProblemCategory();
      
      // Use recent submission's category for stats if available, otherwise use top category
      const categoryForStats = recentSubmission?.category || topCategory;
      const topCategoryData3Stats = await storage.getData3Stats(
        categoryForStats === "SECURE_CONNECTIVITY" ? "SECURE_CONNECTIVITY" :
        categoryForStats === "HYBRID_DC" ? "HYBRID_DC" :
        categoryForStats === "OBSERVABILITY" ? "OBSERVABILITY" :
        categoryForStats === "COLLAB_CX" ? "COLLAB_CX" :
        categoryForStats === "EDGE_IOT" ? "EDGE_IOT" :
        "GENERAL" // Default to GENERAL instead of EXPERTISE
      );

      res.json({
        leaderboard,
        wordCloud,
        categoryStats,
        recentSubmission,
        data3Stats,
        topCategoryStats: topCategoryData3Stats,
        topCategory: categoryForStats // Use the category that matches the stats being shown
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data" });
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
      const leaderboard = await storage.getDetailedLeaderboard();
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

      const { category, stem, choices, correctIndex, dropIndex, hint9s, difficulty, tags, explanation, active, version } = req.body;

      const item = await storage.createTriviaItem({
        category,
        stem,
        choices,
        correctIndex,
        dropIndex,
        hint9s,
        difficulty,
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

      const { category, stem, choices, correctIndex, dropIndex, hint9s, difficulty, tags, explanation, active, version } = req.body;

      await storage.updateTriviaItem(req.params.id, {
        category,
        stem,
        choices,
        correctIndex,
        dropIndex,
        hint9s,
        difficulty,
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

  return httpServer;
}
