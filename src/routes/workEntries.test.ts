import request from 'supertest';
import express, { Application } from 'express';
import workEntryRoutes from './workEntries';
import * as WorkEntryService from '../services/WorkEntryService';
import * as WorkEntryModel from '../models/WorkEntry';
import { UserRole } from '../models/User';
import { CompletionStatus } from '../models/WorkEntry';

// Mock dependencies
jest.mock('../services/WorkEntryService');
jest.mock('../models/WorkEntry');

// Mock authenticate middleware to inject a test user
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'employee-1', role: UserRole.EMPLOYEE };
    next();
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
  AuthenticatedRequest: jest.fn(),
}));

const mockEntry = {
  id: 'entry-1',
  employeeId: 'employee-1',
  description: 'Worked on feature X',
  status: CompletionStatus.COMPLETED,
  date: new Date('2024-01-15'),
  isAutoTracked: false,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
};

describe('Work Entry Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/work-entries', workEntryRoutes);
    jest.clearAllMocks();
  });

  // ─── POST /api/work-entries ───────────────────────────────────────────────

  describe('POST /api/work-entries', () => {
    it('should return 201 with created entry on success', async () => {
      (WorkEntryService.createWorkEntry as jest.Mock).mockResolvedValue(mockEntry);

      const response = await request(app)
        .post('/api/work-entries')
        .send({
          employeeId: 'employee-1',
          description: 'Worked on feature X',
          status: CompletionStatus.COMPLETED,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('entry-1');
      expect(WorkEntryService.createWorkEntry).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/work-entries')
        .send({ description: 'Worked on feature X' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Missing required fields');
    });

    it('should return 400 when service throws a validation error', async () => {
      (WorkEntryService.createWorkEntry as jest.Mock).mockRejectedValue(
        new Error('Description must be at least 10 characters')
      );

      const response = await request(app)
        .post('/api/work-entries')
        .send({
          employeeId: 'employee-1',
          description: 'Short',
          status: CompletionStatus.COMPLETED,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── GET /api/work-entries/search ────────────────────────────────────────

  describe('GET /api/work-entries/search', () => {
    it('should return 200 with matching entries', async () => {
      (WorkEntryService.searchWorkEntries as jest.Mock).mockResolvedValue([mockEntry]);

      const response = await request(app)
        .get('/api/work-entries/search')
        .query({ keyword: 'feature' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(WorkEntryService.searchWorkEntries).toHaveBeenCalledWith({
        keyword: 'feature',
        employeeId: undefined,
      });
    });

    it('should pass employeeId filter when provided', async () => {
      (WorkEntryService.searchWorkEntries as jest.Mock).mockResolvedValue([mockEntry]);

      await request(app)
        .get('/api/work-entries/search')
        .query({ keyword: 'feature', employeeId: 'employee-1' });

      expect(WorkEntryService.searchWorkEntries).toHaveBeenCalledWith({
        keyword: 'feature',
        employeeId: 'employee-1',
      });
    });

    it('should return 400 when keyword is missing', async () => {
      const response = await request(app)
        .get('/api/work-entries/search');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('keyword');
    });
  });

  // ─── GET /api/work-entries/employee/:employeeId/date/:date ───────────────

  describe('GET /api/work-entries/employee/:employeeId/date/:date', () => {
    it('should return 200 with entries for the given date', async () => {
      (WorkEntryService.getWorkEntriesByDate as jest.Mock).mockResolvedValue([mockEntry]);

      const response = await request(app)
        .get('/api/work-entries/employee/employee-1/date/2024-01-15');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(WorkEntryService.getWorkEntriesByDate).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for an invalid date', async () => {
      const response = await request(app)
        .get('/api/work-entries/employee/employee-1/date/not-a-date');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── GET /api/work-entries/employee/:employeeId/range ────────────────────

  describe('GET /api/work-entries/employee/:employeeId/range', () => {
    it('should return 200 with entries in the date range', async () => {
      (WorkEntryService.getWorkEntriesByDateRange as jest.Mock).mockResolvedValue([mockEntry]);

      const response = await request(app)
        .get('/api/work-entries/employee/employee-1/range')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(WorkEntryService.getWorkEntriesByDateRange).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when startDate is missing', async () => {
      const response = await request(app)
        .get('/api/work-entries/employee/employee-1/range')
        .query({ endDate: '2024-01-31' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when endDate is missing', async () => {
      const response = await request(app)
        .get('/api/work-entries/employee/employee-1/range')
        .query({ startDate: '2024-01-01' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date formats', async () => {
      const response = await request(app)
        .get('/api/work-entries/employee/employee-1/range')
        .query({ startDate: 'bad-date', endDate: '2024-01-31' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ─── GET /api/work-entries/:id ────────────────────────────────────────────

  describe('GET /api/work-entries/:id', () => {
    it('should return 200 with the entry when found', async () => {
      (WorkEntryModel.findById as jest.Mock).mockResolvedValue(mockEntry);

      const response = await request(app).get('/api/work-entries/entry-1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('entry-1');
    });

    it('should return 404 when entry is not found', async () => {
      (WorkEntryModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/work-entries/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ─── PUT /api/work-entries/:id ────────────────────────────────────────────

  describe('PUT /api/work-entries/:id', () => {
    it('should return 200 with updated entry on success', async () => {
      const updated = { ...mockEntry, description: 'Updated description here' };
      (WorkEntryService.updateWorkEntry as jest.Mock).mockResolvedValue(updated);

      const response = await request(app)
        .put('/api/work-entries/entry-1')
        .send({ description: 'Updated description here' });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated description here');
      expect(WorkEntryService.updateWorkEntry).toHaveBeenCalledWith(
        'entry-1',
        expect.objectContaining({ description: 'Updated description here' }),
        'employee-1'
      );
    });

    it('should return 404 when entry is not found', async () => {
      (WorkEntryService.updateWorkEntry as jest.Mock).mockRejectedValue(
        new Error('Work entry not found')
      );

      const response = await request(app)
        .put('/api/work-entries/nonexistent')
        .send({ description: 'Updated description here' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 when modifying another employee entry', async () => {
      (WorkEntryService.updateWorkEntry as jest.Mock).mockRejectedValue(
        new Error("Unauthorized: Cannot modify another employee's work entry")
      );

      const response = await request(app)
        .put('/api/work-entries/entry-1')
        .send({ description: 'Updated description here' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 when entry is outside 7-day window', async () => {
      (WorkEntryService.updateWorkEntry as jest.Mock).mockRejectedValue(
        new Error('Work entry cannot be modified after 7 days')
      );

      const response = await request(app)
        .put('/api/work-entries/entry-1')
        .send({ description: 'Updated description here' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ─── DELETE /api/work-entries/:id ─────────────────────────────────────────

  describe('DELETE /api/work-entries/:id', () => {
    it('should return 204 on successful deletion', async () => {
      (WorkEntryService.deleteWorkEntry as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/work-entries/entry-1');

      expect(response.status).toBe(204);
      expect(WorkEntryService.deleteWorkEntry).toHaveBeenCalledWith('entry-1', 'employee-1');
    });

    it('should return 404 when entry is not found', async () => {
      (WorkEntryService.deleteWorkEntry as jest.Mock).mockRejectedValue(
        new Error('Work entry not found')
      );

      const response = await request(app).delete('/api/work-entries/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 when deleting another employee entry', async () => {
      (WorkEntryService.deleteWorkEntry as jest.Mock).mockRejectedValue(
        new Error("Unauthorized: Cannot modify another employee's work entry")
      );

      const response = await request(app).delete('/api/work-entries/entry-1');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 when entry is outside 7-day window', async () => {
      (WorkEntryService.deleteWorkEntry as jest.Mock).mockRejectedValue(
        new Error('Work entry cannot be modified after 7 days')
      );

      const response = await request(app).delete('/api/work-entries/entry-1');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
