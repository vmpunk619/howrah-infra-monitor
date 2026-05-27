-- ============================================================
-- Howrah Sadar Subdivision — Officer Auth Link
-- Migration 003
-- ============================================================

-- Phone-number OTP login column (links Supabase Auth user to officer record)
ALTER TABLE officers
  ADD COLUMN IF NOT EXISTS email   TEXT,
  ADD COLUMN IF NOT EXISTS auth_uid UUID REFERENCES auth.users(id);

-- Fast lookups for the portal auth flow
CREATE INDEX IF NOT EXISTS idx_officers_auth_uid ON officers(auth_uid);
CREATE INDEX IF NOT EXISTS idx_officers_phone    ON officers(phone);
CREATE INDEX IF NOT EXISTS idx_officers_email    ON officers(email);

-- Officers (once logged in via OTP) can read complaints assigned to them
-- even without the full 'authenticated' admin role.
-- Public SELECT already exists from migration 001 — this adds an explicit
-- officer-scoped policy so the portal query is unambiguous.
DROP POLICY IF EXISTS "officers_read_own_complaints" ON complaints;
CREATE POLICY "officers_read_own_complaints" ON complaints
  FOR SELECT USING (
    officer_id IN (
      SELECT id FROM officers
      WHERE auth_uid = auth.uid()
        AND is_active = true
    )
  );

-- Officers can update status of complaints assigned to them
DROP POLICY IF EXISTS "officers_update_own_complaints" ON complaints;
CREATE POLICY "officers_update_own_complaints" ON complaints
  FOR UPDATE USING (
    officer_id IN (
      SELECT id FROM officers
      WHERE auth_uid = auth.uid()
        AND is_active = true
    )
  );

-- Officers can insert complaint_updates for complaints assigned to them
DROP POLICY IF EXISTS "officers_insert_complaint_updates" ON complaint_updates;
CREATE POLICY "officers_insert_complaint_updates" ON complaint_updates
  FOR INSERT WITH CHECK (
    complaint_id IN (
      SELECT c.id FROM complaints c
      JOIN officers o ON o.id = c.officer_id
      WHERE o.auth_uid = auth.uid()
        AND o.is_active = true
    )
  );
