import { ReactNode } from 'react';
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
  const { hasAccess } = useRole();

  if (!hasAccess(permission)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
