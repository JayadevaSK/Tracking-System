import { db } from '../utils/db';

/**
 * TrackingConfiguration interface
 * Requirements: 2.4
 */
export interface TrackingConfiguration {
  id: string;
  employeeId: string;
  isEnabled: boolean;
  trackingInterval: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingConfigurationInput {
  employeeId: string;
  isEnabled?: boolean;
  trackingInterval?: number;
}

const SELECT_COLS = `
  id,
  employee_id as "employeeId",
  is_enabled as "isEnabled",
  tracking_interval as "trackingInterval",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

/**
 * Create or upsert a tracking configuration for an employee.
 * Requirements: 2.4
 */
export async function upsert(input: TrackingConfigurationInput): Promise<TrackingConfiguration> {
  const query = `
    INSERT INTO tracking_configurations (employee_id, is_enabled, tracking_interval)
    VALUES ($1, $2, $3)
    ON CONFLICT (employee_id)
    DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      tracking_interval = EXCLUDED.tracking_interval,
      updated_at = CURRENT_TIMESTAMP
    RETURNING ${SELECT_COLS}
  `;
  const result = await db.query<TrackingConfiguration>(query, [
    input.employeeId,
    input.isEnabled ?? false,
    input.trackingInterval ?? 30,
  ]);
  return result.rows[0];
}

/**
 * Find tracking configuration by employee ID.
 * Requirements: 2.4
 */
export async function findByEmployeeId(
  employeeId: string
): Promise<TrackingConfiguration | null> {
  const query = `SELECT ${SELECT_COLS} FROM tracking_configurations WHERE employee_id = $1`;
  const result = await db.query<TrackingConfiguration>(query, [employeeId]);
  return result.rows[0] || null;
}

/**
 * Update tracking enabled state.
 * Requirements: 2.1, 2.2
 */
export async function setEnabled(
  employeeId: string,
  isEnabled: boolean
): Promise<TrackingConfiguration | null> {
  const query = `
    UPDATE tracking_configurations
    SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP
    WHERE employee_id = $2
    RETURNING ${SELECT_COLS}
  `;
  const result = await db.query<TrackingConfiguration>(query, [isEnabled, employeeId]);
  return result.rows[0] || null;
}
