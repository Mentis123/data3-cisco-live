-- Migration: Add announced_on_leaderboard column to submissions table
-- Purpose: Control when submissions appear on the leaderboard (only after user sees their results)
-- Date: 2025-03-05

-- Add announced_on_leaderboard column to submissions table
ALTER TABLE "submissions"
  ADD COLUMN IF NOT EXISTS "announced_on_leaderboard" boolean NOT NULL DEFAULT false;

-- Create index on announced_on_leaderboard for faster leaderboard queries
CREATE INDEX IF NOT EXISTS "idx_submissions_announced" ON "submissions"("announced_on_leaderboard");

-- Update existing submissions to be announced (for backwards compatibility)
UPDATE "submissions"
  SET "announced_on_leaderboard" = true
  WHERE "announced_on_leaderboard" = false;
