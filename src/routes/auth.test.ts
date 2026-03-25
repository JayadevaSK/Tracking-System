import request from 'supertest';
import express, { Application } from 'express';
import authRoutes from './auth';
import * as AuthService from '../services/AuthService';
import { UserRole } from '../models/User';

// Mock the AuthService
jest.mock('../services/AuthService');

// Mock the authenticate middleware
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    // Mock authenticated user
    req.user = {
      userId: 'test-user-id',
      role: UserRole.EMPLOYEE,
    };
    next();
  },
  AuthenticatedRequest: jest.fn(),
}));

describe('Authentication Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_CREDENTIALS');
      expect(response.body.error.message).toContain('Username and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_CREDENTIALS');
      expect(response.body.error.message).toContain('Username and password are required');
    });

    it('should return 401 when credentials are invalid', async () => {
      (AuthService.login as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 200 with token when credentials are valid', async () => {
      const mockAuthResult = {
        success: true,
        token: 'mock-jwt-token',
        userId: 'user-123',
        role: UserRole.EMPLOYEE,
      };

      (AuthService.login as jest.Mock).mockResolvedValue(mockAuthResult);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'correctpassword' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('mock-jwt-token');
      expect(response.body.userId).toBe('user-123');
      expect(response.body.role).toBe(UserRole.EMPLOYEE);
    });

    it('should return 500 when an unexpected error occurs', async () => {
      (AuthService.login as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 when logout is successful', async () => {
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should call AuthService.logout with the token', async () => {
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer test-token-123');

      expect(AuthService.logout).toHaveBeenCalledWith('test-token-123');
    });

    it('should return 500 when an error occurs during logout', async () => {
      (AuthService.logout as jest.Mock).mockRejectedValue(new Error('Logout error'));

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/auth/validate', () => {
    it('should return 200 with user info when token is valid', async () => {
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.userId).toBe('test-user-id');
      expect(response.body.role).toBe(UserRole.EMPLOYEE);
    });

    it('should return user information from the authenticated request', async () => {
      // The authenticate middleware mock sets req.user
      const response = await request(app)
        .get('/api/auth/validate')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('role');
    });
  });
});
