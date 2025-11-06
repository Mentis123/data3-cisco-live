ALTER TABLE "attempts"
  ADD COLUMN IF NOT EXISTS "trivia_score" integer;

UPDATE "attempts"
SET "trivia_score" = "total_score"
WHERE "trivia_score" IS NULL;
