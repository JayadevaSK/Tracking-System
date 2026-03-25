# Database Setup Guide

This guide explains how to set up and use the database connection for the Employee Work Tracker application.

## Overview

The database setup includes:
- **Configuration Management** (`src/utils/config.ts`) - Environment-based configuration
- **Connection Pool** (`src/utils/db.ts`) - PostgreSQL connection pooling
- **Migration Runner** (`src/utils/initDb.ts`) - Database initialization and migrations

## Prerequisites

1. PostgreSQL installed and running
2. Node.js and npm installed
3. Environment variables configured

## Setup Steps

### 1. Configure Environment Variables

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_work_tracker
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 2. Create Database

Create the database in PostgreSQL:

```sql
CREATE DATABASE employee_work_tracker;
```

For testing, also create a test database:

```sql
CREATE DATABASE employee_work_tracker_test;
```

### 3. Run Migrations

Initialize the database schema:

```bash
npm run db:init
```

This will:
- Enable required PostgreSQL extensions (pgcrypto for UUIDs)
- Create all tables (users, work_entries, tracking_configurations, notification_preferences)
- Set up indexes for optimal query performance
- Enable full-text search on work descriptions

### 4. Verify Connection

Start the development server to verify the connection:

```bash
npm run dev
```

You should see:
```
Database pool initialized for development environment
Database connection successful: [timestamp]
Database connection verified
Server is running on port 3000 in development mode
```

## Database Management Commands

### Initialize Database
Run all migrations to set up the schema:
```bash
npm run db:init
```

### Drop All Tables
Remove all tables (useful for cleanup):
```bash
npm run db:drop
```

### Reset Database
Drop and recreate all tables:
```bash
npm run db:reset
```

## Usage in Code

### Basic Query

```typescript
import { db } from './utils/db';

// Simple query
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
console.log(result.rows);
```

### Transactions

```typescript
import { db } from './utils/db';

const client = await db.getClient();
try {
  await client.query('BEGIN');
  
  // Multiple operations
  await client.query('INSERT INTO users (username, email) VALUES ($1, $2)', ['john', 'john@example.com']);
  await client.query('INSERT INTO work_entries (employee_id, description) VALUES ($1, $2)', [userId, 'Task completed']);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Test Connection

```typescript
import { db } from './utils/db';

const isConnected = await db.testConnection();
if (isConnected) {
  console.log('Database is ready');
}
```

## Configuration Details

### Connection Pool Settings

The connection pool is automatically configured based on the environment:

| Setting | Development | Production |
|---------|-------------|------------|
| Max Connections | 10 | 20 |
| Idle Timeout | 30 seconds | 30 seconds |
| Connection Timeout | 2 seconds | 2 seconds |

### Environment-Based Configuration

The system supports three environments:
- **development** - Local development with verbose logging
- **test** - Testing environment with isolated database
- **production** - Production environment with optimized settings

Set the environment using the `NODE_ENV` variable:
```bash
NODE_ENV=production npm start
```

## Error Handling

The database utilities include comprehensive error handling:

### Connection Errors
If the database connection fails on startup, you'll see:
```
Database connection failed - check your configuration
```

Check:
- PostgreSQL is running
- Database exists
- Credentials are correct
- Host and port are accessible

### Query Errors
Query errors are logged with details:
```
Database query error { text: 'SELECT ...', error: [Error details] }
```

### Pool Errors
Unexpected pool errors will log and exit the process:
```
Unexpected error on idle database client [Error details]
```

## Graceful Shutdown

The application handles graceful shutdown on SIGTERM and SIGINT signals:

1. HTTP server stops accepting new connections
2. Existing connections complete
3. Database pool closes all connections
4. Process exits cleanly

## Testing

### Run Database Tests

```bash
npm test src/utils/db.test.ts
npm test src/utils/config.test.ts
```

### Test Database Setup

For testing, use a separate database:

1. Create test database: `employee_work_tracker_test`
2. Configure `.env.test` with test database credentials
3. Tests automatically use the test environment

### Integration Tests

The database utilities are tested for:
- Connection initialization
- Query execution
- Parameterized queries
- Transaction support
- Error handling
- Configuration loading

## Troubleshooting

### "Database pool not initialized"
Call `db.initialize()` before using the database:
```typescript
db.initialize();
await db.query('SELECT 1');
```

### "Connection timeout"
Increase the connection timeout in `config.ts`:
```typescript
connectionTimeoutMillis: 5000, // 5 seconds
```

### "Too many connections"
Increase the max pool size or check for connection leaks:
```typescript
max: 20, // Increase pool size
```

Always release clients after use:
```typescript
const client = await db.getClient();
try {
  // Use client
} finally {
  client.release(); // Always release!
}
```

### Migration Errors
If migrations fail:
1. Check PostgreSQL logs
2. Verify database permissions
3. Ensure database is empty (or use `npm run db:reset`)
4. Check migration SQL syntax

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Use strong passwords** - Especially in production
3. **Limit database user permissions** - Grant only necessary privileges
4. **Use SSL in production** - Configure `ssl: true` in pool options
5. **Rotate JWT secrets** - Change secrets periodically
6. **Monitor connection pool** - Watch for connection leaks

## Performance Tips

1. **Use connection pooling** - Already configured
2. **Use parameterized queries** - Prevents SQL injection and improves performance
3. **Create indexes** - Already created for common queries
4. **Monitor query performance** - Check logs in development mode
5. **Use transactions wisely** - Keep them short and focused

## Next Steps

After setting up the database:
1. Implement User model and authentication (Task 2.1)
2. Create WorkEntry model (Task 4.1)
3. Build API endpoints (Tasks 5.1, 7.9, etc.)
4. Add business logic services (Tasks 4.8, 7.1, etc.)

## Support

For issues or questions:
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql.log`
- Check application logs: Look for "Database" prefixed messages
- Verify environment variables: `echo $DB_NAME`
- Test connection manually: `psql -h localhost -U postgres -d employee_work_tracker`
