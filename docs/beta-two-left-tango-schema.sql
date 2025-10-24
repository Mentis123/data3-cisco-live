-- Beta release data model for "Beat the Bot: Two-Left Tango"
-- Run inside the Neon project backing https://data3-cisco-live.vercel.app/
-- Review existing tables before executing; adjust names to avoid clashes if they already exist.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Canonical users keyed by hashed email. Use the same hashing routine as the application layer.
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  company text,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Attempt sessions for Dojo (practice) and Ring (official) modes.
CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text REFERENCES users(email_hash),
  category text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('dojo', 'ring')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  total_score integer,
  passed boolean NOT NULL DEFAULT false,
  eligible boolean NOT NULL DEFAULT false,
  avg_correct_time_ms integer,
  bot_bar integer,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  consent_captured_at timestamptz,
  attempt_day date GENERATED ALWAYS AS (started_at::date) STORED,
  CONSTRAINT attempts_email_required CHECK ((mode = 'dojo' AND email_hash IS NULL) OR (mode = 'ring' AND email_hash IS NOT NULL)),
  CONSTRAINT attempts_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Enforce one official Ring attempt per category per email per day.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_ring_daily
  ON attempts (email_hash, category, attempt_day)
  WHERE mode = 'ring';

CREATE INDEX IF NOT EXISTS idx_attempts_category_day
  ON attempts (category, attempt_day)
  WHERE mode = 'ring';

-- Flash-card answers captured during an attempt.
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  choice_index smallint NOT NULL,
  correct boolean NOT NULL,
  t_answer_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers (attempt_id);

-- Case Card submission that powers the five dial scores.
CREATE TABLE IF NOT EXISTS case_cards (
  attempt_id uuid PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  problem_text text NOT NULL,
  baseline_value numeric,
  baseline_unit text,
  target_value numeric,
  target_unit text,
  due_date date,
  owner_role text,
  milestone_label text,
  milestone_date date,
  users_affected integer,
  minutes_saved integer,
  frequency_per_week integer,
  annual_time_hours numeric,
  annual_cost_est numeric,
  dial_clarity smallint,
  dial_impact smallint,
  dial_kpi smallint,
  dial_execution smallint,
  dial_confidence smallint,
  process_features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Raffle entries created for eligible passes.
CREATE TABLE IF NOT EXISTS raffle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_date date NOT NULL,
  email_hash text NOT NULL,
  category text NOT NULL,
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_date ON raffle_entries (raffle_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_raffle_entries_unique ON raffle_entries (raffle_date, email_hash, category);

-- Stored daily draws with reproducible audit data.
CREATE TABLE IF NOT EXISTS raffle_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_date date NOT NULL UNIQUE,
  winner_entry_id uuid REFERENCES raffle_entries(id),
  rng_seed text NOT NULL,
  admin_user text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional cache for pre-rendered leaderboard payloads.
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  cache_date date NOT NULL,
  tab text NOT NULL,
  payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cache_date, tab)
);

-- Flash-card content bank used by the game engine.
CREATE TABLE IF NOT EXISTS flash_items (
  id text PRIMARY KEY,
  category text NOT NULL,
  stem text NOT NULL,
  choices text[] NOT NULL,
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 2),
  drop_index smallint NOT NULL CHECK (drop_index BETWEEN 0 AND 2 AND drop_index <> correct_index),
  hint_9s text NOT NULL,
  difficulty smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  tags text[] DEFAULT '{}',
  explanation text,
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flash_items_category ON flash_items (category) WHERE active = true;

COMMIT;
