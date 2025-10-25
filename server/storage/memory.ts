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
  FlashItem,
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

type FlashMode = "dojo" | "ring";

type FlashCardSnapshot = Array<{
  itemId: string;
  choices: string[];
  correctIndex: number;
  dropIndex: number;
}>;

interface MemoryFlashAttempt extends Attempt {
  startedAt: Date | null;
  endedAt: Date | null;
  deckSnapshot: FlashCardSnapshot;
}

interface MemoryFlashAnswer extends Answer {}

interface FlashCardPayload {
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

interface FlashCardSummary extends FlashCardPayload {
  selectedIndex: number;
  correct: boolean;
  points: number;
  elapsedMs: number;
}

interface StartFlashAttemptOptions {
  category: string;
  mode: FlashMode;
  email?: string;
  marketingOptIn?: boolean;
  playerProfile?: Pick<User, "firstName" | "lastName" | "company" | "role">;
  deckSize?: number;
}

interface FlashAnswerInput {
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
const flashUsersStore = new Map<string, MemoryUser>();
const flashAttemptsStore: MemoryFlashAttempt[] = [];
const flashAnswersStore: MemoryFlashAnswer[] = [];

const FLASH_TARGETS: Record<number, number> = { 1: 1, 2: 3, 3: 1 };
const FLASH_ROUND_SIZE = 5;
const MAX_FLASH_TIME_MS = 12_000;

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

function loadFlashItems(): FlashItem[] {
  try {
    const filePath = path.resolve(process.cwd(), "docs", "flash-items-starter.json");
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
    } satisfies FlashItem));
  } catch (error) {
    console.warn("[memory] Failed to load flash items seed:", error);
    return [];
  }
}

const flashItemsStore: FlashItem[] = loadFlashItems();

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
    profile: StartFlashAttemptOptions["playerProfile"],
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
    profile: StartFlashAttemptOptions["playerProfile"],
  ): { user: MemoryUser | null; emailHash: string | null } => {
    if (!email) {
      return { user: null, emailHash: null };
    }

    const emailHash = hashEmail(email);
    const normalizedProfile = normalizeProfile(profile);
    const existing = flashUsersStore.get(emailHash);

    if (existing) {
      const updated = { ...existing, ...normalizedProfile } as MemoryUser;
      flashUsersStore.set(emailHash, updated);
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

    flashUsersStore.set(emailHash, user);
    return { user, emailHash };
  };

  const buildFlashDeck = (
    category: string,
    deckSize: number = FLASH_ROUND_SIZE,
  ): { cards: FlashCardPayload[]; snapshot: FlashCardSnapshot; maxVersion: number } => {
    const items = flashItemsStore.filter((item) => item.category === category && item.active !== false);
    if (!items.length) {
      throw new Error(`No flash items available for category ${category}`);
    }

    const byDifficulty = new Map<number, FlashItem[]>();
    for (const item of items) {
      const diff = item.difficulty ?? 2;
      const bucket = byDifficulty.get(diff) ?? [];
      bucket.push(item);
      byDifficulty.set(diff, bucket);
    }

    const selected: FlashItem[] = [];
    const leftover: FlashItem[] = [];

    for (const [difficulty, target] of Object.entries(FLASH_TARGETS)) {
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
      throw new Error(`Insufficient flash items to build a deck for ${category}`);
    }

    const deck = shuffleArray(selected.slice(0, deckSize));
    const cards: FlashCardPayload[] = [];
    const snapshot: FlashCardSnapshot = [];
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
      throw new Error(`Failed to construct flash deck for ${category}`);
    }

    return { cards, snapshot, maxVersion };
  };

  return {
    async getFlashCategories() {
      const summary = new Map<
        string,
        { category: string; total: number; easy: number; medium: number; hard: number }
      >();

      for (const item of flashItemsStore) {
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

    async startFlashAttempt(options: StartFlashAttemptOptions) {
      const deckSize = options.deckSize ?? FLASH_ROUND_SIZE;
      const { cards, snapshot, maxVersion } = buildFlashDeck(options.category, deckSize);
      const { emailHash } = ensureUserRecord(options.email, options.playerProfile);
      const now = new Date();

      const attempt: MemoryFlashAttempt = {
        id: nanoid(),
        emailHash,
        category: options.category,
        mode: options.mode,
        startedAt: now,
        endedAt: null,
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
      } as MemoryFlashAttempt;

      flashAttemptsStore.push(attempt);
      return { attempt, cards, snapshot };
    },

    async completeFlashAttempt(options: { attemptId: string; answers: FlashAnswerInput[] }) {
      const attempt = flashAttemptsStore.find((entry) => entry.id === options.attemptId);
      if (!attempt) {
        throw new Error("Flash attempt not found");
      }
      if (attempt.endedAt) {
        throw new Error("Flash attempt already completed");
      }
      if (!options.answers.length) {
        throw new Error("No answers provided for flash attempt completion");
      }

      const snapshotMap = new Map(attempt.deckSnapshot.map((entry) => [entry.itemId, entry]));
      const cardMap = new Map(flashItemsStore.map((item) => [item.id, item]));

      const summaries: FlashCardSummary[] = [];
      const records: MemoryFlashAnswer[] = [];
      let totalScore = 0;
      let correctTimeTotal = 0;
      let correctCount = 0;

      for (const submission of options.answers) {
        const snapshot = snapshotMap.get(submission.itemId);
        const item = cardMap.get(submission.itemId);
        if (!snapshot || !item) {
          throw new Error(`Invalid flash card ${submission.itemId}`);
        }

        const selectedIndex = Number.isInteger(submission.choiceIndex) ? submission.choiceIndex : -1;
        const elapsedMs = Math.max(0, Math.min(MAX_FLASH_TIME_MS, submission.elapsedMs ?? MAX_FLASH_TIME_MS));
        const correct = selectedIndex === snapshot.correctIndex;

        let points = 0;
        if (correct) {
          if (elapsedMs <= 5000) points = 6;
          else if (elapsedMs <= 9000) points = 5;
          else if (elapsedMs <= MAX_FLASH_TIME_MS) points = 4;
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
        } as MemoryFlashAnswer);

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

      for (let i = flashAnswersStore.length - 1; i >= 0; i--) {
        if (flashAnswersStore[i]!.attemptId === attempt.id) {
          flashAnswersStore.splice(i, 1);
        }
      }

      flashAnswersStore.push(...records);

      const avgCorrect = correctCount > 0 ? Math.round(correctTimeTotal / correctCount) : null;
      const endedAt = new Date();
      attempt.totalScore = totalScore;
      attempt.endedAt = endedAt;
      attempt.passed = totalScore >= 18;
      attempt.eligible = attempt.passed && attempt.mode === "ring";
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
        createdAt: new Date(),
      };
      submissionsStore.push(submission);
      sortSubmissions();
      return submission;
    },

    async attachSubmissionToFlashAttempt(attemptId: string, submissionId: string): Promise<void> {
      const attempt = flashAttemptsStore.find((entry) => entry.id === attemptId);
      if (!attempt) {
        throw new Error(`Flash attempt ${attemptId} not found`);
      }

      attempt.submissionId = submissionId;
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
      return {
        ...submission,
        name: `${participant?.firstName ?? "Unknown"} ${participant?.lastName ?? ""}`.trim(),
        subScores: parseJson(submission.subScores),
        structuredJson: parseJson(submission.structuredJson),
      };
    },

    async getAdminLeaderboard(limit = 100): Promise<any[]> {
      return submissionsStore.slice(0, limit).map((submission) => {
        const participant = ensureParticipant(submission.participantId);
        return {
          ...submission,
          name: `${participant?.firstName ?? "Unknown"} ${participant?.lastName ?? ""}`.trim(),
          subScores: parseJson(submission.subScores),
          structuredJson: parseJson(submission.structuredJson),
        };
      });
    },

    async getWordCloudData(): Promise<{ text: string; value: number }[]> {
      return buildWordCloud();
    },

    async getCategoryStats(): Promise<{ [key: string]: number }> {
      return submissionsStore.reduce<Record<string, number>>((acc, submission) => {
        acc[submission.category] = (acc[submission.category] ?? 0) + 1;
        return acc;
      }, {});
    },

    async getData3Stats(category?: string): Promise<Data3Stat[]> {
      const stats = category
        ? data3StatsStore.filter((stat) => stat.category === category)
        : data3StatsStore;
      return stats.map((stat) => ({ ...stat }));
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
        { id: "HYBRID_DC", name: "HYBRID_DC", displayName: "Data Centre & Hybrid Cloud", color: "bg-[#6CC04A]", isSystemCategory: true },
        { id: "COLLAB_CX", name: "COLLAB_CX", displayName: "Collaboration & Contact Centre", color: "bg-[#FF6B35]", isSystemCategory: true },
        { id: "OBSERVABILITY", name: "OBSERVABILITY", displayName: "Observability & Performance", color: "bg-[#9B59B6]", isSystemCategory: true },
        { id: "EDGE_IOT", name: "EDGE_IOT", displayName: "Edge & IoT Solutions", color: "bg-[#F39C12]", isSystemCategory: true },
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
  };
}
