import { db } from '../utils/db';
import { WorkEntry, CompletionStatus } from '../models/WorkEntry';

/**
 * Daily summary for a single employee
 * Requirements: 3.1, 3.2, 3.4
 */
export interface DailySummary {
  employeeId: string;
  date: Date;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  completionPercentage: number;
  totalDuration: number;
  workEntries: WorkEntry[];
}

/**
 * Per-employee summary row used in team overview
 * Requirements: 7.1, 7.2
 */
export interface EmployeeOverview {
  employeeId: string;
  employeeName: string;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  totalDuration: number;
}

/**
 * Team overview for a manager on a given date
 * Requirements: 7.1, 7.2, 7.3
 */
export interface TeamOverview {
  managerId: string;
  date: Date;
  employees: EmployeeOverview[];
}

/**
 * Work metrics over a date range
 * Requirements: 5.1, 5.2, 5.3
 */
export interface WorkMetrics {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  totalDuration: number;
  dailyBreakdown: Array<{
    date: string;
    totalItems: number;
    completedItems: number;
    totalDuration: number;
  }>;
  workEntries: WorkEntry[];
}

/**
 * Calculate completion percentage from counts.
 * Returns 0 when there are no items.
 * Requirements: 4.4
 */
export function getCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Aggregate work entries into a daily summary for one employee.
 * Requirements: 3.1, 3.2, 3.4
 */
export async function getDailySummary(
  employeeId: string,
  date: Date
): Promise<DailySummary> {
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
  const entries = result.rows;

  const totalItems = entries.length;
  const completedItems = entries.filter(e => e.status === CompletionStatus.COMPLETED).length;
  const inProgressItems = entries.filter(e => e.status === CompletionStatus.IN_PROGRESS).length;
  const notStartedItems = entries.filter(e => e.status === CompletionStatus.NOT_STARTED).length;
  const totalDuration = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);

  return {
    employeeId,
    date,
    totalItems,
    completedItems,
    inProgressItems,
    notStartedItems,
    completionPercentage: getCompletionPercentage(completedItems, totalItems),
    totalDuration,
    workEntries: entries,
  };
}

/**
 * Get team overview for all employees under a manager on a given date.
 * Requirements: 7.1, 7.2, 7.3
 */
export async function getTeamOverview(
  managerId: string,
  date: Date
): Promise<TeamOverview> {
  // Fetch all employees managed by this manager
  const employeeQuery = `
    SELECT id, CONCAT(first_name, ' ', last_name) as name
    FROM users
    WHERE manager_id = $1
    ORDER BY first_name ASC
  `;
  const employeeResult = await db.query<{ id: string; name: string }>(
    employeeQuery,
    [managerId]
  );

  const employees: EmployeeOverview[] = await Promise.all(
    employeeResult.rows.map(async (emp) => {
      const summary = await getDailySummary(emp.id, date);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        totalItems: summary.totalItems,
        completedItems: summary.completedItems,
        completionPercentage: summary.completionPercentage,
        totalDuration: summary.totalDuration,
      };
    })
  );

  return { managerId, date, employees };
}

/**
 * Get work metrics for an employee over a date range.
 * Requirements: 5.1, 5.2, 5.3
 */
export async function getWorkMetrics(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<WorkMetrics> {
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
  const entries = result.rows;

  const totalItems = entries.length;
  const completedItems = entries.filter(e => e.status === CompletionStatus.COMPLETED).length;
  const totalDuration = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);

  // Group by date for daily breakdown
  const byDate = new Map<string, WorkEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.date).toISOString().split('T')[0];
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(entry);
  }

  const dailyBreakdown = Array.from(byDate.entries()).map(([dateStr, dayEntries]) => ({
    date: dateStr,
    totalItems: dayEntries.length,
    completedItems: dayEntries.filter(e => e.status === CompletionStatus.COMPLETED).length,
    totalDuration: dayEntries.reduce((sum, e) => sum + (e.duration ?? 0), 0),
  }));

  return {
    employeeId,
    startDate,
    endDate,
    totalItems,
    completedItems,
    completionPercentage: getCompletionPercentage(completedItems, totalItems),
    totalDuration,
    dailyBreakdown,
    workEntries: entries,
  };
}
