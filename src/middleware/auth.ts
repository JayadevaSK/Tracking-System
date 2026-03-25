import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/AuthService';
import { UserRole } from '../models/User';

/**
 * Extended Request interface with user information
 * Requirements: 10.1
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

/**
 * Authentication middleware to extract and validate JWT tokens
 * Requirements: 10.1
 * 
 * Extracts JWT token from Authorization header (Bearer token format),
 * validates the token using AuthService.validateToken, and attaches
 * user information to the request object.
 * 
 * Returns 401 Unauthorized for missing or invalid tokens.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const token = parts[1];

    // Validate token using AuthService
    const validation = await AuthService.validateToken(token);

    if (!validation.valid) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: validation.error || 'Token validation failed',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Attach user information to request
    req.user = {
      userId: validation.userId!,
      role: validation.role!,
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Role-checking middleware factory
 * Requirements: 10.4
 * 
 * Creates middleware that checks if the authenticated user has one of the
 * required roles. Returns 403 Forbidden for insufficient permissions.
 * 
 * Must be used after the authenticate middleware.
 * 
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 * 
 * @example
 * // Restrict to managers only
 * router.get('/team', authenticate, requireRole([UserRole.MANAGER]), getTeamOverview);
 * 
 * @example
 * // Allow both employees and managers
 * router.get('/profile', authenticate, requireRole([UserRole.EMPLOYEE, UserRole.MANAGER]), getProfile);
 */
export function requireRole(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated to access this resource',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'User does not have permission to access this resource',
          details: {
            requiredRoles: roles,
            userRole: req.user.role,
          },
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}
