ALTER TABLE "attempts"
  ADD COLUMN "submission_id" text REFERENCES "submissions"("id") ON DELETE SET NULL;
