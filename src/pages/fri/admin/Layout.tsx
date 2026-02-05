import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFriAdminAuth } from '@/hooks/useFriAdminAuth';
import { LayoutDashboard, Users, MessageSquare, DollarSign, LogOut, Menu, X } from 'lucide-react';
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
    { path: '/fri/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/fri/admin/lessors', label: 'Lessors', icon: Users },
    { path: '/fri/admin/support', label: 'Support', icon: MessageSquare },
    { path: '/fri/admin/payments', label: 'Betalinger', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col border-r border-gray-800`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold">Din platform</h1>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          {sidebarOpen && admin && (
            <div className="px-2">
              <p className="text-xs text-gray-400">Logget ind som</p>
              <p className="text-sm font-medium truncate">{admin.admin_email}</p>
              {admin.is_super_admin && (
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">
                  Super Admin
                </span>
              )}
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {sidebarOpen && 'Log ud'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
