import { nanoid } from "nanoid";
import { differenceInMilliseconds } from "date-fns";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import type {
  InsertParticipant,
  Participant,
  InsertSubmission,
  Submission,
  Data3Stat,
  CustomCategory,
  User,
  Attempt,
  Answer,
  InsertAnswer,
  TriviaItem,
} from "../../shared/schema.js";
import { DEFAULT_DATA3_STATS, SYSTEM_CATEGORY_NAMES } from "./database.js";

interface MemoryParticipant extends Participant {
  createdAt: Date | null;
}

interface MemorySubmission extends Submission {
  createdAt: Date;
}

interface MemoryData3Stat extends Data3Stat {
  createdAt: Date | null;
}

interface MemoryCustomCategory extends CustomCategory {
  createdAt: Date | null;
}

interface MemoryUser extends User {
  createdAt: Date | null;
}

type SessionMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

interface MemoryChatSession {
  token: string;
  participantId: string;
  emailHash: string | null;
  category: string | null;
  triviaAttemptId: string | null;
  messages: SessionMessage[];
  createdAt: Date;
  updatedAt: Date;
}

type PersistedChatSession = {
  token: string;
  participantId: string;
  emailHash: string | null;
  category: string | null;
  triviaAttemptId: string | null;
  messages: SessionMessage[];
};

type TriviaMode = "dojo" | "ring";

type TriviaCardSnapshot = Array<{
  itemId: string;
  choices: string[];
  correctIndex: number;
  dropIndex: number;
}>;

interface MemoryTriviaAttempt extends Attempt {
  startedAt: Date | null;
  endedAt: Date | null;
  deckSnapshot: TriviaCardSnapshot;
}

interface MemoryTriviaAnswer extends Answer {}

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

const participantsStore = new Map<string, MemoryParticipant>();
const submissionsStore: MemorySubmission[] = [];
const data3StatsStore: MemoryData3Stat[] = DEFAULT_DATA3_STATS.map((stat, index) => ({
  id: `mem-stat-${index}`,
  createdAt: new Date(),
  ...stat,
}));
const customCategoriesStore: MemoryCustomCategory[] = [];
const triviaUsersStore = new Map<string, MemoryUser>();
const triviaAttemptsStore: MemoryTriviaAttempt[] = [];
const triviaAnswersStore: MemoryTriviaAnswer[] = [];
const raffleEntriesStore: Array<{
  id: string;
  emailHash: string;
  category: string;
  attemptId: string;
  raffleDate: string;
  createdAt: Date;
}> = [];
const chatSessionsStore = new Map<string, MemoryChatSession>();

const TRIVIA_TARGETS: Record<number, number> = { 1: 1, 2: 3, 3: 1 };
const TRIVIA_ROUND_SIZE = 5;
const MAX_TRIVIA_TIME_MS = 15_000; // 15 seconds to match frontend timer
const ACTIVE_RING_WINDOW_MINUTES = 15;

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

function loadTriviaItems(): TriviaItem[] {
  try {
    const filePath = path.resolve(process.cwd(), "docs", "trivia-items-starter.json");
    const raw = JSON.parse(readFileSync(filePath, "utf-8")) as Array<any>;
    return raw.map((item) => ({
      id: item.id,
      category: item.category,
      stem: item.stem,
      choices: [item.choice_a, item.choice_b, item.choice_c].filter(Boolean),
      correctIndex: item.correct_index,
      dropIndex: item.drop_index,
      hint9s: item.hint_9s,
      difficulty: item.difficulty,
      tags: typeof item.tags === "string"
        ? item.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean)
        : Array.isArray(item.tags) ? item.tags : [],
      explanation: item.explanation ?? null,
      active: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies TriviaItem));
  } catch (error) {
    console.warn("[memory] Failed to load trivia items seed:", error);
    return [];
  }
}

const triviaItemsStore: TriviaItem[] = loadTriviaItems();

const SAMPLE_PARTICIPANTS: Array<Pick<Participant, "firstName" | "lastName">> = [
  { firstName: "Alex", lastName: "Chen" },
  { firstName: "Priya", lastName: "Singh" },
  { firstName: "Marcus", lastName: "Ng" },
  { firstName: "Sophie", lastName: "Kaur" },
  { firstName: "Liam", lastName: "O'Connor" },
];

const SAMPLE_SUBMISSIONS = [
  {
    participantIndex: 0,
    category: "SECURE_CONNECTIVITY",
    totalScore: 86,
    solutionText:
      "Deployed Cisco SecureX automation with Duo for rapid zero trust onboarding across remote branches.",
    structured: {
      problem_summary: "Regional offices struggled with inconsistent security policies and MFA gaps.",
      impact_summary: "Achieved a unified policy baseline with automated threat containment across 12 locations.",
      technologies: ["SecureX", "Duo", "Cisco Umbrella"],
      action_plan: [
        "Integrate SecureX playbooks for policy drift detection",
        "Roll out Duo Passwordless for high-risk groups",
        "Adopt Umbrella SIG for DNS-level protection",
      ],
    },
    subscores: { innovation: 28, impact: 30, feasibility: 28 },
  },
  {
    participantIndex: 1,
    category: "OBSERVABILITY",
    totalScore: 91,
    solutionText:
      "Unified AppDynamics and ThousandEyes to give command centre teams correlated full-stack visibility.",
    structured: {
      problem_summary: "Customer experience war-room lacked end-to-end performance analytics.",
      impact_summary: "Cut mean time to resolution by 45% across cloud and on-prem workloads.",
      technologies: ["AppDynamics", "ThousandEyes", "Cisco Intersight"],
      action_plan: [
        "Deploy AppDynamics business transactions for critical journeys",
        "Configure ThousandEyes last-mile synthetic tests",
        "Stream observability data into Webex Control Hub dashboards",
      ],
    },
    subscores: { innovation: 30, impact: 32, feasibility: 29 },
  },
  {
    participantIndex: 2,
    category: "HYBRID_DC",
    totalScore: 84,
    solutionText:
      "Implemented Cisco Nexus Dashboard automation to orchestrate hybrid cloud workload placement.",
    structured: {
      problem_summary: "Existing provisioning process caused week-long delays for analytics teams.",
      impact_summary: "Reduced provisioning to under two hours with guardrails for compliance.",
      technologies: ["Cisco Nexus Dashboard", "Intersight Service for Terraform"],
      action_plan: [
        "Baseline current capacity with Intersight",
        "Create Terraform blueprints for data science sandboxes",
        "Enable policy-as-code approvals via ServiceNow",
      ],
    },
    subscores: { innovation: 27, impact: 29, feasibility: 28 },
  },
  {
    participantIndex: 3,
    category: "COLLAB_CX",
    totalScore: 88,
    solutionText:
      "Transformed contact centre with Webex Customer Experience AI and Meraki sensor integrations.",
    structured: {
      problem_summary: "Voice-only queues struggled to surface context from in-store experiences.",
      impact_summary: "Raised CSAT scores by feeding real-time footfall insights to agents.",
      technologies: ["Webex Contact Center", "Meraki MV", "Webex Experience Manager"],
      action_plan: [
        "Deploy AI-powered topic summarisation in Webex",
        "Integrate Meraki MV occupancy data",
        "Launch proactive outreach journeys via Webex Journey Builder",
      ],
    },
    subscores: { innovation: 29, impact: 31, feasibility: 28 },
  },
  {
    participantIndex: 4,
    category: "EDGE_IOT",
    totalScore: 79,
    solutionText:
      "Connected remote depots with Cisco Industrial IoT gateways and real-time telemetry analytics.",
    structured: {
      problem_summary: "Legacy sensors offered no predictive insight into refrigerated asset health.",
      impact_summary: "Prevented spoilage incidents with automated anomaly detection and service dispatch.",
      technologies: ["Cisco Catalyst IR1100", "Kinetic", "Meraki Insight"],
      action_plan: [
        "Stage IR1100 gateways with LTE failover",
        "Normalize OT telemetry through Kinetic",
        "Surface incidents within ServiceNow via Meraki APIs",
      ],
    },
    subscores: { innovation: 26, impact: 27, feasibility: 26 },
  },
];

function seedMemoryData() {
  if (participantsStore.size > 0 || submissionsStore.length > 0) {
    return;
  }

  SAMPLE_PARTICIPANTS.forEach((participant) => {
    const record: MemoryParticipant = {
      id: nanoid(),
      firstName: participant.firstName,
      lastName: participant.lastName,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60)),
    };
    participantsStore.set(record.id, record);
  });

  SAMPLE_SUBMISSIONS.forEach((entry, index) => {
    const participant = Array.from(participantsStore.values())[entry.participantIndex];
    if (!participant) {
      return;
    }

    const submission: MemorySubmission = {
      id: nanoid(),
      participantId: participant.id,
      category: entry.category,
      solutionText: entry.solutionText,
      structuredJson: JSON.stringify(entry.structured),
      subScores: JSON.stringify(entry.subscores),
      totalScore: entry.totalScore,
      evaluationNotes: "Seeded showcase submission",
      announcedOnLeaderboard: false,
      createdAt: new Date(Date.now() - index * 1000 * 45),
    };

    submissionsStore.push(submission);
  });

  sortSubmissions();
}

seedMemoryData();

const stopWords = new Set<string>([
  "the",
  "and",
  "for",
  "with",
  "that",
  "from",
  "this",
  "have",
  "their",
  "about",
  "into",
  "your",
  "when",
  "where",
  "which",
  "will",
  "need",
  "needs",
  "they",
  "them",
  "over",
  "under",
  "while",
  "after",
  "before",
  "because",
  "ensure",
  "teams",
  "users",
  "staff",
  "team",
  "user",
  "people",
  "per",
  "week",
  "weeks",
  "month",
  "months",
  "year",
  "years",
  "each",
  "every",
  "daily",
  "weekly",
  "solution",
  "solutions",
  "problem",
  "problems",
  "impact",
  "summary",
  "baseline",
  "target",
  "targets",
  "kpi",
  "kpis",
  "plan",
  "plans",
  "action",
  "actions",
  "risk",
  "risks",
  "success",
  "check",
  "checks",
  "business",
  "customer",
  "customers",
  "experience",
  "experiences",
  "operations",
  "operation",
  "operational",
  "strategy",
  "strategies",
  "architecture",
  "architectures",
  "program",
  "programs",
  "enablement",
  "visibility",
  "governance",
  "process",
  "processes",
  "automation",
  "automated",
  "monitoring",
  "performance",
  "delivery",
  "services",
  "service",
  "environment",
  "environments",
  "employee",
  "employees",
  "site",
  "sites",
  "deployment",
  "deployments",
  "deploy",
  "deploying",
  "rollout",
  "rollouts",
  "phase",
  "phases",
  "global",
  "regional",
  "improve",
  "improves",
  "improved",
  "improving",
  "increase",
  "increases",
  "increased",
  "reduces",
  "reduced",
  "reducing",
  "reduction",
  "reductions",
  "optimize",
  "optimise",
  "optimised",
  "optimizing",
  "optimising",
  "system",
  "systems",
  "application",
  "applications",
  "apps",
  "app",
  "cloud",
  "digital",
  "data",
  "security",
  "secure",
  "connectivity",
  "hybrid",
  "observability",
  "edge",
  "iot",
  "general",
  "scale",
  "expertise",
  "cisco",
  "zero",
  "trust",
  "fso",
  "network",
  "networks",
  "platform",
  "platforms",
  "technology",
  "technologies",
  "client",
  "clients",
]);

const knownTechnologyTerms = new Set<string>([
  "appdynamics",
  "app dynamics",
  "thousandeyes",
  "securex",
  "duo",
  "duo mfa",
  "duo security",
  "meraki",
  "meraki mx",
  "meraki mr",
  "meraki mg",
  "meraki mv",
  "meraki insight",
  "meraki dashboard",
  "meraki systems manager",
  "umbrella",
  "webex",
  "webex calling",
  "webex contact center",
  "webex control hub",
  "catalyst",
  "catalyst center",
  "catalyst 9000",
  "catalyst sd-wan",
  "vmanage",
  "vsmart",
  "ise",
  "identity services engine",
  "intersight",
  "ucs",
  "hyperflex",
  "sd-wan",
  "sase",
  "aci",
  "aci fabric",
  "nexus",
  "nx-os",
  "nxos",
  "dna center",
  "secure client",
  "anyconnect",
  "amp",
  "secure endpoint",
  "xdr",
  "panoptica",
  "threat grid",
  "firepower",
  "firepower threat defense",
  "ftd",
  "stealthwatch",
  "tetration",
  "servicenow",
  "salesforce",
  "microsoft teams",
  "power bi",
  "azure",
  "aws",
  "google cloud",
  "splunk",
  "pagerduty",
  "datadog",
  "new relic",
  "snowflake",
  "tableau",
  "dynatrace",
  "okta",
  "workday",
  "sap",
  "jira",
  "confluence",
  "github",
  "gitlab",
  "slack",
  "zoom",
  "servicenow cmdb",
  "servicenow itom",
  "meraki vision",
  "appdynamics synthetics",
  "thousandeyes synthetics",
  "securex orchestration",
]);

function ensureParticipant(id: string): MemoryParticipant | undefined {
  return participantsStore.get(id);
}

function sortSubmissions(): void {
  submissionsStore.sort((a, b) => {
    if (b.totalScore === a.totalScore) {
      return differenceInMilliseconds(b.createdAt, a.createdAt);
    }
    return b.totalScore - a.totalScore;
  });
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function calculatePitchScore(subScoresRaw: string | null): number {
  const parsed = parseJson<Record<string, unknown>>(subScoresRaw);
  if (!parsed) {
    return 0;
  }

  return Object.values(parsed).reduce<number>((sum, value) => {
    if (typeof value === "number") {
      return sum + value;
    }
    return sum;
  }, 0);
}

function buildWordCloud(): { text: string; value: number }[] {
  const technologyCounts = new Map<string, { count: number; display: string }>();

  const addTechnology = (term: string) => {
    const cleaned = term.replace(/\s+/g, " ").trim();
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

  const processText = (text: string) => {
    if (!text) return;
    const tokens = text
      .split(/\s+/)
      .map((token) => token.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+\-\/#!]+$/g, ""))
      .filter(Boolean);

    const used = new Set<number>();
    const normalized = tokens.map((token) => ({
      cleaned: token,
      lower: token.toLowerCase(),
    }));

    const tryAddPhrase = (start: number, length: number) => {
      if (start + length > normalized.length) return false;
      for (let i = 0; i < length; i += 1) {
        if (used.has(start + i)) return false;
      }
      const phraseTokens = normalized.slice(start, start + length);
      const phrase = phraseTokens.map((t) => t.lower).join(" ");
      if (!knownTechnologyTerms.has(phrase)) {
        return false;
      }
      phraseTokens.forEach((_, idx) => used.add(start + idx));
      addTechnology(phraseTokens.map((t) => t.cleaned).join(" "));
      return true;
    };

    for (let i = 0; i < normalized.length; i += 1) {
      if (tryAddPhrase(i, 3)) continue;
      if (tryAddPhrase(i, 2)) continue;
      const token = normalized[i];
      if (used.has(i)) continue;
      if (stopWords.has(token.lower)) continue;
      if (!/^[a-zA-Z0-9+\-\/#!]+$/.test(token.cleaned)) continue;
      if (knownTechnologyTerms.has(token.lower) || token.cleaned.length > 2) {
        addTechnology(token.cleaned);
      }
    }
  };

  submissionsStore.forEach((submission) => {
    processText(submission.solutionText);
    const structured = parseJson<Record<string, unknown>>(submission.structuredJson ?? "");
    if (structured) {
      Object.values(structured).forEach((value) => {
        if (typeof value === "string") {
          processText(value);
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === "string") {
              processText(item);
            } else if (item && typeof item === "object") {
              const record = item as Record<string, unknown>;
              const candidate =
                typeof record.name === "string"
                  ? record.name
                  : typeof record.value === "string"
                  ? record.value
                  : typeof record.target === "string"
                  ? record.target
                  : undefined;
              if (candidate) {
                processText(candidate);
              }
            }
          });
        }
      });
    }
  });

  return Array.from(technologyCounts.values())
    .map((entry) => ({ text: entry.display, value: entry.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 30);
}

export function createMemoryStorage() {
  const normalizeProfile = (
    profile: StartTriviaAttemptOptions["playerProfile"],
  ): Partial<User> => {
    if (!profile) return {};
    const result: Partial<User> = {};
    if (profile.firstName) result.firstName = profile.firstName;
    if (profile.lastName) result.lastName = profile.lastName;
    if (profile.company) result.company = profile.company;
    if (profile.role) result.role = profile.role;
    return result;
  };

  const ensureUserRecord = (
    email: string | undefined,
    profile: StartTriviaAttemptOptions["playerProfile"],
  ): { user: MemoryUser | null; emailHash: string | null } => {
    if (!email) {
      return { user: null, emailHash: null };
    }

    const emailHash = hashEmail(email);
    const normalizedProfile = normalizeProfile(profile);
    const existing = triviaUsersStore.get(emailHash);

    if (existing) {
      const updated = { ...existing, ...normalizedProfile } as MemoryUser;
      triviaUsersStore.set(emailHash, updated);
      return { user: updated, emailHash };
    }

    const user: MemoryUser = {
      id: nanoid(),
      emailHash,
      createdAt: new Date(),
      firstName: normalizedProfile.firstName ?? null,
      lastName: normalizedProfile.lastName ?? null,
      company: normalizedProfile.company ?? null,
      role: normalizedProfile.role ?? null,
    } as MemoryUser;

    triviaUsersStore.set(emailHash, user);
    return { user, emailHash };
  };

  const buildTriviaDeck = (
    category: string,
    deckSize: number = TRIVIA_ROUND_SIZE,
  ): { cards: TriviaCardPayload[]; snapshot: TriviaCardSnapshot; maxVersion: number } => {
    const items = triviaItemsStore.filter((item) => item.category === category && item.active !== false);
    if (!items.length) {
      throw new Error(`No trivia items available for category ${category}`);
    }

    const byDifficulty = new Map<number, TriviaItem[]>();
    for (const item of items) {
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
      if (!baseChoices.length) {
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
    }) {
      const sessionToken = token ?? nanoid();
      const now = new Date();
      const session: MemoryChatSession = {
        token: sessionToken,
        participantId,
        emailHash,
        category,
        triviaAttemptId,
        messages: Array.isArray(messages) ? [...messages] : [],
        createdAt: now,
        updatedAt: now,
      };
      chatSessionsStore.set(sessionToken, session);
      return {
        token: session.token,
        participantId: session.participantId,
        emailHash: session.emailHash,
        category: session.category,
        triviaAttemptId: session.triviaAttemptId,
        messages: [...session.messages],
      } satisfies PersistedChatSession;
    },

    async getChatSession(token: string) {
      const session = chatSessionsStore.get(token);
      if (!session) {
        return null;
      }
      return {
        token: session.token,
        participantId: session.participantId,
        emailHash: session.emailHash,
        category: session.category,
        triviaAttemptId: session.triviaAttemptId,
        messages: [...session.messages],
      } satisfies PersistedChatSession;
    },

    async updateChatSession(
      token: string,
      updates: Partial<
        Pick<PersistedChatSession, "messages" | "category" | "triviaAttemptId" | "emailHash">
      >,
    ) {
      const session = chatSessionsStore.get(token);
      if (!session) {
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, "messages")) {
        session.messages = Array.isArray(updates.messages) ? [...updates.messages] : [];
      }

      if (Object.prototype.hasOwnProperty.call(updates, "category")) {
        session.category = updates.category ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, "triviaAttemptId")) {
        session.triviaAttemptId = updates.triviaAttemptId ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, "emailHash")) {
        session.emailHash = updates.emailHash ?? null;
      }

      session.updatedAt = new Date();

      return {
        token: session.token,
        participantId: session.participantId,
        emailHash: session.emailHash,
        category: session.category,
        triviaAttemptId: session.triviaAttemptId,
        messages: [...session.messages],
      } satisfies PersistedChatSession;
    },

    async deleteChatSession(token: string) {
      chatSessionsStore.delete(token);
    },

    async getTriviaCategories() {
      const summary = new Map<
        string,
        { category: string; total: number; easy: number; medium: number; hard: number }
      >();

      for (const item of triviaItemsStore) {
        if (item.active === false) continue;
        const entry =
          summary.get(item.category) ?? {
            category: item.category,
            total: 0,
            easy: 0,
            medium: 0,
            hard: 0,
          };

        entry.total += 1;
        if (item.difficulty === 1) entry.easy += 1;
        else if (item.difficulty === 2) entry.medium += 1;
        else entry.hard += 1;

        summary.set(item.category, entry);
      }

      return Array.from(summary.values()).sort((a, b) => a.category.localeCompare(b.category));
    },

    async getPracticeTriviaDeck(category: string, deckSize?: number) {
      const { cards } = buildTriviaDeck(category, deckSize);
      return { cards } satisfies { cards: TriviaCardPayload[] };
    },

    async startTriviaAttempt(options: StartTriviaAttemptOptions) {
      const deckSize = options.deckSize ?? TRIVIA_ROUND_SIZE;
      const { cards, snapshot, maxVersion } = buildTriviaDeck(options.category, deckSize);
      const { emailHash } = ensureUserRecord(options.email, options.playerProfile);
      const now = new Date();

      const attempt: MemoryTriviaAttempt = {
        id: nanoid(),
        emailHash,
        category: options.category,
        mode: options.mode,
        startedAt: now,
        endedAt: null,
        triviaScore: null,
        totalScore: null,
        passed: false,
        eligible: false,
        avgCorrectTimeMs: null,
        botBar: null,
        marketingOptIn: !!options.marketingOptIn,
        consentCapturedAt: null,
        attemptDay: computeAttemptDay(now),
        cardSetVersion: maxVersion,
        deckSnapshot: snapshot,
        submissionId: null,
      } as MemoryTriviaAttempt;

      triviaAttemptsStore.push(attempt);
      return { attempt, cards, snapshot };
    },

    async completeTriviaAttempt(options: { attemptId: string; answers: TriviaAnswerInput[] }) {
      const attempt = triviaAttemptsStore.find((entry) => entry.id === options.attemptId);
      if (!attempt) {
        throw new Error("Trivia attempt not found");
      }
      if (attempt.endedAt) {
        throw new Error("Trivia attempt already completed");
      }
      if (!options.answers.length) {
        throw new Error("No answers provided for trivia attempt completion");
      }

      const snapshotMap = new Map(attempt.deckSnapshot.map((entry) => [entry.itemId, entry]));
      const cardMap = new Map(triviaItemsStore.map((item) => [item.id, item]));

      const summaries: TriviaCardSummary[] = [];
      const records: MemoryTriviaAnswer[] = [];
      let totalScore = 0;
      let correctTimeTotal = 0;
      let correctCount = 0;

      for (const submission of options.answers) {
        const snapshot = snapshotMap.get(submission.itemId);
        const item = cardMap.get(submission.itemId);
        if (!snapshot || !item) {
          throw new Error(`Invalid trivia card ${submission.itemId}`);
        }

        const selectedIndex = Number.isInteger(submission.choiceIndex) ? submission.choiceIndex : -1;
        const elapsedMs = Math.max(0, Math.min(MAX_TRIVIA_TIME_MS, submission.elapsedMs ?? MAX_TRIVIA_TIME_MS));
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

        records.push({
          id: nanoid(),
          attemptId: attempt.id,
          itemId: submission.itemId,
          choiceIndex: selectedIndex,
          correct,
          pointsAwarded: points,
          tAnswerMs: elapsedMs,
          createdAt: new Date(),
        } as MemoryTriviaAnswer);

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

      for (let i = triviaAnswersStore.length - 1; i >= 0; i--) {
        if (triviaAnswersStore[i]!.attemptId === attempt.id) {
          triviaAnswersStore.splice(i, 1);
        }
      }

      triviaAnswersStore.push(...records);

      const avgCorrect = correctCount > 0 ? Math.round(correctTimeTotal / correctCount) : null;
      const endedAt = new Date();
      attempt.totalScore = totalScore;
      attempt.triviaScore = totalScore;
      attempt.endedAt = endedAt;
      // Trivia pass threshold: 40% of 60 points = 24 points
      attempt.passed = totalScore >= 24;
      // Eligibility will be determined at submission time based on total score (trivia + pitch) vs bot bar
      attempt.eligible = false;
      attempt.avgCorrectTimeMs = avgCorrect;

      return { attempt, summary: summaries, totalScore };
    },

    async createParticipant(data: InsertParticipant): Promise<Participant> {
      const participant: MemoryParticipant = {
        id: nanoid(),
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: new Date(),
      };
      participantsStore.set(participant.id, participant);
      return participant;
    },

    async getParticipant(id: string): Promise<Participant | null> {
      return ensureParticipant(id) ?? null;
    },

    async ensureUser(data: { email: string; firstName?: string; lastName?: string }): Promise<User> {
      const { user } = ensureUserRecord(data.email, {
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
      // Filter completed ring attempts for this category and date
      const completedAttempts = triviaAttemptsStore.filter((attempt) => {
        if (attempt.category !== category || attempt.mode !== "ring" || !attempt.passed) {
          return false;
        }

        // Check if date matches using attemptDay field (which uses Melbourne timezone)
        if (attempt.attemptDay !== dateStr) {
          return false;
        }

        // Check if has completed submission
        if (!attempt.submissionId) {
          return false;
        }

        return true;
      });

      // Need at least 5 completed submissions to use dynamic bot bar
      const MINIMUM_SUBMISSIONS = 5;
      const FALLBACK_BOT_BAR = 60; // 60% of 100 points

      if (completedAttempts.length < MINIMUM_SUBMISSIONS) {
        return FALLBACK_BOT_BAR;
      }

      // Calculate combined scores (trivia + pitch)
      const combinedScores = completedAttempts
        .map((attempt) => {
          const submission = submissionsStore.find((s) => s.id === attempt.submissionId);
          const triviaScore = attempt.totalScore || 0;
          const pitchScore = submission ? calculatePitchScore(submission.subScores) : 0;
          return triviaScore + pitchScore;
        })
        .filter((score) => score > 0); // Filter out invalid scores

      if (combinedScores.length < MINIMUM_SUBMISSIONS) {
        return FALLBACK_BOT_BAR;
      }

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
      const attempt = triviaAttemptsStore.find((a) => a.id === attemptId);
      return attempt || null;
    },

    async updateTriviaAttemptBotBar(
      attemptId: string,
      botBar: number,
      eligible: boolean,
      combinedScore?: number,
    ): Promise<void> {
      const attempt = triviaAttemptsStore.find((a) => a.id === attemptId);
      if (attempt) {
        attempt.botBar = botBar;
        attempt.eligible = eligible;
        if (typeof combinedScore === "number" && Number.isFinite(combinedScore)) {
          attempt.totalScore = Math.round(combinedScore);
        }
      }
    },

    async checkExistingDailyAttempt(
      emailHash: string | null,
      category: string,
      attemptDay: string
    ): Promise<Attempt | null> {
      if (!emailHash) {
        return null;
      }

      const existing = triviaAttemptsStore.find(
        (a) => a.emailHash === emailHash && a.category === category && a.attemptDay === attemptDay
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

      const existing = raffleEntriesStore.find(
        (entry) =>
          entry.emailHash === emailHash &&
          entry.category === category &&
          entry.raffleDate === raffleDate
      );

      return !!existing;
    },

    async createRaffleEntry(data: {
      emailHash: string;
      category: string;
      attemptId: string;
      raffleDate: string;
    }): Promise<{ success: boolean; alreadyExists?: boolean }> {
      // Check if entry already exists for this email/category/date
      const existing = raffleEntriesStore.find(
        (entry) =>
          entry.emailHash === data.emailHash &&
          entry.category === data.category &&
          entry.raffleDate === data.raffleDate
      );

      if (existing) {
        return { success: false, alreadyExists: true };
      }

      // Create new raffle entry
      raffleEntriesStore.push({
        id: nanoid(),
        emailHash: data.emailHash,
        category: data.category,
        attemptId: data.attemptId,
        raffleDate: data.raffleDate,
        createdAt: new Date(),
      });

      return { success: true };
    },

    async deleteRaffleEntry(id: string) {
      const index = raffleEntriesStore.findIndex((entry) => entry.id === id);
      if (index !== -1) {
        raffleEntriesStore.splice(index, 1);
      }
    },

    async createSubmission(data: InsertSubmission): Promise<Submission> {
      const submission: MemorySubmission = {
        id: nanoid(),
        participantId: data.participantId,
        category: data.category,
        solutionText: data.solutionText,
        structuredJson: data.structuredJson,
        subScores: data.subScores,
        totalScore: data.totalScore,
        evaluationNotes: data.evaluationNotes ?? null,
        announcedOnLeaderboard: data.announcedOnLeaderboard ?? false,
        createdAt: new Date(),
      };
      submissionsStore.push(submission);
      sortSubmissions();
      return submission;
    },

    async updateSubmissionTotalScore(id: string, totalScore: number): Promise<void> {
      const submission = submissionsStore.find((item) => item.id === id);
      if (!submission) {
        return;
      }

      submission.totalScore = totalScore;
      sortSubmissions();
    },

    async attachSubmissionToTriviaAttempt(attemptId: string, submissionId: string): Promise<void> {
      const attempt = triviaAttemptsStore.find((entry) => entry.id === attemptId);
      if (!attempt) {
        throw new Error(`Trivia attempt ${attemptId} not found`);
      }

      attempt.submissionId = submissionId;
    },

    async markSubmissionAsAnnounced(submissionId: string): Promise<void> {
      const submission = submissionsStore.find((s) => s.id === submissionId);
      if (submission) {
        submission.announcedOnLeaderboard = true;
      }
    },

    async getLeaderboard(limit = 100, category?: string): Promise<any[]> {
      const filtered = category
        ? submissionsStore.filter((submission) => submission.category === category)
        : submissionsStore;
      return filtered.slice(0, limit).map((submission) => {
        const participant = ensureParticipant(submission.participantId);
        const lastName = participant?.lastName ?? "";
        return {
          id: submission.id,
          totalScore: submission.totalScore,
          category: submission.category,
          createdAt: submission.createdAt,
          name: `${participant?.firstName ?? "Unknown"} ${lastName ? `${lastName.charAt(0)}.` : ""}`.trim(),
        };
      });
    },

    async getSubmission(id: string): Promise<any> {
      const submission = submissionsStore.find((item) => item.id === id);
      if (!submission) return null;
      const participant = ensureParticipant(submission.participantId);
      const attempt = triviaAttemptsStore.find((item) => item.submissionId === submission.id);
      const triviaScore = attempt?.totalScore ?? attempt?.triviaScore ?? null;
      const combinedScore = (triviaScore ?? 0) + (submission.totalScore ?? 0);
      return {
        ...submission,
        totalScore: combinedScore,
        pitchScore: submission.totalScore,
        triviaScore,
        combinedScore,
        name: `${participant?.firstName ?? "Unknown"} ${participant?.lastName ?? ""}`.trim(),
        subScores: parseJson(submission.subScores),
        structuredJson: parseJson(submission.structuredJson),
      };
    },

    async getAdminLeaderboard(limit = 100): Promise<any[]> {
      return submissionsStore
        .slice(0, limit)
        .map((submission) => {
          const participant = ensureParticipant(submission.participantId);
          const attempt = triviaAttemptsStore.find((item) => item.submissionId === submission.id);
          const triviaScore = attempt?.totalScore ?? attempt?.triviaScore ?? null;
          const combinedScore = (triviaScore ?? 0) + (submission.totalScore ?? 0);
          return {
            ...submission,
            totalScore: combinedScore,
            pitchScore: submission.totalScore,
            triviaScore,
            combinedScore,
            name: `${participant?.firstName ?? "Unknown"} ${participant?.lastName ?? ""}`.trim(),
            subScores: parseJson(submission.subScores),
            structuredJson: parseJson(submission.structuredJson),
          };
        })
        .sort((a, b) => (b.combinedScore ?? 0) - (a.combinedScore ?? 0));
    },

    async getWordCloudData(): Promise<{ text: string; value: number }[]> {
      return buildWordCloud();
    },

    async getCategoryStats(filterDate?: string): Promise<{ [key: string]: number }> {
      const today = filterDate || getMelbourneDate();

      return triviaAttemptsStore.reduce<Record<string, number>>((acc, attempt) => {
        // Only count eligible attempts from today
        if (attempt.eligible && attempt.attemptDay === today) {
          acc[attempt.category] = (acc[attempt.category] ?? 0) + 1;
        }
        return acc;
      }, {});
    },

    async getData3Stats(category?: string): Promise<Data3Stat[]> {
      const stats = category
        ? data3StatsStore.filter((stat) => stat.category === category)
        : data3StatsStore;
      return stats.map((stat) => ({ ...stat }));
    },

    async getActiveRingAttempts(): Promise<Array<{ attemptId: string; initials: string; category: string; startedAt: string }>> {
      const cutoff = Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000;

      const active = triviaAttemptsStore
        .filter((attempt) =>
          attempt.mode === "ring"
          && !attempt.endedAt
          && attempt.startedAt instanceof Date
          && attempt.startedAt.getTime() >= cutoff,
        )
        .map((attempt) => {
          const user = attempt.emailHash ? triviaUsersStore.get(attempt.emailHash) : null;
          const firstInitial = user?.firstName?.trim()?.[0] ?? "";
          const lastInitial = user?.lastName?.trim()?.[0] ?? "";
          const fallback = attempt.id.slice(0, 2).toUpperCase();
          const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase() || fallback;

          const startedAtIso = attempt.startedAt instanceof Date
            ? attempt.startedAt.toISOString()
            : new Date().toISOString();

          return {
            attemptId: attempt.id,
            category: attempt.category,
            startedAt: startedAtIso,
            initials,
          };
        })
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      return active;
    },

    async getActiveRingAttemptsByStage(): Promise<{
      triviaChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }>;
      projectPitchChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }>;
    }> {
      const cutoff = Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000;

      const triviaChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }> = [];
      const projectPitchChallengers: Array<{ attemptId: string; initials: string; category: string; startedAt: string }> = [];

      triviaAttemptsStore
        .filter((attempt) =>
          attempt.mode === "ring"
          && !attempt.submissionId // Changed from endedAt to submissionId
          && attempt.startedAt instanceof Date
          && attempt.startedAt.getTime() >= cutoff,
        )
        .forEach((attempt) => {
          const user = attempt.emailHash ? triviaUsersStore.get(attempt.emailHash) : null;
          const firstInitial = user?.firstName?.trim()?.[0] ?? "";
          const lastInitial = user?.lastName?.trim()?.[0] ?? "";
          const fallback = attempt.id.slice(0, 2).toUpperCase();
          const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase() || fallback;

          const startedAtIso = attempt.startedAt instanceof Date
            ? attempt.startedAt.toISOString()
            : new Date().toISOString();

          const challenger = {
            attemptId: attempt.id,
            category: attempt.category,
            startedAt: startedAtIso,
            initials,
          };

          // If passed is false, they're still on trivia
          // If passed is true, they've completed trivia and are on project pitch
          if (attempt.passed) {
            projectPitchChallengers.push(challenger);
          } else {
            triviaChallengers.push(challenger);
          }
        });

      // Sort both arrays by startedAt (newest first)
      triviaChallengers.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      projectPitchChallengers.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      return {
        triviaChallengers,
        projectPitchChallengers,
      };
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
      const cutoff = Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000;

      const active = triviaAttemptsStore
        .filter((attempt) =>
          attempt.mode === "ring"
          && !attempt.endedAt
          && attempt.startedAt instanceof Date
          && attempt.startedAt.getTime() >= cutoff,
        )
        .map((attempt) => {
          const user = attempt.emailHash ? triviaUsersStore.get(attempt.emailHash) : null;
          const firstInitial = user?.firstName?.trim()?.[0] ?? "";
          const lastInitial = user?.lastName?.trim()?.[0] ?? "";
          const fallback = attempt.id.slice(0, 2).toUpperCase();
          const initials = `${firstInitial}${lastInitial}`.trim().toUpperCase() || fallback;

          const startedAt = attempt.startedAt instanceof Date ? attempt.startedAt : new Date();
          const elapsedMinutes = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60));

          return {
            attemptId: attempt.id,
            category: attempt.category,
            startedAt: startedAt.toISOString(),
            initials,
            emailHash: attempt.emailHash ?? '',
            firstName: user?.firstName ?? null,
            lastName: user?.lastName ?? null,
            elapsedMinutes,
          };
        })
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      return active;
    },

    async forceEndRingAttempt(attemptId: string): Promise<void> {
      const attempt = triviaAttemptsStore.find((a) => a.id === attemptId);
      if (attempt) {
        attempt.endedAt = new Date();
      }
    },

    async clearStaleRingAttempts(): Promise<number> {
      const cutoff = Date.now() - ACTIVE_RING_WINDOW_MINUTES * 60 * 1000;
      let count = 0;

      triviaAttemptsStore.forEach((attempt) => {
        if (
          attempt.mode === "ring"
          && !attempt.endedAt
          && attempt.startedAt instanceof Date
          && attempt.startedAt.getTime() < cutoff
        ) {
          attempt.endedAt = new Date();
          count++;
        }
      });

      return count;
    },

    async clearAllActiveRingAttempts(): Promise<number> {
      let count = 0;

      triviaAttemptsStore.forEach((attempt) => {
        if (attempt.mode === "ring" && !attempt.endedAt) {
          attempt.endedAt = new Date();
          count++;
        }
      });

      return count;
    },

    async getRecentSubmission(): Promise<any> {
      if (submissionsStore.length === 0) return null;
      const submission = submissionsStore[0];
      const participant = ensureParticipant(submission.participantId);
      return {
        ...submission,
        name: `${participant?.firstName ?? "Unknown"} ${participant?.lastName ?? ""}`.trim(),
        subScores: parseJson(submission.subScores),
        structuredJson: parseJson(submission.structuredJson),
      };
    },

    async getTopProblemCategory(): Promise<string> {
      const stats = await this.getCategoryStats();
      let topCategory = "SECURE_CONNECTIVITY";
      let topValue = -1;
      for (const [category, count] of Object.entries(stats)) {
        if (count > topValue) {
          topCategory = category;
          topValue = count;
        }
      }
      return topCategory;
    },

    async clearDatabase(): Promise<void> {
      participantsStore.clear();
      submissionsStore.splice(0, submissionsStore.length);
      data3StatsStore.splice(0, data3StatsStore.length, ...DEFAULT_DATA3_STATS.map((stat, index) => ({
        id: `mem-stat-${index}`,
        createdAt: new Date(),
        ...stat,
      })));
      customCategoriesStore.splice(0, customCategoriesStore.length);
      chatSessionsStore.clear();
    },

    async getSubmissionDetails(id: string): Promise<any> {
      return this.getSubmission(id);
    },

    async getDetailedLeaderboard(limit = 100): Promise<any[]> {
      return this.getAdminLeaderboard(limit);
    },

    async deleteSubmission(id: string): Promise<void> {
      const index = submissionsStore.findIndex((submission) => submission.id === id);
      if (index !== -1) {
        submissionsStore.splice(index, 1);
      }
    },

    async updateData3Stat(id: string, data: Partial<Data3Stat>): Promise<void> {
      const stat = data3StatsStore.find((item) => item.id === id);
      if (!stat) throw new Error("Stat not found");
      Object.assign(stat, data);
    },

    async createData3Stat(data: Omit<Data3Stat, "id" | "createdAt">): Promise<Data3Stat> {
      const stat: MemoryData3Stat = {
        id: nanoid(),
        createdAt: new Date(),
        ...data,
      };
      data3StatsStore.push(stat);
      return stat;
    },

    async deleteData3Stat(id: string): Promise<void> {
      const index = data3StatsStore.findIndex((item) => item.id === id);
      if (index !== -1) {
        data3StatsStore.splice(index, 1);
      }
    },

    async getCategories(): Promise<any[]> {
      const systemCategories = [
        { id: "GENERAL", name: "GENERAL", displayName: "General", color: "bg-[#64748b]", isSystemCategory: true },
        { id: "SCALE", name: "SCALE", displayName: "Scale", color: "bg-[#0891b2]", isSystemCategory: true },
        { id: "EXPERTISE", name: "EXPERTISE", displayName: "Expertise", color: "bg-[#059669]", isSystemCategory: true },
        { id: "SECURE_CONNECTIVITY", name: "SECURE_CONNECTIVITY", displayName: "Zero Trust & Secure Connectivity", color: "bg-[#00BCF2]", isSystemCategory: true },
        { id: "HYBRID_DC", name: "HYBRID_DC", displayName: "Hybrid Cloud Infrastructure", color: "bg-[#8A2BE2]", isSystemCategory: true },
        { id: "COLLAB_CX", name: "COLLAB_CX", displayName: "Collaboration & Customer Experience", color: "bg-[#F97316]", isSystemCategory: true },
        { id: "OBSERVABILITY", name: "OBSERVABILITY", displayName: "Observability & Automation", color: "bg-[#38BDF8]", isSystemCategory: true },
        { id: "EDGE_IOT", name: "EDGE_IOT", displayName: "Edge & IoT Automation", color: "bg-[#22C55E]", isSystemCategory: true },
      ];
      return [
        ...systemCategories,
        ...customCategoriesStore.map((category) => ({
          ...category,
          id: category.name,
          isSystemCategory: false,
          createdAt: category.createdAt?.toISOString?.() ?? null,
        })),
      ];
    },

    async createCategory(data: { name: string; displayName: string; color: string }): Promise<any> {
      const normalizedName = data.name.toUpperCase();
      if (SYSTEM_CATEGORY_NAMES.includes(normalizedName as any)) {
        throw new Error(`Cannot create category '${data.name}': This name is reserved for system categories. Please choose a different name.`);
      }
      const exists = customCategoriesStore.find((category) => category.name.toLowerCase() === data.name.toLowerCase());
      if (exists) {
        throw new Error(`Category with name '${data.name}' already exists`);
      }
      const category: MemoryCustomCategory = {
        id: nanoid(),
        name: data.name,
        displayName: data.displayName,
        color: data.color,
        createdAt: new Date(),
      };
      customCategoriesStore.push(category);
      return {
        id: category.name,
        name: category.name,
        displayName: category.displayName,
        color: category.color,
        isSystemCategory: false,
        createdAt: category.createdAt ? category.createdAt.toISOString() : null,
      };
    },

    async updateCategory(id: string, data: { displayName: string; color: string }): Promise<void> {
      const category = customCategoriesStore.find((item) => item.name === id);
      if (!category) {
        throw new Error(`Custom category '${id}' not found or is a system category`);
      }
      category.displayName = data.displayName;
      category.color = data.color;
    },

    async deleteCategory(id: string): Promise<{ success: boolean; reassignedStats?: number }> {
      const index = customCategoriesStore.findIndex((item) => item.name === id);
      if (index === -1) {
        throw new Error(`Custom category '${id}' not found or is a system category`);
      }
      const reassignedStats = data3StatsStore.reduce((count, stat) => {
        if (stat.category === id) {
          stat.category = "GENERAL";
          return count + 1;
        }
        return count;
      }, 0);
      customCategoriesStore.splice(index, 1);
      return { success: true, reassignedStats };
    },

    // Beta Admin Methods - Stub implementations for memory storage
    async getBetaAdminOverview() {
      return {
        stats: {
          totalAttempts: 0,
          passedAttempts: 0,
          avgScore: 0,
          passRate: 0,
          ringAttempts: 0,
          dojoAttempts: 0,
          raffleEntries: 0,
        },
        recentAttempts: [],
      };
    },

    async getBetaAdminTriviaItems() {
      return [];
    },

    async createTriviaItem() {
      throw new Error("Beta admin features require database storage");
    },

    async updateTriviaItem() {
      throw new Error("Beta admin features require database storage");
    },

    async deleteTriviaItem() {
      throw new Error("Beta admin features require database storage");
    },

    async getBetaAdminRaffleEntries() {
      return [];
    },

    async getBotBarStats() {
      return [];
    },

    async getWordCloudEntries() {
      return [];
    },

    async createWordCloudEntry() {
      throw new Error("Word cloud management requires database storage");
    },

    async updateWordCloudEntry() {
      throw new Error("Word cloud management requires database storage");
    },

    async deleteWordCloudEntry() {
      throw new Error("Word cloud management requires database storage");
    },

    async batchDeleteWordCloudEntries() {
      throw new Error("Word cloud management requires database storage");
    },

    async syncWordCloudFromSubmissions() {
      throw new Error("Word cloud sync requires database storage");
    },

    // DB Admin methods
    async getDBStats() {
      throw new Error("DB statistics require database storage");
    },

    async clearLeaderboardCache() {
      throw new Error("Leaderboard cache management requires database storage");
    },

    async selectRaffleWinner() {
      throw new Error("Raffle winner selection requires database storage");
    },

    async getRaffleDrawByDate() {
      throw new Error("Raffle draw retrieval requires database storage");
    },

    async clearOldRaffleEntries() {
      throw new Error("Raffle entry management requires database storage");
    },
  };
}
