import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Calendar, Receipt, Tag, Truck, AlertTriangle, Flag, 
  UserCog, MessageCircle, Headphones, ShieldCheck, MapPin, BarChart3,
  Menu, Camera, Building2, Facebook, UsersRound, LogOut, CheckCircle, Clock, Sparkles, HeadphonesIcon,
  FileText, Key, Briefcase, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/azure/client';

interface AdminDashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
}

const menuItems = [
  { value: 'global-pages', icon: FileText, label: 'Globale sider', path: '/admin/global-pages' },
  { value: 'customer-service', icon: HeadphonesIcon, label: 'Kundeservice', path: '/admin/customer-service' },
  { value: 'users', icon: UserCog, label: 'Brugerstyring', path: '/admin/users' },
  { value: 'staff', icon: UsersRound, label: 'Medarbejdere', path: '/admin/staff' },
  { value: 'bookings', icon: Calendar, label: 'Bookinger', path: '/admin/bookings' },
  { value: 'locations', icon: MapPin, label: 'Lokationer', path: '/admin/locations' },
  { value: 'fees', icon: Receipt, label: 'Gebyrer', path: '/admin/fees' },
  { value: 'discounts', icon: Tag, label: 'Rabatkoder', path: '/admin/discounts' },
  { value: 'fleet', icon: Truck, label: 'Fleet', path: '/admin/fleet' },
  { value: 'warnings', icon: AlertTriangle, label: 'Advarsler', path: '/admin/warnings' },
  { value: 'lessor-reports', icon: Flag, label: 'Rapporter', path: '/admin/reports' },
  { value: 'messages', icon: MessageCircle, label: 'Beskeder', path: '/admin/messages' },
  { value: 'live-chat', icon: Headphones, label: 'Live Chat', path: '/admin/live-chat' },
  { value: 'vehicle-values', icon: ShieldCheck, label: 'Bilværdier', path: '/admin/vehicle-values' },
  { value: 'gps', icon: MapPin, label: 'GPS', path: '/admin/gps' },
  { value: 'checkinout', icon: Camera, label: 'Check-in/out', path: '/admin/checkinout' },
  { value: 'corporate', icon: Building2, label: 'Virksomheder', path: '/admin/corporate' },
  { value: 'corporate-employees', icon: Users, label: 'Medarbejderstyring', path: '/admin/corporate/employees' },
  { value: 'corporate-budget', icon: DollarSign, label: 'Budget Management', path: '/admin/corporate/budget' },
  { value: 'corporate-settlement', icon: FileText, label: 'Settlement Rapporter', path: '/admin/corporate/settlement' },
  { value: 'facebook', icon: Facebook, label: 'Facebook', path: '/admin/facebook' },
  { value: 'crm', icon: Briefcase, label: 'Salg & CRM', path: '/admin/crm' },
  { value: 'driver-licenses', icon: ShieldCheck, label: 'Kørekort', path: '/admin/driver-licenses' },
  { value: 'api-keys', icon: Key, label: 'API-nøgler', path: '/admin/api-keys' },
  { value: 'stats', icon: BarChart3, label: 'Statistik', path: '/admin/stats' },
  { value: 'audit-log', icon: FileText, label: 'Audit Log', path: '/admin/audit-log', superAdminOnly: true },
  { value: 'feature-flags', icon: Sparkles, label: 'Feature Flags', path: '/admin/feature-flags', superAdminOnly: true },
];

interface MenuItem {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  superAdminOnly?: boolean;
}

export const AdminDashboardLayout = ({ children, activeTab }: AdminDashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut, isSuperAdmin } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalCustomers: 0, activeCustomers: 0, trialCustomers: 0, totalBookings: 0 });

  // Filter menu items based on role
  const filteredMenuItems = (menuItems as MenuItem[]).filter(item => !item.superAdminOnly || isSuperAdmin);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: customersData } = await supabase
      .from('profiles')
      .select('subscription_status, manual_activation');
    
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (customersData) {
      setStats({
        totalCustomers: customersData.length,
        activeCustomers: customersData.filter(c => c.subscription_status === 'active' || c.manual_activation).length,
        trialCustomers: customersData.filter(c => c.subscription_status === 'trial').length,
        totalBookings: bookingsCount || 0,
      });
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin');
    } catch (error) {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display font-bold">LEJIO Admin</span>
                </div>
                <nav className="p-2 max-h-[calc(100vh-80px)] overflow-y-auto">
                  {filteredMenuItems.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        activeTab === item.value 
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-display font-bold">LEJIO Admin</h1>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="font-medium">
            <LogOut className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Log ud</span>
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-card/50 backdrop-blur-sm min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-3 space-y-1">
            {filteredMenuItems.map((item) => (
              <button
                key={item.value}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  activeTab === item.value 
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg' 
                    : 'hover:bg-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6 relative z-10">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card 
              className="p-4 bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-primary/30 transition-all cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate('/admin/users')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/users')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-display text-2xl font-black">{stats.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Kunder</p>
                </div>
              </div>
            </Card>
            <Card 
              className="p-4 bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-accent/30 transition-all cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate('/admin/users')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/users')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-display text-2xl font-black">{stats.activeCustomers}</p>
                  <p className="text-xs text-muted-foreground">Aktive</p>
                </div>
              </div>
            </Card>
            <Card 
              className="p-4 bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-mint/30 transition-all cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate('/admin/users')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/users')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-mint to-mint/60 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-display text-2xl font-black">{stats.trialCustomers}</p>
                  <p className="text-xs text-muted-foreground">Prøve</p>
                </div>
              </div>
            </Card>
            <Card 
              className="p-4 bg-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-lavender/30 transition-all cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate('/admin/bookings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/bookings')}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender to-lavender/60 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-display text-2xl font-black">{stats.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Bookinger</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Mobile Tab Indicator */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Sektion:</span>
            <Badge variant="secondary" className="font-medium">
              {menuItems.find(m => m.value === activeTab)?.label}
            </Badge>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};
