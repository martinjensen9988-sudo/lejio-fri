import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';

const API_BASE = '';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth-session`, {
          credentials: 'include',
        });
        const data = await response.json();
        
        if (data.user) {
          const userData = data.user;
          setUser(userData);
          setSession({ access_token: 'cookie', user: userData });
          setProfile({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            user_type: userData.user_type || 'professionel',
            cvr_number: userData.cvr_number || null,
            company_name: userData.company_name || null,
            lessor_id: userData.lessor_id || userData.id,
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
          });
        }
      } catch (e) {
        console.error('Session check error:', e);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
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
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName, userType, cvrNumber, companyName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: new Error(data.error || 'Tilmelding fejlede') };
      }

      // Set user state from response
      const userData = data.user;
      setUser(userData);
      setSession({ access_token: 'cookie', user: userData });
      setProfile({
        id: userData.id,
        email: userData.email,
        full_name: fullName,
        user_type: userType,
        cvr_number: cvrNumber || null,
        company_name: companyName || null,
        lessor_id: userData.id,
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
      });

      return { error: null };
    } catch (e) {
      console.error('Signup error:', e);
      return { error: e instanceof Error ? e : new Error('Tilmelding fejlede') };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: new Error(data.error || 'Login fejlede') };
      }

      // Set user state from response
      const userData = data.user;
      setUser(userData);
      setSession({ access_token: 'cookie', user: userData });
      setProfile({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || userData.email.split('@')[0],
        user_type: userData.user_type || 'professionel',
        cvr_number: userData.cvr_number || null,
        company_name: userData.company_name || null,
        lessor_id: userData.lessor_id || userData.id,
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
      });

      return { error: null };
    } catch (e) {
      console.error('Login error:', e);
      return { error: e instanceof Error ? e : new Error('Login fejlede') };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth-logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Ikke logget ind') };

    // Update local state
    setProfile(prev => prev ? { ...prev, ...updates } : null);
    return { error: null };
  }, [user]);

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
