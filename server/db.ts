import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../shared/schema.ts";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: NeonDatabase<typeof schema> | null = null;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL_NO_SSL;

if (connectionString) {
  const maskedConnectionInfo = (() => {
    try {
      const url = new URL(connectionString);
      const host = url.hostname;
      const database = url.pathname.replace(/^\//, "");
      return `${host}/${database || "<default>"}`;
    } catch {
      return "<unparseable connection string>";
    }
  })();

  try {
    pool = new Pool({ connectionString });

    pool.on("error", (error) => {
      console.error("[db] Database pool error:", error);
    });

    await pool.query("select 1");

    db = drizzle({ client: pool, schema });
    console.log(`[db] Connected to database at ${maskedConnectionInfo}`);
  } catch (error) {
    console.error(
      `[db] Failed to connect to database at ${maskedConnectionInfo}. Falling back to in-memory storage.`,
      error,
    );

    if (pool) {
      try {
        await pool.end();
      } catch (closeError) {
        console.error("[db] Failed to close database pool after connection error:", closeError);
      }
    }

    pool = null;
    db = null;
  }
} else {
  console.warn(
    "[db] No database connection string found (expected DATABASE_URL or a POSTGRES_URL variant) – falling back to in-memory storage. Production deployments must provide a database connection string.",
  );
}

export { pool, db };
export const hasDatabase = !!db;
