import {
  CompletionStatus,
  WorkEntry,
  WorkEntryInput,
  UpdateWorkEntryInput,
  create,
  findById,
  update,
  deleteById,
  findByEmployeeAndDate,
  findByEmployeeAndDateRange,
  searchByKeyword,
} from './WorkEntry';

// Mock the db module so tests don't need a real database
jest.mock('../utils/db', () => ({
  db: {
    initialize: jest.fn(),
    query: jest.fn(),
    close: jest.fn(),
  },
}));

import { db } from '../utils/db';
const mockDb = db as jest.Mocked<typeof db>;

const mockEntry: WorkEntry = {
  id: 'entry-uuid-1234',
  employeeId: 'employee-uuid-5678',
  description: 'Worked on the authentication module implementation',
  status: CompletionStatus.COMPLETED,
  category: 'development',
  startTime: new Date('2024-01-15T09:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  duration: 120,
  date: new Date('2024-01-15'),
  isAutoTracked: false,
  createdAt: new Date('2024-01-15T11:00:00Z'),
  updatedAt: new Date('2024-01-15T11:00:00Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('create', () => {
  it('should create a work entry with all required fields', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockEntry], rowCount: 1 } as any);

    const input: WorkEntryInput = {
      employeeId: 'employee-uuid-5678',
      description: 'Worked on the authentication module implementation',
      status: CompletionStatus.COMPLETED,
      date: new Date('2024-01-15'),
    };

    const entry = await create(input);

    expect(entry).toBeDefined();
    expect(entry.employeeId).toBe(input.employeeId);
    expect(entry.description).toBe(input.description);
    expect(entry.status).toBe(CompletionStatus.COMPLETED);
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });

  it('should create a work entry with optional fields', async () => {
    const entryWithOptionals: WorkEntry = {
      ...mockEntry,
      category: 'development',
      duration: 120,
    };
    mockDb.query.mockResolvedValueOnce({ rows: [entryWithOptionals], rowCount: 1 } as any);

    const input: WorkEntryInput = {
      employeeId: 'employee-uuid-5678',
      description: 'Worked on the authentication module implementation',
      status: CompletionStatus.IN_PROGRESS,
      category: 'development',
      duration: 120,
      date: new Date('2024-01-15'),
    };

    const entry = await create(input);

    expect(entry.category).toBe('development');
    expect(entry.duration).toBe(120);
  });

  it('should create an auto-tracked work entry', async () => {
    const autoEntry: WorkEntry = { ...mockEntry, isAutoTracked: true };
    mockDb.query.mockResolvedValueOnce({ rows: [autoEntry], rowCount: 1 } as any);

    const input: WorkEntryInput = {
      employeeId: 'employee-uuid-5678',
      description: 'Automatically tracked coding activity',
      status: CompletionStatus.COMPLETED,
      isAutoTracked: true,
    };

    const entry = await create(input);

    expect(entry.isAutoTracked).toBe(true);
  });

  it('should default isAutoTracked to false when not provided', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockEntry], rowCount: 1 } as any);

    const input: WorkEntryInput = {
      employeeId: 'employee-uuid-5678',
      description: 'Manual work entry for testing purposes',
      status: CompletionStatus.NOT_STARTED,
    };

    await create(input);

    const callArgs = mockDb.query.mock.calls[0];
    // isAutoTracked is the 9th parameter (index 8)
    expect(callArgs[1]![8]).toBe(false);
  });
});

describe('findById', () => {
  it('should find a work entry by ID', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockEntry], rowCount: 1 } as any);

    const entry = await findById('entry-uuid-1234');

    expect(entry).toBeDefined();
    expect(entry?.id).toBe('entry-uuid-1234');
    expect(entry?.description).toBe(mockEntry.description);
  });

  it('should return null for non-existent ID', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const entry = await findById('00000000-0000-0000-0000-000000000000');

    expect(entry).toBeNull();
  });
});

describe('update', () => {
  it('should update description and status', async () => {
    const updated: WorkEntry = {
      ...mockEntry,
      description: 'Updated description for the authentication module work',
      status: CompletionStatus.IN_PROGRESS,
      modifiedAt: new Date(),
    };
    mockDb.query.mockResolvedValueOnce({ rows: [updated], rowCount: 1 } as any);

    const updates: UpdateWorkEntryInput = {
      description: 'Updated description for the authentication module work',
      status: CompletionStatus.IN_PROGRESS,
    };

    const result = await update('entry-uuid-1234', updates);

    expect(result?.description).toBe(updates.description);
    expect(result?.status).toBe(CompletionStatus.IN_PROGRESS);
    expect(result?.modifiedAt).toBeDefined();
  });

  it('should update duration', async () => {
    const updated: WorkEntry = { ...mockEntry, duration: 90 };
    mockDb.query.mockResolvedValueOnce({ rows: [updated], rowCount: 1 } as any);

    const result = await update('entry-uuid-1234', { duration: 90 });

    expect(result?.duration).toBe(90);
  });

  it('should return null for non-existent entry', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await update('00000000-0000-0000-0000-000000000000', {
      status: CompletionStatus.COMPLETED,
    });

    expect(result).toBeNull();
  });

  it('should call findById when no updates provided', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockEntry], rowCount: 1 } as any);

    const result = await update('entry-uuid-1234', {});

    expect(result).toBeDefined();
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });
});

describe('deleteById', () => {
  it('should delete an existing work entry and return true', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const deleted = await deleteById('entry-uuid-1234');

    expect(deleted).toBe(true);
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });

  it('should return false when entry does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const deleted = await deleteById('00000000-0000-0000-0000-000000000000');

    expect(deleted).toBe(false);
  });
});

describe('findByEmployeeAndDate', () => {
  it('should return work entries for an employee on a specific date', async () => {
    const entries = [mockEntry, { ...mockEntry, id: 'entry-uuid-5678' }];
    mockDb.query.mockResolvedValueOnce({ rows: entries, rowCount: 2 } as any);

    const result = await findByEmployeeAndDate('employee-uuid-5678', new Date('2024-01-15'));

    expect(result).toHaveLength(2);
    expect(result[0].employeeId).toBe('employee-uuid-5678');
  });

  it('should return empty array when no entries exist for the date', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await findByEmployeeAndDate('employee-uuid-5678', new Date('2024-01-20'));

    expect(result).toEqual([]);
  });

  it('should pass correct parameters to query', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const date = new Date('2024-01-15');
    await findByEmployeeAndDate('employee-uuid-5678', date);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE employee_id = $1'),
      ['employee-uuid-5678', date]
    );
  });
});

describe('findByEmployeeAndDateRange', () => {
  it('should return entries within the date range', async () => {
    const entries = [
      { ...mockEntry, date: new Date('2024-01-10') },
      { ...mockEntry, id: 'entry-2', date: new Date('2024-01-12') },
      { ...mockEntry, id: 'entry-3', date: new Date('2024-01-15') },
    ];
    mockDb.query.mockResolvedValueOnce({ rows: entries, rowCount: 3 } as any);

    const result = await findByEmployeeAndDateRange(
      'employee-uuid-5678',
      new Date('2024-01-10'),
      new Date('2024-01-15')
    );

    expect(result).toHaveLength(3);
  });

  it('should return empty array when no entries in range', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await findByEmployeeAndDateRange(
      'employee-uuid-5678',
      new Date('2024-02-01'),
      new Date('2024-02-28')
    );

    expect(result).toEqual([]);
  });

  it('should pass start and end dates to query', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    await findByEmployeeAndDateRange('employee-uuid-5678', startDate, endDate);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('date >= $2::date'),
      ['employee-uuid-5678', startDate, endDate]
    );
  });
});

describe('searchByKeyword', () => {
  it('should return entries matching the keyword', async () => {
    const entries = [mockEntry];
    mockDb.query.mockResolvedValueOnce({ rows: entries, rowCount: 1 } as any);

    const result = await searchByKeyword('%authentication%');

    expect(result).toHaveLength(1);
    expect(result[0].description).toContain('authentication');
  });

  it('should filter by employeeId when provided', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await searchByKeyword('%authentication%', 'employee-uuid-5678');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('employee_id'),
      ['%authentication%', 'employee-uuid-5678']
    );
  });

  it('should search without employee filter when employeeId not provided', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await searchByKeyword('%testing%');

    const callArgs = mockDb.query.mock.calls[0];
    expect(callArgs[1]).toEqual(['%testing%']);
  });

  it('should return empty array when no matches found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await searchByKeyword('%nonexistent_keyword_xyz%');

    expect(result).toEqual([]);
  });
});

describe('CompletionStatus enum', () => {
  it('should have the correct values', () => {
    expect(CompletionStatus.COMPLETED).toBe('completed');
    expect(CompletionStatus.IN_PROGRESS).toBe('in-progress');
    expect(CompletionStatus.NOT_STARTED).toBe('not-started');
  });
});
