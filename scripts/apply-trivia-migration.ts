#!/usr/bin/env tsx
/**
 * Quick script to apply the trivia columns migration
 *
 * Usage:
 *   DATABASE_URL="your-url" tsx scripts/apply-trivia-migration.ts
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL ||
                      process.env.POSTGRES_URL ||
                      process.env.POSTGRES_PRISMA_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  console.error('\nUsage:');
  console.error('  DATABASE_URL="your-database-url" tsx scripts/apply-trivia-migration.ts');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function applyMigration() {
  console.log('🔄 Applying trivia columns migration...\n');

  try {
    // Add columns to attempts table
    console.log('Adding card_set_version and deck_snapshot columns to attempts table...');
    await sql`
      ALTER TABLE "attempts"
        ADD COLUMN IF NOT EXISTS "card_set_version" integer DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "deck_snapshot" jsonb
    `;
    console.log('✅ Successfully added columns to attempts table');

    // Add column to answers table
    console.log('\nAdding points_awarded column to answers table...');
    await sql`
      ALTER TABLE "answers"
        ADD COLUMN IF NOT EXISTS "points_awarded" smallint NOT NULL DEFAULT 0
    `;
    console.log('✅ Successfully added column to answers table');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nThe following columns were added:');
    console.log('  - attempts.card_set_version (integer, default: 1)');
    console.log('  - attempts.deck_snapshot (jsonb)');
    console.log('  - answers.points_awarded (smallint, default: 0)');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
