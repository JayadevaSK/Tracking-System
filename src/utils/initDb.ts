import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './db';

/**
 * Run a single migration file
 */
async function runMigration(filename: string): Promise<void> {
  const migrationPath = join(__dirname, '..', 'migrations', filename);
  
  try {
    const sql = readFileSync(migrationPath, 'utf-8');
    await db.query(sql);
    console.log(`✓ Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`✗ Migration ${filename} failed:`, error);
    throw error;
  }
}

/**
 * Initialize the database by running all migrations
 */
export async function initializeDatabase(): Promise<void> {
  console.log('Starting database initialization...');
  
  try {
    // Enable UUID extension
    await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✓ PostgreSQL extensions enabled');

    // Run migrations in order
    const migrations = [
      '001_create_users_table.sql',
      '002_create_work_entries_table.sql',
      '003_create_tracking_configurations_table.sql',
      '004_create_notification_preferences_table.sql',
      '005_create_screenshots_table.sql',
      '006_create_activity_logs_table.sql',
    ];

    for (const migration of migrations) {
      await runMigration(migration);
    }

    console.log('✓ All migrations completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Drop all tables (useful for testing)
 */
export async function dropAllTables(): Promise<void> {
  console.log('Dropping all tables...');
  
  try {
    await db.query(`
      DROP TABLE IF EXISTS screenshots CASCADE;
      DROP TABLE IF EXISTS notification_preferences CASCADE;
      DROP TABLE IF EXISTS tracking_configurations CASCADE;
      DROP TABLE IF EXISTS work_entries CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✓ All tables dropped successfully');
  } catch (error) {
    console.error('Failed to drop tables:', error);
    throw error;
  }
}

/**
 * Reset the database (drop and recreate all tables)
 */
export async function resetDatabase(): Promise<void> {
  console.log('Resetting database...');
  await dropAllTables();
  await initializeDatabase();
  console.log('✓ Database reset completed');
}

// CLI support - run if called directly
if (require.main === module) {
  const command = process.argv[2];

  db.initialize();

  (async () => {
    try {
      switch (command) {
        case 'init':
          await initializeDatabase();
          break;
        case 'drop':
          await dropAllTables();
          break;
        case 'reset':
          await resetDatabase();
          break;
        default:
          console.log('Usage: ts-node initDb.ts [init|drop|reset]');
          console.log('  init  - Run all migrations');
          console.log('  drop  - Drop all tables');
          console.log('  reset - Drop and recreate all tables');
          process.exit(1);
      }
      await db.close();
      process.exit(0);
    } catch (error) {
      console.error('Command failed:', error);
      await db.close();
      process.exit(1);
    }
  })();
}
