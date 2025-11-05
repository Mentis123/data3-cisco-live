-- Manual fix for attempt_day timezone mismatch
-- Run this in Neon SQL Admin to ensure the column uses Melbourne timezone
-- This fixes the "Cannot start trivia" duplicate key constraint error

-- Step 1: Check current state of attempt_day column
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'attempts'
  AND column_name = 'attempt_day';

-- Step 2: Drop the existing attempt_day column if it exists with wrong timezone
-- WARNING: This will recalculate all attempt_day values based on started_at
-- The unique constraint will temporarily be dropped and recreated
BEGIN;

-- Drop the unique constraint first (it depends on the column)
DROP INDEX IF EXISTS idx_attempts_ring_daily;

-- Drop the generated column
ALTER TABLE attempts DROP COLUMN IF EXISTS attempt_day;

-- Recreate with Melbourne timezone
ALTER TABLE attempts
ADD COLUMN attempt_day date
GENERATED ALWAYS AS (DATE(started_at AT TIME ZONE 'Australia/Melbourne')) STORED;

-- Recreate the unique constraint
CREATE UNIQUE INDEX idx_attempts_ring_daily
ON attempts (email_hash, category, attempt_day)
WHERE mode = 'ring';

COMMIT;

-- Step 3: Verify the fix
-- Check that attempt_day now uses Melbourne timezone
SELECT
  column_name,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'attempts'
  AND column_name = 'attempt_day';

-- Step 4: Test with sample data
-- Show some attempts with their started_at and attempt_day to verify timezone
SELECT
  id,
  email_hash,
  category,
  mode,
  started_at,
  started_at AT TIME ZONE 'UTC' AS started_at_utc,
  started_at AT TIME ZONE 'Australia/Melbourne' AS started_at_melbourne,
  attempt_day,
  DATE(started_at AT TIME ZONE 'Australia/Melbourne') AS expected_attempt_day
FROM attempts
WHERE mode = 'ring'
ORDER BY started_at DESC
LIMIT 10;

-- This should show that attempt_day matches expected_attempt_day
