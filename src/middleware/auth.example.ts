/**
 * auth.example.ts - Reference patterns (excluded from compilation)
 */
import { Request, Response, NextFunction } from 'express';

export function requireRole(_role: string) {
  return (_req: Request, _res: Response, _next: NextFunction): void => {};
}

export function optionalAuth(_req: Request, _res: Response, _next: NextFunction): void {}

export function rateLimiter(_req: Request, _res: Response, _next: NextFunction): void {}
