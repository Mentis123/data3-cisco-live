#!/usr/bin/env tsx
/**
 * Script to apply the announced_on_leaderboard migration
 *
 * Usage:
 *   DATABASE_URL="your-url" tsx scripts/apply-announced-migration.ts
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL ||
                      process.env.POSTGRES_URL ||
                      process.env.POSTGRES_PRISMA_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  console.error('\nUsage:');
  console.error('  DATABASE_URL="your-database-url" tsx scripts/apply-announced-migration.ts');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function applyMigration() {
  console.log('🔄 Applying announced_on_leaderboard migration...\n');

  try {
    // Add column to submissions table
    console.log('Adding announced_on_leaderboard column to submissions table...');
    await sql`
      ALTER TABLE "submissions"
        ADD COLUMN IF NOT EXISTS "announced_on_leaderboard" boolean NOT NULL DEFAULT false
    `;
    console.log('✅ Successfully added column to submissions table');

    // Create index
    console.log('\nCreating index on announced_on_leaderboard...');
    await sql`
      CREATE INDEX IF NOT EXISTS "idx_submissions_announced" ON "submissions"("announced_on_leaderboard")
    `;
    console.log('✅ Successfully created index');

    // Update existing submissions
    console.log('\nUpdating existing submissions to be announced...');
    const result = await sql`
      UPDATE "submissions"
        SET "announced_on_leaderboard" = true
        WHERE "announced_on_leaderboard" = false
    `;
    console.log(`✅ Updated ${result.length} existing submissions`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nThe following changes were applied:');
    console.log('  - submissions.announced_on_leaderboard (boolean, default: false)');
    console.log('  - Index: idx_submissions_announced');
    console.log('  - All existing submissions marked as announced');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
