import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types';
import { authService } from '../services/authService';
import { apiService } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  role: UserRole | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, userId: string, role: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const token = apiService.getAuthToken();
    if (!token) {
      setState({ isAuthenticated: false, userId: null, role: null, loading: false });
      return;
    }

    authService.validateToken().then((valid) => {
      if (!valid) {
        apiService.clearAuthToken();
        setState({ isAuthenticated: false, userId: null, role: null, loading: false });
      } else {
        // Token is valid; role/userId will be set on next login or from stored values
        const storedRole = localStorage.getItem('userRole') as UserRole | null;
        const storedUserId = localStorage.getItem('userId');
        setState({
          isAuthenticated: true,
          userId: storedUserId,
          role: storedRole,
          loading: false,
        });
      }
    });
  }, []);

  const login = (token: string, userId: string, role: UserRole) => {
    apiService.setAuthToken(token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', userId);
    setState({ isAuthenticated: true, userId, role, loading: false });
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setState({ isAuthenticated: false, userId: null, role: null, loading: false });
  };

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
