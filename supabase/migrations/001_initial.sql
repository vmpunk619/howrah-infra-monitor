-- ============================================================
-- Howrah Sadar Subdivision — Infrastructure Monitor
-- Initial database schema
-- ============================================================

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number    TEXT        UNIQUE NOT NULL,
  category            TEXT        NOT NULL
                        CHECK (category IN (
                          'pothole','road_damage','streetlight','manhole',
                          'waterlogging','garbage','encroachment','other'
                        )),
  description         TEXT        NOT NULL,
  location_lat        DECIMAL(10,8) NOT NULL,
  location_lng        DECIMAL(11,8) NOT NULL,
  address             TEXT        NOT NULL DEFAULT '',
  ward_number         TEXT        NOT NULL DEFAULT '',
  photo_url           TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','assigned','in_progress','resolved','closed')),
  priority            TEXT        NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','critical')),
  reported_by_name    TEXT        NOT NULL,
  reported_by_phone   TEXT        NOT NULL,
  reported_by_email   TEXT,
  assigned_department TEXT,
  assigned_officer_id UUID        REFERENCES auth.users(id),
  officer_notes       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

-- Activity / status change log
CREATE TABLE IF NOT EXISTS complaint_unpm pdates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID        NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  updated_by    UUID        REFERENCES auth.users(id),
  status_from   TEXT        NOT NULL,
  status_to     TEXT        NOT NULL,
  notes         TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on complaints
CREATE OR REPLACE FUNCTION _update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION _update_updated_at();

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE complaints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;

-- Public can view all complaints (for the live map)
CREATE POLICY "complaints_public_select" ON complaints
  FOR SELECT USING (true);

-- Anyone (citizens) can insert a complaint without auth
CREATE POLICY "complaints_public_insert" ON complaints
  FOR INSERT WITH CHECK (true);

-- Only authenticated officers can update complaint status
CREATE POLICY "complaints_officer_update" ON complaints
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Public can view update history
CREATE POLICY "updates_public_select" ON complaint_updates
  FOR SELECT USING (true);

-- Only authenticated officers can log updates
CREATE POLICY "updates_officer_insert" ON complaint_updates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── Storage bucket for complaint photos ───────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('complaint-photos', 'complaint-photos', true)
  ON CONFLICT DO NOTHING;

CREATE POLICY "photos_public_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'complaint-photos');

CREATE POLICY "photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'complaint-photos');
