import api from './api';
import { DailySummary, TeamOverview, WorkMetrics } from '../types';

export const dashboardService = {
  async getDailySummary(employeeId: string, date: string): Promise<DailySummary> {
    const response = await api.get<DailySummary>(`/dashboard/summary/${employeeId}/${date}`);
    return response.data;
  },

  async getTeamOverview(managerId: string, date: string): Promise<TeamOverview> {
    const response = await api.get<TeamOverview>(`/dashboard/team/${managerId}/${date}`);
    return response.data;
  },

  async getWorkMetrics(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkMetrics> {
    const response = await api.get<WorkMetrics>(`/dashboard/metrics/${employeeId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
