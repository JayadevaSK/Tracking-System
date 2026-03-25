import {
  getCompletionPercentage,
  getDailySummary,
  getTeamOverview,
  getWorkMetrics,
} from './DashboardService';
import { CompletionStatus } from '../models/WorkEntry';

jest.mock('../utils/db', () => ({
  db: {
    initialize: jest.fn(),
    query: jest.fn(),
  },
}));

import { db } from '../utils/db';
const mockQuery = db.query as jest.Mock;

const makeEntry = (overrides: Partial<any> = {}) => ({
  id: 'entry-1',
  employeeId: 'emp-1',
  description: 'Worked on feature X',
  status: CompletionStatus.COMPLETED,
  date: new Date('2024-01-15'),
  duration: 60,
  isAutoTracked: false,
  createdAt: new Date('2024-01-15T09:00:00Z'),
  updatedAt: new Date('2024-01-15T09:00:00Z'),
  ...overrides,
});

describe('getCompletionPercentage', () => {
  it('returns 0 when total is 0', () => {
    expect(getCompletionPercentage(0, 0)).toBe(0);
  });

  it('returns 100 when all items are completed', () => {
    expect(getCompletionPercentage(5, 5)).toBe(100);
  });

  it('returns 50 for half completed', () => {
    expect(getCompletionPercentage(1, 2)).toBe(50);
  });

  it('rounds to nearest integer', () => {
    expect(getCompletionPercentage(1, 3)).toBe(33);
  });
});

describe('getDailySummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns summary with correct counts for mixed statuses', async () => {
    const entries = [
      makeEntry({ id: '1', status: CompletionStatus.COMPLETED }),
      makeEntry({ id: '2', status: CompletionStatus.IN_PROGRESS }),
      makeEntry({ id: '3', status: CompletionStatus.NOT_STARTED }),
      makeEntry({ id: '4', status: CompletionStatus.COMPLETED }),
    ];
    mockQuery.mockResolvedValue({ rows: entries });

    const summary = await getDailySummary('emp-1', new Date('2024-01-15'));

    expect(summary.totalItems).toBe(4);
    expect(summary.completedItems).toBe(2);
    expect(summary.inProgressItems).toBe(1);
    expect(summary.notStartedItems).toBe(1);
    expect(summary.completionPercentage).toBe(50);
  });

  it('returns zero counts when no entries exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const summary = await getDailySummary('emp-1', new Date('2024-01-15'));

    expect(summary.totalItems).toBe(0);
    expect(summary.completionPercentage).toBe(0);
    expect(summary.totalDuration).toBe(0);
    expect(summary.entries).toHaveLength(0);
  });

  it('sums duration correctly', async () => {
    const entries = [
      makeEntry({ id: '1', duration: 30 }),
      makeEntry({ id: '2', duration: 90 }),
      makeEntry({ id: '3', duration: undefined }),
    ];
    mockQuery.mockResolvedValue({ rows: entries });

    const summary = await getDailySummary('emp-1', new Date('2024-01-15'));

    expect(summary.totalDuration).toBe(120);
  });

  it('includes entries in the result', async () => {
    const entries = [makeEntry()];
    mockQuery.mockResolvedValue({ rows: entries });

    const summary = await getDailySummary('emp-1', new Date('2024-01-15'));

    expect(summary.entries).toHaveLength(1);
    expect(summary.entries[0].id).toBe('entry-1');
  });
});

describe('getTeamOverview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns overview with one employee', async () => {
    // First call: fetch employees; subsequent calls: getDailySummary per employee
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'emp-1', name: 'Alice' }] })
      .mockResolvedValueOnce({ rows: [makeEntry({ status: CompletionStatus.COMPLETED })] });

    const overview = await getTeamOverview('mgr-1', new Date('2024-01-15'));

    expect(overview.managerId).toBe('mgr-1');
    expect(overview.employees).toHaveLength(1);
    expect(overview.employees[0].employeeName).toBe('Alice');
    expect(overview.employees[0].completedItems).toBe(1);
  });

  it('returns empty employees array when manager has no reports', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const overview = await getTeamOverview('mgr-1', new Date('2024-01-15'));

    expect(overview.employees).toHaveLength(0);
  });
});

describe('getWorkMetrics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns correct metrics for a date range', async () => {
    const entries = [
      makeEntry({ id: '1', date: new Date('2024-01-01'), status: CompletionStatus.COMPLETED, duration: 60 }),
      makeEntry({ id: '2', date: new Date('2024-01-01'), status: CompletionStatus.IN_PROGRESS, duration: 30 }),
      makeEntry({ id: '3', date: new Date('2024-01-02'), status: CompletionStatus.COMPLETED, duration: 45 }),
    ];
    mockQuery.mockResolvedValue({ rows: entries });

    const metrics = await getWorkMetrics(
      'emp-1',
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );

    expect(metrics.totalItems).toBe(3);
    expect(metrics.completedItems).toBe(2);
    expect(metrics.completionPercentage).toBe(67);
    expect(metrics.totalDuration).toBe(135);
  });

  it('groups entries into daily breakdown', async () => {
    const entries = [
      makeEntry({ id: '1', date: new Date('2024-01-01'), status: CompletionStatus.COMPLETED }),
      makeEntry({ id: '2', date: new Date('2024-01-02'), status: CompletionStatus.IN_PROGRESS }),
    ];
    mockQuery.mockResolvedValue({ rows: entries });

    const metrics = await getWorkMetrics(
      'emp-1',
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );

    expect(metrics.dailyBreakdown).toHaveLength(2);
  });

  it('returns zero metrics when no entries exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const metrics = await getWorkMetrics(
      'emp-1',
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );

    expect(metrics.totalItems).toBe(0);
    expect(metrics.completionPercentage).toBe(0);
    expect(metrics.dailyBreakdown).toHaveLength(0);
  });
});
