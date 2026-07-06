CREATE TABLE IF NOT EXISTS section_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES content_sections(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'file')),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE section_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read section_files"
  ON section_files FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Anon users can read section_files"
  ON section_files FOR SELECT
  TO anon
  USING (TRUE);

CREATE POLICY "Service role can manage section_files"
  ON section_files FOR ALL
  TO service_role
  USING (TRUE);

-- Drop old single columns
ALTER TABLE content_sections
  DROP COLUMN IF EXISTS file_key,
  DROP COLUMN IF EXISTS file_name,
  DROP COLUMN IF EXISTS image_key,
  DROP COLUMN IF EXISTS image_url;
