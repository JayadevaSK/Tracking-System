# Authentication Middleware

This directory contains authentication and authorization middleware for the Employee Work Tracker API.

## Overview

The authentication middleware provides two main functions:

1. **`authenticate`** - Validates JWT tokens and attaches user information to requests
2. **`requireRole`** - Checks if authenticated users have required roles

## Requirements

- **Requirement 10.1**: Authentication required before granting access to any functionality
- **Requirement 10.4**: Restrict manager-only features to users with manager role

## Middleware Functions

### `authenticate`

Extracts and validates JWT tokens from the Authorization header.

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header
- Validates token using `AuthService.validateToken`
- Attaches user information to `req.user` object
- Returns 401 Unauthorized for missing/invalid tokens

**Usage:**
```typescript
import { authenticate } from './middleware/auth';

router.get('/api/protected', authenticate, (req, res) => {
  // req.user is now available
  console.log(req.user.userId);
  console.log(req.user.role);
});
```

**Error Responses:**

Missing token (401):
```json
{
  "error": {
    "code": "MISSING_TOKEN",
    "message": "Authentication token is required",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

Invalid format (401):
```json
{
  "error": {
    "code": "INVALID_TOKEN_FORMAT",
    "message": "Authorization header must be in format: Bearer <token>",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

Invalid token (401):
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token validation failed",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### `requireRole`

Middleware factory that checks if authenticated users have required roles.

**Behavior:**
- Must be used after `authenticate` middleware
- Checks if `req.user.role` matches one of the required roles
- Returns 403 Forbidden for insufficient permissions
- Returns 401 if user is not authenticated

**Usage:**
```typescript
import { authenticate, requireRole } from './middleware/auth';
import { UserRole } from '../models/User';

// Manager-only endpoint
router.get(
  '/api/team',
  authenticate,
  requireRole([UserRole.MANAGER]),
  (req, res) => {
    // Only managers can access
  }
);

// Accessible by both employees and managers
router.post(
  '/api/work-entries',
  authenticate,
  requireRole([UserRole.EMPLOYEE, UserRole.MANAGER]),
  (req, res) => {
    // Both roles can access
  }
);
```

**Error Responses:**

Not authenticated (401):
```json
{
  "error": {
    "code": "NOT_AUTHENTICATED",
    "message": "User must be authenticated to access this resource",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

Insufficient permissions (403):
```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User does not have permission to access this resource",
    "details": {
      "requiredRoles": ["manager"],
      "userRole": "employee"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## TypeScript Types

### `AuthenticatedRequest`

Extended Express Request interface with user information:

```typescript
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}
```

Use this type in route handlers to access user information:

```typescript
import { AuthenticatedRequest } from './middleware/auth';

router.get('/api/profile', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId; // TypeScript knows about user property
  const role = req.user?.role;
});
```

## Testing

The middleware includes comprehensive unit tests in `auth.test.ts`:

- ✅ Returns 401 when Authorization header is missing
- ✅ Returns 401 when Authorization header format is invalid
- ✅ Returns 401 when token validation fails
- ✅ Attaches user info to request when token is valid
- ✅ Handles unexpected errors gracefully
- ✅ Returns 401 when user is not authenticated (requireRole)
- ✅ Returns 403 when user does not have required role
- ✅ Calls next when user has required role
- ✅ Supports multiple required roles

Run tests:
```bash
npm test auth.test
```

## Integration with Routes

Example of a complete route setup:

```typescript
import express from 'express';
import { authenticate, requireRole } from './middleware/auth';
import { UserRole } from './models/User';

const app = express();

// Public routes (no authentication)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes (authentication required)
app.get('/api/profile', authenticate, (req, res) => {
  // Any authenticated user can access
});

// Manager-only routes
app.get(
  '/api/dashboard/team',
  authenticate,
  requireRole([UserRole.MANAGER]),
  (req, res) => {
    // Only managers can access
  }
);

// Employee-only routes
app.get(
  '/api/employee/dashboard',
  authenticate,
  requireRole([UserRole.EMPLOYEE]),
  (req, res) => {
    // Only employees can access
  }
);
```

## Security Considerations

1. **Token Format**: Only accepts Bearer token format in Authorization header
2. **Token Validation**: Validates token signature and expiration using JWT library
3. **User Verification**: Checks that user still exists in database
4. **Error Messages**: Returns generic error messages to avoid leaking information
5. **Role Enforcement**: Strictly enforces role-based access control

## Dependencies

- `express` - Web framework
- `jsonwebtoken` - JWT token validation (via AuthService)
- `../services/AuthService` - Token validation service
- `../models/User` - User role definitions

## See Also

- `auth.example.ts` - Complete usage examples
- `auth.test.ts` - Unit tests
- `../services/AuthService.ts` - Authentication service
- `../models/User.ts` - User model and roles
