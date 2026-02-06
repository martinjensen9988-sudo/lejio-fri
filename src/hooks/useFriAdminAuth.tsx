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

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

const FriAdminContext = createContext<FriAdminContextType | undefined>(undefined);

export const FriAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<FriAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const esc = (v: string) => v.replace(/'/g, "''");

  const fetchAdminByEmail = async (email: string) => {
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT * FROM fri_admins WHERE admin_email='${esc(email)}' OR email='${esc(email)}'`,
        admin: true,
      });
      const rows = normalizeRows(response) as FriAdminProfile[];
      return rows?.[0] || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Use cookie-based session check
        const response = await fetch('/api/auth-session', { credentials: 'include' });
        if (!response.ok) { setLoading(false); return; }
        const data = await response.json();
        const email = data?.user?.email;
        if (!email) { setLoading(false); return; }
        const adminData = await fetchAdminByEmail(email);
        setAdmin(adminData || null);
      } catch (err) {
        console.error('Error checking admin session:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/auth-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }
      const adminData = await fetchAdminByEmail(email);
      if (!adminData) throw new Error('User is not an admin');
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
      await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' });
      setAdmin(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FriAdminContext.Provider value={{ admin, loading, error, login, logout, isAuthenticated: !!admin }}>
      {children}
    </FriAdminContext.Provider>
  );
};

export const useFriAdminAuth = () => {
  const context = useContext(FriAdminContext);
  if (context === undefined) throw new Error('useFriAdminAuth must be used within FriAdminAuthProvider');
  return context;
};
