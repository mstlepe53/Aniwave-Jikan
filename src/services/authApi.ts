export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string | null;
  createdAt: string;
  xp: number;
  level: number;
  watchTime: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const AUTH_API_BASE = (import.meta.env.VITE_AUTH_API_BASE_URL || '').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const url = AUTH_API_BASE ? `${AUTH_API_BASE}/api/auth${path}` : `/api/auth${path}`;
    console.log('[authApi] request URL:', url, 'AUTH_API_BASE:', AUTH_API_BASE);
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { message?: string }).message || 'Request failed. Please try again.');
    }

    return data as T;
  } catch (error) {
    console.error('[authApi] request error:', error);
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        console.error('[authApi] network error detected');
        throw new Error('Server not reachable. Please try again.');
      }
      throw error;
    }
    throw new Error('Request failed. Please try again.');
  }
}

export function registerUser(input: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return request<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginUser(input: { email: string; password: string }) {
  return request<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(token: string) {
  return request<{ user: AuthUser }>('/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
