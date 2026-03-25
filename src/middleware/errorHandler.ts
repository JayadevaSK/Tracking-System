import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handler middleware
 * Requirements: 10.5, 11.1, 11.5
 *
 * Maps known error messages to appropriate HTTP status codes and returns
 * a consistent error response format.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message = err.message || 'An unexpected error occurred';
  const { status, code } = resolveError(message);

  console.error(`[${new Date().toISOString()}] ${status} ${code}: ${message}`);

  res.status(status).json({
    error: {
      code,
      message,
      details: {},
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Resolve HTTP status and error code from an error message.
 */
function resolveError(message: string): { status: number; code: string } {
  if (message === 'Work entry not found') {
    return { status: 404, code: 'NOT_FOUND' };
  }

  if (
    message === "Unauthorized: Cannot modify another employee's work entry" ||
    message === 'Work entry cannot be modified after 7 days'
  ) {
    return { status: 403, code: 'FORBIDDEN' };
  }

  // Validation errors (description, status, duration, missing fields)
  if (
    message.includes('must be at least') ||
    message.includes('Invalid status') ||
    message.includes('Duration must be') ||
    message.includes('Missing required') ||
    message.includes('Invalid date') ||
    message.includes('required')
  ) {
    return { status: 400, code: 'VALIDATION_ERROR' };
  }

  // Authentication errors
  if (
    message.includes('Authentication') ||
    message.includes('token') ||
    message.includes('unauthorized') ||
    message.includes('Unauthorized') && !message.includes('Cannot modify')
  ) {
    return { status: 401, code: 'UNAUTHORIZED' };
  }

  return { status: 500, code: 'INTERNAL_SERVER_ERROR' };
}

/**
 * 404 handler for unmatched routes
 * Requirements: 11.1
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      details: {},
      timestamp: new Date().toISOString(),
    },
  });
}
