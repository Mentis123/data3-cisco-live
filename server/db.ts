import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: NeonDatabase<typeof schema> | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.warn(
    "[db] DATABASE_URL not set – falling back to in-memory storage. Production deployments must provide a database connection string.",
  );
}

export { pool, db };
export const hasDatabase = !!db;