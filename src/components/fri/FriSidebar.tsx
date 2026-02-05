import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Car, 
  Calendar, 
  FileText, 
  Users, 
  Settings,
  LogOut
} from 'lucide-react';
import { useFriAuthContext } from '@/providers/FriAuthProvider';

const FriSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useFriAuthContext();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/fri/dashboard',
    },
    {
      label: 'Køretøjer',
      icon: Car,
      path: '/fri/dashboard/vehicles',
    },
    {
      label: 'Bookinger',
      icon: Calendar,
      path: '/fri/dashboard/bookings',
    },
    {
      label: 'Fakturaer',
      icon: FileText,
      path: '/fri/dashboard/invoices',
    },
    {
      label: 'Team',
      icon: Users,
      path: '/fri/dashboard/team',
    },
    {
      label: 'Indstillinger',
      icon: Settings,
      path: '/fri/dashboard/settings',
    },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-[#4CAF50] to-[#45a049] text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo/Branding Area */}
      <div className="p-6 border-b border-white/20">
        <h1 className="text-2xl font-bold">Din platform</h1>
        <p className="text-sm text-white/80 mt-1">Biludlejningsplatform</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-white/20 font-semibold'
                  : 'hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-white/20 p-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.email || 'Bruger'}</p>
            <p className="text-xs text-white/70">Lessor</p>
          </div>
        </div>
        <button
          onClick={() => {
            try {
              signOut?.();
            } catch (err) {
              console.error('Logout error:', err);
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log ud
        </button>
      </div>
    </aside>
  );
};

export default FriSidebar;
