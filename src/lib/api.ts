// Simple API client for Lejio Fri on Render
// Clean, simple, no Azure/Supabase complexity

import { safeStorage } from './safeStorage';

const SESSION_KEY = 'lejio-session';
const API_BASE = '/api';

// Session type
export interface Session {
  access_token: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
    lessor_id?: string;
  };
}

// Get stored session
export function getSession(): Session | null {
  const data = safeStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Save session
export function saveSession(session: Session): void {
  safeStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Clear session
export function clearSession(): void {
  safeStorage.removeItem(SESSION_KEY);
}

// API request with auth token
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = getSession();
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

// Shorthand methods
export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// Auth functions
export const auth = {
  async signIn(email: string, password: string): Promise<{ session: Session | null; error: string | null }> {
    try {
      const result = await api.post<{ session: Session }>('auth-login', { email, password });
      if (result.session) {
        saveSession(result.session);
        return { session: result.session, error: null };
      }
      return { session: null, error: 'Login failed' };
    } catch (err: any) {
      return { session: null, error: err.message };
    }
  },

  async signUp(email: string, password: string, fullName: string): Promise<{ session: Session | null; error: string | null }> {
    try {
      const result = await api.post<{ session: Session }>('auth-signup', { email, password, full_name: fullName });
      if (result.session) {
        saveSession(result.session);
        return { session: result.session, error: null };
      }
      return { session: null, error: 'Signup failed' };
    } catch (err: any) {
      return { session: null, error: err.message };
    }
  },

  signOut(): void {
    clearSession();
  },

  getSession(): Session | null {
    return getSession();
  },

  isAuthenticated(): boolean {
    return getSession() !== null;
  }
};

export default api;
