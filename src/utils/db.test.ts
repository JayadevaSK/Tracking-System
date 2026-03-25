import { db } from './db';
import { config } from './config';

describe('Database Connection', () => {
  beforeAll(() => {
    db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('initialization', () => {
    it('should initialize database pool', () => {
      const pool = db.getPool();
      expect(pool).toBeDefined();
    });

    it('should throw error if pool not initialized', async () => {
      const testDb = new (db.constructor as any)();
      expect(() => testDb.getPool()).toThrow('Database pool not initialized');
    });
  });

  describe('configuration', () => {
    it('should load database configuration from environment', () => {
      expect(config.database.host).toBeDefined();
      expect(config.database.port).toBeDefined();
      expect(config.database.database).toBeDefined();
      expect(config.database.user).toBeDefined();
    });

    it('should set connection pool size based on environment', () => {
      if (config.nodeEnv === 'production') {
        expect(config.database.max).toBe(20);
      } else {
        expect(config.database.max).toBe(10);
      }
    });
  });

  describe('query execution', () => {
    it('should execute a simple query', async () => {
      const result = await db.query('SELECT 1 as value');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].value).toBe(1);
    });

    it('should execute parameterized queries', async () => {
      const result = await db.query('SELECT $1::text as message', ['Hello']);
      expect(result.rows[0].message).toBe('Hello');
    });

    it('should handle query errors', async () => {
      await expect(db.query('INVALID SQL')).rejects.toThrow();
    });
  });

  describe('connection testing', () => {
    it('should test database connection successfully', async () => {
      const isConnected = await db.testConnection();
      expect(isConnected).toBe(true);
    });
  });

  describe('client management', () => {
    it('should provide a client for transactions', async () => {
      const client = await db.getClient();
      expect(client).toBeDefined();
      
      try {
        const result = await client.query('SELECT 1 as value');
        expect(result.rows[0].value).toBe(1);
      } finally {
        client.release();
      }
    });
  });
});
