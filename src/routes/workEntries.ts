import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as WorkEntryService from '../services/WorkEntryService';
import * as WorkEntryModel from '../models/WorkEntry';
import * as NotificationService from '../services/NotificationService';
import * as UserModel from '../models/User';

const router = Router();

/**
 * Helper: map error message to HTTP status code
 */
function getErrorStatus(message: string): number {
  if (message === 'Work entry not found') return 404;
  if (
    message === "Unauthorized: Cannot modify another employee's work entry" ||
    message === 'Work entry cannot be modified after 7 days'
  ) return 403;
  return 500;
}

/**
 * Helper: map HTTP status to error code string
 */
function getErrorCode(status: number): string {
  switch (status) {
    case 400: return 'VALIDATION_ERROR';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    default:  return 'INTERNAL_SERVER_ERROR';
  }
}

/**
 * POST /api/work-entries
 * Create a new work entry
 * Requirements: 1.1
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, description, status, category, startTime, endTime, duration, date } = req.body;

    if (!employeeId || !description || !status) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: employeeId, description, status',
          details: {},
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const entry = await WorkEntryService.createWorkEntry({
      employeeId,
      description,
      status,
      category,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      duration,
      date: date ? new Date(date) : undefined,
    });

    // Notify manager asynchronously — do not block the response
    UserModel.findById(employeeId).then((user) => {
      if (user?.managerId) {
        NotificationService.sendWorkEntryNotification(user.managerId, entry).catch(() => {});
      }
    }).catch(() => {});

    res.status(201).json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: {},
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/work-entries/search
 * Search work entries by keyword
 * Requirements: 6.4
 * NOTE: Must be defined before /:id to avoid route conflicts
 */
router.get('/search', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { keyword, employeeId } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'keyword query parameter is required',
          details: {},
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const entries = await WorkEntryService.searchWorkEntries({
      keyword,
      employeeId: typeof employeeId === 'string' ? employeeId : undefined,
    });

    res.status(200).json(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = getErrorStatus(message);
    res.status(status).json({
      error: {
        code: getErrorCode(status),
        message,
        details: {},
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/work-entries/employee/:employeeId/date/:date
 * Get work entries for an employee on a specific date
 * Requirements: 8.2
 */
router.get('/employee/:employeeId/date/:date', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const entries = await WorkEntryService.getWorkEntriesByDate(employeeId, parsedDate);
    res.status(200).json(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = getErrorStatus(message);
    res.status(status).json({
      error: {
        code: getErrorCode(status),
        message,
        details: {},
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/work-entries/employee/:employeeId/range
 * Get work entries for an employee within a date range
 * Requirements: 5.4, 8.3
 */
router.get('/employee/:employeeId/range', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
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

    const entries = await WorkEntryService.getWorkEntriesByDateRange(employeeId, parsedStart, parsedEnd);
    res.status(200).json(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = getErrorStatus(message);
    res.status(status).json({
      error: {
        code: getErrorCode(status),
        message,
        details: {},
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/work-entries/:id
 * Get a work entry by ID
 * Requirements: 8.2
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await WorkEntryModel.findById(id);

    if (!entry) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Work entry not found',
          details: {},
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.status(200).json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = getErrorStatus(message);
    res.status(status).json({
      error: {
        code: getErrorCode(status),
        message,
        details: {},
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/work-entries/:id
 * Update a work entry with authorization checks
 * Requirements: 9.1
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user!.userId;
    const { description, status, category, startTime, endTime, duration } = req.body;

    const updated = await WorkEntryService.updateWorkEntry(
      id,
      {
        description,
        status,
        category,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        duration,
      },
      requestingUserId
    );

    res.status(200).json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = getErrorStatus(message);
    res.status(status).json({
      error: {
        code: getErrorCode(status),
        message,
        details: {},
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/work-entries/:id
 * Delete a work entry with authorization checks
 * Requirements: 9.1
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user!.userId;

    await WorkEntryService.deleteWorkEntry(id, requestingUserId);

    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = getErrorStatus(message);
    res.status(status).json({
      error: {
        code: getErrorCode(status),
        message,
        details: {},
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
