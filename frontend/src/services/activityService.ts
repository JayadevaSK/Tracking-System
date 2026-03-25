import api from './api';

export interface ActivityEvent {
  id: string;
  employee_id: string;
  event_type: string;
  page: string | null;
  duration_seconds: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ActivitySummary {
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  pageBreakdown: Record<string, number>;
  sessionCount: number;
}

export interface ActivityTimeline {
  events: ActivityEvent[];
  summary: ActivitySummary;
}

export const activityService = {
  async getTimeline(employeeId: string, date: string): Promise<ActivityTimeline> {
    const res = await api.get(`/activity/employee/${employeeId}/date/${date}`);
    return res.data;
  },
};
