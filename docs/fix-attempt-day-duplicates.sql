-- Fix duplicate attempts that violate the unique constraint
-- This happens when timezone fix moves attempts to the same day
-- Run this BEFORE creating the idx_attempts_ring_daily index

-- Step 1: Identify duplicates
-- Show which email_hash + category + day combinations have multiple ring attempts
SELECT
  email_hash,
  category,
  DATE(started_at AT TIME ZONE 'Australia/Melbourne') AS attempt_day,
  COUNT(*) as attempt_count,
  STRING_AGG(id::text, ', ' ORDER BY started_at) as attempt_ids,
  MIN(started_at) as first_attempt,
  MAX(started_at) as last_attempt
FROM attempts
WHERE mode = 'ring'
GROUP BY email_hash, category, DATE(started_at AT TIME ZONE 'Australia/Melbourne')
HAVING COUNT(*) > 1
ORDER BY attempt_day DESC, email_hash, category;

-- Step 2: Show details of duplicate attempts to decide which to keep
-- For each duplicate group, show which ones are completed vs in-progress
SELECT
  a.id,
  a.email_hash,
  a.category,
  a.started_at,
  a.ended_at,
  DATE(a.started_at AT TIME ZONE 'Australia/Melbourne') AS attempt_day,
  a.total_score,
  a.passed,
  a.submission_id,
  CASE
    WHEN a.ended_at IS NOT NULL THEN 'COMPLETED'
    ELSE 'IN_PROGRESS'
  END as status,
  ROW_NUMBER() OVER (
    PARTITION BY a.email_hash, a.category, DATE(a.started_at AT TIME ZONE 'Australia/Melbourne')
    ORDER BY a.ended_at DESC NULLS LAST, a.started_at
  ) as keep_priority
FROM attempts a
WHERE a.mode = 'ring'
  AND EXISTS (
    -- Only show attempts that have duplicates
    SELECT 1
    FROM attempts a2
    WHERE a2.mode = 'ring'
      AND a2.email_hash = a.email_hash
      AND a2.category = a.category
      AND DATE(a2.started_at AT TIME ZONE 'Australia/Melbourne') = DATE(a.started_at AT TIME ZONE 'Australia/Melbourne')
      AND a2.id != a.id
  )
ORDER BY DATE(a.started_at AT TIME ZONE 'Australia/Melbourne') DESC, a.email_hash, a.category, keep_priority;

-- Step 3: Delete duplicate attempts (keep the one with keep_priority = 1)
-- Strategy: Keep completed attempts over in-progress, and earliest if both have same status
BEGIN;

-- Delete duplicates, keeping only the one with highest priority
-- (completed attempts first, then earliest attempt)
DELETE FROM attempts
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY email_hash, category, DATE(started_at AT TIME ZONE 'Australia/Melbourne')
        ORDER BY
          CASE WHEN ended_at IS NOT NULL THEN 0 ELSE 1 END,  -- Completed first
          started_at  -- Then earliest
      ) as keep_priority
    FROM attempts
    WHERE mode = 'ring'
  ) ranked
  WHERE keep_priority > 1  -- Delete everything except priority 1
);

-- Show what was deleted
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM attempts WHERE mode = 'ring' GROUP BY email_hash, category, DATE(started_at AT TIME ZONE 'Australia/Melbourne') HAVING COUNT(*) > 1)
    THEN 'ERROR: Still have duplicates!'
    ELSE 'SUCCESS: All duplicates removed'
  END as result;

COMMIT;

-- Step 4: Verify no more duplicates
SELECT
  email_hash,
  category,
  DATE(started_at AT TIME ZONE 'Australia/Melbourne') AS attempt_day,
  COUNT(*) as attempt_count
FROM attempts
WHERE mode = 'ring'
GROUP BY email_hash, category, DATE(started_at AT TIME ZONE 'Australia/Melbourne')
HAVING COUNT(*) > 1;

-- Should return no rows if cleanup was successful
