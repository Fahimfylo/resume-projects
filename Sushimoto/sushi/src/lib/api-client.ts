const BASE_URL = "http://localhost:8000/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  code?: string;
  errors?: { field: string; message: string }[];
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        this.accessToken = null;
        return null;
      }
      const data: ApiResponse<{ accessToken: string }> = await res.json();
      if (data.success && data.data?.accessToken) {
        this.accessToken = data.data.accessToken;
        return this.accessToken;
      }
      this.accessToken = null;
      return null;
    } catch {
      this.accessToken = null;
      return null;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown> | object,
    opts?: { skipAuth?: boolean }
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (!opts?.skipAuth && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !opts?.skipAuth) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          method,
          headers,
          credentials: "include",
          body: body ? JSON.stringify(body) : undefined,
        });
        let retryData: ApiResponse<T>;
        try {
          retryData = await retryRes.json();
        } catch {
          retryData = {
            success: false,
            message: `Server error (${retryRes.status})`,
            data: null as unknown as T,
            code: 'PARSE_ERROR',
          };
        }
        return retryData;
      }
    }

    let data: ApiResponse<T>;
    try {
      data = await res.json();
    } catch {
      data = {
        success: false,
        message: `Server error (${res.status})`,
        data: null as unknown as T,
        code: 'PARSE_ERROR',
      };
    }
    return data;
  }

  async get<T>(path: string, opts?: { skipAuth?: boolean }) {
    return this.request<T>("GET", path, undefined, opts);
  }

  async post<T>(path: string, body?: object, opts?: { skipAuth?: boolean }) {
    return this.request<T>("POST", path, body, opts);
  }

  async patch<T>(path: string, body?: object, opts?: { skipAuth?: boolean }) {
    return this.request<T>("PATCH", path, body, opts);
  }

  async del<T>(path: string, opts?: { skipAuth?: boolean }) {
    return this.request<T>("DELETE", path, undefined, opts);
  }
}

export const api = new ApiClient();
export type { ApiResponse };
