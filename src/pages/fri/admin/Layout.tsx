import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFriAdminAuth } from '@/hooks/useFriAdminAuth';
import { LayoutDashboard, Users, MessageSquare, DollarSign, LogOut, Menu, X, Shield, Sparkles, Layers } from 'lucide-react';
import { useState } from 'react';

interface FriAdminLayoutProps {
  children: ReactNode;
}

export const FriAdminLayout = ({ children }: FriAdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useFriAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/fri/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { path: '/fri/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-violet-500 to-indigo-500' },
    { path: '/fri/admin/lessors', label: 'Lessors', icon: Users, gradient: 'from-blue-500 to-cyan-400' },
    { path: '/fri/admin/support', label: 'Support', icon: MessageSquare, gradient: 'from-emerald-500 to-teal-400' },
    { path: '/fri/admin/payments', label: 'Betalinger', icon: DollarSign, gradient: 'from-amber-500 to-orange-400' },
    { path: '/fri/admin/modules', label: 'Moduler', icon: Layers, gradient: 'from-amber-400 to-yellow-300' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-100 transition-all duration-300 flex flex-col shadow-sm`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-brown-900">Lejio Fri</h1>
                <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Admin Panel</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-violet-50 text-violet-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  active
                    ? `bg-gradient-to-br ${item.gradient} shadow-sm`
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                </div>
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-gray-100 space-y-3">
          {sidebarOpen && admin && (
            <div className="px-3 py-3 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Logget ind som</p>
                  <p className="text-sm font-semibold text-brown-900 truncate">{admin.admin_email}</p>
                </div>
              </div>
              {admin.is_super_admin && (
                <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Super Admin
                </span>
              )}
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && 'Log ud'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50/50">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
