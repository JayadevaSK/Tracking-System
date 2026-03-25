import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './config';

class Database {
  private pool: Pool | null = null;

  /**
   * Initialize the database connection pool
   */
  public initialize(): void {
    if (this.pool) {
      console.warn('Database pool already initialized');
      return;
    }

    // Railway and most cloud providers supply DATABASE_URL
    const connectionString = process.env.DATABASE_URL;

    this.pool = new Pool(
      connectionString
        ? {
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: process.env.NODE_ENV === 'production' ? 20 : 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          }
        : {
            host: config.database.host,
            port: config.database.port,
            database: config.database.database,
            user: config.database.user,
            password: config.database.password,
            max: config.database.max,
            idleTimeoutMillis: config.database.idleTimeoutMillis,
            connectionTimeoutMillis: config.database.connectionTimeoutMillis,
          }
    );

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle database client', err);
      process.exit(-1);
    });

    console.log(`Database pool initialized for ${config.nodeEnv} environment`);
  }

  /**
   * Get the database pool instance
   */
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query with parameters
   */
  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const pool = this.getPool();
    const start = Date.now();
    
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (config.nodeEnv === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error', { text, error });
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  public async getClient(): Promise<PoolClient> {
    const pool = this.getPool();
    return pool.connect();
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Close all database connections
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database pool closed');
    }
  }
}

// Export singleton instance
export const db = new Database();
