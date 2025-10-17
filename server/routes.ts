
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, storageKind } from "./storage/index.js";
import { log } from "./logging.js";
import { setupWebSocket, broadcastScoreUpdate } from "./ws.js";
import { chatWithAssistant, evaluateSolution, categorizeProposal } from "./openai.js";
import {
  acceptTncSchema,
  startSessionSchema,
  chatSchema,
  submitSolutionSchema,
} from "../shared/schema.js";
import { randomUUID } from "crypto";
import path from "path";

log(
  `Using ${storageKind} storage backend${storageKind === "memory" ? " (no database connection string configured)" : ""}`,
);

// In-memory session storage (in production, use Redis)
const sessions = new Map<string, { participantId: string; category?: string; messages: any[] }>();

// Rate limiting map (IP -> last submission timestamp)
const rateLimits = new Map<string, number>();

const CATEGORIES = [
  { key: "SECURE_CONNECTIVITY", name: "Zero Trust & Secure Connectivity", description: "Zero Trust security, network security, firewalls, VPN, secure remote access, identity management, threat detection" },
  { key: "HYBRID_DC", name: "Data Centre & Hybrid Cloud", description: "Data center infrastructure, cloud integration, virtualization, storage, compute, hybrid cloud solutions" },
  { key: "COLLAB_CX", name: "Collaboration & Contact Centre", description: "Video conferencing, team collaboration, contact center, communication platforms, unified communications" },
  { key: "OBSERVABILITY", name: "Observability & Performance", description: "Network monitoring, analytics, performance management, troubleshooting, visibility tools, automation" },
  { key: "EDGE_IOT", name: "Edge & IoT Solutions", description: "IoT solutions, edge computing, industrial networks, smart building technologies, sensor networks" },
];

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
      const { firstName, lastName } = startSessionSchema.parse(req.body);

      const participant = await storage.createParticipant({ firstName, lastName });
      const sessionToken = randomUUID();

      sessions.set(sessionToken, { 
        participantId: participant.id, 
        messages: [] 
      });

      res.json({ participantId: participant.id, sessionToken });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get("/api/categories", (req, res) => {
    res.json(CATEGORIES);
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { sessionToken, messages, sprintStep } = chatSchema.parse(req.body);
      const session = sessions.get(sessionToken);

      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Add messages to session
      session.messages.push(...messages);

      // Pass sprintStep to AI for context-aware responses
      const response = await chatWithAssistant(session.messages, sprintStep);

      // Add assistant response to session
      session.messages.push({ role: "assistant", content: response });

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

      const { sessionToken, solutionText, structuredFields } = submitSolutionSchema.parse(req.body);
      const session = sessions.get(sessionToken);

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
      if (!structuredSubmission) {
        // Extract from chat messages if not provided
        const lastMessage = session.messages[session.messages.length - 1];
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

      // Auto-categorize the solution
      const category = await categorizeProposal(
        structuredSubmission.problem_summary,
        session.messages.map(m => m.content).join(" "),
        JSON.stringify(structuredSubmission)
      );

      // Evaluate solution
      console.log('[express] Evaluating solution with structured data:', JSON.stringify(structuredSubmission, null, 2));
      const evaluation = await evaluateSolution(
        structuredSubmission.problem_summary,
        session.messages.map(m => m.content).join(" "),
        JSON.stringify(structuredSubmission)
      );
      console.log('[express] Evaluation result:', JSON.stringify(evaluation, null, 2));

      // Create submission with evaluation notes
      const submission = await storage.createSubmission({
        participantId: session.participantId,
        category,
        solutionText,
        structuredJson: JSON.stringify(structuredSubmission),
        subScores: JSON.stringify(evaluation.subscores),
        totalScore: evaluation.total,
        evaluationNotes: evaluation.notes_short,
      });

      // Get current leaderboard to calculate rank
      const leaderboard = await storage.getLeaderboard();
      const targetRank = leaderboard.findIndex(entry => entry.totalScore <= evaluation.total) + 1;

      // Broadcast WebSocket update
      broadcastScoreUpdate({
        id: submission.id,
        name: `${participant.firstName} ${participant.lastName.charAt(0)}.`,
        category,
        targetRank: targetRank || leaderboard.length + 1,
        finalScore: evaluation.total,
      });

      // Update rate limit
      rateLimits.set(clientIP, now);

      res.json({
        finalScore: evaluation.total,
        subscores: evaluation.subscores,
        evaluationNotes: evaluation.notes_short,
        rank: targetRank || leaderboard.length + 1,
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
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await storage.getData3Stats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Admin endpoint to update Data#3 stats
  app.post("/api/admin/stats/:id", async (req, res) => {
    try {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.deleteData3Stat(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete stat" });
    }
  });

  // Admin endpoint to get all categories
  app.get("/api/admin/categories", async (req, res) => {
    try {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Admin endpoint to create new category
  app.post("/api/admin/categories", async (req, res) => {
    try {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
      const adminKey = req.query.key as string;
      const expectedKey = process.env.ADMIN_KEY || "choose-a-strong-string";

      if (!adminKey || adminKey !== expectedKey) {
        return res.status(403).json({ message: "Invalid admin key" });
      }

      await storage.clearDatabase();
      sessions.clear();
      rateLimits.clear();

      res.json({ message: "Database reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset database" });
    }
  });

  return httpServer;
}
