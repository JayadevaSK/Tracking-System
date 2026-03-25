-- Migration: Create work_entries table
-- Description: Creates the work_entries table with full-text search capability and comprehensive indexing
-- Requirements: 1.2, 1.3, 2.4, 8.1, 12.2

CREATE TABLE IF NOT EXISTS work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL CHECK (LENGTH(description) >= 10),
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'in-progress', 'not-started')),
  category VARCHAR(100),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER CHECK (duration > 0),
  date DATE NOT NULL,
  is_auto_tracked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_work_entries_employee_date ON work_entries(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_work_entries_status ON work_entries(status);
CREATE INDEX IF NOT EXISTS idx_work_entries_date ON work_entries(date);

-- Full-text search index for work descriptions
CREATE INDEX IF NOT EXISTS idx_work_entries_description ON work_entries USING gin(to_tsvector('english', description));

-- Comments for documentation
COMMENT ON TABLE work_entries IS 'Stores work activity records for employees';
COMMENT ON COLUMN work_entries.description IS 'Work description (minimum 10 characters)';
COMMENT ON COLUMN work_entries.status IS 'Completion status: completed, in-progress, or not-started';
COMMENT ON COLUMN work_entries.duration IS 'Duration in minutes (must be positive)';
COMMENT ON COLUMN work_entries.is_auto_tracked IS 'Whether entry was automatically tracked';
COMMENT ON COLUMN work_entries.modified_at IS 'Timestamp of last user modification';
