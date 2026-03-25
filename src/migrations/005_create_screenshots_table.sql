-- Migration: Create screenshots table
-- Description: Stores screenshots attached to work entries

CREATE TABLE IF NOT EXISTS screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_entry_id UUID NOT NULL REFERENCES work_entries(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screenshots_work_entry ON screenshots(work_entry_id);

COMMENT ON TABLE screenshots IS 'Stores screenshots attached to work entries as base64';
