import {
  validateDescription,
  validateStatus,
  validateDate,
  validateDuration,
  validateRequiredFields,
  validateWorkEntryInput,
} from './validation';
import { CompletionStatus } from '../models/WorkEntry';

describe('validateDescription', () => {
  it('should accept descriptions with exactly 10 characters', () => {
    const result = validateDescription('1234567890');
    expect(result.valid).toBe(true);
  });

  it('should accept descriptions longer than 10 characters', () => {
    const result = validateDescription('This is a valid work description');
    expect(result.valid).toBe(true);
  });

  it('should reject descriptions shorter than 10 characters', () => {
    const result = validateDescription('Too short');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 characters');
  });

  it('should reject empty string', () => {
    const result = validateDescription('');
    expect(result.valid).toBe(false);
  });

  it('should reject null', () => {
    const result = validateDescription(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject undefined', () => {
    const result = validateDescription(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject non-string values', () => {
    const result = validateDescription(12345);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('string');
  });

  it('should include the actual length in the error message', () => {
    const result = validateDescription('short');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5');
  });
});

describe('validateStatus', () => {
  it('should accept "completed" status', () => {
    expect(validateStatus(CompletionStatus.COMPLETED).valid).toBe(true);
    expect(validateStatus('completed').valid).toBe(true);
  });

  it('should accept "in-progress" status', () => {
    expect(validateStatus(CompletionStatus.IN_PROGRESS).valid).toBe(true);
    expect(validateStatus('in-progress').valid).toBe(true);
  });

  it('should accept "not-started" status', () => {
    expect(validateStatus(CompletionStatus.NOT_STARTED).valid).toBe(true);
    expect(validateStatus('not-started').valid).toBe(true);
  });

  it('should reject invalid status values', () => {
    const result = validateStatus('done');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('completed');
    expect(result.error).toContain('in-progress');
    expect(result.error).toContain('not-started');
  });

  it('should reject null', () => {
    const result = validateStatus(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject undefined', () => {
    const result = validateStatus(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject empty string', () => {
    const result = validateStatus('');
    expect(result.valid).toBe(false);
  });

  it('should be case-sensitive (reject uppercase)', () => {
    const result = validateStatus('COMPLETED');
    expect(result.valid).toBe(false);
  });
});

describe('validateDate', () => {
  it('should accept a valid Date object', () => {
    const result = validateDate(new Date('2024-01-15'));
    expect(result.valid).toBe(true);
  });

  it('should accept a valid date string', () => {
    const result = validateDate('2024-01-15');
    expect(result.valid).toBe(true);
  });

  it('should accept ISO date string', () => {
    const result = validateDate('2024-01-15T10:30:00Z');
    expect(result.valid).toBe(true);
  });

  it('should reject an invalid Date object (NaN)', () => {
    const result = validateDate(new Date('not-a-date'));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid');
  });

  it('should reject an invalid date string', () => {
    const result = validateDate('not-a-date');
    expect(result.valid).toBe(false);
  });

  it('should reject null', () => {
    const result = validateDate(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject undefined', () => {
    const result = validateDate(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject empty string', () => {
    const result = validateDate('');
    expect(result.valid).toBe(false);
  });

  it('should reject impossible dates like February 30', () => {
    const result = validateDate('2024-02-30');
    expect(result.valid).toBe(false);
  });
});

describe('validateDuration', () => {
  it('should accept positive integer durations', () => {
    expect(validateDuration(60).valid).toBe(true);
    expect(validateDuration(1).valid).toBe(true);
    expect(validateDuration(480).valid).toBe(true);
  });

  it('should accept positive decimal durations', () => {
    expect(validateDuration(1.5).valid).toBe(true);
    expect(validateDuration(0.5).valid).toBe(true);
  });

  it('should reject zero', () => {
    const result = validateDuration(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should reject negative numbers', () => {
    const result = validateDuration(-10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should accept null (duration is optional)', () => {
    expect(validateDuration(null).valid).toBe(true);
  });

  it('should accept undefined (duration is optional)', () => {
    expect(validateDuration(undefined).valid).toBe(true);
  });

  it('should reject non-numeric values', () => {
    const result = validateDuration('60');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('number');
  });

  it('should reject Infinity', () => {
    const result = validateDuration(Infinity);
    expect(result.valid).toBe(false);
  });

  it('should reject NaN', () => {
    const result = validateDuration(NaN);
    expect(result.valid).toBe(false);
  });
});

describe('validateRequiredFields', () => {
  it('should pass when all required fields are present', () => {
    const input = {
      employeeId: 'emp-123',
      description: 'Valid description here',
      status: 'completed',
      date: '2024-01-15',
    };
    const result = validateRequiredFields(input);
    expect(result.valid).toBe(true);
  });

  it('should fail when employeeId is missing', () => {
    const input = {
      description: 'Valid description here',
      status: 'completed',
      date: '2024-01-15',
    };
    const result = validateRequiredFields(input);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('employeeId');
  });

  it('should fail when description is missing', () => {
    const input = {
      employeeId: 'emp-123',
      status: 'completed',
      date: '2024-01-15',
    };
    const result = validateRequiredFields(input);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('description');
  });

  it('should fail when status is missing', () => {
    const input = {
      employeeId: 'emp-123',
      description: 'Valid description here',
      date: '2024-01-15',
    };
    const result = validateRequiredFields(input);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('status');
  });

  it('should fail when date is missing', () => {
    const input = {
      employeeId: 'emp-123',
      description: 'Valid description here',
      status: 'completed',
    };
    const result = validateRequiredFields(input);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('date');
  });

  it('should list all missing fields in the error message', () => {
    const result = validateRequiredFields({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain('employeeId');
    expect(result.error).toContain('description');
    expect(result.error).toContain('status');
    expect(result.error).toContain('date');
  });

  it('should fail when field is null', () => {
    const input = {
      employeeId: null,
      description: 'Valid description here',
      status: 'completed',
      date: '2024-01-15',
    };
    const result = validateRequiredFields(input as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('employeeId');
  });
});

describe('validateWorkEntryInput', () => {
  it('should pass for a valid complete input', () => {
    const input = {
      employeeId: 'emp-123',
      description: 'Completed the feature implementation and testing',
      status: 'completed',
      date: '2024-01-15',
      duration: 120,
    };
    const result = validateWorkEntryInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect multiple errors', () => {
    const input = {
      employeeId: 'emp-123',
      description: 'short',
      status: 'invalid-status',
      date: '2024-01-15',
    };
    const result = validateWorkEntryInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should report missing required fields', () => {
    const result = validateWorkEntryInput({});
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Missing required fields'))).toBe(true);
  });

  it('should validate duration when provided', () => {
    const input = {
      employeeId: 'emp-123',
      description: 'Valid description for work entry',
      status: 'completed',
      date: '2024-01-15',
      duration: -5,
    };
    const result = validateWorkEntryInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('positive'))).toBe(true);
  });

  it('should not report duration error when duration is omitted', () => {
    const input = {
      employeeId: 'emp-123',
      description: 'Valid description for work entry',
      status: 'completed',
      date: '2024-01-15',
    };
    const result = validateWorkEntryInput(input);
    expect(result.valid).toBe(true);
  });
});
