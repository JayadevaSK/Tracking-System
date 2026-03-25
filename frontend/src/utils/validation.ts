import { CompletionStatus } from '../types';

export const validateDescription = (description: string): string | null => {
  if (!description || description.trim().length === 0) {
    return 'Description is required';
  }
  if (description.trim().length < 10) {
    return 'Description must be at least 10 characters';
  }
  return null;
};

export const validateStatus = (status: string): string | null => {
  const validStatuses = Object.values(CompletionStatus);
  if (!validStatuses.includes(status as CompletionStatus)) {
    return 'Invalid completion status';
  }
  return null;
};

export const validateDuration = (duration: number): string | null => {
  if (duration <= 0) {
    return 'Duration must be a positive number';
  }
  return null;
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};
