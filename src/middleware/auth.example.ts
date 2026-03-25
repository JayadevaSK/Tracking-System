/**
 * Example usage of authentication middleware
 * This file demonstrates how to use the authenticate and requireRole middleware
 * in Express routes.
 * 
 * Requirements: 10.1, 10.4
 */

import express, { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from './auth';
import { UserRole } from '../models/User';

const router: Router = express.Router();

/**
 * Example 1: Public endpoint (no authentication required)
 */
router.get('/api/public/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Example 2: Protected endpoint (authentication required)
 * Any authenticated user (employee or manager) can access
 */
router.get('/api/profile', authenticate, (req: AuthenticatedRequest, res) => {
  // req.user is now available with userId and role
  res.json({
    userId: req.user?.userId,
    role: req.user?.role,
  });
});

/**
 * Example 3: Manager-only endpoint
 * Only users with manager role can access
 */
router.get(
  '/api/dashboard/team',
  authenticate,
  requireRole([UserRole.MANAGER]),
  (req: AuthenticatedRequest, res) => {
    // Only managers can reach this point
    res.json({ message: 'Team dashboard data' });
  }
);

/**
 * Example 4: Endpoint accessible by both employees and managers
 */
router.post(
  '/api/work-entries',
  authenticate,
  requireRole([UserRole.EMPLOYEE, UserRole.MANAGER]),
  (req: AuthenticatedRequest, res) => {
    // Both employees and managers can create work entries
    const userId = req.user?.userId;
    res.json({ message: 'Work entry created', userId });
  }
);

/**
 * Example 5: Employee-only endpoint
 */
router.get(
  '/api/employee/dashboard',
  authenticate,
  requireRole([UserRole.EMPLOYEE]),
  (req: AuthenticatedRequest, res) => {
    // Only employees can access
    res.json({ message: 'Employee dashboard data' });
  }
);

export default router;
