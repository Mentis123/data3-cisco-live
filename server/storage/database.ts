import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "../../shared/schema.js";
import { eq, desc, sql, and, inArray, gt, isNull, lt, isNotNull } from "drizzle-orm";
import {
  participants,
  submissions,
  data3Stats,
  customCategories,
  users,
  attempts,
  answers,
  triviaItems,
  chatSessions,
} from "../../shared/schema.js";
import type {
  InsertParticipant,
  InsertSubmission,
  Participant,
  Submission,
  Data3Stat,
  InsertCustomCategory,
  CustomCategory,
  User,
  Attempt,
  Answer,
  InsertAnswer,
  TriviaItem,
  ChatSession,
} from "../../shared/schema.js";
import { createHash, randomUUID } from "crypto";

// Pre-populate Data#3 stats (using only system categories)
export const DEFAULT_DATA3_STATS = [
  { title: "Team Members", value: "1,500+", description: "Across Australia", category: "SCALE", displayOrder: 1 },
  { title: "Years in Business", value: "45+", description: "Trusted technology partner since 1978", category: "SCALE", displayOrder: 2 },
  { title: "Cisco Certifications", value: "500+", description: "Cisco certifications held across our national team", category: "EXPERTISE", displayOrder: 3 },
  { title: "Cisco Training Hours", value: "8K+", description: "Hours invested every year in Cisco enablement", category: "EXPERTISE", displayOrder: 4 },
  { title: "Cisco Specialisations", value: "30+", description: "Cisco specialisations spanning the full architecture", category: "EXPERTISE", displayOrder: 5 },
  { title: "Cisco Master Specialisations", value: "4", description: "Cisco Master specialisations recognising our depth", category: "EXPERTISE", displayOrder: 6 },
  { title: "Enterprise Customers", value: "8,000+", description: "From SMB to Fortune 500", category: "SCALE", displayOrder: 4 },
  { title: "Data Centres", value: "15+", description: "Sovereign cloud infrastructure", category: "GENERAL", displayOrder: 5 },
  { title: "Security Operations", value: "24/7", description: "Always-on threat monitoring", category: "GENERAL", displayOrder: 6 },
  { title: "Cloud Migrations", value: "2,000+", description: "Successful digital transformations", category: "GENERAL", displayOrder: 7 },
  { title: "Network Endpoints", value: "1M+", description: "Devices under management", category: "GENERAL", displayOrder: 8 },
  { title: "Annual Revenue", value: "$1.8B+", description: "Sustained growth and investment", category: "SCALE", displayOrder: 10 }
];

type TriviaMode = "dojo" | "ring";

interface StartTriviaAttemptOptions {
  category: string;
  mode: TriviaMode;
  email?: string;
  marketingOptIn?: boolean;
  playerProfile?: Pick<User, "firstName" | "lastName" | "company" | "role">;
  deckSize?: number;
}

interface TriviaAnswerInput {
  itemId: string;
  choiceIndex: number;
  elapsedMs: number;
}

interface CompleteTriviaAttemptOptions {
  attemptId: string;
  answers: TriviaAnswerInput[];
}

interface TriviaCardPayload {
  id: string;
  category: string;
  stem: string;
  choices: string[];
  correctIndex: number;
  dropIndex: number;
  hint9s: string;
  difficulty: number;
  tags: string[];
  explanation: string | null;
  version: number;
}

interface TriviaCardSummary extends TriviaCardPayload {
  selectedIndex: number;
  correct: boolean;
  points: number;
  elapsedMs: number;
}

interface TriviaAttemptResult {
  attempt: Attempt;
  cards: TriviaCardPayload[];
  snapshot: TriviaCardSnapshot;
}

type TriviaCardSnapshot = Array<{
  itemId: string;
  choices: string[];
  correctIndex: number;
  dropIndex: number;
}>;

const TRIVIA_TARGETS: Record<number, number> = { 1: 1, 2: 3, 3: 1 };
const TRIVIA_ROUND_SIZE = 5;
const MAX_TRIVIA_TIME_MS = 15_000; // 15 seconds to match frontend timer
const ACTIVE_RING_WINDOW_MINUTES = 15;

type SessionMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function parseSubScores(value: unknown): Record<string, number> | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(parsed).map(([key, score]) => [key, typeof score === "number" ? score : 0])
      );
    } catch {
      return null;
    }
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, score]) => [key, typeof score === "number" ? score : 0])
    );
  }

  return null;
}

function calculatePitchScore(subScores: unknown): number {
  const parsed = parseSubScores(subScores);
  if (!parsed) {
    return 0;
  }

  return Object.values(parsed).reduce((sum, score) => sum + score, 0);
}

interface PersistedChatSession {
  token: string;
  participantId: string;
  emailHash: string | null;
  category: string | null;
  triviaAttemptId: string | null;
  messages: SessionMessage[];
}

async function ensureTriviaSchema(db: NeonDatabase<typeof schema>) {
  try {
    // Ensure pgcrypto is available for gen_random_uuid defaults. Some environments (including
    // freshly provisioned Neon projects) do not enable it automatically which causes insert
    // statements to fail with "function gen_random_uuid() does not exist". Creating the
    // extension up front is idempotent and guarantees that the UUID defaults defined in our
    // schema succeed even if the database migrations have not been executed yet.
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Ensure a minimal users table exists. Production databases that were created prior to the
    // trivia rework were missing the table entirely which meant we could not hash and persist
    // ring-mode competitors. Rather than relying on an external migration step, create the
    // table on startup when it is absent so that trivia attempts can be recorded reliably.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "email_hash" text NOT NULL UNIQUE,
        "first_name" text,
        "last_name" text,
        "company" text,
        "role" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(
      sql`ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "marketing_opt_in" boolean NOT NULL DEFAULT false`,
    );
    await db.execute(sql`ALTER TABLE "attempts" ALTER COLUMN "marketing_opt_in" SET DEFAULT false`);

    await db.execute(
      sql`ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "consent_captured_at" timestamptz`,
    );

    // Fix attempt_day timezone to use Melbourne time instead of UTC
    // This ensures daily resets happen at midnight Melbourne time, matching the app logic
    // First, check if the column exists and has the wrong timezone
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          -- Check if attempt_day exists and is using UTC (wrong timezone)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'attempts' AND column_name = 'attempt_day'
          ) THEN
            -- Drop and recreate with Melbourne timezone
            ALTER TABLE attempts DROP COLUMN IF EXISTS attempt_day;
          END IF;
        END $$;
      `);

      // Create attempt_day with Melbourne timezone
      await db.execute(sql`
        ALTER TABLE "attempts"
        ADD COLUMN IF NOT EXISTS "attempt_day" date
        GENERATED ALWAYS AS (DATE(started_at AT TIME ZONE 'Australia/Melbourne')) STORED
      `);
    } catch (error) {
      console.error("[db] Failed to fix attempt_day timezone:", error);
    }

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_attempts_ring_daily"
      ON "attempts" ("email_hash", "category", "attempt_day")
      WHERE "mode" = 'ring'
    `);
    await db.execute(sql`ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "bot_bar" integer`);
    await db.execute(
      sql`ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "card_set_version" integer DEFAULT 1`,
    );
    await db.execute(sql`ALTER TABLE "attempts" ALTER COLUMN "card_set_version" SET DEFAULT 1`);
    await db.execute(sql`ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "deck_snapshot" jsonb`);
    await db.execute(sql`ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "submission_id" text`);

    await db.execute(sql`
      DO $$
      BEGIN
        ALTER TABLE "attempts"
        ADD CONSTRAINT "attempts_submission_id_fkey"
        FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
      $$;
    `);

    // Add announced_on_leaderboard column to submissions table
    await db.execute(sql`
      ALTER TABLE "submissions"
        ADD COLUMN IF NOT EXISTS "announced_on_leaderboard" boolean NOT NULL DEFAULT false
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_submissions_announced" ON "submissions"("announced_on_leaderboard")
    `);

    await db.execute(
      sql`ALTER TABLE "answers" ADD COLUMN IF NOT EXISTS "points_awarded" smallint NOT NULL DEFAULT 0`,
    );
    await db.execute(sql`ALTER TABLE "answers" ALTER COLUMN "points_awarded" SET DEFAULT 0`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "raffle_entries" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "raffle_date" date NOT NULL,
        "email_hash" text NOT NULL,
        "category" text NOT NULL,
        "attempt_id" text NOT NULL REFERENCES "attempts"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_raffle_entries_date" ON "raffle_entries" ("raffle_date")
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_raffle_entries_unique"
      ON "raffle_entries" ("raffle_date", "email_hash", "category")
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "raffle_draws" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "raffle_date" date NOT NULL UNIQUE,
        "winner_entry_id" text REFERENCES "raffle_entries"("id"),
        "rng_seed" text NOT NULL,
        "admin_user" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "word_cloud_entries" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "word" text NOT NULL,
        "count" integer NOT NULL DEFAULT 1,
        "source" text NOT NULL DEFAULT 'manual',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_word_cloud_entries_active" ON "word_cloud_entries" ("active")
    `);

    // Ensure trivia_items table exists
    // Note: The table should be populated via the beta admin interface or proper migrations.
    // Do NOT auto-seed from JSON files on startup as this can cause issues in production.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "trivia_items" (
        "id" text PRIMARY KEY,
        "category" text NOT NULL,
        "stem" text NOT NULL,
        "choices" text[] NOT NULL,
        "correct_index" smallint NOT NULL,
        "drop_index" smallint NOT NULL,
        "hint_9s" text NOT NULL,
        "difficulty" smallint NOT NULL,
        "tags" text[] DEFAULT '{}'::text[],
        "explanation" text,
        "active" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  } catch (error) {
    console.error("[db] Failed to ensure trivia schema:", error);
  }
}

// Initialize stats on startup (development only)
async function initializeData(db: NeonDatabase<typeof schema>) {
  // Only initialize default data in development mode
  // Production should maintain its own data
  if (process.env.NODE_ENV === 'production') {
    console.log("Running in production - skipping default data initialization");
    return;
  }
  
  try {
    // Initialize stats
    const existingStats = await db.select().from(data3Stats);
    if (existingStats.length === 0) {
      await db.insert(data3Stats).values(DEFAULT_DATA3_STATS);
      console.log("Data#3 stats initialized (development mode)");
    }
    
    // NOTE: Custom categories are no longer auto-initialized
    // Only system categories (GENERAL, SCALE, EXPERTISE, SECURE_CONNECTIVITY, etc.) are used
  } catch (e) {
    console.error("Error initializing data:", e);
  }
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function computeAttemptDay(date: Date): string {
  // Use Melbourne timezone for daily resets
  return getMelbourneDate(date);
}

function parseSessionMessages(value: unknown): SessionMessage[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const role = (entry as { role?: string }).role;
        const content = (entry as { content?: unknown }).content;
        if (
          (role === "user" || role === "assistant" || role === "system") &&
          typeof content === "string"
        ) {
          return { role, content } satisfies SessionMessage;
        }
        return null;
      })
      .filter((item): item is SessionMessage => Boolean(item));
  }

  if (typeof value === "string") {
    try {
      return parseSessionMessages(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (typeof value === "object" && value != null && "value" in value) {
    return parseSessionMessages((value as { value: unknown }).value);
  }

  return [];
}

function parseDeckSnapshot(value: unknown): TriviaCardSnapshot | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return parseDeckSnapshot(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    const result: TriviaCardSnapshot = [];
    for (const entry of value) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const item = entry as Record<string, unknown>;
      const itemId = typeof item.itemId === "string" ? item.itemId : null;
      const choices = Array.isArray(item.choices)
        ? item.choices.filter((choice): choice is string => typeof choice === "string")
        : null;
      const correctIndex = typeof item.correctIndex === "number" ? item.correctIndex : null;
      const dropIndex = typeof item.dropIndex === "number" ? item.dropIndex : null;

      if (!itemId || !choices) {
        continue;
      }

      result.push({
        itemId,
        choices,
        correctIndex: correctIndex ?? 0,
        dropIndex: dropIndex ?? 0,
      });
    }

    return result.length ? result : null;
  }

  if (typeof value === "object" && value != null && "value" in value) {
    return parseDeckSnapshot((value as { value: unknown }).value);
  }

  return null;
}

function mapChatSession(row: ChatSession): PersistedChatSession {
  return {
    token: row.token,
    participantId: row.participantId,
    emailHash: row.emailHash ?? null,
    category: row.category ?? null,
    triviaAttemptId: row.triviaAttemptId ?? null,
    messages: parseSessionMessages(row.messages),
  };
}

// Define system category names that are reserved and cannot be used for custom categories
export const SYSTEM_CATEGORY_NAMES = [
  'GENERAL',
  'SCALE',
  'EXPERTISE',
  'SECURE_CONNECTIVITY',
  'HYBRID_DC',
  'COLLAB_CX',
  'OBSERVABILITY',
  'EDGE_IOT'
] as const;

export function createDatabaseStorage(db: NeonDatabase<typeof schema>) {
  void ensureTriviaSchema(db);
  void initializeData(db);

  const normalizeProfile = (
    profile: StartTriviaAttemptOptions["playerProfile"],
  ): Partial<User> => {
    if (!profile) {
      return {};
    }

    const result: Partial<User> = {};
    if (profile.firstName) result.firstName = profile.firstName;
    if (profile.lastName) result.lastName = profile.lastName;
    if (profile.company) result.company = profile.company;
    if (profile.role) result.role = profile.role;
    return result;
  };

  const ensureUserRecord = async (
    email: string | undefined,
    profile: StartTriviaAttemptOptions["playerProfile"],
  ): Promise<{ user: User | null; emailHash: string | null }> => {
    if (!email) {
      return { user: null, emailHash: null };
    }

    const normalizedProfile = normalizeProfile(profile);
    const emailHash = hashEmail(email);

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.emailHash, emailHash));

    if (existing) {
      if (Object.keys(normalizedProfile).length > 0) {
        await db.update(users).set({ ...normalizedProfile, email }).where(eq(users.emailHash, emailHash));
        return { user: { ...existing, ...normalizedProfile, email }, emailHash };
      }
      return { user: existing, emailHash };
    }

    const [created] = await db
      .insert(users)
      .values({ emailHash, email, ...normalizedProfile })
      .returning();
    return { user: created, emailHash };
  };

  const buildTriviaDeck = async (
    category: string,
    deckSize: number = TRIVIA_ROUND_SIZE,
  ): Promise<{ cards: TriviaCardPayload[]; snapshot: TriviaCardSnapshot; maxVersion: number }> => {
    const rawItems = await db
      .select()
      .from(triviaItems)
      .where(and(eq(triviaItems.category, category), eq(triviaItems.active, true)));

    if (!rawItems.length) {
      throw new Error(`No trivia items available for category ${category}`);
    }

    const byDifficulty = new Map<number, TriviaItem[]>();
    for (const item of rawItems) {
      const diff = item.difficulty ?? 2;
      const bucket = byDifficulty.get(diff) ?? [];
      bucket.push(item);
      byDifficulty.set(diff, bucket);
    }

    const selected: TriviaItem[] = [];
    const leftover: TriviaItem[] = [];

    for (const [difficulty, target] of Object.entries(TRIVIA_TARGETS)) {
      const diff = Number(difficulty);
      const bucket = shuffleArray(byDifficulty.get(diff) ?? []);
      const required = target as number;
      for (let i = 0; i < bucket.length; i++) {
        if (selected.length < deckSize && i < required) {
          selected.push(bucket[i]!);
        } else {
          leftover.push(bucket[i]!);
        }
      }
    }

    if (selected.length < deckSize) {
      const filler = shuffleArray(leftover);
      for (const item of filler) {
        if (selected.length >= deckSize) break;
        selected.push(item);
      }
    }

    if (selected.length < deckSize) {
      throw new Error(`Insufficient trivia items to build a deck for ${category}`);
    }

    const deck = shuffleArray(selected.slice(0, deckSize));

    const cards: TriviaCardPayload[] = [];
    const snapshot: TriviaCardSnapshot = [];
    let maxVersion = 1;

    for (const item of deck) {
      const baseChoices = Array.isArray(item.choices) ? item.choices : [];
      if (baseChoices.length === 0) {
        continue;
      }

      const randomized = shuffleArray(
        baseChoices.map((choice, index) => ({ choice, index })),
      );
      const choices = randomized.map((entry) => entry.choice);
      const correctIndex = randomized.findIndex((entry) => entry.index === item.correctIndex);
      const dropIndex = randomized.findIndex((entry) => entry.index === item.dropIndex);

      cards.push({
        id: item.id,
        category: item.category,
        stem: item.stem,
        choices,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        dropIndex: dropIndex >= 0 ? dropIndex : 0,
        hint9s: item.hint9s,
        difficulty: item.difficulty ?? 2,
        tags: Array.isArray(item.tags) ? item.tags : [],
        explanation: item.explanation ?? null,
        version: item.version ?? 1,
      });

      snapshot.push({
        itemId: item.id,
        choices,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        dropIndex: dropIndex >= 0 ? dropIndex : 0,
      });

      if (item.version && item.version > maxVersion) {
        maxVersion = item.version;
      }
    }

    if (cards.length < deckSize) {
      throw new Error(`Failed to construct trivia deck for ${category}`);
    }

    return { cards, snapshot, maxVersion };
  };

  const rehydrateTriviaDeck = async (snapshot: TriviaCardSnapshot): Promise<TriviaCardPayload[]> => {
    if (!snapshot.length) {
      return [];
    }

    const itemIds = Array.from(new Set(snapshot.map((entry) => entry.itemId)));
    const items = await db
      .select()
      .from(triviaItems)
      .where(inArray(triviaItems.id, itemIds));
    const itemMap = new Map(items.map((item) => [item.id, item]));

    const cards: TriviaCardPayload[] = [];
    for (const entry of snapshot) {
      const item = itemMap.get(entry.itemId);
      if (!item) {
        throw new Error(`Failed to rehydrate trivia card ${entry.itemId}`);
      }

      cards.push({
        id: item.id,
        category: item.category,
        stem: item.stem,
        choices: entry.choices,
        correctIndex: typeof entry.correctIndex === "number" ? entry.correctIndex : 0,
        dropIndex: typeof entry.dropIndex === "number" ? entry.dropIndex : 0,
        hint9s: item.hint9s,
        difficulty: item.difficulty ?? 2,
        tags: Array.isArray(item.tags) ? item.tags : [],
        explanation: item.explanation ?? null,
        version: item.version ?? 1,
      });
    }

    return cards;
  };

  return {
    async createChatSession({
      participantId,
      emailHash = null,
      category = null,
      triviaAttemptId = null,
      messages = [],
      token,
    }: {
      participantId: string;
      emailHash?: string | null;
      category?: string | null;
      triviaAttemptId?: string | null;
      messages?: SessionMessage[];
      token?: string;
    }): Promise<PersistedChatSession> {
      const sessionToken = token ?? randomUUID();
      const [row] = await db
        .insert(chatSessions)
        .values({
          token: sessionToken,
          participantId,
          emailHash,
          category,
          triviaAttemptId,
          messages: JSON.stringify(messages ?? []),
        })
        .returning();

      return mapChatSession(row);
    },

    async getChatSession(token: string): Promise<PersistedChatSession | null> {
      const [row] = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.token, token))
        .limit(1);

      if (!row) {
        return null;
      }

      return mapChatSession(row);
    },

    async updateChatSession(
      token: string,
      updates: Partial<
        Pick<PersistedChatSession, "messages" | "category" | "triviaAttemptId" | "emailHash">
      >,
    ): Promise<PersistedChatSession | null> {
      const updatePayload: Record<string, unknown> = { updatedAt: sql`now()` };

      if (Object.prototype.hasOwnProperty.call(updates, "messages")) {
        updatePayload.messages = JSON.stringify(updates.messages ?? []);
      }

      if (Object.prototype.hasOwnProperty.call(updates, "category")) {
        updatePayload.category = updates.category ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, "triviaAttemptId")) {
        updatePayload.triviaAttemptId = updates.triviaAttemptId ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, "emailHash")) {
        updatePayload.emailHash = updates.emailHash ?? null;
      }

      const [row] = await db
        .update(chatSessions)
        .set(updatePayload)
        .where(eq(chatSessions.token, token))
        .returning();

      return row ? mapChatSession(row) : null;
    },

    async deleteChatSession(token: string): Promise<void> {
      await db.delete(chatSessions).where(eq(chatSessions.token, token));
    },

    async getTriviaCategories() {
      const rows = await db
        .select({
          category: triviaItems.category,
          difficulty: triviaItems.difficulty,
          count: sql<number>`count(*)`,
        })
        .from(triviaItems)
        .where(eq(triviaItems.active, true))
        .groupBy(triviaItems.category, triviaItems.difficulty);

      const summary = new Map<
        string,
        { category: string; total: number; easy: number; medium: number; hard: number }
      >();

      for (const row of rows) {
        const category = row.category;
        const entry =
          summary.get(category) ?? {
            category,
            total: 0,
            easy: 0,
            medium: 0,
            hard: 0,
          };

        entry.total += Number(row.count ?? 0);
        const difficulty = row.difficulty ?? 2;
        if (difficulty === 1) entry.easy += Number(row.count ?? 0);
        else if (difficulty === 2) entry.medium += Number(row.count ?? 0);
        else entry.hard += Number(row.count ?? 0);

        summary.set(category, entry);
      }

      return Array.from(summary.values()).sort((a, b) => a.category.localeCompare(b.category));
    },

    async getPracticeTriviaDeck(category: string, deckSize?: number) {
      const { cards } = await buildTriviaDeck(category, deckSize);
      return { cards } satisfies { cards: TriviaCardPayload[] };
    },

    async startTriviaAttempt(options: StartTriviaAttemptOptions) {
      const deckSize = options.deckSize ?? TRIVIA_ROUND_SIZE;
      const { emailHash } = await ensureUserRecord(options.email, options.playerProfile);
      const now = new Date();
      const attemptDay = computeAttemptDay(now);

      const loadExistingRingAttempt = async (): Promise<Attempt | null> => {
        if (!emailHash) {
          return null;
        }

        const [existing] = await db
          .select()
          .from(attempts)
          .where(
            and(
              eq(attempts.mode, "ring"),
              eq(attempts.emailHash, emailHash),
              eq(attempts.category, options.category),
              eq(attempts.attemptDay, attemptDay),
            ),
          )
          .orderBy(desc(attempts.startedAt))
          .limit(1);

        return existing ?? null;
      };

      const duplicateAttemptError = () => {
        const err = new Error(
          "You have already completed your run for this category today. Please select a different technology track if available.",
        ) as Error & { code?: string };
        err.code = "ALREADY_SUBMITTED";
        return err;
      };

      if (options.mode === "ring" && emailHash) {
        const existingAttempt = await loadExistingRingAttempt();
        if (existingAttempt) {
          if (existingAttempt.endedAt) {
            throw duplicateAttemptError();
          }

          const existingSnapshot = parseDeckSnapshot(existingAttempt.deckSnapshot);
          if (!existingSnapshot) {
            throw new Error(`Existing trivia attempt ${existingAttempt.id} is missing a deck snapshot`);
          }

          const cards = await rehydrateTriviaDeck(existingSnapshot);

          return { attempt: existingAttempt, cards, snapshot: existingSnapshot } satisfies TriviaAttemptResult;
        }
      }

      const { cards, snapshot, maxVersion } = await buildTriviaDeck(options.category, deckSize);

      try {
        const [attempt] = await db
          .insert(attempts)
          .values({
            emailHash,
            category: options.category,
            mode: options.mode,
            marketingOptIn: !!options.marketingOptIn,
            cardSetVersion: maxVersion,
            deckSnapshot: snapshot,
            // attemptDay is a GENERATED column in the database, computed from started_at
          })
          .returning();

        if (!attempt) {
          throw new Error("Failed to create trivia attempt");
        }

        return { attempt, cards, snapshot } satisfies TriviaAttemptResult;
      } catch (error) {
        if (options.mode === "ring" && emailHash && (error as { code?: string }).code === "23505") {
          const existingAttempt = await loadExistingRingAttempt();
          if (existingAttempt) {
            if (existingAttempt.endedAt) {
              throw duplicateAttemptError();
            }

            const existingSnapshot = parseDeckSnapshot(existingAttempt.deckSnapshot);
            if (!existingSnapshot) {
              throw error;
            }

            const existingCards = await rehydrateTriviaDeck(existingSnapshot);

            return {
              attempt: existingAttempt,
              cards: existingCards,
              snapshot: existingSnapshot,
            } satisfies TriviaAttemptResult;
          }
        }

        throw error;
      }
    },

    async completeTriviaAttempt(options: CompleteTriviaAttemptOptions) {
      if (!options.answers.length) {
        throw new Error("No answers provided for trivia attempt completion");
      }

      return await db.transaction(async (tx) => {
        const [attempt] = await tx.select().from(attempts).where(eq(attempts.id, options.attemptId));

        if (!attempt) {
          throw new Error("Trivia attempt not found");
        }

        if (attempt.endedAt) {
          throw new Error("Trivia attempt already completed");
        }

        const snapshotRaw = Array.isArray(attempt.deckSnapshot)
          ? (attempt.deckSnapshot as TriviaCardSnapshot)
          : [];
        const snapshotMap = new Map(snapshotRaw.map((entry) => [entry.itemId, entry]));
        const cardIds = Array.from(new Set(options.answers.map((answer) => answer.itemId)));

        const cards = cardIds.length
          ? await tx.select().from(triviaItems).where(inArray(triviaItems.id, cardIds))
          : [];
        const cardMap = new Map(cards.map((item) => [item.id, item]));

        const answerRecords: InsertAnswer[] = [];
        const summaries: TriviaCardSummary[] = [];
        let totalScore = 0;
        let correctTimeTotal = 0;
        let correctCount = 0;

        for (const submission of options.answers) {
          const snapshot = snapshotMap.get(submission.itemId);
          const item = cardMap.get(submission.itemId);

          if (!snapshot || !item) {
            throw new Error(`Invalid trivia card ${submission.itemId} for attempt ${options.attemptId}`);
          }

          const selectedIndex = Number.isInteger(submission.choiceIndex)
            ? submission.choiceIndex
            : -1;
          const elapsedMs = Math.max(
            0,
            Math.min(MAX_TRIVIA_TIME_MS, submission.elapsedMs ?? MAX_TRIVIA_TIME_MS),
          );
          const correct = selectedIndex === snapshot.correctIndex;
          let points = 0;
          if (correct) {
            // Aligned with frontend: 0-5s=12pts, 5-10s=8pts, 10-15s=4pts
            if (elapsedMs <= 5000) points = 12;
            else if (elapsedMs <= 10000) points = 8;
            else if (elapsedMs <= MAX_TRIVIA_TIME_MS) points = 4;
          }

          totalScore += points;
          if (correct) {
            correctTimeTotal += elapsedMs;
            correctCount += 1;
          }

          answerRecords.push({
            attemptId: options.attemptId,
            itemId: submission.itemId,
            choiceIndex: selectedIndex,
            correct,
            pointsAwarded: points,
            tAnswerMs: elapsedMs,
          });

          summaries.push({
            id: item.id,
            category: item.category,
            stem: item.stem,
            choices: snapshot.choices,
            correctIndex: snapshot.correctIndex,
            dropIndex: snapshot.dropIndex,
            hint9s: item.hint9s,
            difficulty: item.difficulty ?? 2,
            tags: Array.isArray(item.tags) ? item.tags : [],
            explanation: item.explanation ?? null,
            version: item.version ?? 1,
            selectedIndex,
            correct,
            points,
            elapsedMs,
          });
        }

        if (answerRecords.length) {
          await tx.delete(answers).where(eq(answers.attemptId, options.attemptId));
          await tx.insert(answers).values(answerRecords);
        }

        const avgCorrect = correctCount > 0 ? Math.round(correctTimeTotal / correctCount) : null;
        const endedAt = new Date();
        // Trivia pass threshold: 40% of 60 points = 24 points
        const passed = totalScore >= 24;
        // Eligibility will be determined at submission time based on total score (trivia + pitch) vs bot bar
        const eligible = false;

        const [updated] = await tx
          .update(attempts)
          .set({
            triviaScore: totalScore,
            totalScore,
            endedAt,
            passed,
            eligible,
            avgCorrectTimeMs: avgCorrect,
          })
          .where(eq(attempts.id, options.attemptId))
          .returning();

        const attemptRecord =
          updated ?? {
            ...attempt,
            totalScore,
            endedAt,
            passed,
            eligible,
            avgCorrectTimeMs: avgCorrect,
          };

        return { attempt: attemptRecord, summary: summaries, totalScore };
      });
    },

    async createParticipant(data: InsertParticipant): Promise<Participant> {
    const [result] = await db.insert(participants).values(data).returning();
    return result;
  },

    async getParticipant(id: string): Promise<Participant | null> {
    const [result] = await db.select().from(participants).where(eq(participants.id, id));
    return result || null;
  },

    async ensureUser(data: { email: string; firstName?: string; lastName?: string }): Promise<User> {
      const { user } = await ensureUserRecord(data.email, {
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        company: null,
        role: null,
      });
      if (!user) {
        throw new Error("Failed to create or retrieve user");
      }
      return user;
    },

    async calculateBotBar(category: string, dateStr: string): Promise<number> {
      // Get all completed ring attempts for this category on this date
      const completedAttempts = await db
        .select({
          attemptId: attempts.id,
          triviaScore: sql<number>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0)`,
          subScores: submissions.subScores,
        })
        .from(attempts)
        .leftJoin(submissions, eq(attempts.submissionId, submissions.id))
        .where(
          and(
            eq(attempts.category, category),
            eq(attempts.mode, "ring"),
            eq(attempts.passed, true),
            sql`DATE(${attempts.startedAt} AT TIME ZONE 'Australia/Melbourne') = ${dateStr}`,
            sql`${submissions.id} IS NOT NULL` // Only include attempts with completed submissions
          )
        );

      // Need at least 5 completed submissions to use dynamic bot bar
      const MINIMUM_SUBMISSIONS = 5;
      const FALLBACK_BOT_BAR = 60; // 60% of 100 points

      if (completedAttempts.length < MINIMUM_SUBMISSIONS) {
        return FALLBACK_BOT_BAR;
      }

      // Calculate combined scores (trivia + pitch)
      const combinedScores = completedAttempts.map((attempt) => {
        const triviaScore = attempt.triviaScore || 0;
        const pitchScore = calculatePitchScore(attempt.subScores);
        return triviaScore + pitchScore;
      });

      // Sort and find median
      combinedScores.sort((a, b) => a - b);
      const midpoint = Math.floor(combinedScores.length / 2);

      if (combinedScores.length % 2 === 0) {
        // Even number of scores: average the two middle values
        return Math.round((combinedScores[midpoint - 1]! + combinedScores[midpoint]!) / 2);
      } else {
        // Odd number of scores: return the middle value
        return combinedScores[midpoint]!;
      }
    },

    async getTriviaAttempt(attemptId: string): Promise<Attempt | null> {
      const [attempt] = await db
        .select()
        .from(attempts)
        .where(eq(attempts.id, attemptId));

      return attempt || null;
    },

    async updateTriviaAttemptBotBar(
      attemptId: string,
      botBar: number,
      eligible: boolean,
      combinedScore?: number,
    ): Promise<void> {
      const updateData: { botBar: number; eligible: boolean; totalScore?: number } = { botBar, eligible };
      if (typeof combinedScore === "number" && Number.isFinite(combinedScore)) {
        updateData.totalScore = Math.round(combinedScore);
      }

      await db
        .update(attempts)
        .set(updateData)
        .where(eq(attempts.id, attemptId));
    },

    async checkExistingDailyAttempt(
      emailHash: string | null,
      category: string,
      attemptDay: string
    ): Promise<Attempt | null> {
      if (!emailHash) {
        return null;
      }

      const [existing] = await db
        .select()
        .from(attempts)
        .where(
          and(
            eq(attempts.emailHash, emailHash),
            eq(attempts.category, category),
            sql`DATE(${attempts.startedAt} AT TIME ZONE 'Australia/Melbourne') = ${attemptDay}`,
          )
        );

      return existing || null;
    },

    async checkExistingRaffleEntry(
      emailHash: string | null,
      category: string,
      raffleDate: string
    ): Promise<boolean> {
      if (!emailHash) {
        return false;
      }

      const existing = await db
        .select()
        .from(schema.raffleEntries)
        .where(
          and(
            eq(schema.raffleEntries.emailHash, emailHash),
            eq(schema.raffleEntries.category, category),
            eq(schema.raffleEntries.raffleDate, raffleDate)
          )
        );

      return existing.length > 0;
    },

    async createRaffleEntry(data: {
      emailHash: string;
      category: string;
      attemptId: string;
      raffleDate: string;
    }): Promise<{ success: boolean; alreadyExists?: boolean }> {
      // Check if entry already exists for this email/category/date (enforced by unique index)
      const existing = await db
        .select()
        .from(schema.raffleEntries)
        .where(
          and(
            eq(schema.raffleEntries.emailHash, data.emailHash),
            eq(schema.raffleEntries.category, data.category),
            eq(schema.raffleEntries.raffleDate, data.raffleDate)
          )
        );

      if (existing.length > 0) {
        return { success: false, alreadyExists: true };
      }

      // Create new raffle entry
      await db.insert(schema.raffleEntries).values({
        emailHash: data.emailHash,
        category: data.category,
        attemptId: data.attemptId,
        raffleDate: data.raffleDate,
      });

      return { success: true };
    },

    async createSubmission(data: InsertSubmission): Promise<Submission> {
      const [result] = await db.insert(submissions).values(data).returning();
      return result;
    },

    async updateSubmissionTotalScore(id: string, totalScore: number): Promise<void> {
      await db
        .update(submissions)
        .set({ totalScore })
        .where(eq(submissions.id, id));
    },

    async attachSubmissionToTriviaAttempt(attemptId: string, submissionId: string): Promise<void> {
    const updated = await db
      .update(attempts)
      .set({ submissionId })
      .where(eq(attempts.id, attemptId))
      .returning({ id: attempts.id });

    if (!updated.length) {
      throw new Error(`Trivia attempt ${attemptId} not found`);
    }
  },

    async markSubmissionAsAnnounced(submissionId: string): Promise<void> {
      await db
        .update(submissions)
        .set({ announcedOnLeaderboard: true })
        .where(eq(submissions.id, submissionId));
    },

    async getLeaderboard(limit: number = 100, category?: string, filterDate?: string, includeUnannounced: boolean = false): Promise<any[]> {
    let query = db
      .select({
        id: submissions.id,
        totalScore: submissions.totalScore,
        category: submissions.category,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || substr(${participants.lastName}, 1, 1) || '.'`,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .orderBy(desc(submissions.totalScore), submissions.createdAt)
      .limit(limit);

    // Build WHERE conditions
    const conditions = [];

    // Only filter by announcedOnLeaderboard if we're not including unannounced submissions
    if (!includeUnannounced) {
      conditions.push(eq(submissions.announcedOnLeaderboard, true));
    }

    if (filterDate) {
      // Filter by date portion of createdAt timestamp using Melbourne timezone
      conditions.push(
        sql`DATE(${submissions.createdAt} AT TIME ZONE 'Australia/Melbourne') = ${filterDate}`,
      );
    }

    if (category) {
      conditions.push(eq(submissions.category, category));
    }

    if (conditions.length > 0) {
      return await query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    return await query;
  },

    async getSubmission(id: string): Promise<any> {
    const combinedScoreExpr = sql<number>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`;

    const [result] = await db
      .select({
        id: submissions.id,
        participantId: submissions.participantId,
        category: submissions.category,
        solutionText: submissions.solutionText,
        structuredJson: submissions.structuredJson,
        subScores: submissions.subScores,
        pitchScore: submissions.totalScore,
        triviaScore: sql<number | null>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore})`,
        combinedScore: combinedScoreExpr,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || substr(${participants.lastName}, 1, 1) || '.'`,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .leftJoin(attempts, eq(attempts.submissionId, submissions.id))
      .where(eq(submissions.id, id));
    
    if (!result) return null;
    
    // Parse JSON strings for subScores and structuredJson
    return {
        ...result,
        totalScore: result.combinedScore,
        subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
        structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
    };
  },

    async getAdminLeaderboard(limit: number = 100, filterDate?: string): Promise<any[]> {
    const combinedScoreExpr = sql<number>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`;

    const baseQuery = db
      .select({
        id: submissions.id,
        category: submissions.category,
        solutionText: submissions.solutionText,
        structuredJson: submissions.structuredJson,
        subScores: submissions.subScores,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || ${participants.lastName}`,
        pitchScore: submissions.totalScore,
        triviaScore: sql<number | null>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore})`,
        combinedScore: combinedScoreExpr,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .leftJoin(attempts, eq(attempts.submissionId, submissions.id));

    // Build the query with optional where clause
    const results = filterDate
      ? await baseQuery
          .where(
            sql`DATE(${submissions.createdAt} AT TIME ZONE 'Australia/Melbourne') = ${filterDate}`,
          )
          .orderBy(
            desc(sql`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`),
            submissions.createdAt
          )
          .limit(limit)
      : await baseQuery
          .orderBy(
            desc(sql`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`),
            submissions.createdAt
          )
          .limit(limit);

    // Parse JSON strings for each result
    return results.map(result => ({
      ...result,
      totalScore: result.combinedScore,
      subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
      structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
    }));
  },

    async getWordCloudData(): Promise<{ text: string; value: number }[]> {
    // Fetch word cloud data from database (this is the primary source now)
    // Data can be synced from submissions using the syncWordCloudFromSubmissions() function
    try {
      const entries = await db
        .select()
        .from(schema.wordCloudEntries)
        .where(eq(schema.wordCloudEntries.active, true))
        .orderBy(desc(schema.wordCloudEntries.count));

      // If we have entries in the database, use them
      if (entries.length > 0) {
        return entries
          .map(entry => ({ text: entry.word, value: entry.count }))
          .slice(0, 30);
      }

      // Fallback: if no entries exist, generate from submissions (backward compatibility)
      console.log('[getWordCloudData] No entries in database, generating from submissions as fallback');
      const allSubmissions = await db.select().from(submissions);

    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'from', 'this', 'have', 'their', 'about', 'into', 'your',
      'when', 'where', 'which', 'will', 'need', 'needs', 'they', 'them', 'over', 'under', 'while',
      'after', 'before', 'because', 'ensure', 'teams', 'users', 'staff', 'team', 'user', 'people',
      'per', 'week', 'weeks', 'month', 'months', 'year', 'years', 'each', 'every', 'daily', 'weekly',
      'solution', 'solutions', 'problem', 'problems', 'impact', 'summary', 'baseline', 'target',
      'targets', 'kpi', 'kpis', 'plan', 'plans', 'action', 'actions', 'risk', 'risks', 'success',
      'check', 'checks', 'business', 'customer', 'customers', 'experience', 'experiences', 'operations',
      'operation', 'operational', 'strategy', 'strategies', 'architecture', 'architectures', 'teams',
      'team', 'leader', 'leaders', 'program', 'programs', 'enablement', 'visibility', 'governance',
      'process', 'processes', 'automation', 'automated', 'monitoring', 'performance', 'delivery',
      'services', 'service', 'environment', 'environments', 'employee', 'employees', 'site', 'sites',
      'deployment', 'deployments', 'deploy', 'deploying', 'rollout', 'rollouts', 'phase', 'phases',
      'global', 'regional', 'improve', 'improves', 'improved', 'improving', 'increase', 'increases',
      'increased', 'reduces', 'reduced', 'reducing', 'reduction', 'reductions', 'optimize',
      'optimise', 'optimised', 'optimizing', 'optimising', 'system', 'systems', 'application',
      'applications', 'apps', 'app', 'cloud', 'digital', 'data', 'security', 'secure', 'connectivity',
      'hybrid', 'observability', 'edge', 'iot', 'general', 'scale', 'expertise', 'cisco', 'zero',
      'trust', 'fso', 'network', 'networks', 'platform', 'platforms', 'technology', 'technologies',
      'client', 'clients'
    ]);

    const knownTechnologyTerms = new Set([
      'appdynamics',
      'app dynamics',
      'thousandeyes',
      'securex',
      'duo',
      'duo mfa',
      'duo security',
      'meraki',
      'meraki mx',
      'meraki mr',
      'meraki mg',
      'meraki mv',
      'meraki insight',
      'meraki dashboard',
      'meraki systems manager',
      'umbrella',
      'webex',
      'webex calling',
      'webex contact center',
      'webex control hub',
      'catalyst',
      'catalyst center',
      'catalyst 9000',
      'catalyst sd-wan',
      'vmanage',
      'vsmart',
      'ise',
      'identity services engine',
      'intersight',
      'ucs',
      'hyperflex',
      'sd-wan',
      'sase',
      'aci',
      'aci fabric',
      'nexus',
      'nx-os',
      'nxos',
      'dna center',
      'secure client',
      'anyconnect',
      'amp',
      'secure endpoint',
      'xdr',
      'panoptica',
      'threat grid',
      'firepower',
      'firepower threat defense',
      'ftd',
      'stealthwatch',
      'tetration',
      'servicenow',
      'salesforce',
      'microsoft teams',
      'power bi',
      'azure',
      'aws',
      'google cloud',
      'splunk',
      'pagerduty',
      'datadog',
      'new relic',
      'snowflake',
      'tableau',
      'dynatrace',
      'okta',
      'workday',
      'sap',
      'jira',
      'confluence',
      'github',
      'gitlab',
      'slack',
      'zoom',
      'servicenow cmdb',
      'servicenow itom',
      'meraki vision',
      'appdynamics synthetics',
      'thousandeyes synthetics',
      'securex orchestration'
    ]);

    const technologyCounts = new Map<string, { count: number; display: string }>();

    const addTechnology = (term: string) => {
      const cleaned = term.replace(/\s+/g, ' ').trim();
      if (!cleaned) return;
      const canonical = cleaned.toLowerCase();
      const existing = technologyCounts.get(canonical);
      if (existing) {
        existing.count += 1;
        if (cleaned.length > existing.display.length) {
          existing.display = cleaned;
        }
      } else {
        technologyCounts.set(canonical, { count: 1, display: cleaned });
      }
    };

    const isTechnologyToken = (token: string) => {
      const cleaned = token.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+\-\/#!]+$/g, '');
      if (!cleaned) return false;

      const lower = cleaned.toLowerCase();
      if (stopWords.has(lower)) return false;
      if (knownTechnologyTerms.has(lower)) return true;

      if (!/[a-zA-Z]/.test(cleaned)) return false;

      if (/^[A-Z0-9+\-\/#!]+$/.test(cleaned)) {
        if (cleaned.length <= 2 && !knownTechnologyTerms.has(lower)) return false;
        return true;
      }

      if (/[0-9]/.test(cleaned)) return true;
      if (/^[A-Z][a-z]+[A-Z][a-zA-Z0-9]*$/.test(cleaned)) return true;
      if (/[A-Z]/.test(cleaned.slice(1))) return true;

      return knownTechnologyTerms.has(lower);
    };

    const tryAddPhrase = (
      tokens: Array<{ cleaned: string; lower: string }>,
      start: number,
      length: number,
      used: Set<number>
    ) => {
      if (start + length > tokens.length) return false;
      for (let offset = 0; offset < length; offset += 1) {
        if (used.has(start + offset)) return false;
      }

      const phraseTokens = tokens.slice(start, start + length);
      const lowerPhrase = phraseTokens.map(t => t.lower).join(' ');

      let trimStart = 0;
      let trimEnd = phraseTokens.length;
      while (trimStart < trimEnd && stopWords.has(phraseTokens[trimStart].lower)) {
        trimStart += 1;
      }
      while (trimEnd > trimStart && stopWords.has(phraseTokens[trimEnd - 1].lower)) {
        trimEnd -= 1;
      }

      const trimmedTokens = phraseTokens.slice(trimStart, trimEnd);
      const filteredLowerPhrase = trimmedTokens.map(t => t.lower).join(' ');

      const matchedFullPhrase = knownTechnologyTerms.has(lowerPhrase);
      const matchedTrimmedPhrase = filteredLowerPhrase.length > 0 && knownTechnologyTerms.has(filteredLowerPhrase);
      const matchedPhrase = matchedFullPhrase || matchedTrimmedPhrase;

      if (!matchedPhrase) {
        return false;
      }

      const displaySource = matchedFullPhrase ? phraseTokens : trimmedTokens;
      const displayWords = displaySource.map(t => t.cleaned).filter(word => word);

      const display = displayWords.join(' ').trim();
      if (!display) return false;

      for (let offset = 0; offset < length; offset += 1) {
        used.add(start + offset);
      }

      addTechnology(display);
      return true;
    };

    const processText = (text: string) => {
      if (!text) return;

      const cleanedText = text.replace(/[\u201c\u201d]/g, '"');
      const rawTokens = cleanedText
        .split(/\s+/)
        .map(token => {
          const cleanedToken = token.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+\-\/#!]+$/g, '');
          return {
            original: token,
            cleaned: cleanedToken,
            lower: cleanedToken.toLowerCase(),
          };
        })
        .filter(token => token.cleaned.length > 0);

      if (rawTokens.length === 0) return;

      const usedIndexes = new Set<number>();
      const phraseTokens = rawTokens.map(token => ({ cleaned: token.cleaned, lower: token.lower }));

      for (let size = 3; size >= 2; size -= 1) {
        for (let index = 0; index <= rawTokens.length - size; index += 1) {
          tryAddPhrase(phraseTokens, index, size, usedIndexes);
        }
      }

      rawTokens.forEach((token, index) => {
        if (usedIndexes.has(index)) return;

        if (isTechnologyToken(token.cleaned)) {
          const display = token.cleaned;
          if (display && !stopWords.has(display.toLowerCase())) {
            addTechnology(display);
          }
        }
      });
    };

    allSubmissions.forEach(submission => {
      let structured: Record<string, unknown> | null = null;

      try {
        structured = JSON.parse(submission.structuredJson);
      } catch {
        structured = null;
      }

      const fieldsToCheck = [
        'problem_summary',
        'impact_summary',
        'action_plan',
        'success_checks',
        'risks',
        'integration_points',
        'security_considerations',
        'observability_plan',
        'technologies',
        'tools',
        'platforms',
        'cisco_products',
        'recommended_tools',
        'recommended_technologies',
        'stack'
      ];

      if (structured && typeof structured === 'object') {
        const structuredRecord = structured as Record<string, unknown>;
        fieldsToCheck.forEach(field => {
          const value = structuredRecord[field];
          if (!value) return;

          if (Array.isArray(value)) {
            value.forEach(item => {
              if (typeof item === 'string') {
                processText(item);
              } else if (item && typeof item === 'object') {
                const itemRecord = item as Record<string, unknown>;
                const candidate =
                  typeof itemRecord.name === 'string'
                    ? itemRecord.name
                    : typeof itemRecord.value === 'string'
                      ? itemRecord.value
                      : typeof itemRecord.target === 'string'
                        ? itemRecord.target
                        : undefined;

                if (candidate) {
                  processText(candidate);
                }
              }
            });
          } else if (typeof value === 'string') {
            processText(value);
          }
        });
      }

      processText(submission.solutionText);
    });

    // NOTE: The manual entries are now merged into the main database via syncWordCloudFromSubmissions
    // This old code is kept as fallback only

    return Array.from(technologyCounts.entries())
      .map(([, data]) => ({ text: data.display, value: data.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
    } catch (error) {
      console.error('[getWordCloudData] Error fetching word cloud data:', error);
      return [];
    }
  },

    async getCategoryStats(filterDate?: string): Promise<{ [key: string]: number }> {
    const today = filterDate || getMelbourneDate();

    const results = await db
      .select({
        category: attempts.category,
        count: sql<number>`count(*)::int`,
      })
      .from(attempts)
      .where(
        and(
          eq(attempts.eligible, true),
          eq(attempts.attemptDay, today)
        )
      )
      .groupBy(attempts.category);

    const stats: { [key: string]: number } = {};
    results.forEach(row => {
      stats[row.category] = row.count;
    });

    return stats;
  },

    async getData3Stats(category?: string): Promise<Data3Stat[]> {
    const query = db.select().from(data3Stats).orderBy(data3Stats.displayOrder);

    if (category) {
      return await query.where(eq(data3Stats.category, category));
    }

    return await query;
  },

    async getActiveRingAttempts(): Promise<Array<{ attemptId: string; initials: string; category: string; startedAt: string }>> {
    try {
      const cutoff = new Date(Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000);

      const rows = await db
        .select({
          attemptId: attempts.id,
          category: attempts.category,
          startedAt: attempts.startedAt,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(attempts)
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .where(
          and(
            eq(attempts.mode, "ring"),
            isNull(attempts.endedAt),
            gt(attempts.startedAt, cutoff),
          ),
        )
        .orderBy(desc(attempts.startedAt));

      return rows.map((row) => {
        const firstInitial = row.firstName?.trim()?.[0] ?? "";
        const lastInitial = row.lastName?.trim()?.[0] ?? "";
        const fallback = row.attemptId.slice(0, 2).toUpperCase();
        const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase() || fallback;

        return {
          attemptId: row.attemptId,
          category: row.category,
          startedAt: row.startedAt ? row.startedAt.toISOString() : new Date().toISOString(),
          initials,
        };
      });
    } catch (error) {
      console.warn('[getActiveRingAttempts] Error fetching active ring attempts:', error);
      return [];
    }
  },

  async getActiveRingAttemptsByStage(): Promise<{
    triviaChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }>;
    projectPitchChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }>;
  }> {
    try {
      const cutoff = new Date(Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000);

      const rows = await db
        .select({
          attemptId: attempts.id,
          category: attempts.category,
          startedAt: attempts.startedAt,
          firstName: users.firstName,
          lastName: users.lastName,
          passed: attempts.passed,
        })
        .from(attempts)
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .where(
          and(
            eq(attempts.mode, "ring"),
            isNull(attempts.submissionId), // Changed from endedAt to submissionId
            gt(attempts.startedAt, cutoff),
          ),
        )
        .orderBy(desc(attempts.startedAt));

      const triviaChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }> = [];
      const projectPitchChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }> = [];

      rows.forEach((row) => {
        const firstInitial = row.firstName?.trim()?.[0] ?? "";
        const lastInitial = row.lastName?.trim()?.[0] ?? "";
        const fallback = row.attemptId.slice(0, 2).toUpperCase();
        const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase() || fallback;

        const challenger = {
          attemptId: row.attemptId,
          category: row.category,
          startedAt: row.startedAt ? row.startedAt.toISOString() : new Date().toISOString(),
          initials,
        };

        // If passed is false, they're still on trivia
        // If passed is true, they've completed trivia and are on project pitch
        if (row.passed) {
          projectPitchChallengers.push(challenger);
        } else {
          triviaChallengers.push(challenger);
        }
      });

      return {
        triviaChallengers,
        projectPitchChallengers,
      };
    } catch (error) {
      console.warn('[getActiveRingAttemptsByStage] Error fetching active ring attempts by stage:', error);
      return {
        triviaChallengers: [],
        projectPitchChallengers: [],
      };
    }
  },

  async getActiveRingAttemptsDetailed(): Promise<Array<{
    attemptId: string;
    initials: string;
    category: string;
    startedAt: string;
    emailHash: string;
    firstName: string | null;
    lastName: string | null;
    elapsedMinutes: number;
  }>> {
    try {
      const cutoff = new Date(Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000);

      const rows = await db
        .select({
          attemptId: attempts.id,
          category: attempts.category,
          startedAt: attempts.startedAt,
          emailHash: attempts.emailHash,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(attempts)
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .where(
          and(
            eq(attempts.mode, "ring"),
            isNull(attempts.endedAt),
            gt(attempts.startedAt, cutoff),
          ),
        )
        .orderBy(desc(attempts.startedAt));

      return rows.map((row) => {
        const firstInitial = row.firstName?.trim()?.[0] ?? "";
        const lastInitial = row.lastName?.trim()?.[0] ?? "";
        const fallback = row.attemptId.slice(0, 2).toUpperCase();
        const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase() || fallback;

        const startedAt = row.startedAt ? new Date(row.startedAt) : new Date();
        const elapsedMinutes = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60));

        return {
          attemptId: row.attemptId,
          category: row.category,
          startedAt: row.startedAt ? row.startedAt.toISOString() : new Date().toISOString(),
          initials,
          emailHash: row.emailHash ?? '',
          firstName: row.firstName,
          lastName: row.lastName,
          elapsedMinutes,
        };
      });
    } catch (error) {
      console.warn('[getActiveRingAttemptsDetailed] Error fetching active ring attempts:', error);
      return [];
    }
  },

  async forceEndRingAttempt(attemptId: string): Promise<void> {
    try {
      await db
        .update(attempts)
        .set({ endedAt: new Date() })
        .where(eq(attempts.id, attemptId));
    } catch (error) {
      console.error('[forceEndRingAttempt] Error ending ring attempt:', error);
      throw error;
    }
  },

  async clearStaleRingAttempts(): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000);

      const result = await db
        .update(attempts)
        .set({ endedAt: new Date() })
        .where(
          and(
            eq(attempts.mode, "ring"),
            isNull(attempts.endedAt),
            lt(attempts.startedAt, cutoff),
          ),
        );

      // Drizzle returns an array of updated rows, so we can get the count
      return Array.isArray(result) ? result.length : 0;
    } catch (error) {
      console.error('[clearStaleRingAttempts] Error clearing stale ring attempts:', error);
      throw error;
    }
  },

  async clearAllActiveRingAttempts(): Promise<number> {
    try {
      const result = await db
        .update(attempts)
        .set({ endedAt: new Date() })
        .where(
          and(
            eq(attempts.mode, "ring"),
            isNull(attempts.endedAt),
          ),
        );

      // Drizzle returns an array of updated rows, so we can get the count
      return Array.isArray(result) ? result.length : 0;
    } catch (error) {
      console.error('[clearAllActiveRingAttempts] Error clearing all active ring attempts:', error);
      throw error;
    }
  },

    async getRecentSubmission(): Promise<any> {
    try {
      const [result] = await db
        .select({
          id: submissions.id,
          participantId: submissions.participantId,
          category: submissions.category,
          solutionText: submissions.solutionText,
          structuredJson: submissions.structuredJson,
          subScores: submissions.subScores,
          totalScore: submissions.totalScore,
          evaluationNotes: submissions.evaluationNotes,
          createdAt: submissions.createdAt,
          name: sql<string>`${participants.firstName} || ' ' || substr(${participants.lastName}, 1, 1) || '.'`,
        })
        .from(submissions)
        .innerJoin(participants, eq(submissions.participantId, participants.id))
        .orderBy(desc(submissions.createdAt))
        .limit(1);

      if (!result) return null;

      // Parse JSON strings for subScores and structuredJson
      return {
        ...result,
        subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
        structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
      };
    } catch (error) {
      console.warn('[getRecentSubmission] Error fetching recent submission:', error);
      return null;
    }
  },

    async getTopProblemCategory(): Promise<string> {
    try {
      const [result] = await db
        .select({
          category: submissions.category,
          count: sql<number>`count(*)::int`,
        })
        .from(submissions)
        .groupBy(submissions.category)
        .orderBy(desc(sql`count(*)`))
        .limit(1);

      return result?.category || "SECURE_CONNECTIVITY";
    } catch (error) {
      console.warn('[getTopProblemCategory] Error fetching top category, returning default:', error);
      return "SECURE_CONNECTIVITY";
    }
  },

    async clearDatabase(): Promise<void> {
      await db.delete(chatSessions);
      await db.delete(submissions);
      await db.delete(participants);
      // Don't clear data3_stats as they are reference data
    },

    async getSubmissionDetails(id: string): Promise<any> {
    return await this.getSubmission(id);
  },

    async getDetailedLeaderboard(limit: number = 100, filterDate?: string): Promise<any[]> {
    return await this.getAdminLeaderboard(limit, filterDate);
  },

    async deleteSubmission(id: string): Promise<void> {
    await db.delete(submissions).where(eq(submissions.id, id));
  },

    async updateData3Stat(id: string, data: Partial<Data3Stat>): Promise<void> {
    await db.update(data3Stats).set(data).where(eq(data3Stats.id, id));
  },

    async createData3Stat(data: Omit<Data3Stat, 'id' | 'createdAt'>): Promise<Data3Stat> {
    const [result] = await db.insert(data3Stats).values(data).returning();
    return result;
  },

    async deleteData3Stat(id: string): Promise<void> {
    await db.delete(data3Stats).where(eq(data3Stats.id, id));
  },

    async getCategories(): Promise<any[]> {
    // System categories that are always present and protected
    const systemCategories = [
      { id: 'GENERAL', name: 'GENERAL', displayName: 'General', color: 'bg-[#64748b]', isSystemCategory: true },
      { id: 'SCALE', name: 'SCALE', displayName: 'Scale', color: 'bg-[#0891b2]', isSystemCategory: true },
      { id: 'EXPERTISE', name: 'EXPERTISE', displayName: 'Expertise', color: 'bg-[#059669]', isSystemCategory: true },
      { id: 'SECURE_CONNECTIVITY', name: 'SECURE_CONNECTIVITY', displayName: 'Zero Trust & Secure Connectivity', color: 'bg-[#00BCF2]', isSystemCategory: true },
      { id: 'HYBRID_DC', name: 'HYBRID_DC', displayName: 'Hybrid Cloud Infrastructure', color: 'bg-[#8A2BE2]', isSystemCategory: true },
      { id: 'COLLAB_CX', name: 'COLLAB_CX', displayName: 'Collaboration & Customer Experience', color: 'bg-[#F97316]', isSystemCategory: true },
      { id: 'OBSERVABILITY', name: 'OBSERVABILITY', displayName: 'Observability & Automation', color: 'bg-[#38BDF8]', isSystemCategory: true },
      { id: 'EDGE_IOT', name: 'EDGE_IOT', displayName: 'Edge & IoT Automation', color: 'bg-[#22C55E]', isSystemCategory: true }
    ];
    
    // Get custom categories from database
    const customCategoriesFromDb = await db.select().from(customCategories);
    
    // Defensive deduplication: Filter out any custom categories that collide with system categories
    // This handles the case where bad data might already exist in the database
    const systemCategoryNamesLower = SYSTEM_CATEGORY_NAMES.map(name => name.toLowerCase());
    const filteredCustomCategories = customCategoriesFromDb.filter(cat => {
      const categoryNameLower = cat.name.toLowerCase();
      const isCollision = systemCategoryNamesLower.includes(categoryNameLower);
      if (isCollision) {
        console.warn(`Filtering out custom category '${cat.name}' that collides with system category`);
      }
      return !isCollision;
    });
    
    // Transform custom categories to match the expected format
    const customCategoriesList = filteredCustomCategories.map(cat => ({
      id: cat.name, // Use name as ID for compatibility
      name: cat.name,
      displayName: cat.displayName,
      color: cat.color,
      isSystemCategory: false,
      createdAt: cat.createdAt?.toISOString()
    }));
    
    // Merge system and custom categories
    return [...systemCategories, ...customCategoriesList];
  },

    async createCategory(data: { name: string; displayName: string; color: string }): Promise<any> {
    // Check if the name collides with a system category (case-insensitive)
    const normalizedName = data.name.toUpperCase();
    if (SYSTEM_CATEGORY_NAMES.includes(normalizedName as any)) {
      throw new Error(`Cannot create category '${data.name}': This name is reserved for system categories. Please choose a different name.`);
    }
    
    // Also check case-insensitive against all system names
    const nameLower = data.name.toLowerCase();
    const systemNameLower = SYSTEM_CATEGORY_NAMES.find(sysName => sysName.toLowerCase() === nameLower);
    if (systemNameLower) {
      throw new Error(`Cannot create category '${data.name}': This name is too similar to the system category '${systemNameLower}'. Please choose a different name.`);
    }
    
    // Check if category with same name already exists
    const existing = await db.select().from(customCategories).where(eq(customCategories.name, data.name));
    if (existing.length > 0) {
      throw new Error(`Category with name '${data.name}' already exists`);
    }
    
    // Insert new custom category
    const [result] = await db.insert(customCategories).values({
      name: data.name,
      displayName: data.displayName,
      color: data.color
    }).returning();
    
    return {
      id: result.name,
      name: result.name,
      displayName: result.displayName,
      color: result.color,
      isSystemCategory: false,
      createdAt: result.createdAt?.toISOString()
    };
  },

    async updateCategory(id: string, data: { displayName: string; color: string }): Promise<void> {
    // Only allow updating custom categories (not system categories)
    const category = await db.select().from(customCategories).where(eq(customCategories.name, id));
    
    if (category.length === 0) {
      throw new Error(`Custom category '${id}' not found or is a system category`);
    }
    
    await db.update(customCategories)
      .set({
        displayName: data.displayName,
        color: data.color
      })
      .where(eq(customCategories.name, id));
  },

    async deleteCategory(id: string): Promise<{ success: boolean; reassignedStats?: number }> {
    // Check if it's a custom category (not a system category)
    const category = await db.select().from(customCategories).where(eq(customCategories.name, id));
    
    if (category.length === 0) {
      throw new Error(`Custom category '${id}' not found or is a system category`);
    }
    
    // Find all stats using this category
    const stats = await db.select().from(data3Stats).where(eq(data3Stats.category, id));
    
    // Reassign stats to GENERAL category
    if (stats.length > 0) {
      await db.update(data3Stats)
        .set({ category: 'GENERAL' })
        .where(eq(data3Stats.category, id));
    }
    
    // Delete the custom category
    await db.delete(customCategories).where(eq(customCategories.name, id));
    
    return {
      success: true,
      reassignedStats: stats.length
    };
  },

    // Beta Admin Methods
    async getBetaAdminOverview() {
      // Get today's date in Melbourne timezone
      const today = getMelbourneDate();

      const [attemptStats] = await db
        .select({
          totalAttempts: sql<number>`count(*)`,
          passedAttempts: sql<number>`sum(case when ${attempts.passed} then 1 else 0 end)`,
          avgScore: sql<number>`avg(${attempts.totalScore})`,
          ringAttempts: sql<number>`sum(case when ${attempts.mode} = 'ring' then 1 else 0 end)`,
          dojoAttempts: sql<number>`sum(case when ${attempts.mode} = 'dojo' then 1 else 0 end)`,
        })
        .from(attempts)
        .where(sql`DATE(${attempts.startedAt} AT TIME ZONE 'Australia/Melbourne') = ${today}`);

      const [raffleCount] = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(schema.raffleEntries)
        .where(eq(schema.raffleEntries.raffleDate, today));

      const recentAttempts = await db
        .select({
          id: attempts.id,
          category: attempts.category,
          mode: attempts.mode,
          triviaScore: sql<number | null>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore})`,
          pitchScore: submissions.totalScore,
          combinedScore: sql<number>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`,
          passed: attempts.passed,
          eligible: attempts.eligible,
          startedAt: attempts.startedAt,
          endedAt: attempts.endedAt,
          emailHash: attempts.emailHash,
          firstName: users.firstName,
          lastName: users.lastName,
          company: users.company,
        })
        .from(attempts)
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .leftJoin(submissions, eq(attempts.submissionId, submissions.id))
        .orderBy(desc(attempts.startedAt))
        .limit(20);

      return {
        stats: {
          totalAttempts: Number(attemptStats?.totalAttempts ?? 0),
          passedAttempts: Number(attemptStats?.passedAttempts ?? 0),
          avgScore: Number(attemptStats?.avgScore ?? 0),
          passRate: attemptStats?.totalAttempts
            ? Number(((attemptStats.passedAttempts / attemptStats.totalAttempts) * 100).toFixed(1))
            : 0,
          ringAttempts: Number(attemptStats?.ringAttempts ?? 0),
          dojoAttempts: Number(attemptStats?.dojoAttempts ?? 0),
          raffleEntries: Number(raffleCount?.total ?? 0),
        },
        recentAttempts,
      };
    },

    async getBetaAdminTriviaItems() {
      const items = await db
        .select()
        .from(triviaItems)
        .orderBy(triviaItems.category, triviaItems.difficulty);

      // Get usage stats for each item
      const usageStats = await db
        .select({
          itemId: answers.itemId,
          timesShown: sql<number>`count(*)`,
          timesCorrect: sql<number>`sum(case when ${answers.correct} then 1 else 0 end)`,
        })
        .from(answers)
        .groupBy(answers.itemId);

      const statsMap = new Map(
        usageStats.map((stat) => [
          stat.itemId,
          {
            timesShown: Number(stat.timesShown),
            timesCorrect: Number(stat.timesCorrect),
            correctRate:
              stat.timesShown > 0
                ? Number(((stat.timesCorrect / stat.timesShown) * 100).toFixed(1))
                : 0,
          },
        ])
      );

      return items.map((item) => ({
        ...item,
        stats: statsMap.get(item.id) ?? { timesShown: 0, timesCorrect: 0, correctRate: 0 },
      }));
    },

    async createTriviaItem(data: {
      category: string;
      stem: string;
      choices: string[];
      correctIndex: number;
      dropIndex: number;
      hint9s: string;
      difficulty: number;
      tags: string[];
      explanation: string | null;
      active: boolean;
      version: number;
    }) {
      const [item] = await db.insert(triviaItems).values({
        id: randomUUID(),
        ...data,
      }).returning();
      return item;
    },

    async updateTriviaItem(
      id: string,
      data: {
        category?: string;
        stem?: string;
        choices?: string[];
        correctIndex?: number;
        dropIndex?: number;
        hint9s?: string;
        difficulty?: number;
        tags?: string[];
        explanation?: string | null;
        active?: boolean;
        version?: number;
      }
    ) {
      await db.update(triviaItems).set(data).where(eq(triviaItems.id, id));
    },

    async deleteTriviaItem(id: string) {
      // Soft delete - set active to false
      await db.update(triviaItems).set({ active: false }).where(eq(triviaItems.id, id));
    },

    async getBetaAdminRaffleEntries() {
      const entries = await db
        .select({
          id: schema.raffleEntries.id,
          raffleDate: schema.raffleEntries.raffleDate,
          category: schema.raffleEntries.category,
          emailHash: schema.raffleEntries.emailHash,
          attemptId: schema.raffleEntries.attemptId,
          createdAt: schema.raffleEntries.createdAt,
          firstName: users.firstName,
          lastName: users.lastName,
          company: users.company,
          role: users.role,
          triviaScore: sql<number | null>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore})`,
          pitchScore: submissions.totalScore,
          combinedScore: sql<number>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`,
          passed: attempts.passed,
          // All raffle entries are eligible by definition (only created when eligible)
          eligible: sql<boolean>`true`.as('eligible'),
        })
        .from(schema.raffleEntries)
        .leftJoin(users, eq(schema.raffleEntries.emailHash, users.emailHash))
        .leftJoin(attempts, eq(schema.raffleEntries.attemptId, attempts.id))
        .leftJoin(submissions, eq(attempts.submissionId, submissions.id))
        .orderBy(desc(schema.raffleEntries.createdAt));

      return entries;
    },

    async deleteRaffleEntry(id: string) {
      // Hard delete - actually remove the raffle entry
      await db.delete(schema.raffleEntries).where(eq(schema.raffleEntries.id, id));
    },

    async getBotBarStats() {
      // Get individual submissions with bot bar information
      const stats = await db
        .select({
          attemptId: attempts.id,
          date: sql<string>`DATE(${attempts.startedAt} AT TIME ZONE 'Australia/Melbourne')`.as('date'),
          category: attempts.category,
          emailHash: attempts.emailHash,
          firstName: users.firstName,
          lastName: users.lastName,
          company: users.company,
          triviaScore: sql<number | null>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore})`,
          pitchScore: submissions.totalScore,
          combinedScore: sql<number>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`.as('combined_score'),
          botBar: attempts.botBar,
          eligible: attempts.eligible,
          passed: attempts.passed,
          startedAt: attempts.startedAt,
          endedAt: attempts.endedAt,
        })
        .from(attempts)
        .leftJoin(users, eq(attempts.emailHash, users.emailHash))
        .leftJoin(submissions, eq(attempts.submissionId, submissions.id))
        .where(
          and(
            eq(attempts.mode, 'ring'),
            isNotNull(attempts.endedAt),
            isNotNull(attempts.botBar),
            isNotNull(submissions.id) // Only include attempts with completed submissions
          )
        )
        .orderBy(desc(attempts.startedAt));

      return stats;
    },

    async getWordCloudEntries() {
      const entries = await db
        .select()
        .from(schema.wordCloudEntries)
        .where(eq(schema.wordCloudEntries.active, true))
        .orderBy(desc(schema.wordCloudEntries.count));
      return entries;
    },

    async createWordCloudEntry(data: {
      word: string;
      count: number;
      source: string;
      active: boolean;
    }) {
      const [entry] = await db
        .insert(schema.wordCloudEntries)
        .values({
          id: randomUUID(),
          ...data,
        })
        .returning();
      return entry;
    },

    async updateWordCloudEntry(
      id: string,
      data: {
        word?: string;
        count?: number;
        active?: boolean;
      }
    ) {
      const [entry] = await db
        .update(schema.wordCloudEntries)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.wordCloudEntries.id, id))
        .returning();
      return entry;
    },

    async deleteWordCloudEntry(id: string) {
      await db.delete(schema.wordCloudEntries).where(eq(schema.wordCloudEntries.id, id));
    },

    async batchDeleteWordCloudEntries(ids: string[]) {
      await db.delete(schema.wordCloudEntries).where(inArray(schema.wordCloudEntries.id, ids));
    },

    async syncWordCloudFromSubmissions(): Promise<{ synced: number; message: string }> {
      try {
        // Generate word cloud data from submissions (using the existing logic)
        const allSubmissions = await db.select().from(submissions);

        if (allSubmissions.length === 0) {
          return { synced: 0, message: 'No submissions found to generate word cloud from' };
        }

        const stopWords = new Set([
          // Articles, conjunctions, prepositions
          'the', 'and', 'for', 'with', 'that', 'from', 'this', 'have', 'their', 'about', 'into', 'your',
          'when', 'where', 'which', 'will', 'need', 'needs', 'they', 'them', 'over', 'under', 'while',
          'after', 'before', 'because', 'ensure', 'also', 'but', 'are', 'was', 'were', 'been', 'has',
          'had', 'having', 'does', 'did', 'can', 'could', 'would', 'should', 'may', 'might', 'must',
          'shall', 'being', 'our', 'its', 'than', 'then', 'these', 'those', 'such', 'both', 'through',
          'during', 'without', 'within', 'between', 'among', 'upon', 'off', 'out', 'down', 'up',

          // Common nouns/verbs
          'teams', 'users', 'staff', 'team', 'user', 'people', 'per', 'week', 'weeks', 'month', 'months',
          'year', 'years', 'day', 'days', 'time', 'times', 'each', 'every', 'daily', 'weekly', 'monthly',
          'make', 'makes', 'made', 'making', 'use', 'uses', 'used', 'using', 'work', 'works', 'worked',
          'working', 'get', 'gets', 'getting', 'got', 'provide', 'provides', 'provided', 'providing',

          // Business jargon
          'solution', 'solutions', 'problem', 'problems', 'impact', 'summary', 'baseline', 'target',
          'targets', 'kpi', 'kpis', 'plan', 'plans', 'action', 'actions', 'risk', 'risks', 'success',
          'check', 'checks', 'business', 'customer', 'customers', 'experience', 'experiences', 'operations',
          'operation', 'operational', 'strategy', 'strategies', 'architecture', 'architectures',
          'leader', 'leaders', 'program', 'programs', 'enablement', 'visibility', 'governance',
          'process', 'processes', 'automation', 'automated', 'monitoring', 'performance', 'delivery',
          'services', 'service', 'environment', 'environments', 'employee', 'employees', 'site', 'sites',
          'deployment', 'deployments', 'deploy', 'deploying', 'rollout', 'rollouts', 'phase', 'phases',
          'implementation', 'implementations', 'initiative', 'initiatives', 'objective', 'objectives',

          // Action verbs
          'global', 'regional', 'improve', 'improves', 'improved', 'improving', 'increase', 'increases',
          'increased', 'reduces', 'reduced', 'reducing', 'reduction', 'reductions', 'optimize',
          'optimise', 'optimised', 'optimizing', 'optimising', 'implement', 'implementing', 'implemented',
          'enable', 'enables', 'enabled', 'enabling', 'support', 'supports', 'supported', 'supporting',

          // Generic tech terms
          'system', 'systems', 'application', 'applications', 'apps', 'app', 'cloud', 'digital', 'data',
          'security', 'secure', 'connectivity', 'hybrid', 'observability', 'edge', 'iot', 'general',
          'scale', 'expertise', 'cisco', 'zero', 'trust', 'fso', 'network', 'networks', 'platform',
          'platforms', 'technology', 'technologies', 'client', 'clients', 'tool', 'tools', 'feature',
          'features', 'capability', 'capabilities', 'integration', 'integrations', 'access', 'management'
        ]);

        const categoryKeywords = [
          'SECURE_CONNECTIVITY',
          'HYBRID_DC',
          'COLLAB_CX',
          'OBSERVABILITY',
          'EDGE_IOT',
          'GENERAL',
          'SCALE',
          'EXPERTISE',
        ];

        const disallowedTokens = new Set<string>();
        categoryKeywords.forEach(keyword => {
          const lower = keyword.toLowerCase();
          stopWords.add(lower);
          disallowedTokens.add(lower);
          disallowedTokens.add(lower.replace(/_/g, ''));
        });

        const knownTechnologyTerms = new Set([
          'appdynamics', 'app dynamics', 'thousandeyes', 'securex', 'duo', 'duo mfa', 'duo security',
          'meraki', 'meraki mx', 'meraki mr', 'meraki mg', 'meraki mv', 'meraki insight',
          'meraki dashboard', 'meraki systems manager', 'umbrella', 'webex', 'webex calling',
          'webex contact center', 'webex control hub', 'catalyst', 'catalyst center', 'catalyst 9000',
          'catalyst sd-wan', 'vmanage', 'vsmart', 'ise', 'identity services engine', 'intersight',
          'ucs', 'hyperflex', 'sd-wan', 'sase', 'aci', 'aci fabric', 'nexus', 'nx-os', 'nxos',
          'dna center', 'secure client', 'anyconnect', 'amp', 'secure endpoint', 'xdr', 'panoptica',
          'threat grid', 'firepower', 'firepower threat defense', 'ftd', 'stealthwatch', 'tetration',
        ]);

        const technologyCounts = new Map<string, { count: number; display: string }>();

        const addTechnology = (term: string) => {
          const cleaned = term.replace(/\s+/g, ' ').trim();
          if (!cleaned) return;
          const canonical = cleaned.toLowerCase();
          const existing = technologyCounts.get(canonical);
          if (existing) {
            existing.count += 1;
            if (cleaned.length > existing.display.length) {
              existing.display = cleaned;
            }
          } else {
            technologyCounts.set(canonical, { count: 1, display: cleaned });
          }
        };

        const isTechnologyToken = (token: string) => {
          const cleaned = token.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+\-\/#!]+$/g, '');
          if (!cleaned) return false;
          const lower = cleaned.toLowerCase();

          // Filter out stopwords
          if (stopWords.has(lower)) return false;

          // Allow known technology terms
          if (knownTechnologyTerms.has(lower)) return true;

          // Must contain at least one letter
          if (!/[a-zA-Z]/.test(cleaned)) return false;

          // Filter out labels like "1a", "1b", "2a", "3b", etc.
          // Pattern: single digit followed by single letter, or vice versa
          if (/^[0-9][a-z]$/i.test(cleaned) || /^[a-z][0-9]$/i.test(cleaned)) return false;

          // Filter out purely numeric or very short alphanumeric noise
          if (cleaned.length < 2) return false;
          if (cleaned.length === 2 && /^[0-9]+$/.test(cleaned)) return false;

          // Filter out tokens that are mostly numbers with single letter prefix/suffix
          // e.g., "1st", "2nd", "3rd", etc.
          if (/^[0-9]+(st|nd|rd|th)$/i.test(cleaned)) return false;

          // All-caps acronyms or product codes (like ISE, SD-WAN, UCS)
          if (/^[A-Z0-9+\-\/#!]+$/.test(cleaned)) {
            // Must be at least 2 characters if not in known terms
            if (cleaned.length <= 2 && !knownTechnologyTerms.has(lower)) return false;
            return true;
          }

          // Contains numbers - likely a product name/version (e.g., Catalyst9000, MX64)
          // But must be at least 3 chars and have meaningful letter content
          if (/[0-9]/.test(cleaned)) {
            if (cleaned.length < 3) return false;
            // Ensure it has at least 2 letters to avoid noise like "1a", "x1", etc.
            const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
            if (letterCount < 2) return false;
            return true;
          }

          // CamelCase patterns (e.g., AppDynamics, SecureX)
          if (/^[A-Z][a-z]+[A-Z][a-zA-Z0-9]*$/.test(cleaned)) return true;

          // Mixed case (likely a brand name)
          if (/[A-Z]/.test(cleaned.slice(1))) return true;

          // Final check against known terms
          return knownTechnologyTerms.has(lower);
        };

        const processText = (text: string) => {
          if (!text) return;
          const cleanedText = text.replace(/[\u201c\u201d]/g, '"');
          const rawTokens = cleanedText
            .split(/\s+/)
            .map(token => {
              const cleanedToken = token.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+\-\/#!]+$/g, '');
              return {
                original: token,
                cleaned: cleanedToken,
                lower: cleanedToken.toLowerCase(),
              };
            })
            .filter(token => token.cleaned.length > 0);

          if (rawTokens.length === 0) return;

          rawTokens.forEach((token) => {
            if (isTechnologyToken(token.cleaned)) {
              const normalizedToken = token.lower.replace(/[_\s-]/g, '');
              if (disallowedTokens.has(token.lower) || disallowedTokens.has(normalizedToken)) {
                return;
              }
              const display = token.cleaned;
              if (display && !stopWords.has(display.toLowerCase())) {
                addTechnology(display);
              }
            }
          });
        };

        // Process all submissions
        allSubmissions.forEach(submission => {
          let structured: Record<string, unknown> | null = null;
          try {
            structured = JSON.parse(submission.structuredJson);
          } catch {
            structured = null;
          }

          const fieldsToCheck = [
            'problem_summary', 'impact_summary', 'action_plan', 'success_checks', 'risks',
            'integration_points', 'security_considerations', 'observability_plan',
            'technologies', 'tools', 'platforms', 'cisco_products', 'recommended_tools',
            'recommended_technologies', 'stack'
          ];

          if (structured && typeof structured === 'object') {
            const structuredRecord = structured as Record<string, unknown>;
            fieldsToCheck.forEach(field => {
              const value = structuredRecord[field];
              if (!value) return;
              if (Array.isArray(value)) {
                value.forEach(item => {
                  if (typeof item === 'string') {
                    processText(item);
                  }
                });
              } else if (typeof value === 'string') {
                processText(value);
              }
            });
          }
          processText(submission.solutionText);
        });

        // Now store the generated data in the database
        // Mark all existing auto-generated entries as inactive first
        await db
          .update(schema.wordCloudEntries)
          .set({ active: false, updatedAt: new Date() })
          .where(eq(schema.wordCloudEntries.source, 'auto'));

        // Insert new entries
        const entries = Array.from(technologyCounts.entries())
          .map(([, data]) => ({ text: data.display, value: data.count }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 50); // Store top 50

        let syncedCount = 0;
        for (const entry of entries) {
          await db
            .insert(schema.wordCloudEntries)
            .values({
              id: randomUUID(),
              word: entry.text,
              count: entry.value,
              source: 'auto',
              active: true,
            });
          syncedCount++;
        }

        return {
          synced: syncedCount,
          message: `Successfully synced ${syncedCount} word cloud entries from ${allSubmissions.length} submissions`
        };
      } catch (error) {
        console.error('[syncWordCloudFromSubmissions] Error:', error);
        throw new Error(`Failed to sync word cloud: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    // DB Admin methods
    async getDBStats() {
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
      const [attemptsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.attempts);
      const [submissionsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.submissions);
      const [raffleEntriesCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.raffleEntries);
      const [leaderboardCacheCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.leaderboardCache);
      const [triviaItemsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.triviaItems);
      const [raffleDrawsCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.raffleDraws);
      const [wordCloudCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.wordCloudEntries);

      return {
        totalUsers: usersCount.count,
        totalAttempts: attemptsCount.count,
        totalSubmissions: submissionsCount.count,
        totalRaffleEntries: raffleEntriesCount.count,
        leaderboardCacheEntries: leaderboardCacheCount.count,
        totalTriviaItems: triviaItemsCount.count,
        totalRaffleDraws: raffleDrawsCount.count,
        wordCloudEntries: wordCloudCount.count,
      };
    },

    async clearLeaderboardCache() {
      const result = await db.delete(schema.leaderboardCache);
      return result.rowCount || 0;
    },

    async selectRaffleWinner(raffleDate: string) {
      // Check if a winner has already been selected for this date
      const existingDraw = await db
        .select()
        .from(schema.raffleDraws)
        .where(eq(schema.raffleDraws.raffleDate, raffleDate))
        .limit(1);

      if (existingDraw.length > 0) {
        // Return the existing draw
        const draw = existingDraw[0];
        const winnerEntry = await db
          .select()
          .from(schema.raffleEntries)
          .where(eq(schema.raffleEntries.id, draw.winnerEntryId!))
          .limit(1);

        if (winnerEntry.length === 0) {
          throw new Error("Winner entry not found for existing draw");
        }

        // Get winner user details
        const winnerUser = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.emailHash, winnerEntry[0].emailHash))
          .limit(1);

        return {
          winner: {
            ...winnerEntry[0],
            firstName: winnerUser[0]?.firstName || null,
            lastName: winnerUser[0]?.lastName || null,
            email: winnerUser[0]?.email || null,
          },
          draw: draw,
          totalEntries: -1, // We don't know the original count
          selectedIndex: -1,
        };
      }

      // Get all entries for the specified date
      const entries = await db
        .select()
        .from(schema.raffleEntries)
        .where(eq(schema.raffleEntries.raffleDate, raffleDate));

      if (entries.length === 0) {
        throw new Error(`No raffle entries found for date ${raffleDate}`);
      }

      // Generate cryptographically secure random seed
      const timestamp = Date.now();
      const randomBytes = randomUUID();
      const rngSeed = `${timestamp}-${randomBytes}`;

      // Use the seed to generate a deterministic but verifiable random selection
      const seedHash = createHash("sha256").update(rngSeed).digest();
      const seedValue = seedHash.readUInt32BE(0);
      const selectedIndex = seedValue % entries.length;
      const winner = entries[selectedIndex];

      // Get winner user details
      const winnerUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.emailHash, winner.emailHash))
        .limit(1);

      // Record the draw in the database
      const [draw] = await db
        .insert(schema.raffleDraws)
        .values({
          raffleDate: raffleDate,
          winnerEntryId: winner.id,
          rngSeed: rngSeed,
          adminUser: "admin", // You could pass this from the route if needed
        })
        .returning();

      return {
        winner: {
          ...winner,
          firstName: winnerUser[0]?.firstName || null,
          lastName: winnerUser[0]?.lastName || null,
          email: winnerUser[0]?.email || null,
        },
        draw: draw,
        totalEntries: entries.length,
        selectedIndex: selectedIndex,
      };
    },

    async getRaffleDrawByDate(raffleDate: string) {
      // Check if a winner has been selected for this date
      const existingDraw = await db
        .select()
        .from(schema.raffleDraws)
        .where(eq(schema.raffleDraws.raffleDate, raffleDate))
        .limit(1);

      if (existingDraw.length === 0) {
        return null;
      }

      // Return the existing draw
      const draw = existingDraw[0];
      const winnerEntry = await db
        .select()
        .from(schema.raffleEntries)
        .where(eq(schema.raffleEntries.id, draw.winnerEntryId!))
        .limit(1);

      if (winnerEntry.length === 0) {
        throw new Error("Winner entry not found for existing draw");
      }

      // Get winner user details
      const winnerUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.emailHash, winnerEntry[0].emailHash))
        .limit(1);

      return {
        winner: {
          ...winnerEntry[0],
          firstName: winnerUser[0]?.firstName || null,
          lastName: winnerUser[0]?.lastName || null,
          email: winnerUser[0]?.email || null,
        },
        draw: draw,
      };
    },

    async getLatestRaffleWinner() {
      const [latestDraw] = await db
        .select({
          drawId: schema.raffleDraws.id,
          raffleDate: schema.raffleDraws.raffleDate,
          announcedAt: schema.raffleDraws.announcedAt,
          winnerEntryId: schema.raffleDraws.winnerEntryId,
          category: schema.raffleEntries.category,
          firstName: users.firstName,
          lastName: users.lastName,
          combinedScore: sql<number>`COALESCE(${attempts.triviaScore}, ${attempts.totalScore}, 0) + COALESCE(${submissions.totalScore}, 0)`,
        })
        .from(schema.raffleDraws)
        .leftJoin(schema.raffleEntries, eq(schema.raffleDraws.winnerEntryId, schema.raffleEntries.id))
        .leftJoin(users, eq(schema.raffleEntries.emailHash, users.emailHash))
        .leftJoin(attempts, eq(schema.raffleEntries.attemptId, attempts.id))
        .leftJoin(submissions, eq(attempts.submissionId, submissions.id))
        .where(isNotNull(schema.raffleDraws.announcedAt))
        .orderBy(desc(schema.raffleDraws.announcedAt))
        .limit(1);

      if (!latestDraw || !latestDraw.winnerEntryId || !latestDraw.category || !latestDraw.announcedAt) {
        return null;
      }

      return latestDraw;
    },

    async markRaffleWinnerAnnounced(drawId: string): Promise<Date> {
      const announcedAt = new Date();
      const [updated] = await db
        .update(schema.raffleDraws)
        .set({ announcedAt })
        .where(eq(schema.raffleDraws.id, drawId))
        .returning({ announcedAt: schema.raffleDraws.announcedAt });

      if (!updated) {
        throw new Error(`Raffle draw ${drawId} not found`);
      }

      if (!updated.announcedAt) {
        throw new Error(`Failed to mark raffle draw ${drawId} as announced`);
      }

      return updated.announcedAt;
    },

    async clearOldRaffleEntries(daysOld: number) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffDateStr = getMelbourneDate(cutoffDate);

      const result = await db
        .delete(schema.raffleEntries)
        .where(sql`${schema.raffleEntries.raffleDate} < ${cutoffDateStr}`);

      return result.rowCount || 0;
    },
  };
}
