import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema.js";

// IMPORTANT: Explicitly disable WebSocket for serverless environments
// The @neondatabase/serverless package tries to use WebSocket by default, which causes
// "Cannot set property message" errors in serverless environments like Vercel.
// We must explicitly configure it to use HTTP fetch instead.

// Detect if running in serverless environment
const isServerless = !!(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.VERCEL_ENV
);

if (isServerless) {
  // For serverless (Vercel, AWS Lambda), explicitly disable WebSocket and use HTTP fetch
  // This prevents the "Cannot set property message" error
  neonConfig.webSocketConstructor = undefined;
  // Note: fetchConnectionCache is deprecated and now always true
  console.log('[db] Running in serverless environment - WebSocket disabled, using HTTP fetch for database connections');
} else {
  // For local development, we can use WebSocket or HTTP fetch (both work fine)
  console.log('[db] Running in local development mode');
}

let pool: Pool | null = null;
let db: NeonDatabase<typeof schema> | null = null;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL_NO_SSL;

if (connectionString) {
  try {
    // Configure pool with proper limits to prevent connection exhaustion
    pool = new Pool({
      connectionString,
      max: 10, // Maximum 10 connections (Vercel serverless friendly)
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout connection attempts after 10 seconds
    });

    // Add error handler to prevent uncaught exceptions from crashing the process
    pool.on('error', (err) => {
      console.error('[db] Unexpected database pool error:', err);
    });

    db = drizzle({ client: pool, schema });
  } catch (error) {
    console.error('[db] Failed to initialize database pool:', error);
    pool = null;
    db = null;
  }
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
      const errorMessage = error?.message?.toLowerCase() || '';
      const errorCode = error?.code || '';

      const isRetryableError =
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ENOTFOUND' ||
        errorCode === 'ECONNRESET' ||
        errorCode === 'EPIPE' ||
        errorCode === 'PROTOCOL_CONNECTION_LOST' ||
        errorCode === '57P01' || // Neon: admin_shutdown
        errorCode === '57P03' || // Neon: cannot_connect_now
        errorCode === '08006' || // Neon: connection_failure
        errorCode === '08003' || // Neon: connection_does_not_exist
        errorCode === '08000' || // Neon: connection_exception
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('timed out') ||
        errorMessage.includes('network') ||
        errorMessage.includes('suspended') ||
        errorMessage.includes('connect') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('socket') ||
        errorMessage.includes('refused') ||
        errorMessage.includes('unavailable');

      if (!isRetryableError || isLastAttempt) {
        // Log non-retryable errors for debugging
        if (!isRetryableError) {
          console.error(`[db] Non-retryable error in ${operationName}:`, {
            code: errorCode,
            message: error?.message,
            name: error?.name,
          });
        }
        throw error;
      }

      const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff: 500ms, 1s, 2s
      console.warn(
        `[db] ${operationName} attempt ${attempt + 1}/${maxRetries} failed with retryable error, retrying in ${waitTime}ms...`,
        { code: errorCode, message: error?.message }
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(`${operationName} failed after ${maxRetries} attempts`);
}

export { pool, db };
export const hasDatabase = !!db;
