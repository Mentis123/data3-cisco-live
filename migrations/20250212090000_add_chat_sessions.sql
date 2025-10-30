CREATE TABLE IF NOT EXISTS chat_sessions (
  token text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  email_hash text REFERENCES users(email_hash),
  category text,
  trivia_attempt_id text REFERENCES attempts(id) ON DELETE SET NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_participant_id_idx ON chat_sessions (participant_id);
