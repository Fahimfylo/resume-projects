'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, setAccessToken, getAccessToken } from './api';

export interface User {
  _id: string;
  email: string;
  gamerTag: string;
  gamerBio: string;
  avatarUrl: string;
  gamingPreferences: string[];
  role: string;
  isBanned: boolean;
  isSuspended: boolean;
  warnings: number;
  rank: string;
  level: number;
  stats: {
    winRate: number;
    kdRatio: number;
    matches: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string, gamerTag?: string) => Promise<{ email: string }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      setUser(res.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const register = async (email: string, password: string, gamerTag?: string) => {
    const res = await api.post<RegisterResponse>('/auth/register', { email, password, gamerTag });
    return { email: res.email };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await api.post<AuthResponse>('/auth/verify-email', { email, otp });
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const resendOtp = async (email: string) => {
    await api.post('/auth/resend-otp', { email });
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, verifyEmail, resendOtp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
