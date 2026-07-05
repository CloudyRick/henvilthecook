-- Downloads table for paid-only downloadable files (stored in Oracle OCI)
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read downloads"
  ON downloads FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Service role can manage downloads"
  ON downloads FOR ALL
  TO service_role
  USING (TRUE);
