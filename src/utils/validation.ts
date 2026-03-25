import { CompletionStatus } from '../models/WorkEntry';

/**
 * Validation result containing success flag and optional error message
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a work description meets the minimum length requirement (10 characters)
 * Requirements: 1.4, 11.1
 */
export function validateDescription(description: unknown): ValidationResult {
  if (description === undefined || description === null) {
    return { valid: false, error: 'Description is required' };
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string' };
  }

  if (description.length < 10) {
    return {
      valid: false,
      error: `Description must be at least 10 characters (got ${description.length})`,
    };
  }

  return { valid: true };
}

/**
 * Validate that a completion status is one of the allowed values
 * Requirements: 1.5, 11.1
 */
export function validateStatus(status: unknown): ValidationResult {
  if (status === undefined || status === null) {
    return { valid: false, error: 'Status is required' };
  }

  const validStatuses = Object.values(CompletionStatus) as string[];

  if (!validStatuses.includes(status as string)) {
    return {
      valid: false,
      error: `Status must be one of: ${validStatuses.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate that a date field contains a valid date
 * Requirements: 11.3
 */
export function validateDate(date: unknown): ValidationResult {
  if (date === undefined || date === null) {
    return { valid: false, error: 'Date is required' };
  }

  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Date is invalid' };
    }
    return { valid: true };
  }

  if (typeof date === 'string') {
    if (date.trim() === '') {
      return { valid: false, error: 'Date cannot be empty' };
    }

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return { valid: false, error: `Invalid date: "${date}"` };
    }

    // Detect impossible dates like Feb 30 by checking if the parsed date
    // round-trips back to the same date string components.
    // Only apply this check for YYYY-MM-DD style strings.
    const isoDateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch.map(Number);
      // Use UTC to avoid timezone shifts
      const utc = new Date(Date.UTC(year, month - 1, day));
      if (
        utc.getUTCFullYear() !== year ||
        utc.getUTCMonth() + 1 !== month ||
        utc.getUTCDate() !== day
      ) {
        return { valid: false, error: `Invalid date: "${date}" (day out of range for month)` };
      }
    }

    return { valid: true };
  }

  if (typeof date === 'number') {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return { valid: false, error: 'Date is invalid' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Date must be a valid date value' };
}

/**
 * Validate that a duration value is a positive number
 * Requirements: 11.4
 */
export function validateDuration(duration: unknown): ValidationResult {
  if (duration === undefined || duration === null) {
    // Duration is optional; only validate if provided
    return { valid: true };
  }

  if (typeof duration !== 'number') {
    return { valid: false, error: 'Duration must be a number' };
  }

  if (!isFinite(duration)) {
    return { valid: false, error: 'Duration must be a finite number' };
  }

  if (duration <= 0) {
    return { valid: false, error: 'Duration must be a positive number' };
  }

  return { valid: true };
}

/**
 * Required fields for a work entry submission
 */
const REQUIRED_WORK_ENTRY_FIELDS = ['employeeId', 'description', 'status', 'date'] as const;

/**
 * Validate that all required fields are present in a work entry input
 * Requirements: 11.2
 */
export function validateRequiredFields(
  input: Record<string, unknown>
): ValidationResult {
  const missingFields: string[] = [];

  for (const field of REQUIRED_WORK_ENTRY_FIELDS) {
    const value = input[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate a complete work entry input object
 * Runs all individual validators and collects all errors
 * Requirements: 1.4, 1.5, 11.1, 11.2, 11.3, 11.4
 */
export function validateWorkEntryInput(
  input: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const requiredResult = validateRequiredFields(input);
  if (!requiredResult.valid && requiredResult.error) {
    errors.push(requiredResult.error);
  }

  const descriptionResult = validateDescription(input.description);
  if (!descriptionResult.valid && descriptionResult.error) {
    // Avoid duplicate "required" errors
    if (input.description !== undefined && input.description !== null && input.description !== '') {
      errors.push(descriptionResult.error);
    }
  }

  const statusResult = validateStatus(input.status);
  if (!statusResult.valid && statusResult.error) {
    if (input.status !== undefined && input.status !== null && input.status !== '') {
      errors.push(statusResult.error);
    }
  }

  if (input.date !== undefined && input.date !== null && input.date !== '') {
    const dateResult = validateDate(input.date);
    if (!dateResult.valid && dateResult.error) {
      errors.push(dateResult.error);
    }
  }

  if (input.duration !== undefined && input.duration !== null) {
    const durationResult = validateDuration(input.duration);
    if (!durationResult.valid && durationResult.error) {
      errors.push(durationResult.error);
    }
  }

  return { valid: errors.length === 0, errors };
}
