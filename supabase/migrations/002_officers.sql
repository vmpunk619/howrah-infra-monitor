-- ============================================================
-- Howrah Sadar Subdivision — Officer Hierarchy
-- Migration 002
-- ============================================================

CREATE TABLE IF NOT EXISTS officers (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL,
  designation TEXT    NOT NULL,
  rank        INTEGER NOT NULL CHECK (rank IN (1, 2, 3)),
  department  TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "officers_public_select" ON officers;
CREATE POLICY "officers_public_select" ON officers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "officers_auth_write" ON officers;
CREATE POLICY "officers_auth_write" ON officers
  FOR ALL USING (auth.role() = 'authenticated');

-- Add field officer assignment to complaints
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS officer_id UUID REFERENCES officers(id);

-- ── Seed data ─────────────────────────────────────────────────

-- Rank 1: SDO level
INSERT INTO officers (name, designation, rank, department, phone) VALUES
  ('Sri Vivek Pankaj, IAS', 'Sub-Divisional Officer (SDO)', 1, NULL, '983071856');

-- Rank 2: Department Heads
INSERT INTO officers (name, designation, rank, department, phone) VALUES
  ('Sri Partha Ghosh',      'Executive Engineer, PWD Roads', 2, 'PWD Roads Division, Howrah',          '033-2638-1100'),
  ('Sri Debashis Roy',      'Executive Engineer, PHE',       2, 'PHE & Drainage Division',             '033-2638-1200'),
  ('Sri Mohan Das',         'Asst. Engineer, WBSEDCL',       2, 'WBSEDCL / Municipal Lighting Cell',   '033-2638-1300'),
  ('Sri Arindam Sen',       'Sanitary Superintendent',       2, 'Solid Waste Management Cell',         '033-2638-1400'),
  ('Sri Joydeep',           'Deputy Magistrate',             2, 'Sub-Divisional Office, Howrah Sadar', '033-2638-1500');

-- Rank 3: Field Officers
INSERT INTO officers (name, designation, rank, department, phone) VALUES
  ('Sri Rajib Mondal',       'Assistant Engineer, PWD',  3, 'PWD Roads Division, Howrah',          '9831000001'),
  ('Sri Bikash Paul',        'Junior Engineer, PWD',     3, 'PWD Roads Division, Howrah',          '9831000002'),
  ('Sri Tapas Dey',          'Junior Engineer, PHE',     3, 'PHE & Drainage Division',             '9831000003'),
  ('Sri Sumon Bera',         'Drainage Overseer',        3, 'Drainage & Flood Control Division',   '9831000004'),
  ('Sri Tapan Roy',          'Asst. Engineer, Drainage', 3, 'Drainage & Flood Control Division',   '9831000005'),
  ('Sri Anup Jana',          'Line Supervisor, WBSEDCL', 3, 'WBSEDCL / Municipal Lighting Cell',   '9831000006'),
  ('Smt. Piya Das',          'Sanitary Inspector',       3, 'Solid Waste Management Cell',         '9831000007'),
  ('Sri Karim Sheikh',       'Sanitary Inspector',       3, 'Solid Waste Management Cell',         '9831000008'),
  ('Sri Subrata Mukherjee',  'CA to SDO',                3, 'Sub-Divisional Office, Howrah Sadar', '9831000009');
