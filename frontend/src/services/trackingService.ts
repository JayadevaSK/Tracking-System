import api from './api';

export interface TrackingStatus {
  isEnabled: boolean;
  trackingInterval?: number;
}

export const trackingService = {
  async getStatus(employeeId: string): Promise<TrackingStatus> {
    try {
      const res = await api.get<TrackingStatus>(`/tracking/${employeeId}/status`);
      return res.data;
    } catch {
      return { isEnabled: false };
    }
  },

  async enable(employeeId: string): Promise<TrackingStatus> {
    const res = await api.post<TrackingStatus>(`/tracking/${employeeId}/enable`);
    return res.data;
  },

  async disable(employeeId: string): Promise<TrackingStatus> {
    const res = await api.post<TrackingStatus>(`/tracking/${employeeId}/disable`);
    return res.data;
  },

  async recordActivity(employeeId: string, description: string, duration: number): Promise<void> {
    await api.post('/work-entries', {
      employeeId,
      description,
      status: 'in-progress',
      duration,
      isAutoTracked: true,
      date: new Date().toISOString().split('T')[0],
    });
  },
};
