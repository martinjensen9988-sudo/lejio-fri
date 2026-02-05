import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { useBookings } from '@/hooks/useBookings';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LejioLogo from '@/components/LejioLogo';
import PendingFeesCard from '@/components/dashboard/PendingFeesCard';
import TrialStatusCard from '@/components/dashboard/TrialStatusCard';
import { 
  Car, Calendar, Menu, MessageCircle, Settings, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
}

export const DashboardLayout = ({ children, activeTab }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { unreadCount } = useUnreadMessages();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const activeBookings = bookings.filter(b => b.status === 'active').length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Premium background effects */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-10">
        <DashboardSidebar
          activeTab={activeTab}
          unreadCount={unreadCount}
          pendingBookings={pendingBookings}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile Header & Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-card/95 backdrop-blur-xl border-border/50">
                <DashboardSidebar
                  activeTab={activeTab}
                  unreadCount={unreadCount}
                  pendingBookings={pendingBookings}
                  onSignOut={handleSignOut}
                />
              </SheetContent>
            </Sheet>
            <LejioLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/messages')} className="relative">
              <MessageCircle className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:h-screen lg:overflow-y-auto relative z-10">
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard icon={Car} label="Dine biler" value={vehicles.length} loading={vehiclesLoading} gradient="from-primary to-primary/60" onClick={() => navigate('/dashboard/vehicles')} />
            <StatCard icon={Calendar} label="Afventende" value={pendingBookings} loading={bookingsLoading} highlight={pendingBookings > 0} gradient="from-accent to-accent/60" onClick={() => navigate('/dashboard/bookings')} />
            <StatCard icon={Calendar} label="Aktive" value={activeBookings} loading={bookingsLoading} gradient="from-mint to-mint/60" onClick={() => navigate('/dashboard/bookings')} />
            <StatCard icon={Calendar} label="Total" value={bookings.length} loading={bookingsLoading} gradient="from-lavender to-lavender/60" onClick={() => navigate('/dashboard/bookings')} />
          </div>

          <div className="space-y-4 mb-6">
            <TrialStatusCard />
            <PendingFeesCard />
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  loading?: boolean;
  highlight?: boolean;
  gradient?: string;
  onClick?: () => void;
}

const StatCard = ({ icon: Icon, label, value, loading, highlight, gradient = "from-primary to-primary/60", onClick }: StatCardProps) => (
  <div 
    className={`glass-strong rounded-xl sm:rounded-2xl p-3 sm:p-5 border transition-all duration-300 hover-lift ${highlight ? 'border-accent glow-accent' : 'border-border/50 hover:border-primary/30'} ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
    {loading ? (
      <Skeleton className="h-7 sm:h-9 w-12 sm:w-14" />
    ) : (
      <p className="font-display text-2xl sm:text-4xl font-black text-foreground">{value}</p>
    )}
    <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{label}</p>
  </div>
);

export default DashboardLayout;
