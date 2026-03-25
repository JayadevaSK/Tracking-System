import { config } from './config';

describe('Configuration', () => {
  describe('application config', () => {
    it('should have a valid port number', () => {
      expect(config.port).toBeGreaterThan(0);
      expect(config.port).toBeLessThan(65536);
    });

    it('should have a node environment', () => {
      expect(config.nodeEnv).toBeDefined();
      expect(['development', 'test', 'production']).toContain(config.nodeEnv);
    });

    it('should have a CORS origin', () => {
      expect(config.corsOrigin).toBeDefined();
      expect(typeof config.corsOrigin).toBe('string');
    });
  });

  describe('database config', () => {
    it('should have database connection settings', () => {
      expect(config.database.host).toBeDefined();
      expect(config.database.port).toBeGreaterThan(0);
      expect(config.database.database).toBeDefined();
      expect(config.database.user).toBeDefined();
    });

    it('should have connection pool settings', () => {
      expect(config.database.max).toBeGreaterThan(0);
      expect(config.database.idleTimeoutMillis).toBeGreaterThan(0);
      expect(config.database.connectionTimeoutMillis).toBeGreaterThan(0);
    });

    it('should adjust pool size based on environment', () => {
      if (config.nodeEnv === 'production') {
        expect(config.database.max).toBe(20);
      } else {
        expect(config.database.max).toBe(10);
      }
    });
  });

  describe('JWT config', () => {
    it('should have JWT secret', () => {
      expect(config.jwt.secret).toBeDefined();
      expect(config.jwt.secret.length).toBeGreaterThan(0);
    });

    it('should have JWT expiration time', () => {
      expect(config.jwt.expiresIn).toBeDefined();
      expect(typeof config.jwt.expiresIn).toBe('string');
    });
  });

  describe('email config', () => {
    it('should have email service settings', () => {
      expect(config.email.host).toBeDefined();
      expect(config.email.port).toBeGreaterThan(0);
      expect(config.email.from).toBeDefined();
    });
  });
});
