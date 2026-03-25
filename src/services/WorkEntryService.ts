import * as WorkEntryModel from '../models/WorkEntry';
import { WorkEntry, WorkEntryInput } from '../models/WorkEntry';
import { validateWorkEntryInput } from '../utils/validation';

/**
 * Search query interface for work entry searches
 * Requirements: 6.4
 */
export interface SearchQuery {
  keyword: string;
  employeeId?: string;
}

/**
 * Check if a work entry is within the 7-day modification window.
 * Entries older than 7 days cannot be modified.
 * Requirements: 9.3
 *
 * @param entry - The work entry to check
 * @returns true if the entry can still be modified, false otherwise
 */
export function isWithinModificationWindow(entry: WorkEntry): boolean {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return entry.createdAt >= sevenDaysAgo;
}

/**
 * Verify that the requesting user owns the work entry.
 * Requirements: 9.4
 *
 * @param entry - The work entry to check
 * @param requestingUserId - The ID of the user requesting the modification
 * @returns true if the user owns the entry, false otherwise
 */
export function verifyEntryOwnership(entry: WorkEntry, requestingUserId: string): boolean {
  return entry.employeeId === requestingUserId;
}

/**
 * Create a new work entry after validating input.
 * Requirements: 1.1, 1.2, 1.3
 *
 * @param entry - Input data for the new work entry
 * @returns The created work entry
 * @throws Error if validation fails
 */
export async function createWorkEntry(entry: WorkEntryInput): Promise<WorkEntry> {
  const inputRecord: Record<string, unknown> = {
    employeeId: entry.employeeId,
    description: entry.description,
    status: entry.status,
    date: entry.date || new Date(),
    category: entry.category,
    duration: entry.duration,
  };

  const validation = validateWorkEntryInput(inputRecord);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  return WorkEntryModel.create(entry);
}

/**
 * Update an existing work entry with authorization checks.
 * Requirements: 9.1, 9.2, 9.3, 9.4
 *
 * @param entryId - ID of the entry to update
 * @param updates - Partial update data
 * @param requestingUserId - ID of the user requesting the update
 * @returns The updated work entry
 * @throws Error if entry not found, unauthorized, or outside modification window
 */
export async function updateWorkEntry(
  entryId: string,
  updates: Partial<WorkEntryInput>,
  requestingUserId: string
): Promise<WorkEntry> {
  const entry = await WorkEntryModel.findById(entryId);
  if (!entry) {
    throw new Error('Work entry not found');
  }

  if (!verifyEntryOwnership(entry, requestingUserId)) {
    throw new Error("Unauthorized: Cannot modify another employee's work entry");
  }

  if (!isWithinModificationWindow(entry)) {
    throw new Error('Work entry cannot be modified after 7 days');
  }

  // Validate any updated fields
  if (updates.description !== undefined) {
    const { validateDescription } = await import('../utils/validation');
    const result = validateDescription(updates.description);
    if (!result.valid) {
      throw new Error(result.error!);
    }
  }

  if (updates.status !== undefined) {
    const { validateStatus } = await import('../utils/validation');
    const result = validateStatus(updates.status);
    if (!result.valid) {
      throw new Error(result.error!);
    }
  }

  if (updates.duration !== undefined) {
    const { validateDuration } = await import('../utils/validation');
    const result = validateDuration(updates.duration);
    if (!result.valid) {
      throw new Error(result.error!);
    }
  }

  // modifiedAt is set by the model's update function (CURRENT_TIMESTAMP)
  const updated = await WorkEntryModel.update(entryId, {
    description: updates.description,
    status: updates.status,
    category: updates.category,
    startTime: updates.startTime,
    endTime: updates.endTime,
    duration: updates.duration,
  });

  if (!updated) {
    throw new Error('Work entry not found');
  }

  return updated;
}

/**
 * Get all work entries for an employee on a specific date.
 * Requirements: 8.2
 *
 * @param employeeId - The employee's ID
 * @param date - The date to query
 * @returns Array of work entries for that date
 */
export async function getWorkEntriesByDate(
  employeeId: string,
  date: Date
): Promise<WorkEntry[]> {
  return WorkEntryModel.findByEmployeeAndDate(employeeId, date);
}

/**
 * Get all work entries for an employee within a date range.
 * Requirements: 5.4, 8.3
 *
 * @param employeeId - The employee's ID
 * @param startDate - Start of the date range (inclusive)
 * @param endDate - End of the date range (inclusive)
 * @returns Array of work entries within the date range
 */
export async function getWorkEntriesByDateRange(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<WorkEntry[]> {
  return WorkEntryModel.findByEmployeeAndDateRange(employeeId, startDate, endDate);
}

/**
 * Delete a work entry with authorization checks.
 * Requirements: 9.1, 9.3, 9.4
 *
 * @param entryId - ID of the entry to delete
 * @param requestingUserId - ID of the user requesting the deletion
 * @throws Error if entry not found, unauthorized, or outside modification window
 */
export async function deleteWorkEntry(
  entryId: string,
  requestingUserId: string
): Promise<void> {
  const entry = await WorkEntryModel.findById(entryId);
  if (!entry) {
    throw new Error('Work entry not found');
  }

  if (!verifyEntryOwnership(entry, requestingUserId)) {
    throw new Error("Unauthorized: Cannot modify another employee's work entry");
  }

  if (!isWithinModificationWindow(entry)) {
    throw new Error('Work entry cannot be modified after 7 days');
  }

  await WorkEntryModel.deleteById(entryId);
}

/**
 * Search work entries by keyword in description.
 * Requirements: 6.4
 *
 * @param query - Search query with keyword and optional employeeId filter
 * @returns Array of matching work entries
 */
export async function searchWorkEntries(query: SearchQuery): Promise<WorkEntry[]> {
  const keyword = `%${query.keyword}%`;
  return WorkEntryModel.searchByKeyword(keyword, query.employeeId);
}
