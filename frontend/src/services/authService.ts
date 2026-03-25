import api, { apiService } from './api';
import { AuthResult } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<AuthResult> {
    const response = await api.post<AuthResult>('/auth/login', {
      username,
      password,
    });
    
    if (response.data.success && response.data.token) {
      apiService.setAuthToken(response.data.token);
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      apiService.clearAuthToken();
    }
  },

  async validateToken(): Promise<boolean> {
    try {
      const response = await api.get('/auth/validate');
      return response.status === 200;
    } catch {
      return false;
    }
  },

  isAuthenticated(): boolean {
    return apiService.getAuthToken() !== null;
  },
};
