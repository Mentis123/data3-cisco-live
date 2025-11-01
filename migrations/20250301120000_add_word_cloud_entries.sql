CREATE TABLE IF NOT EXISTS "word_cloud_entries" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "word" text NOT NULL UNIQUE,
  "count" integer NOT NULL DEFAULT 1,
  "source" text NOT NULL DEFAULT 'manual',
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_word_cloud_entries_active ON word_cloud_entries(active);
CREATE INDEX IF NOT EXISTS idx_word_cloud_entries_word ON word_cloud_entries(word);
