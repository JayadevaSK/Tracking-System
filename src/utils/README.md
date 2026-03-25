# Database Utilities

This directory contains utilities for database connection management and configuration.

## Files

### config.ts
Environment-based configuration management for the application. Loads configuration from environment variables and provides type-safe access to:
- Server configuration (port, environment)
- Database connection settings
- JWT authentication settings
- Email service settings
- CORS configuration

### db.ts
Database connection pool utility using PostgreSQL. Provides:
- Singleton database pool instance
- Query execution with error handling and logging
- Transaction support via client connections
- Connection testing
- Graceful shutdown

### initDb.ts
Database initialization and migration runner. Provides:
- `initializeDatabase()` - Run all migrations to set up the schema
- `dropAllTables()` - Drop all tables (useful for testing)
- `resetDatabase()` - Drop and recreate all tables

## Usage

### Configuration

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_work_tracker
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@worktracker.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

### Database Connection

The database connection is automatically initialized when the server starts. To use it in your code:

```typescript
import { db } from './utils/db';

// Execute a query
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Use a transaction
const client = await db.getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO work_entries ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Running Migrations

Use the npm scripts to manage database migrations:

```bash
# Initialize database (run all migrations)
npm run db:init

# Drop all tables
npm run db:drop

# Reset database (drop and recreate)
npm run db:reset
```

Or run directly with ts-node:

```bash
ts-node src/utils/initDb.ts init
ts-node src/utils/initDb.ts drop
ts-node src/utils/initDb.ts reset
```

## Environment-Based Configuration

The configuration automatically adjusts based on the `NODE_ENV` environment variable:

- **development**: 10 max connections, verbose query logging
- **production**: 20 max connections, minimal logging

## Error Handling

All database operations include comprehensive error handling:
- Connection errors are logged and cause process exit
- Query errors are logged with query details
- Failed migrations throw errors with detailed messages
- Graceful shutdown on SIGTERM/SIGINT signals

## Connection Pooling

The database pool is configured with:
- Max connections: 10 (dev) / 20 (prod)
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

These settings can be adjusted in `config.ts` based on your needs.
