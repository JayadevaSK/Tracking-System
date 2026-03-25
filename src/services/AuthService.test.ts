import jwt from 'jsonwebtoken';
import * as AuthService from './AuthService';
import * as UserModel from '../models/User';
import { UserRole } from '../models/User';
import { config } from '../utils/config';

// Mock the User model
jest.mock('../models/User');

// Mock the config
jest.mock('../utils/config', () => ({
  config: {
    jwt: {
      secret: 'test_secret',
      expiresIn: '1h',
    },
  },
}));

describe('AuthService', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.EMPLOYEE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await AuthService.login('testuser', 'password123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.userId).toBe(mockUser.id);
      expect(result.role).toBe(UserRole.EMPLOYEE);
      expect(result.error).toBeUndefined();
      expect(UserModel.findByUsername).toHaveBeenCalledWith('testuser');
      expect(UserModel.comparePassword).toHaveBeenCalledWith(
        'password123',
        mockUser.passwordHash
      );
    });

    it('should fail login with incorrect password', async () => {
      // Arrange
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.comparePassword as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await AuthService.login('testuser', 'wrongpassword');

      // Assert
      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.userId).toBeUndefined();
      expect(result.role).toBeUndefined();
      expect(result.error).toBe('Invalid credentials');
    });

    it('should fail login with non-existent username', async () => {
      // Arrange
      (UserModel.findByUsername as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await AuthService.login('nonexistent', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.userId).toBeUndefined();
      expect(result.role).toBeUndefined();
      expect(result.error).toBe('Invalid credentials');
      expect(UserModel.comparePassword).not.toHaveBeenCalled();
    });

    it('should fail login with empty username', async () => {
      // Act
      const result = await AuthService.login('', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required');
      expect(UserModel.findByUsername).not.toHaveBeenCalled();
    });

    it('should fail login with empty password', async () => {
      // Act
      const result = await AuthService.login('testuser', '');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required');
      expect(UserModel.findByUsername).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      (UserModel.findByUsername as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await AuthService.login('testuser', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('An error occurred during login');
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      // Arrange
      const token = jwt.sign(
        { userId: mockUser.id, role: mockUser.role },
        config.jwt.secret,
        { expiresIn: '1h' }
      );
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.validateToken(token);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.userId).toBe(mockUser.id);
      expect(result.role).toBe(UserRole.EMPLOYEE);
      expect(result.error).toBeUndefined();
      expect(UserModel.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should reject an invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid.token.here';

      // Act
      const result = await AuthService.validateToken(invalidToken);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
      expect(result.role).toBeUndefined();
      expect(result.error).toBe('Invalid token');
    });

    it('should reject an expired token', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { userId: mockUser.id, role: mockUser.role },
        config.jwt.secret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      // Act
      const result = await AuthService.validateToken(expiredToken);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should reject token with empty string', async () => {
      // Act
      const result = await AuthService.validateToken('');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
    });

    it('should reject token for non-existent user', async () => {
      // Arrange
      const token = jwt.sign(
        { userId: 'non-existent-id', role: UserRole.EMPLOYEE },
        config.jwt.secret,
        { expiresIn: '1h' }
      );
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await AuthService.validateToken(token);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getUserRole', () => {
    it('should return user role for valid user ID', async () => {
      // Arrange
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const role = await AuthService.getUserRole(mockUser.id);

      // Assert
      expect(role).toBe(UserRole.EMPLOYEE);
      expect(UserModel.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      // Act
      const role = await AuthService.getUserRole('non-existent-id');

      // Assert
      expect(role).toBeNull();
    });

    it('should return null on database error', async () => {
      // Arrange
      (UserModel.findById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const role = await AuthService.getUserRole(mockUser.id);

      // Assert
      expect(role).toBeNull();
    });

    it('should return manager role for manager user', async () => {
      // Arrange
      const managerUser = { ...mockUser, role: UserRole.MANAGER };
      (UserModel.findById as jest.Mock).mockResolvedValue(managerUser);

      // Act
      const role = await AuthService.getUserRole(managerUser.id);

      // Assert
      expect(role).toBe(UserRole.MANAGER);
    });
  });

  describe('logout', () => {
    it('should complete successfully', async () => {
      // Arrange
      const token = jwt.sign(
        { userId: mockUser.id, role: mockUser.role },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // Act & Assert
      await expect(AuthService.logout(token)).resolves.toBeUndefined();
    });

    it('should handle empty token', async () => {
      // Act & Assert
      await expect(AuthService.logout('')).resolves.toBeUndefined();
    });
  });
});
