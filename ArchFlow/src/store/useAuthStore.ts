import { create } from 'zustand';
import { api } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  init: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setUnauthenticated: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<AuthUser>;
  updateAvatar: (file: File) => Promise<AuthUser>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  init: async () => {
    const { status } = get();
    if (status === 'loading' || status === 'authenticated') return;
    set({ status: 'loading' });
    try {
      const { user } = await api.get<{ user: AuthUser }>('/auth/me');
      set({ user, status: 'authenticated' });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
  setUnauthenticated: () => set({ user: null, status: 'unauthenticated' }),

  login: async (email, password) => {
    const { user } = await api.post<{ user: AuthUser }>('/auth/login', { email, password });
    set({ user, status: 'authenticated' });
    return user;
  },

  signup: async (name, email, password) => {
    const { user } = await api.post<{ user: AuthUser }>('/auth/signup', { name, email, password });
    set({ user, status: 'authenticated' });
    return user;
  },

  logout: async () => {
    try {
      await api.post<void>('/auth/logout');
    } finally {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  updateProfile: async (data) => {
    const { user } = await api.patch<{ user: AuthUser }>('/auth/profile', data);
    set({ user });
    return user;
  },

  updateAvatar: async (file) => {
    const { user } = await api.uploadField<{ user: AuthUser }>('/auth/profile/avatar', 'avatar', file);
    set({ user });
    return user;
  },
}));
