import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

// Configure fetch with timeout to prevent hanging connections
neonConfig.fetchConnectionCache = true;

let pool: Pool | null = null;
let db: NeonDatabase<typeof schema> | null = null;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL_NO_SSL;

if (connectionString) {
  // Configure pool with proper limits to prevent connection exhaustion
  pool = new Pool({
    connectionString,
    max: 10, // Maximum 10 connections (Vercel serverless friendly)
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Timeout connection attempts after 10 seconds
  });
  db = drizzle({ client: pool, schema });
} else {
  console.warn(
    "[db] No database connection string found (expected DATABASE_URL or a POSTGRES_URL variant) – falling back to in-memory storage. Production deployments must provide a database connection string.",
  );
}

/**
 * Warms up the database connection by running a simple query.
 * Retries if the database is suspended (common with Neon free tier).
 * This helps prevent 400 errors on cold starts.
 */
export async function warmupDatabase(maxRetries = 3): Promise<boolean> {
  if (!db) return false;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Simple query to wake up the database
      await db.execute(sql`SELECT 1`);
      if (attempt > 0) {
        console.log(`[db] Database warmed up successfully after ${attempt + 1} attempts`);
      }
      return true;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s

      if (isLastAttempt) {
        console.error(`[db] Failed to warm up database after ${maxRetries} attempts:`, error);
        return false;
      }

      console.warn(`[db] Database warmup attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return false;
}

/**
 * Executes a database operation with automatic retry on connection failures.
 * Useful for handling intermittent Neon database connectivity issues.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  operationName = "database operation"
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;

      // Check if error is a connection/network issue worth retrying
      const isRetryableError =
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENOTFOUND' ||
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network');

      if (!isRetryableError || isLastAttempt) {
        throw error;
      }

      const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff: 500ms, 1s, 2s
      console.warn(
        `[db] ${operationName} attempt ${attempt + 1} failed with retryable error, retrying in ${waitTime}ms...`,
        error.message
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(`${operationName} failed after ${maxRetries} attempts`);
}

export { pool, db };
export const hasDatabase = !!db;
