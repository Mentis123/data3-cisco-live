-- Decision Room (When the agent acts tabletop)
-- Room instrument for the 90-minute workshop: session, tables, rounds, locked
-- decisions and a facilitator audit trail. No scores, ranks or personal data.

CREATE TABLE IF NOT EXISTS "workshop_sessions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "join_code" text NOT NULL UNIQUE,
  "console_key" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "variant" text NOT NULL,
  "status" text NOT NULL DEFAULT 'live',
  "active_round" integer NOT NULL DEFAULT 1,
  "results_visible" boolean NOT NULL DEFAULT false,
  "revision" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "ended_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "workshop_teams" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
  "table_code" text NOT NULL,
  "display_name" text NOT NULL,
  "claimed_at" timestamptz,
  "last_seen_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "workshop_teams_session_code_idx"
  ON "workshop_teams" ("session_id", "table_code");

CREATE TABLE IF NOT EXISTS "workshop_rounds" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
  "round_number" integer NOT NULL,
  "content_key" text NOT NULL,
  "state" text NOT NULL DEFAULT 'pending',
  "duration_seconds" integer NOT NULL,
  "opened_at" timestamptz,
  "closed_at" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "workshop_rounds_session_number_idx"
  ON "workshop_rounds" ("session_id", "round_number");

CREATE TABLE IF NOT EXISTS "workshop_decisions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
  "team_id" text NOT NULL REFERENCES "workshop_teams"("id") ON DELETE CASCADE,
  "round_id" text NOT NULL REFERENCES "workshop_rounds"("id") ON DELETE CASCADE,
  "option_key" text,
  "own_action" text,
  "confidence" integer CHECK ("confidence" BETWEEN 1 AND 5),
  "rationale" text,
  "is_locked" boolean NOT NULL DEFAULT false,
  "selected_for_display" boolean NOT NULL DEFAULT false,
  "display_order" integer,
  "locked_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "workshop_decisions_team_round_idx"
  ON "workshop_decisions" ("team_id", "round_id");

CREATE TABLE IF NOT EXISTS "workshop_events" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" text NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
  "actor_type" text NOT NULL,
  "actor_id" text,
  "event_type" text NOT NULL,
  "payload" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
