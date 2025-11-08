-- Purpose: Track when a raffle winner has been publicly announced on the leaderboard.
-- This prevents the leaderboard from revealing the winner as soon as a draw is created.

ALTER TABLE raffle_draws
ADD COLUMN IF NOT EXISTS announced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_raffle_draws_announced_at
  ON raffle_draws (announced_at);
