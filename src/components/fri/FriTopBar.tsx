import React, { useState } from 'react';
import { Search, Bell, Settings, Menu, X, Sparkles } from 'lucide-react';
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
    <header className="bg-[#0a0d14]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 right-0 left-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Søg køretøjer, bookinger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 ml-6">
          {/* Upgrade Banner */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-100">Pro Plan Aktiv</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-white/60 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-all duration-300 border border-transparent hover:border-amber-500/30">
            <Bell className="w-5 h-5" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            )}
          </button>

          {/* Settings */}
          <button className="p-2 text-white/60 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-all duration-300 border border-transparent hover:border-amber-500/30">
            <Settings className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10"></div>

          {/* User Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              L
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FriTopBar;
