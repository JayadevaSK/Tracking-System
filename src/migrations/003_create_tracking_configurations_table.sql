-- Migration: Create tracking_configurations table
-- Description: Creates the tracking_configurations table for managing automatic work tracking settings
-- Requirements: 1.2, 1.3, 2.4, 8.1, 12.2

CREATE TABLE IF NOT EXISTS tracking_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID UNIQUE NOT NULL REFERENCES users(id),
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance optimization
CREATE INDEX IF NOT EXISTS idx_tracking_employee ON tracking_configurations(employee_id);

-- Comments for documentation
COMMENT ON TABLE tracking_configurations IS 'Stores automatic tracking configuration per employee';
COMMENT ON COLUMN tracking_configurations.employee_id IS 'Reference to employee user (unique per employee)';
COMMENT ON COLUMN tracking_configurations.is_enabled IS 'Whether automatic tracking is enabled for this employee';
