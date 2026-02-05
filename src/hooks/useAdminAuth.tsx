import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { azureApi } from '@/integrations/azure/client';

// Local user type (NOT from Supabase)
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

type AdminRole = 'support' | 'admin' | 'super_admin' | null;

interface AdminAuthContextType {
  user: AuthUser | null;
  adminRole: AdminRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  hasAccess: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Singleton state to persist across hook instances
let globalUser: AuthUser | null = null;
let globalAdminRole: AdminRole = null;
let globalIsLoading = true;
let globalIsInitialized = false;
const globalListeners: Set<() => void> = new Set();

const notifyListeners = () => {
  globalListeners.forEach(listener => listener());
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(globalUser);
  const [adminRole, setAdminRole] = useState<AdminRole>(globalAdminRole);
  const [isLoading, setIsLoading] = useState(globalIsLoading);

  const checkAdminStatus = useCallback(async (userId: string): Promise<AdminRole> => {
    try {
      const roles: ('super_admin' | 'admin' | 'support')[] = ['super_admin', 'admin', 'support'];
      
      for (const role of roles) {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: role
        });
        
        if (error) {
          console.error(`Error checking ${role} status:`, error);
          continue;
        }
        
        if (data === true) {
          return role;
        }
      }
      return null;
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Sync local state with global state
    const syncState = () => {
      if (mounted) {
        setUser(globalUser);
        setAdminRole(globalAdminRole);
        setIsLoading(globalIsLoading);
      }
    };

    globalListeners.add(syncState);

    const initializeAuth = async () => {
      // Skip if already initialized
      if (globalIsInitialized) {
        syncState();
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          globalUser = session.user;
          const role = await checkAdminStatus(session.user.id);
          globalAdminRole = role;
        } else {
          globalUser = null;
          globalAdminRole = null;
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        globalUser = null;
        globalAdminRole = null;
      } finally {
        globalIsLoading = false;
        globalIsInitialized = true;
        notifyListeners();
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Handle sign out event immediately
        if (event === 'SIGNED_OUT') {
          globalUser = null;
          globalAdminRole = null;
          globalIsLoading = false;
          notifyListeners();
          return;
        }
        
        if (session?.user) {
          globalUser = session.user;
          // Check admin status after initialization
          if (globalIsInitialized) {
            const role = await checkAdminStatus(session.user.id);
            globalAdminRole = role;
            globalIsLoading = false;
            notifyListeners();
          }
        } else {
          globalUser = null;
          globalAdminRole = null;
          globalIsLoading = false;
          notifyListeners();
        }
      }
    );

    return () => {
      mounted = false;
      globalListeners.delete(syncState);
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  const signIn = async (email: string, password: string) => {
    globalIsLoading = true;
    notifyListeners();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      globalIsLoading = false;
      notifyListeners();
      return { error };
    }

    if (data.user) {
      const { data: hasAnyRole } = await supabase.rpc<boolean>('has_any_admin_role', {
        _user_id: data.user.id
      });

      if (!hasAnyRole) {
        await supabase.auth.signOut();
        globalIsLoading = false;
        notifyListeners();
        return { error: { message: 'Du har ikke adgang til admin-panelet' } };
      }
      
      globalUser = data.user;
      const role = await checkAdminStatus(data.user.id);
      globalAdminRole = role;
    }

    globalIsLoading = false;
    notifyListeners();
    return { error: null };
  };

  const signOut = useCallback(async () => {
    // Clear state immediately
    globalUser = null;
    globalAdminRole = null;
    notifyListeners();
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const isSuperAdmin = adminRole === 'super_admin';
  const isAdmin = adminRole === 'admin' || adminRole === 'super_admin';
  const isSupport = adminRole === 'support' || isAdmin;
  const hasAccess = adminRole !== null;

  const value = {
    user,
    adminRole,
    isSuperAdmin,
    isAdmin,
    isSupport,
    hasAccess,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  const standaloneFallback = useAdminAuthStandalone();
  
  // Fallback for components outside the provider (e.g., admin login page)
  if (context === undefined) {
    return standaloneFallback;
  }
  
  return context;
};

// Standalone hook for use outside provider (admin login page)
const useAdminAuthStandalone = () => {
  const [user, setUser] = useState<User | null>(globalUser);
  const [adminRole, setAdminRole] = useState<AdminRole>(globalAdminRole);
  const [isLoading, setIsLoading] = useState(globalIsLoading);

  const checkAdminStatus = useCallback(async (userId: string): Promise<AdminRole> => {
    try {
      const roles: ('super_admin' | 'admin' | 'support')[] = ['super_admin', 'admin', 'support'];
      
      for (const role of roles) {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: role
        });
        
        if (error) continue;
        if (data === true) return role;
      }
      return null;
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncState = () => {
      if (mounted) {
        setUser(globalUser);
        setAdminRole(globalAdminRole);
        setIsLoading(globalIsLoading);
      }
    };

    globalListeners.add(syncState);

    const initializeAuth = async () => {
      if (globalIsInitialized) {
        syncState();
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
          globalUser = session.user;
          const role = await checkAdminStatus(session.user.id);
          globalAdminRole = role;
        } else {
          globalUser = null;
          globalAdminRole = null;
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        globalUser = null;
        globalAdminRole = null;
      } finally {
        globalIsLoading = false;
        globalIsInitialized = true;
        notifyListeners();
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          globalUser = null;
          globalAdminRole = null;
          globalIsLoading = false;
          notifyListeners();
          return;
        }
        
        if (session?.user) {
          globalUser = session.user;
          if (globalIsInitialized) {
            const role = await checkAdminStatus(session.user.id);
            globalAdminRole = role;
            globalIsLoading = false;
            notifyListeners();
          }
        } else {
          globalUser = null;
          globalAdminRole = null;
          globalIsLoading = false;
          notifyListeners();
        }
      }
    );

    return () => {
      mounted = false;
      globalListeners.delete(syncState);
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  const signIn = async (email: string, password: string) => {
    globalIsLoading = true;
    notifyListeners();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      globalIsLoading = false;
      notifyListeners();
      return { error };
    }

    if (data.user) {
      const { data: hasAnyRole } = await supabase.rpc<boolean>('has_any_admin_role', {
        _user_id: data.user.id
      });

      if (!hasAnyRole) {
        await supabase.auth.signOut();
        globalIsLoading = false;
        notifyListeners();
        return { error: { message: 'Du har ikke adgang til admin-panelet' } };
      }
      
      globalUser = data.user;
      const role = await checkAdminStatus(data.user.id);
      globalAdminRole = role;
    }

    globalIsLoading = false;
    notifyListeners();
    return { error: null };
  };

  const signOut = useCallback(async () => {
    globalUser = null;
    globalAdminRole = null;
    notifyListeners();
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const isSuperAdmin = adminRole === 'super_admin';
  const isAdmin = adminRole === 'admin' || adminRole === 'super_admin';
  const isSupport = adminRole === 'support' || isAdmin;
  const hasAccess = adminRole !== null;

  return {
    user,
    adminRole,
    isSuperAdmin,
    isAdmin,
    isSupport,
    hasAccess,
    isLoading,
    signIn,
    signOut,
  };
};
