-- Migration 006: Create activity_logs table for in-app activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,  -- 'page_visit', 'idle', 'active', 'tab_hidden', 'tab_visible', 'session_start', 'session_end'
  page VARCHAR(200),                -- which section/page they were on
  duration_seconds INTEGER,         -- how long they spent (filled on transition)
  metadata JSONB,                   -- extra info (e.g. idle duration, previous page)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_id ON activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_date ON activity_logs(employee_id, DATE(created_at));
