import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useFriAuthContext } from '@/providers/FriAuthProvider';
import { useRole } from '@/hooks/useRole';
import { AccessDeniedPage } from '@/components/fri/RoleGate';

interface ProtectedRouteProps {
  permission: string;
  children: ReactNode;
}

/**
 * Wraps a route element and shows AccessDeniedPage if the user lacks the required permission.
 * Used in App.tsx route definitions to gate entire pages.
 */
export function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { user, loading } = useFriAuthContext();
  const { hasAccess } = useRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Indlaeser...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(permission)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
