import { API_BASE } from './config';

export interface StoredUser {
  id: string;
  email: string;
  name?: string;
  businessName?: string;
  avatarUrl?: string;
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('momentum_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeUser(user: StoredUser): void {
  localStorage.setItem('momentum_user', JSON.stringify(user));
}

function clearUser(): void {
  localStorage.removeItem('momentum_user');
}

export function isAuthenticated(): boolean {
  return !!getStoredUser();
}

export { getStoredUser, storeUser, clearUser };

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/);
  return match ? match[1] : null;
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function retryAfterRefresh<T>(method: string, path: string, headers: Record<string, string>, body?: unknown): Promise<T> {
  const retryRes = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const retryJson = await retryRes.json();
  if (!retryRes.ok) throw new ApiError(retryRes.status, retryJson.message || 'Request failed', retryJson.errors);
  return retryJson.data;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (!SAFE_METHODS.includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const original = await res.json().catch(() => ({ message: 'Session expired. Please sign in again.' }));
    const refreshed = await tryRefresh();
    if (refreshed) {
      return retryAfterRefresh<T>(method, path, headers, body);
    }
    clearUser();
    throw new ApiError(401, original.message || 'Session expired. Please sign in again.');
  }

  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json.message || 'Request failed', json.errors);
  return json.data;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>('GET', path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>('PATCH', path, body),
  delete: <T>(path: string) => apiRequest<T>('DELETE', path),
};

export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers['x-csrf-token'] = csrf;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (res.status === 401) {
    const original = await res.json().catch(() => ({ message: 'Session expired. Please sign in again.' }));
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryRes = await fetch(`${API_BASE}${path}`, {
        method: 'POST', headers, credentials: 'include', body: formData,
      });
      const retryJson = await retryRes.json();
      if (!retryRes.ok) throw new ApiError(retryRes.status, retryJson.message || 'Request failed', retryJson.errors);
      return retryJson.data;
    }
    clearUser();
    throw new ApiError(401, original.message || 'Session expired. Please sign in again.');
  }

  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json.message || 'Request failed', json.errors);
  return json.data;
}

export function normalizeDoc<T extends Record<string, unknown>>(doc: T): T & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id as string, ...rest } as T & { id: string };
}
