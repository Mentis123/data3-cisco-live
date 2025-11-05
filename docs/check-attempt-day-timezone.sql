-- Quick diagnostic script to check if attempt_day timezone is correct
-- Run this in Neon SQL Admin to verify the fix has been applied

-- 1. Check the column definition
SELECT
  table_name,
  column_name,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'attempts'
  AND column_name = 'attempt_day';

-- Expected result should show:
-- generation_expression: "DATE((started_at AT TIME ZONE 'Australia/Melbourne'::text))"

-- 2. Compare actual vs expected attempt_day values for recent ring attempts
SELECT
  id,
  category,
  started_at AT TIME ZONE 'Australia/Melbourne' AS melbourne_time,
  attempt_day AS actual_day,
  DATE(started_at AT TIME ZONE 'Australia/Melbourne') AS expected_day,
  CASE
    WHEN attempt_day = DATE(started_at AT TIME ZONE 'Australia/Melbourne') THEN '✓ CORRECT'
    ELSE '✗ WRONG TIMEZONE - needs fix'
  END AS status
FROM attempts
WHERE mode = 'ring'
ORDER BY started_at DESC
LIMIT 10;

-- If you see "✗ WRONG TIMEZONE" in the status column, run fix-attempt-day-timezone.sql
