-- Complete fix for attempt_day timezone mismatch
-- This script handles both the timezone fix AND cleanup of any duplicates
-- Run this in Neon SQL Admin to fix the "Cannot start trivia" error

BEGIN;

-- Step 1: Drop the existing unique constraint (it depends on the column)
DROP INDEX IF EXISTS idx_attempts_ring_daily;

-- Step 2: Drop and recreate the generated column with correct timezone
ALTER TABLE attempts DROP COLUMN IF EXISTS attempt_day;

ALTER TABLE attempts
ADD COLUMN attempt_day date
GENERATED ALWAYS AS (DATE(started_at AT TIME ZONE 'Australia/Melbourne')) STORED;

-- Step 3: Identify duplicates that would violate the unique constraint
SELECT
  'Found duplicates:' as message,
  COUNT(*) as duplicate_groups
FROM (
  SELECT
    email_hash,
    category,
    attempt_day
  FROM attempts
  WHERE mode = 'ring'
  GROUP BY email_hash, category, attempt_day
  HAVING COUNT(*) > 1
) dupes;

-- Step 4: Clean up duplicates (keep completed attempts, or earliest if all incomplete)
-- This DELETE keeps the first attempt based on priority rules
DELETE FROM attempts
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY email_hash, category, attempt_day
        ORDER BY
          CASE WHEN ended_at IS NOT NULL THEN 0 ELSE 1 END,  -- Completed attempts first
          started_at  -- Then earliest started
      ) as keep_priority
    FROM attempts
    WHERE mode = 'ring'
  ) ranked
  WHERE keep_priority > 1  -- Delete all except the keeper (priority 1)
);

-- Step 5: Verify no duplicates remain
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM attempts
      WHERE mode = 'ring'
      GROUP BY email_hash, category, attempt_day
      HAVING COUNT(*) > 1
    )
    THEN 'ERROR: Still have duplicates!'
    ELSE 'SUCCESS: No duplicates found'
  END as duplicate_check;

-- Step 6: Create the unique index
CREATE UNIQUE INDEX idx_attempts_ring_daily
ON attempts (email_hash, category, attempt_day)
WHERE mode = 'ring';

-- Step 7: Verify the fix
SELECT
  column_name,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'attempts'
  AND column_name = 'attempt_day';

-- Should show: "DATE((started_at AT TIME ZONE 'Australia/Melbourne'::text))"

-- Step 8: Test with sample data
SELECT
  id,
  category,
  started_at AT TIME ZONE 'Australia/Melbourne' AS melbourne_time,
  attempt_day,
  DATE(started_at AT TIME ZONE 'Australia/Melbourne') AS expected_day,
  CASE
    WHEN attempt_day = DATE(started_at AT TIME ZONE 'Australia/Melbourne') THEN '✓ Match'
    ELSE '✗ Mismatch'
  END AS status
FROM attempts
WHERE mode = 'ring'
ORDER BY started_at DESC
LIMIT 10;

COMMIT;

SELECT 'Fix complete! The attempt_day column now uses Melbourne timezone.' as result;
