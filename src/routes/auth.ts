import { Router, Request, Response } from 'express';
import * as AuthService from '../services/AuthService';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with username and password
 * Requirements: 10.1, 10.2
 * 
 * Request body:
 * {
 *   "username": "string",
 *   "password": "string"
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "token": "jwt_token",
 *   "userId": "uuid",
 *   "role": "employee" | "manager"
 * }
 * 
 * Response (failure):
 * {
 *   "error": {
 *     "code": "AUTHENTICATION_FAILED",
 *     "message": "error message",
 *     "timestamp": "ISO timestamp"
 *   }
 * }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
      res.status(400).json({
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Username and password are required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Attempt login
    const result = await AuthService.login(username, password);

    if (!result.success) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: result.error || 'Authentication failed',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Return success response
    res.status(200).json({
      success: true,
      token: result.token,
      userId: result.userId,
      role: result.role,
    });
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during login',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 * Requirements: 10.1
 * 
 * Requires authentication via Bearer token in Authorization header
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || '';

    // Call logout service
    await AuthService.logout(token);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during logout',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/auth/validate
 * Validate current authentication token
 * Requirements: 10.1
 * 
 * Requires authentication via Bearer token in Authorization header
 * 
 * Response (success):
 * {
 *   "valid": true,
 *   "userId": "uuid",
 *   "role": "employee" | "manager"
 * }
 */
router.get('/validate', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // If we reach here, the authenticate middleware has already validated the token
    // and attached user information to the request
    res.status(200).json({
      valid: true,
      userId: req.user?.userId,
      role: req.user?.role,
    });
  } catch (error) {
    console.error('Validate endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during token validation',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
