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
  Crown,
  BarChart3,
  CreditCard,
  Package,
  MessageSquare,
  Shield,
  Zap,
  Key,
  Sparkles
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
      label: 'Analytik',
      icon: BarChart3,
      path: '/fri/dashboard/analytics',
    },
    {
      label: 'Betalinger',
      icon: CreditCard,
      path: '/fri/dashboard/payments',
    },
    {
      label: 'Moduler',
      icon: Package,
      path: '/fri/dashboard/modules',
    },
    {
      label: 'API-nøgler',
      icon: Key,
      path: '/fri/dashboard/api-keys',
    },
    {
      label: 'Indstillinger',
      icon: Settings,
      path: '/fri/dashboard/settings',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/fri/dashboard') {
      return location.pathname === '/fri/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-[#0a0d14] text-white flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-white/10">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo/Branding Area */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)]">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">Din platform</h1>
            <p className="text-xs text-white/50">Biludlejningsplatform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                active
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-100'
                  : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-white/50 group-hover:text-amber-400/70'} transition-colors`} />
              <span className="font-medium">{item.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-200">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.email || 'Bruger'}</p>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <p className="text-xs text-amber-400/80">Pro Lessor</p>
            </div>
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
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-300 border border-transparent hover:border-rose-500/30"
        >
          <LogOut className="w-4 h-4" />
          Log ud
        </button>
      </div>
    </aside>
  );
};

export default FriSidebar;
