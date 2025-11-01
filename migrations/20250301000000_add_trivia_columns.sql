-- Add missing columns to attempts table for trivia card set versioning
ALTER TABLE "attempts"
  ADD COLUMN IF NOT EXISTS "card_set_version" integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deck_snapshot" jsonb;

-- Add missing points_awarded column to answers table
ALTER TABLE "answers"
  ADD COLUMN IF NOT EXISTS "points_awarded" smallint NOT NULL DEFAULT 0;
