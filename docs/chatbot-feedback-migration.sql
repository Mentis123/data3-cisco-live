-- Chatbot Feedback Table Migration
-- Run this SQL in your Neon database console to create the feedback table

CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT REFERENCES users(email_hash),
  session_token TEXT,
  category TEXT NOT NULL,
  rating SMALLINT NOT NULL,
  message TEXT NOT NULL,
  page TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_status ON chatbot_feedback(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_created_at ON chatbot_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_email_hash ON chatbot_feedback(email_hash);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_category ON chatbot_feedback(category);

-- Add comments for documentation
COMMENT ON TABLE chatbot_feedback IS 'User feedback collected through the chatbot widget';
COMMENT ON COLUMN chatbot_feedback.email_hash IS 'Optional reference to user who submitted feedback';
COMMENT ON COLUMN chatbot_feedback.session_token IS 'Session token when feedback was submitted';
COMMENT ON COLUMN chatbot_feedback.category IS 'Feedback category: ui-ux, gameplay, trivia, technical, feature-request, other';
COMMENT ON COLUMN chatbot_feedback.rating IS 'User rating from 1-5 stars';
COMMENT ON COLUMN chatbot_feedback.message IS 'User feedback message (10-1000 characters)';
COMMENT ON COLUMN chatbot_feedback.page IS 'Page/route where feedback was submitted';
COMMENT ON COLUMN chatbot_feedback.status IS 'Status: pending, reviewed, implemented';
