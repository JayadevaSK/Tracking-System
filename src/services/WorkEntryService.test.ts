import * as WorkEntryService from './WorkEntryService';
import * as WorkEntryModel from '../models/WorkEntry';
import { CompletionStatus, WorkEntry } from '../models/WorkEntry';

// Mock the WorkEntry model
jest.mock('../models/WorkEntry');

// Mock the validation utils
jest.mock('../utils/validation', () => ({
  validateWorkEntryInput: jest.fn(),
  validateDescription: jest.fn(),
  validateStatus: jest.fn(),
  validateDuration: jest.fn(),
}));

import * as validation from '../utils/validation';

// ─── Helpers ────────────────────────────────────────────────────────────────

const EMPLOYEE_ID = 'employee-uuid-1';
const OTHER_EMPLOYEE_ID = 'employee-uuid-2';
const ENTRY_ID = 'entry-uuid-1';

function makeEntry(overrides: Partial<WorkEntry> = {}): WorkEntry {
  return {
    id: ENTRY_ID,
    employeeId: EMPLOYEE_ID,
    description: 'Worked on feature X implementation',
    status: CompletionStatus.COMPLETED,
    date: new Date('2024-01-15'),
    isAutoTracked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeOldEntry(): WorkEntry {
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  return makeEntry({ createdAt: eightDaysAgo });
}

// ─── isWithinModificationWindow ─────────────────────────────────────────────

describe('isWithinModificationWindow', () => {
  it('returns true for a freshly created entry', () => {
    const entry = makeEntry({ createdAt: new Date() });
    expect(WorkEntryService.isWithinModificationWindow(entry)).toBe(true);
  });

  it('returns true for an entry created 6 days ago', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const entry = makeEntry({ createdAt: sixDaysAgo });
    expect(WorkEntryService.isWithinModificationWindow(entry)).toBe(true);
  });

  it('returns false for an entry created 8 days ago', () => {
    const entry = makeOldEntry();
    expect(WorkEntryService.isWithinModificationWindow(entry)).toBe(false);
  });

  it('returns false for an entry created exactly 7 days and 1 second ago', () => {
    const justOver7Days = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000 + 1000));
    const entry = makeEntry({ createdAt: justOver7Days });
    expect(WorkEntryService.isWithinModificationWindow(entry)).toBe(false);
  });
});

// ─── verifyEntryOwnership ────────────────────────────────────────────────────

describe('verifyEntryOwnership', () => {
  it('returns true when the requesting user owns the entry', () => {
    const entry = makeEntry({ employeeId: EMPLOYEE_ID });
    expect(WorkEntryService.verifyEntryOwnership(entry, EMPLOYEE_ID)).toBe(true);
  });

  it('returns false when the requesting user does not own the entry', () => {
    const entry = makeEntry({ employeeId: EMPLOYEE_ID });
    expect(WorkEntryService.verifyEntryOwnership(entry, OTHER_EMPLOYEE_ID)).toBe(false);
  });
});

// ─── createWorkEntry ─────────────────────────────────────────────────────────

describe('createWorkEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a work entry when validation passes', async () => {
    const input = {
      employeeId: EMPLOYEE_ID,
      description: 'Worked on feature X implementation',
      status: CompletionStatus.COMPLETED,
    };
    const created = makeEntry();

    (validation.validateWorkEntryInput as jest.Mock).mockReturnValue({ valid: true, errors: [] });
    (WorkEntryModel.create as jest.Mock).mockResolvedValue(created);

    const result = await WorkEntryService.createWorkEntry(input);

    expect(validation.validateWorkEntryInput).toHaveBeenCalled();
    expect(WorkEntryModel.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });

  it('throws when validation fails', async () => {
    const input = {
      employeeId: EMPLOYEE_ID,
      description: 'short',
      status: CompletionStatus.COMPLETED,
    };

    (validation.validateWorkEntryInput as jest.Mock).mockReturnValue({
      valid: false,
      errors: ['Description must be at least 10 characters (got 5)'],
    });

    await expect(WorkEntryService.createWorkEntry(input)).rejects.toThrow(
      'Description must be at least 10 characters (got 5)'
    );
    expect(WorkEntryModel.create).not.toHaveBeenCalled();
  });

  it('throws when multiple validation errors occur', async () => {
    const input = {
      employeeId: EMPLOYEE_ID,
      description: 'short',
      status: 'invalid-status' as CompletionStatus,
    };

    (validation.validateWorkEntryInput as jest.Mock).mockReturnValue({
      valid: false,
      errors: ['Description must be at least 10 characters (got 5)', 'Status must be one of: completed, in-progress, not-started'],
    });

    await expect(WorkEntryService.createWorkEntry(input)).rejects.toThrow();
    expect(WorkEntryModel.create).not.toHaveBeenCalled();
  });
});

// ─── updateWorkEntry ─────────────────────────────────────────────────────────

describe('updateWorkEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: validation passes
    (validation.validateDescription as jest.Mock).mockReturnValue({ valid: true });
    (validation.validateStatus as jest.Mock).mockReturnValue({ valid: true });
    (validation.validateDuration as jest.Mock).mockReturnValue({ valid: true });
  });

  it('updates a work entry when authorized and within window', async () => {
    const entry = makeEntry();
    const updated = makeEntry({ description: 'Updated description here' });

    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(entry);
    (WorkEntryModel.update as jest.Mock).mockResolvedValue(updated);

    const result = await WorkEntryService.updateWorkEntry(
      ENTRY_ID,
      { description: 'Updated description here' },
      EMPLOYEE_ID
    );

    expect(WorkEntryModel.findById).toHaveBeenCalledWith(ENTRY_ID);
    expect(WorkEntryModel.update).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it('throws "Work entry not found" when entry does not exist', async () => {
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      WorkEntryService.updateWorkEntry(ENTRY_ID, { description: 'Updated description here' }, EMPLOYEE_ID)
    ).rejects.toThrow('Work entry not found');
  });

  it('throws authorization error when user does not own the entry', async () => {
    const entry = makeEntry({ employeeId: EMPLOYEE_ID });
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(entry);

    await expect(
      WorkEntryService.updateWorkEntry(ENTRY_ID, { description: 'Updated description here' }, OTHER_EMPLOYEE_ID)
    ).rejects.toThrow("Unauthorized: Cannot modify another employee's work entry");

    expect(WorkEntryModel.update).not.toHaveBeenCalled();
  });

  it('throws time window error when entry is older than 7 days', async () => {
    const oldEntry = makeOldEntry();
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(oldEntry);

    await expect(
      WorkEntryService.updateWorkEntry(ENTRY_ID, { description: 'Updated description here' }, EMPLOYEE_ID)
    ).rejects.toThrow('Work entry cannot be modified after 7 days');

    expect(WorkEntryModel.update).not.toHaveBeenCalled();
  });

  it('records modification timestamp on update (modifiedAt set by model)', async () => {
    const entry = makeEntry();
    const now = new Date();
    const updated = makeEntry({ modifiedAt: now });

    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(entry);
    (WorkEntryModel.update as jest.Mock).mockResolvedValue(updated);

    const result = await WorkEntryService.updateWorkEntry(
      ENTRY_ID,
      { status: CompletionStatus.IN_PROGRESS },
      EMPLOYEE_ID
    );

    expect(result.modifiedAt).toBeDefined();
    expect(WorkEntryModel.update).toHaveBeenCalledWith(ENTRY_ID, expect.objectContaining({
      status: CompletionStatus.IN_PROGRESS,
    }));
  });

  it('throws when update returns null (entry disappeared)', async () => {
    const entry = makeEntry();
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(entry);
    (WorkEntryModel.update as jest.Mock).mockResolvedValue(null);

    await expect(
      WorkEntryService.updateWorkEntry(ENTRY_ID, { description: 'Updated description here' }, EMPLOYEE_ID)
    ).rejects.toThrow('Work entry not found');
  });
});

// ─── getWorkEntriesByDate ────────────────────────────────────────────────────

describe('getWorkEntriesByDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns entries for the given employee and date', async () => {
    const entries = [makeEntry(), makeEntry({ id: 'entry-uuid-2' })];
    (WorkEntryModel.findByEmployeeAndDate as jest.Mock).mockResolvedValue(entries);

    const date = new Date('2024-01-15');
    const result = await WorkEntryService.getWorkEntriesByDate(EMPLOYEE_ID, date);

    expect(WorkEntryModel.findByEmployeeAndDate).toHaveBeenCalledWith(EMPLOYEE_ID, date);
    expect(result).toEqual(entries);
  });

  it('returns empty array when no entries exist for the date', async () => {
    (WorkEntryModel.findByEmployeeAndDate as jest.Mock).mockResolvedValue([]);

    const result = await WorkEntryService.getWorkEntriesByDate(EMPLOYEE_ID, new Date());
    expect(result).toEqual([]);
  });
});

// ─── getWorkEntriesByDateRange ───────────────────────────────────────────────

describe('getWorkEntriesByDateRange', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns entries within the date range', async () => {
    const entries = [makeEntry()];
    (WorkEntryModel.findByEmployeeAndDateRange as jest.Mock).mockResolvedValue(entries);

    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');
    const result = await WorkEntryService.getWorkEntriesByDateRange(EMPLOYEE_ID, start, end);

    expect(WorkEntryModel.findByEmployeeAndDateRange).toHaveBeenCalledWith(EMPLOYEE_ID, start, end);
    expect(result).toEqual(entries);
  });

  it('returns empty array when no entries exist in range', async () => {
    (WorkEntryModel.findByEmployeeAndDateRange as jest.Mock).mockResolvedValue([]);

    const result = await WorkEntryService.getWorkEntriesByDateRange(
      EMPLOYEE_ID,
      new Date('2020-01-01'),
      new Date('2020-01-31')
    );
    expect(result).toEqual([]);
  });
});

// ─── deleteWorkEntry ─────────────────────────────────────────────────────────

describe('deleteWorkEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a work entry when authorized and within window', async () => {
    const entry = makeEntry();
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(entry);
    (WorkEntryModel.deleteById as jest.Mock).mockResolvedValue(true);

    await expect(
      WorkEntryService.deleteWorkEntry(ENTRY_ID, EMPLOYEE_ID)
    ).resolves.toBeUndefined();

    expect(WorkEntryModel.deleteById).toHaveBeenCalledWith(ENTRY_ID);
  });

  it('throws "Work entry not found" when entry does not exist', async () => {
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      WorkEntryService.deleteWorkEntry(ENTRY_ID, EMPLOYEE_ID)
    ).rejects.toThrow('Work entry not found');
  });

  it('throws authorization error when user does not own the entry', async () => {
    const entry = makeEntry({ employeeId: EMPLOYEE_ID });
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(entry);

    await expect(
      WorkEntryService.deleteWorkEntry(ENTRY_ID, OTHER_EMPLOYEE_ID)
    ).rejects.toThrow("Unauthorized: Cannot modify another employee's work entry");

    expect(WorkEntryModel.deleteById).not.toHaveBeenCalled();
  });

  it('throws time window error when entry is older than 7 days', async () => {
    const oldEntry = makeOldEntry();
    (WorkEntryModel.findById as jest.Mock).mockResolvedValue(oldEntry);

    await expect(
      WorkEntryService.deleteWorkEntry(ENTRY_ID, EMPLOYEE_ID)
    ).rejects.toThrow('Work entry cannot be modified after 7 days');

    expect(WorkEntryModel.deleteById).not.toHaveBeenCalled();
  });
});

// ─── searchWorkEntries ───────────────────────────────────────────────────────

describe('searchWorkEntries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searches entries by keyword', async () => {
    const entries = [makeEntry()];
    (WorkEntryModel.searchByKeyword as jest.Mock).mockResolvedValue(entries);

    const result = await WorkEntryService.searchWorkEntries({ keyword: 'feature' });

    expect(WorkEntryModel.searchByKeyword).toHaveBeenCalledWith('%feature%', undefined);
    expect(result).toEqual(entries);
  });

  it('searches entries by keyword filtered by employeeId', async () => {
    const entries = [makeEntry()];
    (WorkEntryModel.searchByKeyword as jest.Mock).mockResolvedValue(entries);

    const result = await WorkEntryService.searchWorkEntries({
      keyword: 'feature',
      employeeId: EMPLOYEE_ID,
    });

    expect(WorkEntryModel.searchByKeyword).toHaveBeenCalledWith('%feature%', EMPLOYEE_ID);
    expect(result).toEqual(entries);
  });

  it('returns empty array when no entries match', async () => {
    (WorkEntryModel.searchByKeyword as jest.Mock).mockResolvedValue([]);

    const result = await WorkEntryService.searchWorkEntries({ keyword: 'nonexistent' });
    expect(result).toEqual([]);
  });
});
