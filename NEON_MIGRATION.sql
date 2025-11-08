-- ============================================
-- RESET CONSOLE - DATABASE MIGRATION
-- Run this in Neon SQL Admin Console
-- Project: data3-cisco-live
-- Date: 2025-11-08
-- ============================================

-- Create reset_timestamps table
CREATE TABLE IF NOT EXISTS reset_timestamps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  admin_user TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_reset_timestamps_scope
  ON reset_timestamps(scope, created_at DESC);

-- Verify table structure
\d reset_timestamps;

-- Verify index
\di idx_reset_timestamps_scope;

-- Check for any existing data (should be empty)
SELECT COUNT(*) as total_resets FROM reset_timestamps;

-- ============================================
-- EXPECTED RESULTS:
-- 1. Table created successfully
-- 2. Index created successfully
-- 3. COUNT returns 0 (empty table ready for use)
-- ============================================

-- ============================================
-- SCOPE VALUES REFERENCE:
-- 'global' - The Big Reset (all systems)
-- 'leaderboard' - Leaderboard entries only
-- 'raffle' - Raffle entries only
-- 'word_cloud' - Word cloud entries only
-- 'scored_submissions' - Scored submissions only
-- 'bot_bar' - Bot bar threshold calculations only
-- ============================================
