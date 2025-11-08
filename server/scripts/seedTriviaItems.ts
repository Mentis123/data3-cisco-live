import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import process from "process";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import * as schema from "../../shared/schema.js";

interface RawTriviaRow {
  id: string;
  category: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  correct_index: number | string;
  drop_index: number | string;
  hint_9s: string;
  tags?: string | string[];
  explanation?: string | null;
}

function parseChoices(row: RawTriviaRow): string[] {
  const choices = [row.choice_a, row.choice_b, row.choice_c]
    .map((choice) => (typeof choice === "string" ? choice.trim() : ""))
    .filter((choice) => choice.length > 0);

  if (choices.length !== 3) {
    throw new Error(`Trivia card ${row.id} expected 3 choices but found ${choices.length}`);
  }

  return choices;
}

function parseNumber(value: number | string, fallback: number): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTags(value: RawTriviaRow["tags"]): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter((tag) => tag.length > 0);
  }

  return String(value)
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

async function loadSeedRows(datasetPath: string): Promise<RawTriviaRow[]> {
  const raw = await readFile(datasetPath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Trivia seed file must contain an array of rows");
  }

  return parsed as RawTriviaRow[];
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NO_SSL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL (or a POSTGRES_URL variant) must be provided to seed trivia items.",
    );
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, "../..", "");
  const datasetPath = path.resolve(projectRoot, "docs", "trivia-items-starter.json");

  const rows = await loadSeedRows(datasetPath);
  const timestamp = new Date();

  const records = rows.map((row) => {
    const choices = parseChoices(row);
    const correctIndex = parseNumber(row.correct_index, 0);
    const dropIndex = parseNumber(row.drop_index, 0);

    if (correctIndex < 0 || correctIndex >= choices.length) {
      throw new Error(`Trivia card ${row.id} has invalid correct_index ${correctIndex}`);
    }

    if (dropIndex < 0 || dropIndex >= choices.length) {
      throw new Error(`Trivia card ${row.id} has invalid drop_index ${dropIndex}`);
    }

    return {
      id: row.id,
      category: row.category,
      stem: row.stem,
      choices,
      correctIndex,
      dropIndex,
      hint9s: row.hint_9s,
      tags: parseTags(row.tags),
      explanation: row.explanation ?? null,
      active: true,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies typeof schema.triviaItems.$inferInsert;
  });

  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, schema });

  try {
    await db
      .insert(schema.triviaItems)
      .values(records)
      .onConflictDoUpdate({
        target: schema.triviaItems.id,
        set: {
          category: sql`excluded.category`,
          stem: sql`excluded.stem`,
          choices: sql`excluded.choices`,
          correctIndex: sql`excluded.correct_index`,
          dropIndex: sql`excluded.drop_index`,
          hint9s: sql`excluded.hint_9s`,
          tags: sql`excluded.tags`,
          explanation: sql`excluded.explanation`,
          active: sql`excluded.active`,
          version: sql`excluded.version`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    console.log(`Seeded ${records.length} trivia items from ${path.basename(datasetPath)}`);
  } finally {
    await pool.end();
  }
}

const invokedDirectly =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]!).href;

if (invokedDirectly) {
  main().catch((error) => {
    console.error("Failed to seed trivia items:", error);
    process.exit(1);
  });
}
