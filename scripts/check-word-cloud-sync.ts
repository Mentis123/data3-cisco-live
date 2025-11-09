#!/usr/bin/env tsx
/**
 * Check what submissions are being synced for word cloud
 *
 * Usage:
 *   DATABASE_URL="your-url" tsx scripts/check-word-cloud-sync.ts
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL ||
                      process.env.POSTGRES_URL ||
                      process.env.POSTGRES_PRISMA_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkWordCloudSync() {
  console.log('🔍 Checking Word Cloud Sync Status...\n');

  try {
    // Check reset timestamp
    console.log('=== RESET TIMESTAMP CHECK ===');
    const resetTs = await sql`
      SELECT * FROM reset_timestamps
      WHERE scope = 'word_cloud'
    `;

    let resetTimestamp = null;
    if (resetTs.length > 0) {
      resetTimestamp = resetTs[0].reset_timestamp;
      console.log('✓ Reset timestamp found:', resetTimestamp);
      console.log('  Only syncing submissions AFTER this timestamp\n');
    } else {
      console.log('✓ No reset timestamp - syncing ALL submissions\n');
    }

    // Get total submissions count
    const totalCount = await sql`SELECT COUNT(*) as count FROM submissions`;
    console.log('=== TOTAL SUBMISSIONS ===');
    console.log(`Total: ${totalCount[0].count}\n`);

    // Get recent submissions
    console.log('=== RECENT SUBMISSIONS (Last 15) ===');
    const recentSubs = await sql`
      SELECT
        id,
        "participantId",
        category,
        "createdAt",
        LENGTH("solutionText") as text_length,
        CASE
          WHEN "structuredJson" IS NOT NULL THEN TRUE
          ELSE FALSE
        END as has_structured_data
      FROM submissions
      ORDER BY "createdAt" DESC
      LIMIT 15
    `;

    recentSubs.forEach((sub, i) => {
      const afterReset = !resetTimestamp || new Date(sub.createdAt) >= new Date(resetTimestamp);
      const marker = afterReset ? '✓' : '✗';
      console.log(`${i+1}. ${marker} ${sub.createdAt} - ${sub.participantId}`);
      console.log(`   Category: ${sub.category}, Text: ${sub.text_length} chars, Structured: ${sub.has_structured_data}`);
    });

    // Count submissions that would be synced
    if (resetTimestamp) {
      const syncableCount = await sql`
        SELECT COUNT(*) as count
        FROM submissions
        WHERE "createdAt" >= ${resetTimestamp}
      `;
      console.log(`\n=== SYNC STATUS ===`);
      console.log(`Submissions AFTER reset: ${syncableCount[0].count} (will be synced)`);
      console.log(`Submissions BEFORE reset: ${totalCount[0].count - syncableCount[0].count} (will be ignored)`);

      if (syncableCount[0].count === 0) {
        console.log('\n⚠️  WARNING: No submissions will be synced!');
        console.log('   The reset timestamp is newer than all submissions.');
      }
    }

    // Check current word cloud entries
    console.log('\n=== CURRENT WORD CLOUD ENTRIES ===');
    const wordCloudCount = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE active = true) as active,
        COUNT(*) FILTER (WHERE source = 'auto') as auto,
        COUNT(*) FILTER (WHERE source = 'manual') as manual
      FROM word_cloud_entries
    `;
    console.log(`Total entries: ${wordCloudCount[0].total}`);
    console.log(`Active entries: ${wordCloudCount[0].active}`);
    console.log(`Auto-generated: ${wordCloudCount[0].auto}`);
    console.log(`Manual entries: ${wordCloudCount[0].manual}`);

    // Show top 10 word cloud entries
    const topWords = await sql`
      SELECT word, count, source, active
      FROM word_cloud_entries
      WHERE active = true
      ORDER BY count DESC
      LIMIT 10
    `;

    if (topWords.length > 0) {
      console.log('\n=== TOP 10 ACTIVE WORDS ===');
      topWords.forEach((word, i) => {
        console.log(`${i+1}. ${word.word} (${word.count}) - ${word.source}`);
      });
    }

    console.log('\n✅ Check completed!');
  } catch (error) {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  }
}

checkWordCloudSync();
