import { ReactNode } from 'react';
import { useRole } from '@/hooks/useRole';
import type { FriUserRole } from '@/hooks/useFriAuth';

interface RoleGateProps {
  /** Permission key to check (e.g. 'settings', 'payments', 'team') */
  permission?: string;
  /** Alternative: allow if user has any of these roles */
  roles?: FriUserRole[];
  /** Content to show when access is granted */
  children: ReactNode;
  /** Optional fallback content when access is denied (defaults to nothing) */
  fallback?: ReactNode;
}

/**
 * RoleGate - Conditionally renders children based on user role/permissions.
 * 
 * Usage:
 *   <RoleGate permission="settings">
 *     <SettingsButton />
 *   </RoleGate>
 * 
 *   <RoleGate roles={['owner', 'manager']}>
 *     <DeleteButton />
 *   </RoleGate>
 */
export function RoleGate({ permission, roles, children, fallback = null }: RoleGateProps) {
  const { hasAccess, hasRole } = useRole();

  // Check by permission key
  if (permission && !hasAccess(permission)) {
    return <>{fallback}</>;
  }

  // Check by role list
  if (roles && !hasRole(...roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * AccessDeniedPage - shown when a user navigates to a page they don't have access to
 */
export function AccessDeniedPage() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m5-7V8a5 5 0 00-10 0v3m-2 0h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Ingen adgang</h2>
        <p className="text-sm text-gray-500">Du har ikke adgang til denne side. Kontakt din administrator.</p>
      </div>
    </div>
  );
}
