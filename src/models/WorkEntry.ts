import { db } from '../utils/db';

/**
 * Completion status enumeration for work entries
 * Requirements: 1.5
 */
export enum CompletionStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress',
  NOT_STARTED = 'not-started',
}

/**
 * WorkEntry interface representing a single work activity record
 * Requirements: 1.2, 1.3, 8.1
 */
export interface WorkEntry {
  id: string;
  employeeId: string;
  description: string;
  status: CompletionStatus;
  category?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  date: Date;
  isAutoTracked: boolean;
  createdAt: Date;
  updatedAt: Date;
  modifiedAt?: Date;
}

/**
 * Input data for creating a new work entry
 * Requirements: 1.2, 1.4, 1.5
 */
export interface WorkEntryInput {
  employeeId: string;
  description: string;
  status: CompletionStatus;
  category?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  date?: Date;
  isAutoTracked?: boolean;
}

/**
 * Input data for updating an existing work entry
 */
export interface UpdateWorkEntryInput {
  description?: string;
  status?: CompletionStatus;
  category?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * Create a new work entry
 * Requirements: 1.2, 1.3, 8.1
 */
export async function create(input: WorkEntryInput): Promise<WorkEntry> {
  const query = `
    INSERT INTO work_entries (
      employee_id,
      description,
      status,
      category,
      start_time,
      end_time,
      duration,
      date,
      is_auto_tracked
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING
      id,
      employee_id as "employeeId",
      description,
      status,
      category,
      start_time as "startTime",
      end_time as "endTime",
      duration,
      date,
      is_auto_tracked as "isAutoTracked",
      created_at as "createdAt",
      updated_at as "updatedAt",
      modified_at as "modifiedAt"
  `;

  const values = [
    input.employeeId,
    input.description,
    input.status,
    input.category || null,
    input.startTime || null,
    input.endTime || null,
    input.duration || null,
    input.date || new Date(),
    input.isAutoTracked || false,
  ];

  const result = await db.query<WorkEntry>(query, values);
  return result.rows[0];
}

/**
 * Find a work entry by ID
 * Requirements: 8.1, 8.2
 */
export async function findById(id: string): Promise<WorkEntry | null> {
  const query = `
    SELECT
      id,
      employee_id as "employeeId",
      description,
      status,
      category,
      start_time as "startTime",
      end_time as "endTime",
      duration,
      date,
      is_auto_tracked as "isAutoTracked",
      created_at as "createdAt",
      updated_at as "updatedAt",
      modified_at as "modifiedAt"
    FROM work_entries
    WHERE id = $1
  `;

  const result = await db.query<WorkEntry>(query, [id]);
  return result.rows[0] || null;
}

/**
 * Update an existing work entry
 * Requirements: 9.1, 9.2
 */
export async function update(
  id: string,
  updates: UpdateWorkEntryInput
): Promise<WorkEntry | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }

  if (updates.status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(updates.status);
  }

  if (updates.category !== undefined) {
    fields.push(`category = $${paramCount++}`);
    values.push(updates.category);
  }

  if (updates.startTime !== undefined) {
    fields.push(`start_time = $${paramCount++}`);
    values.push(updates.startTime);
  }

  if (updates.endTime !== undefined) {
    fields.push(`end_time = $${paramCount++}`);
    values.push(updates.endTime);
  }

  if (updates.duration !== undefined) {
    fields.push(`duration = $${paramCount++}`);
    values.push(updates.duration);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  // Always update timestamps on modification
  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  fields.push(`modified_at = CURRENT_TIMESTAMP`);

  values.push(id);

  const query = `
    UPDATE work_entries
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id,
      employee_id as "employeeId",
      description,
      status,
      category,
      start_time as "startTime",
      end_time as "endTime",
      duration,
      date,
      is_auto_tracked as "isAutoTracked",
      created_at as "createdAt",
      updated_at as "updatedAt",
      modified_at as "modifiedAt"
  `;

  const result = await db.query<WorkEntry>(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a work entry by ID
 * Requirements: 9.1
 */
export async function deleteById(id: string): Promise<boolean> {
  const query = `DELETE FROM work_entries WHERE id = $1`;
  const result = await db.query(query, [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Find all work entries for an employee on a specific date
 * Requirements: 3.1, 8.2
 */
export async function findByEmployeeAndDate(
  employeeId: string,
  date: Date
): Promise<WorkEntry[]> {
  const query = `
    SELECT
      id,
      employee_id as "employeeId",
      description,
      status,
      category,
      start_time as "startTime",
      end_time as "endTime",
      duration,
      date,
      is_auto_tracked as "isAutoTracked",
      created_at as "createdAt",
      updated_at as "updatedAt",
      modified_at as "modifiedAt"
    FROM work_entries
    WHERE employee_id = $1
      AND date = $2::date
    ORDER BY created_at ASC
  `;

  const result = await db.query<WorkEntry>(query, [employeeId, date]);
  return result.rows;
}

/**
 * Find all work entries for an employee within a date range
 * Requirements: 5.4, 8.3
 */
export async function findByEmployeeAndDateRange(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<WorkEntry[]> {
  const query = `
    SELECT
      id,
      employee_id as "employeeId",
      description,
      status,
      category,
      start_time as "startTime",
      end_time as "endTime",
      duration,
      date,
      is_auto_tracked as "isAutoTracked",
      created_at as "createdAt",
      updated_at as "updatedAt",
      modified_at as "modifiedAt"
    FROM work_entries
    WHERE employee_id = $1
      AND date >= $2::date
      AND date <= $3::date
    ORDER BY date ASC, created_at ASC
  `;

  const result = await db.query<WorkEntry>(query, [employeeId, startDate, endDate]);
  return result.rows;
}

/**
 * Search work entries by keyword in description (full-text search)
 * Requirements: 6.4, 8.2
 */
export async function searchByKeyword(
  keyword: string,
  employeeId?: string
): Promise<WorkEntry[]> {
  const params: any[] = [keyword];
  let employeeFilter = '';

  if (employeeId) {
    params.push(employeeId);
    employeeFilter = `AND employee_id = $${params.length}`;
  }

  const query = `
    SELECT
      id,
      employee_id as "employeeId",
      description,
      status,
      category,
      start_time as "startTime",
      end_time as "endTime",
      duration,
      date,
      is_auto_tracked as "isAutoTracked",
      created_at as "createdAt",
      updated_at as "updatedAt",
      modified_at as "modifiedAt"
    FROM work_entries
    WHERE description ILIKE $1
      ${employeeFilter}
    ORDER BY date DESC, created_at DESC
  `;

  const result = await db.query<WorkEntry>(query, params);
  return result.rows;
}
