import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Car, Calendar, CalendarDays, Receipt, Users, Heart, Repeat, Wrench, CircleDot, Shield, AlertCircle, BarChart3, Sparkles, Truck, TrendingDown, MapPin, MessageCircle, FileText, Search, Settings, LogOut, Home, Building2, Gift, Bike, ChevronDown, ChevronRight, Zap, Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import LejioLogo from "@/components/LejioLogo";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  value: string;
  badge?: number;
}

interface MenuGroup {
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
  gradient?: string;
}

interface DashboardSidebarProps {
  activeTab: string;
  unreadCount?: number;
  pendingBookings?: number;
  onSignOut: () => void;
}

export const DashboardSidebar = ({ activeTab, unreadCount = 0, pendingBookings = 0, onSignOut }: DashboardSidebarProps) => {
  const navigate = useNavigate();

  const getRouteForTab = (tab: string) => {
    const routeMap: Record<string, string> = {
      'vehicles': '/dashboard/vehicles', 'calendar': '/dashboard/calendar', 'bookings': '/dashboard/bookings',
      'locations': '/dashboard/locations', 'invoices': '/dashboard/invoices', 'fines': '/dashboard/fines',
      'revenue-loss': '/dashboard/revenue-loss', 'customers': '/dashboard/customers', 'favorites': '/dashboard/favorites',
      'recurring': '/dashboard/recurring', 'warnings': '/dashboard/warnings', 'service': '/dashboard/service',
      'tires': '/dashboard/tires', 'inspections': '/dashboard/inspections', 'analytics': '/dashboard/analytics',
      'ai-pricing': '/dashboard/ai-pricing', 'fleet-ai': '/dashboard/fleet-ai', 'fleet': '/dashboard/fleet',
      'deductibles': '/dashboard/deductibles', 'api-keys': '/dashboard/api-keys',
    };
    return routeMap[tab] || '/dashboard/vehicles';
  };

  const handleNavigate = (tab: string) => navigate(getRouteForTab(tab));

  const menuGroups: MenuGroup[] = [
    { title: "Overblik", icon: Home, defaultOpen: true, gradient: "from-primary to-primary/60", items: [
      { label: "Mine biler", icon: Car, value: "vehicles" },
      { label: "Kalender", icon: CalendarDays, value: "calendar" },
      { label: "Bookinger", icon: Calendar, value: "bookings", badge: pendingBookings },
      { label: "Lokationer", icon: MapPin, value: "locations" },
      { label: "Fleet", icon: Truck, value: "fleet" },
    ]},
    { title: "Økonomi", icon: Receipt, gradient: "from-accent to-accent/60", items: [
      { label: "Fakturaer", icon: Receipt, value: "invoices" },
      { label: "Bøder", icon: AlertCircle, value: "fines" },
      { label: "Tabt indtægt", icon: TrendingDown, value: "revenue-loss" },
    ]},
    { title: "Kunder", icon: Users, gradient: "from-mint to-mint/60", items: [
      { label: "Kundesegmenter", icon: Users, value: "customers" },
      { label: "Favoritter", icon: Heart, value: "favorites" },
      { label: "Abonnementer", icon: Repeat, value: "recurring" },
      { label: "Advarselsregister", icon: AlertCircle, value: "warnings" },
    ]},
    { title: "Værksted & Service", icon: Wrench, gradient: "from-orange-500 to-orange-500/60", items: [
      { label: "Service", icon: Wrench, value: "service" },
      { label: "Dæk", icon: CircleDot, value: "tires" },
      { label: "Syn", icon: Shield, value: "inspections" },
    ]},
    { title: "AI & Analytics", icon: Sparkles, gradient: "from-lavender to-lavender/60", items: [
      { label: "Analytics", icon: BarChart3, value: "analytics" },
      { label: "AI Priser", icon: Sparkles, value: "ai-pricing" },
      { label: "Flåde AI", icon: Truck, value: "fleet-ai" },
    ]},
    { title: "Selvrisiko", icon: Shield, gradient: "from-teal-500 to-teal-500/60", items: [
      { label: "Selvrisko-profiler", icon: Shield, value: "deductibles" },
    ]},
    { title: "Integrationer", icon: Key, gradient: "from-violet-500 to-violet-500/60", items: [
      { label: "API-nøgler", icon: Key, value: "api-keys" },
    ]},
  ];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuGroups.forEach((group) => {
      if (group.defaultOpen || group.items.some((item) => item.value === activeTab)) {
        initial[group.title] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (title: string) => setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <div className="w-64 glass-strong border-r border-border/50 h-screen flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <LejioLogo size="sm" />
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold text-primary">
            <Zap className="w-3 h-3" />
            Pro
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-border/50 space-y-2">
        <Button variant="glass" size="sm" className="w-full justify-start font-medium" onClick={() => navigate("/search")}>
          <Search className="w-4 h-4 mr-2" />
          Find bil
        </Button>
        <Button variant="glass" size="sm" className="w-full justify-start font-medium relative" onClick={() => navigate("/messages")}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Beskeder
          {unreadCount > 0 && (
            <span className="absolute right-2 min-w-5 h-5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
        <Button variant="glass" size="sm" className="w-full justify-start font-medium" onClick={() => navigate("/gps")}>
          <MapPin className="w-4 h-4 mr-2" />
          GPS-sporing
        </Button>
      </div>

      {/* Menu Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuGroups.map((group) => (
          <Collapsible key={group.title} open={openGroups[group.title]} onOpenChange={() => toggleGroup(group.title)}>
            <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-md`}>
                  <group.icon className="w-4 h-4 text-white" />
                </div>
                <span>{group.title}</span>
              </div>
              {openGroups[group.title] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleNavigate(item.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-all duration-200",
                    activeTab === item.value
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium shadow-lg glow-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="min-w-5 h-5 flex items-center justify-center text-xs font-bold bg-accent text-white rounded-full px-1 shadow-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start font-medium rounded-xl" onClick={() => navigate("/my-rentals")}>
          <FileText className="w-4 h-4 mr-2" />
          Mine lejeaftaler
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start font-medium rounded-xl" onClick={() => navigate("/settings")}>
          <Settings className="w-4 h-4 mr-2" />
          Indstillinger
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={onSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Log ud
        </Button>
      </div>
    </div>
  );
};
