import { useFriAuthContext } from '@/providers/FriAuthProvider';
import type { FriUserRole } from '@/hooks/useFriAuth';

/**
 * Role permission matrix
 * Defines which pages/features each role can access
 */
const rolePermissions: Record<FriUserRole, string[]> = {
  owner: [
    'dashboard', 'vehicles', 'dealer', 'bookings', 'invoices', 'team',
    'analytics', 'payments', 'modules', 'api-keys', 'settings',
    'settings.billing', 'create-vehicle', 'create-booking',
    'create-invoice', 'page-builder', 'payout',
  ],
  manager: [
    'dashboard', 'vehicles', 'dealer', 'bookings', 'invoices', 'team',
    'analytics', 'modules', 'api-keys', 'settings',
    'create-vehicle', 'create-booking', 'create-invoice',
  ],
  salesperson: [
    'dashboard', 'vehicles', 'dealer', 'bookings',
    'create-booking',
  ],
  accountant: [
    'dashboard', 'invoices', 'payments', 'analytics',
    'create-invoice',
  ],
  mechanic: [
    'dashboard', 'vehicles',
  ],
  driver: [
    'dashboard', 'bookings',
  ],
};

/**
 * Role display labels (Danish)
 */
export const roleLabels: Record<FriUserRole, string> = {
  owner: 'Ejer',
  manager: 'Manager',
  salesperson: 'Sælger',
  accountant: 'Regnskab',
  mechanic: 'Mekaniker',
  driver: 'Chauffør',
};

/**
 * Hook to check the current user's role and permissions
 */
export function useRole() {
  const { user } = useFriAuthContext();
  const role: FriUserRole = user?.role || 'owner';

  /**
   * Check if the current user has access to a specific permission/page
   */
  const hasAccess = (permission: string): boolean => {
    const perms = rolePermissions[role];
    return perms?.includes(permission) ?? false;
  };

  /**
   * Check if the user has one of the specified roles
   */
  const hasRole = (...roles: FriUserRole[]): boolean => {
    return roles.includes(role);
  };

  /**
   * Check if the user is an owner or manager (admin-level)
   */
  const isAdmin = role === 'owner' || role === 'manager';

  /**
   * Check if user is the account owner
   */
  const isOwner = role === 'owner';

  return {
    role,
    hasAccess,
    hasRole,
    isAdmin,
    isOwner,
    roleLabel: roleLabels[role],
  };
}

export type { FriUserRole };
