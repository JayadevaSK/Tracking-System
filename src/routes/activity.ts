import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';

const router = Router();

/**
 * POST /api/activity
 * Log an activity event for the authenticated employee
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.user!.userId;
    const { eventType, page, durationSeconds, metadata } = req.body;

    if (!eventType) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'eventType is required' } });
      return;
    }

    const result = await db.query(
      `INSERT INTO activity_logs (employee_id, event_type, page, duration_seconds, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, employee_id, event_type, page, duration_seconds, metadata, created_at`,
      [employeeId, eventType, page || null, durationSeconds || null, metadata ? JSON.stringify(metadata) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message } });
  }
});

/**
 * GET /api/activity/employee/:employeeId/date/:date
 * Get activity timeline for an employee on a specific date (manager only)
 */
router.get('/employee/:employeeId/date/:date', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, date } = req.params;

    const result = await db.query(
      `SELECT id, employee_id, event_type, page, duration_seconds, metadata, created_at
       FROM activity_logs
       WHERE employee_id = $1
         AND DATE(created_at AT TIME ZONE 'UTC') = $2::date
       ORDER BY created_at ASC`,
      [employeeId, date]
    );

    // Build a summary alongside the raw events
    const events = result.rows;
    const totalActiveSeconds = events
      .filter((e: any) => e.event_type === 'page_visit' && e.duration_seconds)
      .reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0);

    const totalIdleSeconds = events
      .filter((e: any) => e.event_type === 'idle' && e.duration_seconds)
      .reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0);

    const pageBreakdown: Record<string, number> = {};
    events
      .filter((e: any) => e.event_type === 'page_visit' && e.page && e.duration_seconds)
      .forEach((e: any) => {
        pageBreakdown[e.page] = (pageBreakdown[e.page] || 0) + e.duration_seconds;
      });

    res.status(200).json({
      events,
      summary: {
        totalActiveSeconds,
        totalIdleSeconds,
        pageBreakdown,
        sessionCount: events.filter((e: any) => e.event_type === 'session_start').length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message } });
  }
});

export default router;
