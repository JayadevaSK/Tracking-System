-- Master migration script
-- Description: Runs all migrations in order to set up the complete database schema
-- Usage: psql -U <username> -d <database> -f run-migrations.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Run migrations in order
\i 001_create_users_table.sql
\i 002_create_work_entries_table.sql
\i 003_create_tracking_configurations_table.sql
\i 004_create_notification_preferences_table.sql

-- Display success message
\echo 'All migrations completed successfully!'
