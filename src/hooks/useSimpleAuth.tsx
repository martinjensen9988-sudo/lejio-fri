// Simple auth hook for Lejio Fri
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, Session, getSession, clearSession } from '@/lib/api';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  lessor_id: string;
  user_type: 'privat' | 'professionel';
  company_name?: string;
  cvr_number?: string;
}

interface AuthContextType {
  user: Session['user'] | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, userType?: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    const savedSession = getSession();
    if (savedSession) {
      setSession(savedSession);
      setUser(savedSession.user);
      // Create profile from session user
      setProfile({
        id: savedSession.user.id,
        email: savedSession.user.email,
        full_name: savedSession.user.full_name || null,
        lessor_id: savedSession.user.lessor_id || savedSession.user.id,
        user_type: 'professionel',
      });
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await auth.signIn(email, password);
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
      setProfile({
        id: result.session.user.id,
        email: result.session.user.email,
        full_name: result.session.user.full_name || null,
        lessor_id: result.session.user.lessor_id || result.session.user.id,
        user_type: 'professionel',
      });
    }
    return { error: result.error };
  };

  const signUp = async (email: string, password: string, fullName: string, userType?: string) => {
    const result = await auth.signUp(email, password, fullName);
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
      setProfile({
        id: result.session.user.id,
        email: result.session.user.email,
        full_name: result.session.user.full_name || fullName,
        lessor_id: result.session.user.lessor_id || result.session.user.id,
        user_type: (userType as 'privat' | 'professionel') || 'professionel',
      });
    }
    return { error: result.error };
  };

  const signOut = () => {
    clearSession();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
