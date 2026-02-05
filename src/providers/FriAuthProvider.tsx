import { createContext, useContext, ReactNode } from 'react';
import { useFriAuth } from '@/hooks/useFriAuth';

interface FriAuthUser {
  id: string;
  email: string;
  company_name?: string;
  isLessor?: boolean;
}

interface FriAuthContextType {
  user: FriAuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: Error | null;
}

const FriAuthContext = createContext<FriAuthContextType | undefined>(undefined);

export function FriAuthProvider({ children }: { children: ReactNode }) {
  const auth = useFriAuth();

  return <FriAuthContext.Provider value={auth}>{children}</FriAuthContext.Provider>;
}

export function useFriAuthContext(): FriAuthContextType {
  const context = useContext(FriAuthContext);
  if (!context) {
    throw new Error('useFriAuthContext must be used within FriAuthProvider');
  }
  return context;
}
