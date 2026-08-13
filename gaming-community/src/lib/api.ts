const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

function getStorage(): Storage {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : (null as any);
  } catch {
    return null as any;
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  const storage = getStorage();
  if (!storage) return;
  if (token) {
    storage.setItem('nexus_access_token', token);
  } else {
    storage.removeItem('nexus_access_token');
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    const storage = getStorage();
    accessToken = storage?.getItem('nexus_access_token') || null;
  }
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && token) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  const contentType = res.headers.get('content-type') || '';
  let data: any;
  try {
    data = contentType.includes('application/json') ? await res.json() : { message: `Server returned ${res.status}: ${res.statusText}` };
  } catch {
    data = { message: `Server returned ${res.status}: ${res.statusText}` };
  }

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
