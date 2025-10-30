CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "token" text PRIMARY KEY,
  "participant_id" text NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
  "email_hash" text REFERENCES "users"("email_hash"),
  "category" text,
  "trivia_attempt_id" uuid REFERENCES "attempts"("id") ON DELETE SET NULL,  -- Changed to uuid (or whatever type it actually is)
  "messages" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);