-- Migration: Create notification_preferences table
-- Description: Creates the notification_preferences table for managing user notification settings
-- Requirements: 1.2, 1.3, 2.4, 8.1, 12.2

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  email_enabled BOOLEAN DEFAULT TRUE,
  work_entry_notifications BOOLEAN DEFAULT TRUE,
  reminder_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance optimization
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification_preferences(user_id);

-- Comments for documentation
COMMENT ON TABLE notification_preferences IS 'Stores notification preferences per user';
COMMENT ON COLUMN notification_preferences.user_id IS 'Reference to user (unique per user)';
COMMENT ON COLUMN notification_preferences.email_enabled IS 'Whether email notifications are enabled';
COMMENT ON COLUMN notification_preferences.work_entry_notifications IS 'Whether to notify on work entry submission';
COMMENT ON COLUMN notification_preferences.reminder_notifications IS 'Whether to send reminder notifications';
