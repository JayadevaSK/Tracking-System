import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ error: ApiError }>) => {
        const status = error.response?.status;
        const isLoginRequest = error.config?.url?.includes('/auth/login');

        if (status === 401 && !isLoginRequest) {
          // Authentication error — clear token and redirect to login (but not during login itself)
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        } else if (status === 403) {
          console.warn('Access denied:', error.response?.data?.error?.message);
        } else if (status === 400) {
          // Validation errors — let the caller handle field-specific messages
          console.warn('Validation error:', error.response?.data?.error?.message);
        } else if (status && status >= 500) {
          console.error('Server error:', error.response?.data?.error?.message);
        } else if (!error.response) {
          console.error('Network error — check your connection');
        }

        return Promise.reject(error);
      }
    );
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

export const apiService = new ApiService();
export default apiService.getClient();
