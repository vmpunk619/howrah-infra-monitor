-- ============================================================
-- Howrah Sadar Subdivision — Dak Memo No + Attachments
-- Migration 009
--
-- 1) memo_number  — the physical hardcopy file reference (e.g. SDO/H/1234)
--                   So an office clerk can search a digital record by
--                   the memo number printed on the physical file cover.
-- 2) dak_attachments table — for adding more correspondences/files to
--                   the same Dak over time (rather than creating a new
--                   Dak each time a follow-up letter arrives).
-- ============================================================

-- 1) Memo number on the main Dak row -------------------------
ALTER TABLE dak
  ADD COLUMN IF NOT EXISTS memo_number TEXT;

CREATE INDEX IF NOT EXISTS idx_dak_memo_number ON dak(memo_number);

COMMENT ON COLUMN dak.memo_number IS
  'Physical hardcopy file reference / memo number (e.g. SDO/HOW/2026/123). Searchable.';

-- 2) Attachments table ---------------------------------------
CREATE TABLE IF NOT EXISTS dak_attachments (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id          UUID         NOT NULL REFERENCES dak(id) ON DELETE CASCADE,
  file_url        TEXT         NOT NULL,                  -- Supabase Storage signed URL
  file_name       TEXT         NOT NULL,
  description     TEXT         NOT NULL DEFAULT '',
  uploaded_by     UUID         REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dak_attachments_dak_id     ON dak_attachments(dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_attachments_created_at ON dak_attachments(created_at DESC);

ALTER TABLE dak_attachments ENABLE ROW LEVEL SECURITY;

-- Admin full access
DROP POLICY IF EXISTS "dak_attach_admin_all" ON dak_attachments;
CREATE POLICY "dak_attach_admin_all" ON dak_attachments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Officers in the chain can see attachments
DROP POLICY IF EXISTS "dak_attach_officer_select" ON dak_attachments;
CREATE POLICY "dak_attach_officer_select" ON dak_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dak d
      JOIN officers o ON o.auth_uid = auth.uid() AND o.is_active = true
      WHERE d.id = dak_attachments.dak_id
        AND d.current_officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );

-- Officers can attach new files to daks they can see
DROP POLICY IF EXISTS "dak_attach_officer_insert" ON dak_attachments;
CREATE POLICY "dak_attach_officer_insert" ON dak_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM dak d
      JOIN officers o ON o.auth_uid = auth.uid() AND o.is_active = true
      WHERE d.id = dak_attachments.dak_id
        AND d.current_officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );
