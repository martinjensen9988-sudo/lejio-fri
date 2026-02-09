import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Car, 
  Calendar, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  BarChart3,
  CreditCard,
  Package,
  Key,
  Store
} from 'lucide-react';
import { useFriAuthContext } from '@/providers/FriAuthProvider';
import { useRole, roleLabels } from '@/hooks/useRole';

const FriSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useFriAuthContext();
  const { hasAccess, role, roleLabel } = useRole();

  const allMenuItems = [
    { label: 'Dashboard', icon: Home, path: '/fri/dashboard', permission: 'dashboard' },
    { label: 'Køretøjer', icon: Car, path: '/fri/dashboard/vehicles', permission: 'vehicles' },
    { label: 'Bilforhandler', icon: Store, path: '/fri/dashboard/dealer', permission: 'dealer' },
    { label: 'Bookinger', icon: Calendar, path: '/fri/dashboard/bookings', permission: 'bookings' },
    { label: 'Fakturaer', icon: FileText, path: '/fri/dashboard/invoices', permission: 'invoices' },
    { label: 'Team', icon: Users, path: '/fri/dashboard/team', permission: 'team' },
    { label: 'Analytik', icon: BarChart3, path: '/fri/dashboard/analytics', permission: 'analytics' },
    { label: 'Betalinger', icon: CreditCard, path: '/fri/dashboard/payments', permission: 'payments' },
    { label: 'Moduler', icon: Package, path: '/fri/dashboard/modules', permission: 'modules' },
    { label: 'API-nøgler', icon: Key, path: '/fri/dashboard/api-keys', permission: 'api-keys' },
    { label: 'Indstillinger', icon: Settings, path: '/fri/dashboard/settings', permission: 'settings' },
  ];

  // Filter menu items based on user's role permissions
  const menuItems = allMenuItems.filter(item => hasAccess(item.permission));

  const isActive = (path: string) => {
    if (path === '/fri/dashboard') {
      return location.pathname === '/fri/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white text-brown-900 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-gray-200 shadow-sm">
      {/* Logo/Branding Area */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-brown-900">Din platform</h1>
            <p className="text-xs text-gray-500">Alt-i-én til autobranchen</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                active
                  ? 'bg-pink-50 text-pink-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-brown-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-pink-500' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-semibold text-pink-600">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brown-900 truncate">{user?.email || 'Bruger'}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => signOut?.()}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log ud
        </button>
      </div>
    </aside>
  );
};

export default FriSidebar;
