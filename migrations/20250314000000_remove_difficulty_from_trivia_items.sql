-- Remove difficulty column from trivia_items table
-- Questions are now selected randomly instead of being difficulty-based
ALTER TABLE "trivia_items"
  DROP COLUMN IF EXISTS "difficulty";
