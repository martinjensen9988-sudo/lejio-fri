import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface FriAdminProfile {
  id: string;
  email: string;
  admin_name: string;
  admin_email: string;
  is_super_admin: boolean;
  created_at: string;
}

interface FriAdminContextType {
  admin: FriAdminProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const FriAdminContext = createContext<FriAdminContextType | undefined>(undefined);

export const FriAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<FriAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = '/api';

  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  const fetchAdminByEmail = async (email: string) => {
    const response = await azureApi.post<any>('/db/query', {
      query: `SELECT * FROM fri_admins WHERE admin_email='${escapeSqlValue(email)}' OR email='${escapeSqlValue(email)}'`,
    });

    const rows = normalizeRows(response) as FriAdminProfile[];
    return rows?.[0] || null;
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const token = localStorage.getItem('fri-admin-auth-token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiBaseUrl}/AuthMe`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem('fri-admin-auth-token');
          setAdmin(null);
          setLoading(false);
          return;
        }

        const userData = await response.json();
        const email = userData?.email;
        if (!email) {
          setAdmin(null);
          setLoading(false);
          return;
        }

        const adminData = await fetchAdminByEmail(email);
        setAdmin(adminData || null);
      } catch (err) {
        console.error('Error checking admin session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${apiBaseUrl}/AuthLogin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      const token = data?.session?.access_token;

      if (token) {
        localStorage.setItem('fri-admin-auth-token', token);
      }

      const adminData = await fetchAdminByEmail(email);
      if (!adminData) {
        localStorage.removeItem('fri-admin-auth-token');
        throw new Error('User is not an admin');
      }

      setAdmin(adminData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('fri-admin-auth-token');
      setAdmin(null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: FriAdminContextType = {
    admin,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!admin,
  };

  return (
    <FriAdminContext.Provider value={value}>
      {children}
    </FriAdminContext.Provider>
  );
};

export const useFriAdminAuth = () => {
  const context = useContext(FriAdminContext);
  if (context === undefined) {
    throw new Error('useFriAdminAuth must be used within FriAdminAuthProvider');
  }
  return context;
};
