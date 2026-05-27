-- ============================================================
-- Howrah Sadar Subdivision — Officer Reporting Chain
-- Migration 005
--
-- Adds hierarchical chain support:
--   SDO → DMDC (with portfolio) → OC-in-Charge → Field Officer
--
-- An officer can be the parent of many others. Complaints assigned
-- to a child officer are automatically visible (and updatable) by
-- every ancestor in the chain via RLS.
-- ============================================================

-- 1) Chain columns ---------------------------------------------
ALTER TABLE officers
  ADD COLUMN IF NOT EXISTS parent_officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portfolio         TEXT;

CREATE INDEX IF NOT EXISTS idx_officers_parent_officer_id ON officers(parent_officer_id);

COMMENT ON COLUMN officers.parent_officer_id IS
  'Direct supervisor — the officer this person reports to. NULL means top of chain (typically SDO).';
COMMENT ON COLUMN officers.portfolio IS
  'Subject area handled by this officer (e.g. ''Disaster Management'', ''Land Revenue''). Free-form text.';

-- 2) Descendant function ---------------------------------------
-- Returns the given officer + every officer below them in the chain.
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

-- 3) RLS — chain-aware visibility ------------------------------
-- Old policy was: officer can SELECT/UPDATE complaints WHERE officer_id = self
-- New policy: also includes complaints assigned to any descendant.

DROP POLICY IF EXISTS "officers_read_own_complaints"   ON complaints;
DROP POLICY IF EXISTS "officers_update_own_complaints" ON complaints;

CREATE POLICY "officers_read_chain_complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.auth_uid = auth.uid()
        AND o.is_active = true
        AND complaints.officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );

CREATE POLICY "officers_update_chain_complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.auth_uid = auth.uid()
        AND o.is_active = true
        AND complaints.officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers o
      WHERE o.auth_uid = auth.uid()
        AND o.is_active = true
        AND complaints.officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );

-- 4) complaint_updates — same chain rule -----------------------
DROP POLICY IF EXISTS "officers_insert_complaint_updates" ON complaint_updates;
CREATE POLICY "officers_insert_chain_complaint_updates" ON complaint_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM complaints c
      JOIN officers   o ON o.auth_uid = auth.uid() AND o.is_active = true
      WHERE c.id = complaint_updates.complaint_id
        AND c.officer_id IN (SELECT officer_self_and_descendants(o.id))
    )
  );

-- 5) Seed: wire up the existing officers into a default chain --
-- (Best-effort: link each rank-2 head to the SDO, each rank-3 field
-- officer to their department's head if one exists.)
DO $$
DECLARE
  sdo_id UUID;
  head_id UUID;
  dept_name TEXT;
BEGIN
  SELECT id INTO sdo_id FROM officers WHERE rank = 1 ORDER BY created_at LIMIT 1;

  IF sdo_id IS NOT NULL THEN
    -- All rank-2 officers without a parent → report to SDO
    UPDATE officers
      SET parent_officer_id = sdo_id
      WHERE rank = 2 AND parent_officer_id IS NULL;

    -- Each rank-3 officer → reports to a rank-2 head in the same dept
    FOR dept_name IN SELECT DISTINCT department FROM officers WHERE rank = 3 AND department IS NOT NULL LOOP
      SELECT id INTO head_id
      FROM officers
      WHERE rank = 2 AND department = dept_name
      ORDER BY created_at LIMIT 1;

      IF head_id IS NOT NULL THEN
        UPDATE officers
          SET parent_officer_id = head_id
          WHERE rank = 3 AND department = dept_name AND parent_officer_id IS NULL;
      END IF;
    END LOOP;
  END IF;
END $$;
