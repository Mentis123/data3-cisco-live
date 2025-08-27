import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket, broadcastScoreUpdate } from "./ws";
import { chatWithAssistant, evaluateSolution } from "./openai";
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
  { key: "SECURE_CONNECTIVITY", name: "Zero Trust, SASE, SD-WAN, Network Segmentation" },
  { key: "HYBRID_DC", name: "Data Centre & Hybrid Cloud" },
  { key: "COLLAB_CX", name: "Collaboration & Contact Centre" },
  { key: "OBSERVABILITY", name: "ThousandEyes, AppDynamics, Full-Stack Observability" },
  { key: "EDGE_IOT", name: "Meraki/Catalyst at branch/industrial edge" },
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

      const { sessionToken, category, solutionText, structuredFields } = submitSolutionSchema.parse(req.body);
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
      
      // Fix array fields that might come as strings from AI
      if (structuredSubmission) {
        const arrayFields = ['cisco_products', 'integration_points', 'security_considerations', 'observability_plan', 'rollout_plan', 'risks'] as const;
        for (const field of arrayFields) {
          if ((structuredSubmission as any)[field] && typeof (structuredSubmission as any)[field] === 'string') {
            // Convert single string to array
            (structuredSubmission as any)[field] = [(structuredSubmission as any)[field]];
          }
        }
        
        // Fix nested array fields
        if (structuredSubmission.current_state) {
          if (structuredSubmission.current_state.constraints && typeof structuredSubmission.current_state.constraints === 'string') {
            structuredSubmission.current_state.constraints = [structuredSubmission.current_state.constraints];
          }
        }
        if (structuredSubmission.target_state) {
          if (structuredSubmission.target_state.persona && typeof structuredSubmission.target_state.persona === 'string') {
            structuredSubmission.target_state.persona = [structuredSubmission.target_state.persona];
          }
        }
      }

      // Evaluate solution
      const evaluation = await evaluateSolution(structuredSubmission);
      
      // Create submission
      const submission = await storage.createSubmission({
        participantId: session.participantId,
        category,
        solutionText,
        structuredJson: JSON.stringify(structuredSubmission),
        subScores: JSON.stringify(evaluation.subscores),
        totalScore: evaluation.total,
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
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
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
