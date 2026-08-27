
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  smallint,
  jsonb,
  date,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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
  announcedOnLeaderboard: boolean("announced_on_leaderboard").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const data3Stats = pgTable("data3_stats", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const customCategories = pgTable("custom_categories", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  emailHash: text("email_hash").notNull().unique(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  emailHash: text("email_hash").references(() => users.emailHash),
  category: text("category").notNull(),
  mode: text("mode").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).default(sql`now()`),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  triviaScore: integer("trivia_score"),
  totalScore: integer("total_score"),
  passed: boolean("passed").notNull().default(false),
  eligible: boolean("eligible").notNull().default(false),
  avgCorrectTimeMs: integer("avg_correct_time_ms"),
  botBar: integer("bot_bar"),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  consentCapturedAt: timestamp("consent_captured_at", { withTimezone: true }),
  attemptDay: date("attempt_day"),
  cardSetVersion: integer("card_set_version").default(1),
  deckSnapshot: jsonb("deck_snapshot"),
  submissionId: text("submission_id").references(() => submissions.id, { onDelete: "set null" }),
});

export const answers = pgTable("answers", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: text("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  choiceIndex: smallint("choice_index").notNull(),
  correct: boolean("correct").notNull(),
  pointsAwarded: smallint("points_awarded").notNull().default(0),
  tAnswerMs: integer("t_answer_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const triviaItems = pgTable("trivia_items", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  stem: text("stem").notNull(),
  choices: text("choices").array().notNull(),
  correctIndex: smallint("correct_index").notNull(),
  dropIndex: smallint("drop_index").notNull(),
  hint9s: text("hint_9s").notNull(),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  explanation: text("explanation"),
  active: boolean("active").notNull().default(true),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const caseCards = pgTable("case_cards", {
  attemptId: text("attempt_id")
    .primaryKey()
    .references(() => attempts.id, { onDelete: "cascade" }),
  problemText: text("problem_text").notNull(),
  baselineValue: integer("baseline_value"),
  baselineUnit: text("baseline_unit"),
  targetValue: integer("target_value"),
  targetUnit: text("target_unit"),
  dueDate: date("due_date"),
  ownerRole: text("owner_role"),
  milestoneLabel: text("milestone_label"),
  milestoneDate: date("milestone_date"),
  usersAffected: integer("users_affected"),
  minutesSaved: integer("minutes_saved"),
  frequencyPerWeek: integer("frequency_per_week"),
  annualTimeHours: integer("annual_time_hours"),
  annualCostEst: integer("annual_cost_est"),
  dialClarity: smallint("dial_clarity"),
  dialImpact: smallint("dial_impact"),
  dialKpi: smallint("dial_kpi"),
  dialExecution: smallint("dial_execution"),
  dialConfidence: smallint("dial_confidence"),
  processFeatures: jsonb("process_features").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const raffleEntries = pgTable("raffle_entries", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleDate: date("raffle_date").notNull(),
  emailHash: text("email_hash").notNull(),
  category: text("category").notNull(),
  attemptId: text("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const raffleDraws = pgTable("raffle_draws", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  raffleDate: date("raffle_date").notNull().unique(),
  winnerEntryId: text("winner_entry_id").references(() => raffleEntries.id),
  rngSeed: text("rng_seed").notNull(),
  adminUser: text("admin_user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  announcedAt: timestamp("announced_at", { withTimezone: true }),
});

export const leaderboardCache = pgTable(
  "leaderboard_cache",
  {
    cacheDate: date("cache_date").notNull(),
    tab: text("tab").notNull(),
    payloadJson: jsonb("payload_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.cacheDate, table.tab] }),
  }),
);

export const alpha2026LeaderboardEntries = pgTable(
  "alpha_2026_leaderboard_entries",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    playerId: text("player_id").notNull(),
    displayName: text("display_name").notNull(),
    incidentId: text("incident_id").notNull(),
    score: integer("score").notNull(),
    elapsedSeconds: integer("elapsed_seconds").notNull(),
    responseStyle: text("response_style").notNull(),
    choiceIds: text("choice_ids").array().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (table) => ({
    playerIncident: uniqueIndex("alpha_2026_player_incident_idx").on(
      table.playerId,
      table.incidentId,
    ),
  }),
);

export const chatbotFeedback = pgTable("chatbot_feedback", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  emailHash: text("email_hash").references(() => users.emailHash),
  sessionToken: text("session_token"),
  category: text("category").notNull(),
  rating: smallint("rating").notNull(),
  message: text("message").notNull(),
  page: text("page").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const chatSessions = pgTable("chat_sessions", {
  token: text("token").primaryKey(),
  participantId: text("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  emailHash: text("email_hash").references(() => users.emailHash),
  category: text("category"),
  triviaAttemptId: text("trivia_attempt_id").references(() => attempts.id, { onDelete: "set null" }),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const wordCloudEntries = pgTable("word_cloud_entries", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  word: text("word").notNull().unique(),
  count: integer("count").notNull().default(1),
  source: text("source").notNull().default("manual"), // "manual" or "auto"
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`),
});

export const resetTimestamps = pgTable("reset_timestamps", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  scope: text("scope").notNull(), // 'global', 'leaderboard', 'raffle', 'word_cloud', 'scored_submissions', 'bot_bar'
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  adminUser: text("admin_user").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
});

export const insertData3StatSchema = createInsertSchema(data3Stats).omit({
  id: true,
  createdAt: true,
});

export const insertCustomCategorySchema = createInsertSchema(customCategories).omit({
  id: true,
  createdAt: true,
});

export const acceptTncSchema = z.object({
  accepted: z.boolean(),
});

export const startSessionSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
});

export const chatSchema = z.object({
  sessionToken: z.string(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
  sprintStep: z.number().optional(),
  category: z.string().optional(),
});

export const submitSolutionSchema = z.object({
  sessionToken: z.string(),
  category: z.enum(["NETWORKING", "SECURITY", "COLLABORATION", "DATA_CENTER"]).optional(), // Category now auto-assigned
  solutionText: z.string(),
  triviaAttemptId: z.string().optional(),
  structuredFields: z.object({
    problem_summary: z.string(),
    impact_summary: z.string(),
    chosen_category: z.string(),
    baseline_metrics: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })),
    target_metrics: z.array(z.object({
      name: z.string(),
      target: z.string(),
    })),
    action_plan: z.array(z.string()),
    success_checks: z.array(z.string()),
    risks: z.array(z.string()),
  }).optional(),
});

export const insertWordCloudEntrySchema = createInsertSchema(wordCloudEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResetTimestampSchema = createInsertSchema(resetTimestamps).omit({
  id: true,
  createdAt: true,
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertData3Stat = z.infer<typeof insertData3StatSchema>;
export type Data3Stat = typeof data3Stats.$inferSelect;
export type InsertCustomCategory = z.infer<typeof insertCustomCategorySchema>;
export type CustomCategory = typeof customCategories.$inferSelect;
export type User = typeof users.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;
export type TriviaItem = typeof triviaItems.$inferSelect;
export type CaseCard = typeof caseCards.$inferSelect;
export type RaffleEntry = typeof raffleEntries.$inferSelect;
export type RaffleDraw = typeof raffleDraws.$inferSelect;
export type ChatbotFeedback = typeof chatbotFeedback.$inferSelect;
export type InsertChatbotFeedback = typeof chatbotFeedback.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertWordCloudEntry = z.infer<typeof insertWordCloudEntrySchema>;
export type WordCloudEntry = typeof wordCloudEntries.$inferSelect;
export type InsertResetTimestamp = z.infer<typeof insertResetTimestampSchema>;
export type ResetTimestamp = typeof resetTimestamps.$inferSelect;
