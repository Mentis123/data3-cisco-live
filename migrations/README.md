# Database Migrations

This directory contains SQL migration files for the database schema.

## How to Apply Migrations

### Option 1: Using Drizzle Kit (Recommended)

If you have the database connection string, you can use Drizzle Kit to automatically sync the schema:

```bash
# Set your database URL
export DATABASE_URL="your-neon-database-url"

# Push schema changes to the database
npm run db:push
```

This will automatically sync all schema changes from `shared/schema.ts` to your database.

### Option 2: Manual SQL Execution

If you prefer to run migrations manually or need more control:

1. Open your Neon database console
2. Navigate to the SQL Editor
3. Copy and paste the SQL from the migration file
4. Execute the SQL

## Recent Migrations

### 20250301000000_add_trivia_columns.sql

**Purpose**: Adds missing columns for trivia card set versioning and scoring

**Changes**:
- Adds `card_set_version` column to `attempts` table (default: 1)
- Adds `deck_snapshot` column to `attempts` table (stores JSONB snapshot of the deck)
- Adds `points_awarded` column to `answers` table (default: 0)

**Status**: ⚠️ **REQUIRED** - The application will fail when starting official trivia attempts without these columns.

**Error if not applied**:
```
column "card_set_version" does not exist
```

To apply this migration immediately, run:
```sql
-- In your Neon SQL console
ALTER TABLE "attempts"
  ADD COLUMN IF NOT EXISTS "card_set_version" integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deck_snapshot" jsonb;

ALTER TABLE "answers"
  ADD COLUMN IF NOT EXISTS "points_awarded" smallint NOT NULL DEFAULT 0;
```

## Migration Naming Convention

Migrations follow the pattern: `YYYYMMDDHHMMSS_description.sql`

Example: `20250301000000_add_trivia_columns.sql`
