
import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const participants = pgTable("participants", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: text("participant_id").notNull().references(() => participants.id),
  category: text("category").notNull(),
  solutionText: text("solution_text").notNull(),
  structuredJson: text("structured_json").notNull(),
  subScores: text("sub_scores").notNull(), // JSON string of subscores object
  totalScore: integer("total_score").notNull(),
  evaluationNotes: text("evaluation_notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
});

export const acceptTncSchema = z.object({
  accepted: z.boolean(),
});

export const startSessionSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const chatSchema = z.object({
  sessionToken: z.string(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
});

export const submitSolutionSchema = z.object({
  sessionToken: z.string(),
  category: z.enum(["SECURE_CONNECTIVITY", "HYBRID_DC", "COLLAB_CX", "OBSERVABILITY", "EDGE_IOT"]).optional(), // Category now auto-assigned
  solutionText: z.string(),
  structuredFields: z.object({
    problem_summary: z.string(),
    chosen_category: z.string(),
    cisco_products: z.array(z.string()),
    current_state: z.object({
      baseline_kpis: z.array(z.object({
        name: z.string(),
        value: z.string(),
      })),
      constraints: z.array(z.string()),
    }),
    target_state: z.object({
      kpis: z.array(z.object({
        name: z.string(),
        target: z.string(),
      })),
      persona: z.array(z.string()),
    }),
    integration_points: z.array(z.string()),
    security_considerations: z.array(z.string()),
    observability_plan: z.array(z.string()),
    rollout_plan: z.array(z.string()),
    risks: z.array(z.string()),
  }).optional(),
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
