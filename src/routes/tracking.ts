import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as AutomaticTrackerService from '../services/AutomaticTrackerService';

const router = Router();

/**
 * POST /api/tracking/:employeeId/enable
 * Enable automatic tracking for an employee
 * Requirements: 2.4
 */
router.post(
  '/:employeeId/enable',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const config = await AutomaticTrackerService.enableTracking(employeeId);
      res.status(200).json(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message, details: {}, timestamp: new Date().toISOString() },
      });
    }
  }
);

/**
 * POST /api/tracking/:employeeId/disable
 * Disable automatic tracking for an employee
 * Requirements: 2.4
 */
router.post(
  '/:employeeId/disable',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const config = await AutomaticTrackerService.disableTracking(employeeId);
      res.status(200).json(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message, details: {}, timestamp: new Date().toISOString() },
      });
    }
  }
);

/**
 * GET /api/tracking/:employeeId/status
 * Get tracking status for an employee
 * Requirements: 2.4
 */
router.get(
  '/:employeeId/status',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const config = await AutomaticTrackerService.getTrackingStatus(employeeId);

      if (!config) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'No tracking configuration found for this employee',
            details: {},
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message, details: {}, timestamp: new Date().toISOString() },
      });
    }
  }
);

export default router;
