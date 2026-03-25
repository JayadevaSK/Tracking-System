import api from './api';
import { WorkEntry, WorkEntryInput } from '../types';

export const workEntryService = {
  async createWorkEntry(entry: WorkEntryInput): Promise<WorkEntry> {
    const response = await api.post<WorkEntry>('/work-entries', entry);
    return response.data;
  },

  async getWorkEntry(id: string): Promise<WorkEntry> {
    const response = await api.get<WorkEntry>(`/work-entries/${id}`);
    return response.data;
  },

  async updateWorkEntry(id: string, updates: Partial<WorkEntryInput>): Promise<WorkEntry> {
    const response = await api.put<WorkEntry>(`/work-entries/${id}`, updates);
    return response.data;
  },

  async deleteWorkEntry(id: string): Promise<void> {
    await api.delete(`/work-entries/${id}`);
  },

  async getWorkEntriesByDate(employeeId: string, date: string): Promise<WorkEntry[]> {
    const response = await api.get<WorkEntry[]>(`/work-entries/employee/${employeeId}/date/${date}`);
    return response.data;
  },

  async getWorkEntriesByDateRange(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkEntry[]> {
    const response = await api.get<WorkEntry[]>(`/work-entries/employee/${employeeId}/range`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async searchWorkEntries(query: string): Promise<WorkEntry[]> {
    const response = await api.get<WorkEntry[]>('/work-entries/search', {
      params: { q: query },
    });
    return response.data;
  },
};
