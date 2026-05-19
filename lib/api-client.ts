import { getSession } from 'next-auth/react';

interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`/api${endpoint}`, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  async fetch<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    let token: string | undefined;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken') || undefined;
      if (!token) {
        const session = await getSession();
        token = (session?.user as any)?.accessToken || undefined;
        if (token) {
          localStorage.setItem('accessToken', token);
        }
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.fetch<T>(endpoint, options);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;
      if (!refreshToken) return false;

      const response = await fetch(this.buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.data?.accessToken || data.accessToken);
        localStorage.setItem('refreshToken', data.data?.refreshToken || data.refreshToken);
      }
      return true;
    } catch {
      return false;
    }
  }

  get<T>(endpoint: string, params?: Record<string, string | number | undefined>) {
    return this.fetch<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
