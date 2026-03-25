import { Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from './auth';
import * as AuthService from '../services/AuthService';
import { UserRole } from '../models/User';

// Mock AuthService
jest.mock('../services/AuthService');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should return 401 when Authorization header is missing', async () => {
      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required',
        }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header format is invalid', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
        }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token validation fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      (AuthService.validateToken as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid token',
      });

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(AuthService.validateToken).toHaveBeenCalledWith('invalid_token');
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user info to request and call next when token is valid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (AuthService.validateToken as jest.Mock).mockResolvedValue({
        valid: true,
        userId: 'user123',
        role: UserRole.EMPLOYEE,
      });

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(AuthService.validateToken).toHaveBeenCalledWith('valid_token');
      expect(mockRequest.user).toEqual({
        userId: 'user123',
        role: UserRole.EMPLOYEE,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (AuthService.validateToken as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed',
        }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should return 401 when user is not authenticated', () => {
      const middleware = requireRole([UserRole.MANAGER]);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated to access this resource',
        }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', () => {
      mockRequest.user = {
        userId: 'user123',
        role: UserRole.EMPLOYEE,
      };

      const middleware = requireRole([UserRole.MANAGER]);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'User does not have permission to access this resource',
          details: {
            requiredRoles: [UserRole.MANAGER],
            userRole: UserRole.EMPLOYEE,
          },
        }),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when user has required role', () => {
      mockRequest.user = {
        userId: 'user123',
        role: UserRole.MANAGER,
      };

      const middleware = requireRole([UserRole.MANAGER]);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should call next when user has one of multiple required roles', () => {
      mockRequest.user = {
        userId: 'user123',
        role: UserRole.EMPLOYEE,
      };

      const middleware = requireRole([UserRole.EMPLOYEE, UserRole.MANAGER]);

      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
