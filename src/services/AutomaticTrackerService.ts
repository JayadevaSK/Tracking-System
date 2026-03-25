import * as TrackingConfigModel from '../models/TrackingConfiguration';
import { TrackingConfiguration } from '../models/TrackingConfiguration';
import * as WorkEntryModel from '../models/WorkEntry';
import { WorkEntry, CompletionStatus } from '../models/WorkEntry';

/**
 * Enable automatic tracking for an employee.
 * Creates a config record if one doesn't exist yet.
 * Requirements: 2.1, 2.4
 */
export async function enableTracking(employeeId: string): Promise<TrackingConfiguration> {
  return TrackingConfigModel.upsert({ employeeId, isEnabled: true });
}

/**
 * Disable automatic tracking for an employee.
 * Requirements: 2.2, 2.4
 */
export async function disableTracking(employeeId: string): Promise<TrackingConfiguration> {
  const existing = await TrackingConfigModel.findByEmployeeId(employeeId);
  if (existing) {
    const updated = await TrackingConfigModel.setEnabled(employeeId, false);
    return updated!;
  }
  return TrackingConfigModel.upsert({ employeeId, isEnabled: false });
}

/**
 * Get the current tracking status for an employee.
 * Returns null if no configuration exists.
 * Requirements: 2.4
 */
export async function getTrackingStatus(
  employeeId: string
): Promise<TrackingConfiguration | null> {
  return TrackingConfigModel.findByEmployeeId(employeeId);
}

/**
 * Record a detected activity as a work entry.
 * Only creates the entry if tracking is enabled for the employee.
 * Requirements: 2.1, 2.2, 2.3
 */
export async function recordActivity(
  employeeId: string,
  description: string,
  duration?: number
): Promise<WorkEntry | null> {
  const config = await TrackingConfigModel.findByEmployeeId(employeeId);
  if (!config || !config.isEnabled) {
    return null;
  }

  return WorkEntryModel.create({
    employeeId,
    description,
    status: CompletionStatus.IN_PROGRESS,
    duration,
    isAutoTracked: true,
    date: new Date(),
  });
}
