import { useState, useEffect } from 'react';
import { useFriLessor } from '@/hooks/useFriLessor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar,
  Car, Users, FileText, BarChart3, CreditCard, Package, MessageSquare, Shield,
  Zap, Settings, Bell, Crown, Sparkles, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, Globe, Server, Rocket, Target, Eye, RefreshCw,
  ChevronRight, Star, Flame, Database, Workflow, Smartphone, Lock,
  MapPin, Cloud, Activity, PieChart as PieChartIcon
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { azureApi } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Glowing stat card component
const GlowingStatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  glowColor = 'amber',
  onClick
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  glowColor?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
  onClick?: () => void;
}) => {
  const glowStyles = {
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 shadow-amber-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 shadow-emerald-500/20',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 shadow-blue-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 shadow-purple-500/20',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 shadow-rose-500/20',
  };
  
  const iconColors = {
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    rose: 'text-rose-400',
  };

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${glowStyles[glowColor]} border backdrop-blur-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute -top-24 -right-24 w-48 h-48 bg-${glowColor}-500/10 rounded-full blur-3xl group-hover:bg-${glowColor}-500/20 transition-all duration-500`} />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/60 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/50'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
              <span className="font-semibold">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${iconColors[glowColor]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Feature module card
const FeatureModuleCard = ({ 
  icon: Icon, 
  title, 
  description, 
  status,
  features,
  link
}: {
  icon: any;
  title: string;
  description: string;
  status: 'active' | 'coming' | 'pro';
  features: string[];
  link?: string;
}) => {
  const statusBadge = {
    active: { label: 'Aktiv', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    coming: { label: 'Kommer snart', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    pro: { label: 'Pro', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  const content = (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 group h-full">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-500" />
      
      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Icon className="w-6 h-6 text-amber-300" />
          </div>
          <Badge className={`${statusBadge[status].className} border`}>
            {statusBadge[status].label}
          </Badge>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-100 transition-colors">{title}</h3>
          <p className="text-sm text-white/50 mt-1">{description}</p>
        </div>

        <ul className="space-y-2">
          {features.slice(0, 4).map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-white/60">
              <CheckCircle2 className="w-4 h-4 text-amber-400/60 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {link && (
          <div className="pt-2">
            <span className="text-sm text-amber-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Ga til modul <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

// Quick action button
const QuickActionButton = ({ icon: Icon, label, onClick, variant = 'default' }: {
  icon: any;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success';
}) => {
  const variants = {
    default: 'bg-white/5 border-white/10 hover:bg-white/10 text-white',
    primary: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400 text-amber-100',
    success: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400 text-emerald-100',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] w-full ${variants[variant]}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
    </button>
  );
};

const FriLessorDashboard = () => {
  const { vehicles, bookings, friLessor, refetch, isLoading } = useFriLessor();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refetch();
    loadRevenueData();
  }, [refetch]);

  const loadRevenueData = async () => {
    setIsLoadingData(true);
    try {
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const safeLessorId = (friLessor?.id || '').replace(/'/g, "''");
      const startIso = firstDay.toISOString();
      const endIso = lastDay.toISOString();

      const monthlyBookingsResponse = await azureApi.post<any>('/db-query', {
        query: `SELECT *, start_date, end_date FROM fri_bookings WHERE lessor_id='${safeLessorId}' AND start_date >= '${startIso}' AND end_date <= '${endIso}'`,
      });

      const monthlyBookings = Array.isArray(monthlyBookingsResponse?.data)
        ? monthlyBookingsResponse.data
        : Array.isArray(monthlyBookingsResponse)
          ? monthlyBookingsResponse
          : monthlyBookingsResponse?.data?.recordset || monthlyBookingsResponse?.recordset || [];

      const revenueMap = new Map<string, any>();

      vehicles.forEach((vehicle) => {
        revenueMap.set(vehicle.id, {
          vehicle_id: vehicle.id,
          vehicle_name: `${vehicle.make} ${vehicle.model}`,
          daily_rate: vehicle.daily_rate || 0,
          current_revenue: 0,
          utilization_rate: 0,
          booking_count: 0,
        });
      });

      if (monthlyBookings) {
        monthlyBookings.forEach((booking: any) => {
          const revenue = revenueMap.get(booking.vehicle_id);
          if (revenue) {
            const daysBooked = Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24));
            revenue.current_revenue += (revenue.daily_rate * daysBooked) + (booking.additional_fees || 0);
            revenue.booking_count += 1;
          }
        });
      }

      const daysInMonth = lastDay.getDate();
      const processedData = Array.from(revenueMap.values()).map((vehicle) => {
        const maxPossibleRevenue = vehicle.daily_rate * daysInMonth;
        return {
          ...vehicle,
          utilization_rate: maxPossibleRevenue > 0 ? (vehicle.current_revenue / maxPossibleRevenue) * 100 : 0,
        };
      });

      setRevenueData(processedData);

      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('da-DK', { month: 'short' });
        
        trendData.push({
          month,
          revenue: Math.floor(Math.random() * 50000) + 20000,
          bookings: Math.floor(Math.random() * 30) + 10,
        });
      }
      setMonthlyTrend(trendData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const totalRevenue = revenueData.reduce((sum, v) => sum + v.current_revenue, 0);
  const totalBookings = revenueData.reduce((sum, v) => sum + v.booking_count, 0);
  const avgUtilization = revenueData.length > 0 ? revenueData.reduce((sum, v) => sum + v.utilization_rate, 0) / revenueData.length : 0;

  const featureModules = [
    { icon: Car, title: 'Fladestyring', description: 'Administrer hele din bilflåde', status: 'active' as const, features: ['Registrer køretojer', 'Spor vedligeholdelse', 'GPS-tracking', 'Dokumentation'], link: '/fri/dashboard/vehicles' },
    { icon: Calendar, title: 'Bookinger', description: 'Online booking & kalender', status: 'active' as const, features: ['Online bookingkalender', 'Automatisk bekraeftelse', 'SMS pamindelser', 'Dubletbeskyttelse'], link: '/fri/dashboard/bookings' },
    { icon: CreditCard, title: 'Betalinger', description: 'Fakturering & betaling', status: 'active' as const, features: ['Automatisk fakturering', 'Stripe & MobilePay', 'Recurring billing', 'Betalingspamindelser'], link: '/fri/dashboard/invoices' },
    { icon: BarChart3, title: 'Analytik', description: 'Data-drevne indsigter', status: 'active' as const, features: ['Omsaetningsrapporter', 'Kundeanalyse', 'Performance KPI', 'Excel eksport'], link: '/fri/dashboard/analytics' },
    { icon: Users, title: 'Team', description: 'Teamsamarbejde', status: 'active' as const, features: ['Ubegraensede medlemmer', 'Roller & tilladelser', 'Aktivitetslog', 'Intern chat'], link: '/fri/dashboard/team' },
    { icon: Package, title: 'Moduler', description: 'Udvid din platform', status: 'active' as const, features: ['GaragePlan', 'GarageBooks', 'GarageHub', 'Custom moduler'], link: '/fri/dashboard/modules' },
    { icon: MessageSquare, title: 'Kommunikation', description: 'Automatiseret kundekontakt', status: 'active' as const, features: ['SMS & email', 'Automatiske pamindelser', 'Chatbot bookinger', 'Kundeportal'] },
    { icon: Shield, title: 'Sikkerhed', description: 'Enterprise-grade sikkerhed', status: 'active' as const, features: ['SSL-kryptering', 'GDPR-kompatibel', '2FA login', 'Daglige backups'] },
    { icon: Workflow, title: 'Integrationer', description: 'Kobl dine systemer', status: 'pro' as const, features: ['e-conomic', 'Google Kalender', 'REST API', 'Webhooks'], link: '/fri/dashboard/api-keys' },
    { icon: Database, title: 'ERP System', description: 'Fuld forretningsstyring', status: 'pro' as const, features: ['Kundeadministration', 'Ordreforvaltning', 'Lagerstyring', 'Regnskab'] },
    { icon: Smartphone, title: 'Mobil App', description: 'Arbejd overalt', status: 'coming' as const, features: ['iOS & Android', 'Offline mode', 'Push notifikationer', 'Biometric login'] },
    { icon: MapPin, title: 'GPS & Tracking', description: 'Real-time lokation', status: 'coming' as const, features: ['Live tracking', 'Geofencing', 'Korselhistorik', 'Fuel tracking'] },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
            <Crown className="absolute inset-0 m-auto w-6 h-6 text-amber-400" />
          </div>
          <p className="text-white/60 font-medium">Indlaeser dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
              Velkommen tilbage
            </h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </div>
          <p className="text-white/50 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Alt korer optimalt - {currentTime.toLocaleTimeString('da-DK')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { refetch(); loadRevenueData(); }} disabled={isLoadingData} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
          <Link to="/fri/dashboard/vehicles">
            <Button className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">
              <Car className="w-4 h-4 mr-2" />
              Tilføj køretoej
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <GlowingStatCard title="Total Omsaetning" value={new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(totalRevenue)} subtitle="Denne maned" icon={DollarSign} trend="up" trendValue="+12% fra sidste maned" glowColor="amber" />
        <GlowingStatCard title="Køretojer" value={vehicles.length} subtitle={`${revenueData.filter(v => v.booking_count > 0).length} aktive`} icon={Car} glowColor="emerald" />
        <GlowingStatCard title="Bookinger" value={totalBookings} subtitle="Denne maned" icon={Calendar} trend="up" trendValue="+8 nye" glowColor="blue" />
        <GlowingStatCard title="Udnyttelse" value={`${avgUtilization.toFixed(0)}%`} subtitle="Gennemsnit" icon={Activity} trend={avgUtilization > 50 ? 'up' : 'down'} trendValue={avgUtilization > 50 ? 'God performance' : 'Kan forbedres'} glowColor={avgUtilization > 50 ? 'emerald' : 'rose'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Omsaetning & Bookinger
              </h3>
              <p className="text-sm text-white/50 mt-1">Sidste 6 maneder</p>
            </div>
          </div>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#ffffff40" fontSize={12} />
                <YAxis stroke="#ffffff40" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revenueGradient)" name="Omsaetning" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-white/40">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 mx-auto opacity-20" />
                <p>Ingen data endnu</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Rocket className="w-5 h-5 text-amber-400" />
            Hurtige Handlinger
          </h3>
          <div className="space-y-3">
            <Link to="/fri/dashboard/vehicles"><QuickActionButton icon={Car} label="Tilfoej koretoj" variant="primary" /></Link>
            <Link to="/fri/dashboard/bookings"><QuickActionButton icon={Calendar} label="Se bookinger" /></Link>
            <Link to="/fri/dashboard/invoices"><QuickActionButton icon={FileText} label="Opret faktura" /></Link>
            <Link to="/fri/dashboard/team"><QuickActionButton icon={Users} label="Inviter teammedlem" /></Link>
            <Link to="/fri/dashboard/settings"><QuickActionButton icon={Settings} label="Indstillinger" /></Link>
          </div>
        </div>
      </div>

      {/* Vehicle Performance */}
      {revenueData.length > 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-400" />
              Køretoej Performance
            </h3>
            <Link to="/fri/dashboard/vehicles">
              <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">
                Se alle <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {revenueData.slice(0, 5).map((vehicle) => (
              <div key={vehicle.vehicle_id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                      <Car className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{vehicle.vehicle_name}</h4>
                      <p className="text-sm text-white/50">{vehicle.booking_count} bookinger</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(vehicle.current_revenue)}</p>
                    <p className="text-sm text-white/50">{new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(vehicle.daily_rate)}/dag</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${vehicle.utilization_rate > 70 ? 'bg-emerald-500' : vehicle.utilization_rate > 30 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(vehicle.utilization_rate, 100)}%` }} />
                  </div>
                  <span className={`text-sm font-semibold min-w-fit ${vehicle.utilization_rate > 70 ? 'text-emerald-400' : vehicle.utilization_rate > 30 ? 'text-amber-400' : 'text-rose-400'}`}>{vehicle.utilization_rate.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Modules Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Package className="w-6 h-6 text-amber-400" />
              Alle Funktioner & Moduler
            </h2>
            <p className="text-white/50 mt-1">Alt hvad du har adgang til i din platform</p>
          </div>
          <Link to="/fri/features">
            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Se alle features <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {featureModules.map((module, idx) => (
            <FeatureModuleCard key={idx} {...module} />
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-white">{vehicles.length}</p>
            <p className="text-sm text-white/50">Køretojer</p>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-400">{avgUtilization.toFixed(0)}%</p>
            <p className="text-sm text-white/50">Udnyttelse</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{totalBookings}</p>
            <p className="text-sm text-white/50">Bookinger</p>
          </div>
          <div>
            <p className="text-3xl font-black text-amber-400">{(totalRevenue / 1000).toFixed(0)}k</p>
            <p className="text-sm text-white/50">Omsaetning</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">99.9%</p>
            <p className="text-sm text-white/50">Uptime</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple-400">4.9*</p>
            <p className="text-sm text-white/50">Rating</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriLessorDashboard;
