import { nanoid } from "nanoid";
import { promises as fs } from "fs";
import path from "path";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "../../shared/schema.js";
import { chatbotFeedback } from "../../shared/schema.js";
import type { ChatbotFeedback, InsertChatbotFeedback } from "../../shared/schema.js";
import { desc, eq } from "drizzle-orm";

// JSON-based feedback storage (fallback when no database)
interface FeedbackReviewMetadata {
  lastReviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
}

interface JSONFeedbackStore {
  metadata: FeedbackReviewMetadata;
  feedback: ChatbotFeedback[];
}

const FEEDBACK_FILE_PATH = path.join(process.cwd(), "server", "data", "feedback.json");

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(FEEDBACK_FILE_PATH);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }
}

// Initialize feedback file if it doesn't exist
async function initializeFeedbackFile(): Promise<JSONFeedbackStore> {
  await ensureDataDirectory();

  try {
    const data = await fs.readFile(FEEDBACK_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, create it
    const initialData: JSONFeedbackStore = {
      metadata: {
        lastReviewedAt: null,
        reviewedBy: null,
        reviewNotes: null,
      },
      feedback: [],
    };
    await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// Read feedback from JSON
async function readFeedbackJSON(): Promise<JSONFeedbackStore> {
  try {
    const data = await fs.readFile(FEEDBACK_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return await initializeFeedbackFile();
  }
}

// Write feedback to JSON
async function writeFeedbackJSON(data: JSONFeedbackStore): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(data, null, 2));
}

/**
 * Create feedback storage with database
 */
export function createDatabaseFeedbackStorage(db: NeonDatabase<typeof schema>) {
  return {
    async submitFeedback(data: InsertChatbotFeedback): Promise<ChatbotFeedback> {
      const [feedback] = await db
        .insert(chatbotFeedback)
        .values(data)
        .returning();
      return feedback;
    },

    async getAllFeedback(): Promise<ChatbotFeedback[]> {
      return await db
        .select()
        .from(chatbotFeedback)
        .orderBy(desc(chatbotFeedback.createdAt));
    },

    async getFeedbackByStatus(status: string): Promise<ChatbotFeedback[]> {
      return await db
        .select()
        .from(chatbotFeedback)
        .where(eq(chatbotFeedback.status, status))
        .orderBy(desc(chatbotFeedback.createdAt));
    },

    async updateFeedbackStatus(id: string, status: string): Promise<void> {
      await db
        .update(chatbotFeedback)
        .set({ status })
        .where(eq(chatbotFeedback.id, id));
    },
  };
}

/**
 * Create feedback storage with JSON fallback (no database)
 */
export function createJSONFeedbackStorage() {
  return {
    async submitFeedback(data: InsertChatbotFeedback): Promise<ChatbotFeedback> {
      const store = await readFeedbackJSON();

      const feedback: ChatbotFeedback = {
        id: nanoid(),
        emailHash: data.emailHash || null,
        sessionToken: data.sessionToken || null,
        category: data.category,
        rating: data.rating,
        message: data.message,
        page: data.page,
        status: data.status || "pending",
        createdAt: new Date(),
      };

      store.feedback.unshift(feedback); // Add to beginning
      await writeFeedbackJSON(store);

      return feedback;
    },

    async getAllFeedback(): Promise<ChatbotFeedback[]> {
      const store = await readFeedbackJSON();
      return store.feedback;
    },

    async getFeedbackByStatus(status: string): Promise<ChatbotFeedback[]> {
      const store = await readFeedbackJSON();
      return store.feedback.filter((f) => f.status === status);
    },

    async updateFeedbackStatus(id: string, status: string): Promise<void> {
      const store = await readFeedbackJSON();
      const feedback = store.feedback.find((f) => f.id === id);
      if (feedback) {
        feedback.status = status;
        await writeFeedbackJSON(store);
      }
    },

    async updateReviewMetadata(
      reviewedBy: string,
      reviewNotes: string
    ): Promise<void> {
      const store = await readFeedbackJSON();
      store.metadata = {
        lastReviewedAt: new Date().toISOString(),
        reviewedBy,
        reviewNotes,
      };
      await writeFeedbackJSON(store);
    },

    async getReviewMetadata(): Promise<FeedbackReviewMetadata> {
      const store = await readFeedbackJSON();
      return store.metadata;
    },
  };
}
