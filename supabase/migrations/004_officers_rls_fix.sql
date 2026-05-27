-- ============================================================
-- Howrah Sadar Subdivision — Officers RLS Fix
-- Migration 004
--
-- The previous policy "officers_auth_write" used `FOR ALL USING (...)`
-- but for INSERT, Postgres only honours `WITH CHECK`. Result: inserts
-- from the admin dashboard were silently being rejected by RLS even
-- though the user was authenticated.
--
-- This migration replaces the broken policy with explicit per-action
-- policies that include WITH CHECK where needed.
-- ============================================================

DROP POLICY IF EXISTS "officers_auth_write" ON officers;

CREATE POLICY "officers_auth_insert" ON officers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "officers_auth_update" ON officers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "officers_auth_delete" ON officers
  FOR DELETE TO authenticated
  USING (true);

-- Officers self-update: an officer can update their OWN row
-- (used by the "Edit Profile" view in the officer portal)
DROP POLICY IF EXISTS "officers_self_update" ON officers;
CREATE POLICY "officers_self_update" ON officers
  FOR UPDATE
  USING (auth_uid = auth.uid())
  WITH CHECK (auth_uid = auth.uid());
