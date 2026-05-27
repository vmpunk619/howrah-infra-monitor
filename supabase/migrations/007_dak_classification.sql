-- ============================================================
-- Howrah Sadar Subdivision — Dak Classification & Contacts
-- Migration 007
--
-- Adds:
--   • Sender contact details (phone, email, address)
--   • Sender type (citizen, district office, block office, line dept, etc.)
--   • Subject category (Health, Education, Public Grievance, BCW, etc.)
-- ============================================================

ALTER TABLE dak
  ADD COLUMN IF NOT EXISTS sender_phone   TEXT,
  ADD COLUMN IF NOT EXISTS sender_email   TEXT,
  ADD COLUMN IF NOT EXISTS sender_address TEXT,
  ADD COLUMN IF NOT EXISTS sender_type    TEXT NOT NULL DEFAULT 'citizen',
  ADD COLUMN IF NOT EXISTS category       TEXT NOT NULL DEFAULT 'other';

-- Replace CHECK constraints (drop then add — handles re-runs)
ALTER TABLE dak DROP CONSTRAINT IF EXISTS dak_sender_type_check;
ALTER TABLE dak ADD  CONSTRAINT dak_sender_type_check CHECK (
  sender_type IN (
    'citizen','government','district','block',
    'line_dept','panchayat','organization','court','media','other'
  )
);

ALTER TABLE dak DROP CONSTRAINT IF EXISTS dak_category_check;
ALTER TABLE dak ADD  CONSTRAINT dak_category_check CHECK (
  category IN (
    'public_grievance','health','education','bcw',
    'land_revenue','welfare_scheme','disaster','law_order',
    'infrastructure','election','administrative','other'
  )
);

-- Useful indexes for filtering on the dashboard
CREATE INDEX IF NOT EXISTS idx_dak_category    ON dak(category);
CREATE INDEX IF NOT EXISTS idx_dak_sender_type ON dak(sender_type);

COMMENT ON COLUMN dak.sender_type IS
  'Classification of who sent the Dak — citizen, district office, block office, line department, etc.';
COMMENT ON COLUMN dak.category IS
  'Subject area of the Dak — Health, Education, Public Grievance, BCW, etc.';
