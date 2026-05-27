-- ============================================================
-- Howrah Sadar Subdivision — Dak (Correspondence) Tracking
-- Migration 006
--
-- A "Dak" is an incoming hardcopy/electronic correspondence (letter,
-- application, government communication, etc.) that needs to be routed
-- through officers in the SDO office. Each Dak has:
--   • A unique reference number (DAK-YYYYMM-NNNN)
--   • An assigned officer (current handler — DMDC, OC, or any officer)
--   • A movement history (who-forwarded-to-whom + when + remarks)
--   • A status (pending → in_progress → forwarded → disposed)
--   • A due date (overdue if past + not disposed)
-- ============================================================

-- 0) Prereqs from migration 005 (idempotent — safe to run twice)
-- These are repeated here so migration 006 can be run standalone.
ALTER TABLE officers
  ADD COLUMN IF NOT EXISTS parent_officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portfolio         TEXT;

CREATE INDEX IF NOT EXISTS idx_officers_parent_officer_id ON officers(parent_officer_id);

CREATE OR REPLACE FUNCTION officer_self_and_descendants(officer_uuid UUID)
RETURNS SETOF UUID LANGUAGE sql STABLE AS $$
  WITH RECURSIVE tree AS (
    SELECT id FROM officers WHERE id = officer_uuid
    UNION ALL
    SELECT o.id
    FROM officers o
    JOIN tree t ON o.parent_officer_id = t.id
  )
  SELECT id FROM tree;
$$;

-- 1) Dak master table -----------------------------------------
CREATE TABLE IF NOT EXISTS dak (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_number          TEXT         UNIQUE NOT NULL,                -- DAK-202605-0001
  subject             TEXT         NOT NULL,
  description         TEXT         NOT NULL DEFAULT '',
  sender_name         TEXT         NOT NULL,
  sender_designation  TEXT,
  sender_organization TEXT,
  received_mode       TEXT         NOT NULL DEFAULT 'physical'
                        CHECK (received_mode IN ('physical','email','speedpost','courier','fax','online')),
  received_date       DATE         NOT NULL DEFAULT CURRENT_DATE,
  priority            TEXT         NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('normal','urgent','immediate')),
  file_url            TEXT,                                        -- Supabase Storage path
  current_officer_id  UUID         REFERENCES officers(id) ON DELETE SET NULL,
  status              TEXT         NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','assigned','in_progress','forwarded','awaiting_reply','action_taken','disposed','closed')),
  due_date            DATE,
  created_by          UUID         REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  disposed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dak_current_officer ON dak(current_officer_id);
CREATE INDEX IF NOT EXISTS idx_dak_status          ON dak(status);
CREATE INDEX IF NOT EXISTS idx_dak_due_date        ON dak(due_date);
CREATE INDEX IF NOT EXISTS idx_dak_created_at      ON dak(created_at DESC);

-- Auto-update updated_at on row change
CREATE TRIGGER dak_updated_at
  BEFORE UPDATE ON dak
  FOR EACH ROW EXECUTE FUNCTION _update_updated_at();

-- 2) Dak movements (the audit/timeline trail) -----------------
CREATE TABLE IF NOT EXISTS dak_movements (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id                UUID        NOT NULL REFERENCES dak(id) ON DELETE CASCADE,
  from_officer_id       UUID        REFERENCES officers(id),      -- NULL = entry / from outside
  to_officer_id         UUID        REFERENCES officers(id),      -- NULL = sent to external authority
  external_to_name      TEXT,                                     -- when to_officer_id is NULL
  external_to_org       TEXT,
  action_type           TEXT        NOT NULL
                          CHECK (action_type IN (
                            'received','assigned','forwarded','returned',
                            'action_taken','external_dispatched','reply_received','disposed','reopened'
                          )),
  remarks               TEXT        NOT NULL DEFAULT '',
  performed_by_user_id  UUID        REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dak_movements_dak_id     ON dak_movements(dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_movements_created_at ON dak_movements(created_at DESC);

-- 3) RLS ------------------------------------------------------
ALTER TABLE dak             ENABLE ROW LEVEL SECURITY;
ALTER TABLE dak_movements   ENABLE ROW LEVEL SECURITY;

-- Public SELECT off for dak (only admin + assigned officers)
-- Authenticated (admin dashboard) can do everything
CREATE POLICY "dak_admin_all" ON dak
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dak_movements_admin_all" ON dak_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Officers can SEE daks currently assigned to them OR their descendants
CREATE POLICY "dak_officer_visibility" ON dak
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.auth_uid = auth.uid()
        AND o.is_active = true
        AND dak.current_officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );

-- Officers can UPDATE (forward, change status) for daks they can see
CREATE POLICY "dak_officer_update" ON dak
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.auth_uid = auth.uid()
        AND o.is_active = true
        AND dak.current_officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.auth_uid = auth.uid()
        AND o.is_active = true
    )
  );

-- Officers can INSERT movements for daks they can see
CREATE POLICY "dak_movements_officer_insert" ON dak_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM dak d
      JOIN officers o ON o.auth_uid = auth.uid() AND o.is_active = true
      WHERE d.id = dak_movements.dak_id
        AND d.current_officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );

-- Officers can SEE movements for daks they can see
CREATE POLICY "dak_movements_officer_select" ON dak_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dak d
      JOIN officers o ON o.auth_uid = auth.uid() AND o.is_active = true
      WHERE d.id = dak_movements.dak_id
        AND d.current_officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );

-- 4) Storage bucket for scanned hardcopies --------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('dak-files', 'dak-files', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone authenticated can upload to the bucket
DROP POLICY IF EXISTS "dak_files_upload" ON storage.objects;
CREATE POLICY "dak_files_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dak-files');

-- Anyone authenticated can read the bucket (RLS on dak table gates which IDs they can see)
DROP POLICY IF EXISTS "dak_files_read" ON storage.objects;
CREATE POLICY "dak_files_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dak-files');

DROP POLICY IF EXISTS "dak_files_delete" ON storage.objects;
CREATE POLICY "dak_files_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dak-files');

-- 5) Dak number generator function ----------------------------
CREATE OR REPLACE FUNCTION next_dak_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  prefix TEXT := 'DAK-' || to_char(CURRENT_DATE, 'YYYYMM') || '-';
  last_seq INT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(dak_number FROM '\d+$') AS INT)
  ), 0)
  INTO last_seq
  FROM dak
  WHERE dak_number LIKE prefix || '%';

  RETURN prefix || lpad((last_seq + 1)::TEXT, 4, '0');
END $$;
