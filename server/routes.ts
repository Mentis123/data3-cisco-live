
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, broadcastScoreUpdate } from "./ws";
import { chatWithAssistant, evaluateSolution, categorizeProposal } from "./openai";
import { 
  acceptTncSchema, 
  startSessionSchema, 
  chatSchema, 
  submitSolutionSchema 
} from "@shared/schema";
import { randomUUID } from "crypto";
import path from "path";

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

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  setupWebSocket(httpServer);

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
      const { sessionToken, messages } = chatSchema.parse(req.body);
      const session = sessions.get(sessionToken);

      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Add messages to session
      session.messages.push(...messages);

      const response = await chatWithAssistant(session.messages);

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
        const arrayFields = ['cisco_products', 'integration_points', 'security_considerations', 'observability_plan', 'rollout_plan', 'risks'] as const;
        for (const field of arrayFields) {
          if (req.body.structuredFields[field] && typeof req.body.structuredFields[field] === 'string') {
            req.body.structuredFields[field] = [req.body.structuredFields[field]];
          }
        }

        // Fix nested array fields
        if (req.body.structuredFields.current_state) {
          if (req.body.structuredFields.current_state.constraints && typeof req.body.structuredFields.current_state.constraints === 'string') {
            req.body.structuredFields.current_state.constraints = [req.body.structuredFields.current_state.constraints];
          }
          if (req.body.structuredFields.current_state.baseline_kpis && typeof req.body.structuredFields.current_state.baseline_kpis === 'string') {
            req.body.structuredFields.current_state.baseline_kpis = [];
          }
        }
        if (req.body.structuredFields.target_state) {
          if (req.body.structuredFields.target_state.persona && typeof req.body.structuredFields.target_state.persona === 'string') {
            req.body.structuredFields.target_state.persona = [req.body.structuredFields.target_state.persona];
          }
          if (req.body.structuredFields.target_state.kpis && typeof req.body.structuredFields.target_state.kpis === 'string') {
            req.body.structuredFields.target_state.kpis = [];
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
      const topCategoryData3Stats = await storage.getData3Stats(
        topCategory === "SECURE_CONNECTIVITY" ? "SECURITY" :
        topCategory === "HYBRID_DC" ? "CLOUD" :
        topCategory === "OBSERVABILITY" ? "INFRASTRUCTURE" :
        "EXPERTISE"
      );

      res.json({
        leaderboard,
        wordCloud,
        categoryStats,
        recentSubmission,
        data3Stats,
        topCategoryStats: topCategoryData3Stats,
        topCategory
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
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
      const deleted = await storage.deleteSubmission(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Submission not found" });
      }
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
