# Database Migrations

This directory contains SQL migration files for the Employee Work Tracker database schema.

## Migration Files

1. **001_create_users_table.sql** - Creates the users table with role-based access control
2. **002_create_work_entries_table.sql** - Creates the work_entries table with full-text search
3. **003_create_tracking_configurations_table.sql** - Creates the tracking_configurations table
4. **004_create_notification_preferences_table.sql** - Creates the notification_preferences table

## Running Migrations

### Option 1: Run all migrations at once

```bash
psql -U <username> -d <database> -f run-migrations.sql
```

### Option 2: Run migrations individually

```bash
psql -U <username> -d <database> -f 001_create_users_table.sql
psql -U <username> -d <database> -f 002_create_work_entries_table.sql
psql -U <username> -d <database> -f 003_create_tracking_configurations_table.sql
psql -U <username> -d <database> -f 004_create_notification_preferences_table.sql
```

### Option 3: Using Docker

If you're using Docker for PostgreSQL:

```bash
docker exec -i <container_name> psql -U <username> -d <database> < run-migrations.sql
```

## Database Schema Overview

### users
- Stores user accounts (employees and managers)
- Includes authentication credentials and role information
- Supports manager-employee relationships

### work_entries
- Stores work activity records
- Includes full-text search capability on descriptions
- Tracks completion status, duration, and timestamps
- Supports both manual and automatic entries

### tracking_configurations
- Manages automatic tracking settings per employee
- One configuration per employee

### notification_preferences
- Manages notification settings per user
- Controls email and reminder notifications

## Requirements

- PostgreSQL 12 or higher
- pgcrypto extension (for UUID generation)

## Notes

- All tables use UUID primary keys
- Indexes are created for optimal query performance
- Full-text search is enabled on work entry descriptions
- Foreign key constraints ensure referential integrity
- Check constraints validate data at the database level
