import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../shared/schema.js";

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
  pool = new Pool({ connectionString });
  db = drizzle({ client: pool, schema });
} else {
  console.warn(
    "[db] No database connection string found (expected DATABASE_URL or a POSTGRES_URL variant) – falling back to in-memory storage. Production deployments must provide a database connection string.",
  );
}

export { pool, db };
export const hasDatabase = !!db;
