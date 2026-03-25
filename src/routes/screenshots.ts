import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../utils/db';

const router = Router();

/**
 * POST /api/screenshots/:workEntryId
 * Upload screenshots for a work entry (base64 encoded)
 */
router.post(
  '/:workEntryId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { workEntryId } = req.params;
    const { screenshots } = req.body as {
      screenshots: Array<{ filename: string; mimeType: string; data: string }>;
    };

    if (!Array.isArray(screenshots) || screenshots.length === 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'screenshots array is required' } });
      return;
    }

    if (screenshots.length > 5) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Maximum 5 screenshots per entry' } });
      return;
    }

    try {
      const inserted = await Promise.all(
        screenshots.map((s) =>
          db.query(
            `INSERT INTO screenshots (work_entry_id, filename, mime_type, data)
             VALUES ($1, $2, $3, $4) RETURNING id, filename, created_at`,
            [workEntryId, s.filename, s.mimeType, s.data]
          )
        )
      );

      res.status(201).json({ screenshots: inserted.map((r) => r.rows[0]) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save screenshots';
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message } });
    }
  }
);

/**
 * GET /api/screenshots/:workEntryId
 * Get all screenshots for a work entry
 */
router.get(
  '/:workEntryId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { workEntryId } = req.params;
    try {
      const result = await db.query(
        `SELECT id, work_entry_id as "workEntryId", filename, mime_type as "mimeType", data, created_at as "createdAt"
         FROM screenshots WHERE work_entry_id = $1 ORDER BY created_at ASC`,
        [workEntryId]
      );
      res.status(200).json({ screenshots: result.rows });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch screenshots';
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message } });
    }
  }
);

/**
 * DELETE /api/screenshots/:screenshotId
 * Delete a screenshot
 */
router.delete(
  '/single/:screenshotId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { screenshotId } = req.params;
    try {
      await db.query('DELETE FROM screenshots WHERE id = $1', [screenshotId]);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete screenshot';
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message } });
    }
  }
);

export default router;
