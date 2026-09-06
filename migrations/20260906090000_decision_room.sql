CREATE TABLE IF NOT EXISTS workshop_sessions (
  id uuid PRIMARY KEY,
  join_code varchar(8) NOT NULL UNIQUE,
  name text NOT NULL,
  variant varchar(16) NOT NULL CHECK (variant IN ('enterprise', 'government')),
  status varchar(16) NOT NULL DEFAULT 'lobby',
  active_round integer NOT NULL DEFAULT 1 CHECK (active_round BETWEEN 1 AND 3),
  results_visible boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1,
  display_token_hash text NOT NULL,
  round_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS workshop_teams (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE,
  team_code varchar(12) NOT NULL,
  display_name text NOT NULL,
  token_hash text,
  state varchar(16) NOT NULL DEFAULT 'not_joined',
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, team_code)
);

CREATE TABLE IF NOT EXISTS workshop_decisions (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES workshop_teams(id) ON DELETE CASCADE,
  round_no integer NOT NULL CHECK (round_no BETWEEN 1 AND 3),
  option_key varchar(4),
  action text NOT NULL DEFAULT '',
  accepted_tradeoff text NOT NULL DEFAULT '',
  reversal_evidence text NOT NULL DEFAULT '',
  confidence integer CHECK (confidence BETWEEN 1 AND 5),
  is_locked boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, round_no)
);

CREATE TABLE IF NOT EXISTS workshop_events (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workshop_teams_session_idx ON workshop_teams(session_id);
CREATE INDEX IF NOT EXISTS workshop_decisions_session_round_idx ON workshop_decisions(session_id, round_no);
CREATE INDEX IF NOT EXISTS workshop_events_session_idx ON workshop_events(session_id, created_at);
