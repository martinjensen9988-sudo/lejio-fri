import React, { useState } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';

const FriTopBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNotifications] = useState(true);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 right-0 left-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Søg køretøjer, bookinger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 text-brown-900 placeholder:text-gray-400 focus:bg-white focus:border-pink-500"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 ml-6">
          {/* Pro Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 shadow-sm">
            <span className="text-sm font-medium text-white">✨ Pro Plan Aktiv</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-pink-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full"></span>
            )}
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200"></div>

          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-semibold">
            L
          </div>
        </div>
      </div>
    </header>
  );
};

export default FriTopBar;
