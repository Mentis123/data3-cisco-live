-- Seed sample word cloud entries for testing
-- These are common Cisco/networking terms that will appear in the word cloud

-- First, clear any existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM word_cloud_entries WHERE source = 'manual';

-- Insert sample word cloud entries
-- Note: If you already have entries, this will add duplicates unless you have a UNIQUE constraint
INSERT INTO word_cloud_entries (word, count, source, active)
VALUES
  ('Meraki', 15, 'manual', true),
  ('Webex', 12, 'manual', true),
  ('Catalyst', 10, 'manual', true),
  ('SD-WAN', 8, 'manual', true),
  ('ISE', 7, 'manual', true),
  ('Umbrella', 6, 'manual', true),
  ('Duo', 6, 'manual', true),
  ('SecureX', 5, 'manual', true),
  ('ThousandEyes', 5, 'manual', true),
  ('AppDynamics', 4, 'manual', true),
  ('Firepower', 4, 'manual', true),
  ('ACI', 3, 'manual', true),
  ('SASE', 3, 'manual', true),
  ('Zero Trust', 3, 'manual', true)
ON CONFLICT (word) DO UPDATE SET
  count = EXCLUDED.count,
  updated_at = now();
