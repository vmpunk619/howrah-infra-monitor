-- ============================================================
-- Howrah Sadar Subdivision — Officer Username
-- Migration 008
--
-- Adds optional `username` to officers. Officer can choose a username
-- in their profile after first login; can then sign in with either
-- email or username + password.
-- ============================================================

ALTER TABLE officers
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Unique among non-null entries (so empty is allowed for multiple officers)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_officers_username
  ON officers (lower(username))
  WHERE username IS NOT NULL;

COMMENT ON COLUMN officers.username IS
  'Optional unique username for login (case-insensitive). Set by the officer in their profile.';
