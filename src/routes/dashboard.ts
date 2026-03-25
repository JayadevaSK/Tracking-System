import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as DashboardService from '../services/DashboardService';

const router = Router();

/**
 * GET /api/dashboard/summary/:employeeId/:date
 * Get daily summary for an employee
 * Requirements: 3.1
 */
router.get(
  '/summary/:employeeId/:date',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { employeeId, date } = req.params;
      const parsedDate = new Date(date);

      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format',
            details: {},
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const summary = await DashboardService.getDailySummary(employeeId, parsedDate);
      res.status(200).json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message,
          details: {},
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/dashboard/team/:managerId/:date
 * Get team overview for a manager on a given date
 * Requirements: 7.1
 */
router.get(
  '/team/:managerId/:date',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { managerId, date } = req.params;
      const parsedDate = new Date(date);

      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format',
            details: {},
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const overview = await DashboardService.getTeamOverview(managerId, parsedDate);
      res.status(200).json(overview);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message,
          details: {},
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/dashboard/metrics/:employeeId
 * Get work metrics for an employee over a date range
 * Requirements: 5.3
 */
router.get(
  '/metrics/:employeeId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      if (
        !startDate ||
        !endDate ||
        typeof startDate !== 'string' ||
        typeof endDate !== 'string'
      ) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate query parameters are required',
            details: {},
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const parsedStart = new Date(startDate);
      const parsedEnd = new Date(endDate);

      if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format for startDate or endDate',
            details: {},
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const metrics = await DashboardService.getWorkMetrics(employeeId, parsedStart, parsedEnd);
      res.status(200).json(metrics);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message,
          details: {},
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;
