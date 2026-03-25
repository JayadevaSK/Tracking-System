import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import * as UserModel from '../models/User';
import { UserRole } from '../models/User';

/**
 * Authentication result interface
 * Requirements: 10.2
 */
export interface AuthResult {
  success: boolean;
  token?: string;
  userId?: string;
  role?: UserRole;
  error?: string;
}

/**
 * Token validation result interface
 * Requirements: 10.1
 */
export interface TokenValidation {
  valid: boolean;
  userId?: string;
  role?: UserRole;
  error?: string;
}

/**
 * JWT token payload interface
 */
interface TokenPayload {
  userId: string;
  role: UserRole;
}

/**
 * Login function with credential validation
 * Requirements: 10.2
 * 
 * @param username - User's username
 * @param password - User's plain text password
 * @returns Authentication result with token if successful
 */
export async function login(
  username: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validate input
    if (!username || !password) {
      return {
        success: false,
        error: 'Username and password are required',
      };
    }

    // Find user by username
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    // Verify password
    const isPasswordValid = await UserModel.comparePassword(
      password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    return {
      success: true,
      token,
      userId: user.id,
      role: user.role,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An error occurred during login',
    };
  }
}

/**
 * Generate JWT token with user ID and role
 * Requirements: 10.1, 10.3
 * 
 * @param userId - User's unique identifier
 * @param role - User's role (employee or manager)
 * @returns Signed JWT token
 */
function generateToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    userId,
    role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
}

/**
 * Validate JWT token and extract user information
 * Requirements: 10.1
 * 
 * @param token - JWT token to validate
 * @returns Token validation result with user info if valid
 */
export async function validateToken(token: string): Promise<TokenValidation> {
  try {
    if (!token) {
      return {
        valid: false,
        error: 'Token is required',
      };
    }

    // Verify and decode token
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    // Verify user still exists
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return {
        valid: false,
        error: 'User not found',
      };
    }

    return {
      valid: true,
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token expired',
      };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      };
    }
    console.error('Token validation error:', error);
    return {
      valid: false,
      error: 'Token validation failed',
    };
  }
}

/**
 * Get user role by user ID
 * Requirements: 10.3
 * 
 * @param userId - User's unique identifier
 * @returns User's role or null if user not found
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const user = await UserModel.findById(userId);
    return user ? user.role : null;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
}

/**
 * Logout function (token invalidation)
 * Requirements: 10.1
 * 
 * Note: With JWT tokens, true invalidation requires a token blacklist
 * or database-backed session management. This implementation provides
 * the interface for logout, but actual token invalidation would require
 * additional infrastructure (e.g., Redis blacklist).
 * 
 * For now, this function serves as a placeholder and returns successfully.
 * Client-side should remove the token from storage on logout.
 * 
 * @param token - JWT token to invalidate
 */
export async function logout(_token: string): Promise<void> {
  // In a production system, you would:
  // 1. Add the token to a blacklist in Redis with TTL matching token expiry
  // 2. Check blacklist in validateToken function
  // 3. Clean up expired tokens periodically
  
  // For now, this is a no-op as the client will remove the token
  // and the token will naturally expire based on its expiration time
  return Promise.resolve();
}
