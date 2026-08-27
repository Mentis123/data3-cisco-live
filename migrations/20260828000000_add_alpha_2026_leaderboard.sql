CREATE TABLE IF NOT EXISTS "alpha_2026_leaderboard_entries" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "player_id" text NOT NULL,
  "display_name" text NOT NULL,
  "incident_id" text NOT NULL,
  "score" integer NOT NULL CHECK ("score" BETWEEN 0 AND 100),
  "elapsed_seconds" integer NOT NULL CHECK ("elapsed_seconds" BETWEEN 1 AND 1800),
  "response_style" text NOT NULL,
  "choice_ids" text[] NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "alpha_2026_player_incident_idx"
  ON "alpha_2026_leaderboard_entries" ("player_id", "incident_id");
