import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

function performRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function isAuthPath(path: string) {
  return path.startsWith('/auth/login') || path.startsWith('/auth/signup');
}

function isPublicPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/workspaces') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')
  );
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  let res: Response;
  try {
    const isForm = options.body instanceof FormData;
    res = await fetch(`${BASE_URL}${path}`, {
      headers: isForm ? { ...(options.headers || {}) } : { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
      ...options,
    });
  } catch (err) {
    throw new ApiError('API unreachable — start the backend server', 'NETWORK_ERROR', 0);
  }

  if (res.status === 401 && !retried && !isAuthPath(path)) {
    const refreshed = await performRefresh();
    if (refreshed) return request<T>(path, options, true);
    useAuthStore.getState().setUnauthenticated();
    if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired', 'UNAUTHENTICATED', 401);
  }

  if (res.status === 204) return undefined as T;

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new ApiError(body?.error?.message || `Request failed (${res.status})`, body?.error?.code || 'HTTP_ERROR', res.status);
  }

  return body as T;
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });
const patch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });
const upload = <T>(path: string, file: File) => {
  const form = new FormData();
  form.append('codebase', file);
  return request<T>(path, { method: 'POST', body: form });
};
const uploadField = <T>(path: string, fieldName: string, file: File) => {
  const form = new FormData();
  form.append(fieldName, file);
  return request<T>(path, { method: 'POST', body: form });
};

const CHUNK_SIZE = 3 * 1024 * 1024;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file chunk'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads a file in ~3MB chunks so it fits within serverless request-body
 * limits (Vercel caps function bodies around 4.5MB), then finalizes on the
 * server. Uses `path` ending in `/upload` (chunk/complete are appended).
 */
const uploadChunked = async <T>(path: string, file: File, onProgress?: (pct: number) => void): Promise<T> => {
  const uploadId = `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  for (let i = 0; i < total; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const blob = file.slice(start, end);
    const data = await blobToBase64(blob);
    await request<void>(`${path}/chunk`, {
      method: 'POST',
      body: JSON.stringify({ uploadId, index: i, total, data }),
    });
    onProgress?.(Math.round(((i + 1) / total) * 90));
  }

  const res = await request<T>(`${path}/complete`, {
    method: 'POST',
    body: JSON.stringify({ uploadId, filename: file.name, total }),
  });
  onProgress?.(100);
  return res;
};

export const api = {
  get,
  post,
  patch,
  del,
  upload,
  uploadField,
  uploadChunked,
};
