import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { safeStorage } from '@/lib/safeStorage';

const SESSION_KEY = 'lejio-session';
const API_BASE = import.meta.env.PROD ? '' : '';

// User type
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface Profile {
  id: string;
  user_type: 'privat' | 'professionel';
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  avatar_url: string | null;
  cvr_number: string | null;
  company_name: string | null;
  payment_gateway: string | null;
  insurance_company: string | null;
  insurance_policy_number: string | null;
  trial_ends_at: string | null;
  subscription_status: string;
  feature_flags?: Record<string, boolean>;
  account_banned_at?: string | null;
  account_banned_reason?: string | null;
  lessor_id?: string | null;
}

interface Session {
  access_token: string;
  user: AuthUser;
}

export interface PaymentSettings {
  id: string;
  lessor_id: string;
  payment_gateway: string | null;
  gateway_api_key: string | null;
  gateway_merchant_id: string | null;
  bank_account: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, userType: 'privat' | 'professionel', cvrNumber?: string, companyName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions
const getStoredSession = (): { session: Session; profile: Profile } | null => {
  try {
    const stored = safeStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading session:', e);
  }
  return null;
};

const saveSession = (session: Session, profile: Profile) => {
  try {
    safeStorage.setItem(SESSION_KEY, JSON.stringify({ session, profile }));
  } catch (e) {
    console.error('Error saving session:', e);
  }
};

const clearSession = () => {
  try {
    safeStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Error clearing session:', e);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored.session);
      setUser(stored.session.user);
      setProfile(stored.profile);
    }
    setLoading(false);
  }, []);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    fullName: string, 
    userType: 'privat' | 'professionel',
    cvrNumber?: string,
    companyName?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, userType, cvrNumber, companyName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: new Error(data.error || 'Signup fejlede') };
      }

      // Save session and profile
      const newSession: Session = {
        access_token: data.token,
        user: data.user,
      };
      const newProfile: Profile = {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        user_type: userType,
        cvr_number: cvrNumber || null,
        company_name: companyName || null,
        phone: null,
        address: null,
        city: null,
        postal_code: null,
        avatar_url: null,
        payment_gateway: null,
        insurance_company: null,
        insurance_policy_number: null,
        trial_ends_at: null,
        subscription_status: 'active',
        lessor_id: data.user.id,
      };

      setSession(newSession);
      setUser(data.user);
      setProfile(newProfile);
      saveSession(newSession, newProfile);

      return { error: null };
    } catch (e) {
      console.error('Signup error:', e);
      return { error: e instanceof Error ? e : new Error('Signup fejlede') };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: new Error(data.error || 'Login fejlede') };
      }

      // Save session and profile
      const newSession: Session = {
        access_token: data.token,
        user: data.user,
      };
      const newProfile: Profile = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name || data.user.email.split('@')[0],
        user_type: data.user.user_type || 'professionel',
        cvr_number: data.user.cvr_number || null,
        company_name: data.user.company_name || null,
        phone: null,
        address: null,
        city: null,
        postal_code: null,
        avatar_url: null,
        payment_gateway: null,
        insurance_company: null,
        insurance_policy_number: null,
        trial_ends_at: null,
        subscription_status: 'active',
        lessor_id: data.user.lessor_id || data.user.id,
      };

      setSession(newSession);
      setUser(data.user);
      setProfile(newProfile);
      saveSession(newSession, newProfile);

      return { error: null };
    } catch (e) {
      console.error('Login error:', e);
      return { error: e instanceof Error ? e : new Error('Login fejlede') };
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    clearSession();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Update local state
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      // Also update stored session
      if (session) {
        saveSession(session, updated);
      }
      return updated;
    });

    return { error: null };
  }, [user, session]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
