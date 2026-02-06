import { useEffect, useState, useCallback } from 'react';

export type FriUserRole = 'owner' | 'manager' | 'salesperson' | 'mechanic' | 'driver' | 'accountant';

export interface FriAuthUser {
  id: string;
  email: string;
  company_name?: string;
  lessor_id?: string;
  isLessor?: boolean;
  role?: FriUserRole;
}

interface UseFriAuthReturn {
  user: FriAuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook for Fri authentication
 * Uses Azure Functions via Static Web Apps API routing
 */
export function useFriAuth(): UseFriAuthReturn {
  const [user, setUser] = useState<FriAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Use relative /api path which Azure Static Web Apps will proxy to Azure Functions
  const apiBaseUrl = '/api';

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session via cookie (server resolves lejio_sid)
        const response = await fetch(`${apiBaseUrl}/auth-session`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user?.id) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, [apiBaseUrl]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/auth-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Signup failed');
        }

        const userData = await response.json();
        // Set user after signup (cookie is set by server)
        if (userData.user) {
          setUser(userData.user);
        } else if (userData.id) {
          setUser(userData);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/auth-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Login failed');
        }

        const data = await response.json();
        
        // Cookie is set by server via Set-Cookie header
        setUser(data.user || {
          id: '',
          email: email,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${apiBaseUrl}/auth-logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    error,
  };
}
