import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "../../shared/schema.js";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import {
  participants,
  submissions,
  data3Stats,
  customCategories,
  users,
  attempts,
  answers,
  triviaItems,
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
} from "../../shared/schema.js";
import { createHash } from "crypto";

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

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function computeAttemptDay(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return utc.toISOString().slice(0, 10);
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
  initializeData(db);

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
        await db.update(users).set(normalizedProfile).where(eq(users.emailHash, emailHash));
        return { user: { ...existing, ...normalizedProfile }, emailHash };
      }
      return { user: existing, emailHash };
    }

    const [created] = await db
      .insert(users)
      .values({ emailHash, ...normalizedProfile })
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

  return {
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
      const { cards, snapshot, maxVersion } = await buildTriviaDeck(options.category, deckSize);
      const { emailHash } = await ensureUserRecord(options.email, options.playerProfile);
      const now = new Date();

      const [attempt] = await db
        .insert(attempts)
        .values({
          emailHash,
          category: options.category,
          mode: options.mode,
          marketingOptIn: !!options.marketingOptIn,
          attemptDay: computeAttemptDay(now),
          cardSetVersion: maxVersion,
          deckSnapshot: snapshot,
        })
        .returning();

      return { attempt, cards, snapshot } satisfies TriviaAttemptResult;
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
            // Aligned with frontend: 0-5s=6pts, 5-10s=4pts, 10-15s=2pts
            if (elapsedMs <= 5000) points = 6;
            else if (elapsedMs <= 10000) points = 4;
            else if (elapsedMs <= MAX_TRIVIA_TIME_MS) points = 2;
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
        const passed = totalScore >= 18;
        const eligible = passed && attempt.mode === "ring";

        const [updated] = await tx
          .update(attempts)
          .set({
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

    async createSubmission(data: InsertSubmission): Promise<Submission> {
    const [result] = await db.insert(submissions).values(data).returning();
    return result;
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

    async getLeaderboard(limit: number = 100, category?: string): Promise<any[]> {
    const query = db
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

    if (category) {
      return await query.where(eq(submissions.category, category));
    }

    return await query;
  },

    async getSubmission(id: string): Promise<any> {
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
      .where(eq(submissions.id, id));
    
    if (!result) return null;
    
    // Parse JSON strings for subScores and structuredJson
    return {
        ...result,
        subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
        structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
    };
  },

    async getAdminLeaderboard(limit: number = 100): Promise<any[]> {
    const results = await db
      .select({
        id: submissions.id,
        totalScore: submissions.totalScore,
        category: submissions.category,
        solutionText: submissions.solutionText,
        structuredJson: submissions.structuredJson,
        subScores: submissions.subScores,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || ${participants.lastName}`,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .orderBy(desc(submissions.totalScore), submissions.createdAt)
      .limit(limit);
    
    // Parse JSON strings for each result
    return results.map(result => ({
      ...result,
      subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
      structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
    }));
  },

    async getWordCloudData(): Promise<{ text: string; value: number }[]> {
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

    return Array.from(technologyCounts.entries())
      .map(([, data]) => ({ text: data.display, value: data.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30);
  },

    async getCategoryStats(): Promise<{ [key: string]: number }> {
    const results = await db
      .select({
        category: submissions.category,
        count: sql<number>`count(*)::int`,
      })
      .from(submissions)
      .groupBy(submissions.category);
    
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

    async getRecentSubmission(): Promise<any> {
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
  },

    async getTopProblemCategory(): Promise<string> {
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
  },

    async clearDatabase(): Promise<void> {
    await db.delete(submissions);
    await db.delete(participants);
    // Don't clear data3_stats as they are reference data
  },

    async getSubmissionDetails(id: string): Promise<any> {
    return await this.getSubmission(id);
  },

    async getDetailedLeaderboard(limit: number = 100): Promise<any[]> {
    return await this.getAdminLeaderboard(limit);
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
      { id: 'HYBRID_DC', name: 'HYBRID_DC', displayName: 'Data Centre & Hybrid Cloud', color: 'bg-[#6CC04A]', isSystemCategory: true },
      { id: 'COLLAB_CX', name: 'COLLAB_CX', displayName: 'Collaboration & Contact Centre', color: 'bg-[#FF6B35]', isSystemCategory: true },
      { id: 'OBSERVABILITY', name: 'OBSERVABILITY', displayName: 'Observability & Performance', color: 'bg-[#9B59B6]', isSystemCategory: true },
      { id: 'EDGE_IOT', name: 'EDGE_IOT', displayName: 'Edge & IoT Solutions', color: 'bg-[#F39C12]', isSystemCategory: true }
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
  }
  };
}
