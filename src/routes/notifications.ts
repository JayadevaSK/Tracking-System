import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as NotificationService from '../services/NotificationService';

const router = Router();

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the authenticated user
 * Requirements: 12.2
 */
router.put(
  '/preferences',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { emailEnabled, notifyOnWorkEntry, notifyOnDailySummary, email } = req.body;
      const userId = req.user!.userId;

      const prefs = await NotificationService.updateNotificationPreferences({
        userId,
        emailEnabled,
        notifyOnWorkEntry,
        notifyOnDailySummary,
        email,
      });

      res.status(200).json(prefs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message, details: {}, timestamp: new Date().toISOString() },
      });
    }
  }
);

/**
 * GET /api/notifications/preferences/:userId
 * Get notification preferences for a user
 * Requirements: 12.2
 */
router.get(
  '/preferences/:userId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const prefs = await NotificationService.getNotificationPreferences(userId);

      if (!prefs) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Notification preferences not found for this user',
            details: {},
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json(prefs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message, details: {}, timestamp: new Date().toISOString() },
      });
    }
  }
);

export default router;
