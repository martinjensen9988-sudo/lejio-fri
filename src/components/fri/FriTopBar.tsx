import React, { useState } from 'react';
import { Search, Bell, Settings, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FriTopBarProps {
  onMenuToggle?: (open: boolean) => void;
  sidebarOpen?: boolean;
}

const FriTopBar: React.FC<FriTopBarProps> = ({ onMenuToggle, sidebarOpen = true }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNotifications, setHasNotifications] = useState(true);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 right-0 left-0 z-30 ml-64">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Søg køretøjer, bookinger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6 ml-6">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200"></div>

          {/* User Indicator (Simple) */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#45a049] flex items-center justify-center text-white text-sm font-semibold">
              L
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FriTopBar;
