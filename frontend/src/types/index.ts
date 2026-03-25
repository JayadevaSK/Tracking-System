export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager'
}

export enum CompletionStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress',
  NOT_STARTED = 'not-started'
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  managerId?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  userId?: string;
  role?: UserRole;
  error?: string;
}

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

export interface WorkEntryInput {
  employeeId: string;
  description: string;
  status: CompletionStatus;
  category?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface DailySummary {
  employeeId: string;
  date: Date;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  totalDuration: number;
  completionPercentage: number;
  workEntries: WorkEntry[];
}

export interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
}

export interface TeamOverview {
  date: Date;
  employees: EmployeeSummary[];
}

export interface WorkMetrics {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  totalItems: number;
  completedItems: number;
  totalDuration: number;
  workEntries?: WorkEntry[];
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  workEntryNotifications: boolean;
  reminderNotifications: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}
