/**
 * auth.example.ts
 * Example/reference file — not compiled (excluded in tsconfig.json)
 * Shows alternative authentication middleware patterns.
 */

import { Request, Response, NextFunction } from 'express';

// Example: Role-based access control middleware
export function requireRole(role: string) {
  return (_req: Request, _res: Response, _next: NextFunction) => {
    // Implementation example
    void role;
  };
}
