import { db } from "./server/storage/database";
import { submissions, resetTimestamps } from "./shared/schema";
import { desc, gte } from "drizzle-orm";

async function checkSubmissions() {
  try {
    // Check reset timestamp
    console.log('=== CHECKING RESET TIMESTAMP ===');
    const resetTs = await db
      .select()
      .from(resetTimestamps)
      .where(gte(resetTimestamps.scope, 'word_cloud'))
      .limit(1);

    if (resetTs.length > 0) {
      console.log('Reset timestamp found:', resetTs[0].resetTimestamp);
      console.log('Only syncing submissions AFTER this timestamp');
    } else {
      console.log('No reset timestamp - syncing ALL submissions');
    }

    // Get recent submissions
    console.log('\n=== RECENT SUBMISSIONS (Last 15) ===');
    const recentSubs = await db
      .select({
        id: submissions.id,
        participantId: submissions.participantId,
        category: submissions.category,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .orderBy(desc(submissions.createdAt))
      .limit(15);

    recentSubs.forEach((sub, i) => {
      console.log(`${i+1}. ${sub.createdAt?.toISOString()} - ${sub.participantId} (${sub.category})`);
    });

    // Count totals
    const total = await db.select().from(submissions);
    console.log(`\n=== TOTAL SUBMISSIONS: ${total.length} ===`);

    // Count how many would be synced
    if (resetTs.length > 0 && resetTs[0].resetTimestamp) {
      const syncable = await db
        .select()
        .from(submissions)
        .where(gte(submissions.createdAt, resetTs[0].resetTimestamp));
      console.log(`Submissions AFTER reset: ${syncable.length}`);
      console.log(`Submissions BEFORE reset (excluded): ${total.length - syncable.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSubmissions();
