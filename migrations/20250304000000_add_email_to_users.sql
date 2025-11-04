-- Migration: Add email column to users table
-- Purpose: Store actual email addresses for raffle winners so admins can contact them
-- Date: 2025-03-04

-- Add email column to users table
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "email" text;

-- Create index on email for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
