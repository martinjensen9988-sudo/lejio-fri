import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminFleetPremiumVehicles, FleetCustomerWithVehicles } from '@/hooks/useAdminFleetPremiumVehicles';
import { FleetExportButton } from '@/components/fleet/FleetExportButton';
import { FleetVehicleStats } from '@/hooks/useFleetPremiumVehicles';
import {
  Car,
  Building2,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Gauge,
  MapPin,
  Star,
  Droplets,
  Home,
  Users,
  TrendingUp,
  Wallet,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdminFleetPremiumDashboard = () => {
  const {
    customers,
    allVehicles,
    globalSummary,
    isLoading,
    lastCalculatedAt,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    triggerRecalculation,
  } = useAdminFleetPremiumVehicles();
  
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await triggerRecalculation();
    setIsRecalculating(false);
  };
  
  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return 'Aldrig';
    const date = new Date(dateString);
    return date.toLocaleString('da-DK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'Marts' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Maj' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Filter vehicles based on search and selected customer
  const filteredVehicles = allVehicles.filter(v => {
    const matchesSearch = !searchQuery || 
      v.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${v.make} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCustomer = !selectedCustomerId || v.owner_id === selectedCustomerId;
    return matchesSearch && matchesCustomer;
  });

  const currentVehicle = filteredVehicles[currentVehicleIndex];

  const goToPrevVehicle = () => {
    setCurrentVehicleIndex(prev => (prev === 0 ? filteredVehicles.length - 1 : prev - 1));
  };

  const goToNextVehicle = () => {
    setCurrentVehicleIndex(prev => (prev === filteredVehicles.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-3 h-48 rounded-2xl" />
          <Skeleton className="col-span-6 h-48 rounded-2xl" />
          <Skeleton className="col-span-3 h-48 rounded-2xl" />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-4 h-64 rounded-2xl" />
          <Skeleton className="col-span-4 h-64 rounded-2xl" />
          <Skeleton className="col-span-4 h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!globalSummary || allVehicles.length === 0) {
    return (
      <Card className="bg-card rounded-3xl shadow-lg">
        <CardContent className="py-16 text-center">
          <Car className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
          <h3 className="text-xl font-semibold mb-3">Ingen fleet biler endnu</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Fleet Premium køretøjer vises her, når de er registreret i systemet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector & Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-32 rounded-xl border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 rounded-xl border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg bil eller nummerplade..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentVehicleIndex(0);
            }}
            className="pl-9 rounded-xl"
          />
        </div>

        <Select 
          value={selectedCustomerId || "all"} 
          onValueChange={(v) => {
            setSelectedCustomerId(v === "all" ? null : v);
            setCurrentVehicleIndex(0);
          }}
        >
          <SelectTrigger className="w-56 rounded-xl border-border/50">
            <SelectValue placeholder="Alle kunder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kunder</SelectItem>
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.company_name || c.full_name || c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FleetExportButton 
          vehicles={filteredVehicles} 
          summary={globalSummary} 
          month={selectedMonth}
          year={selectedYear}
        />

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRecalculate} 
          disabled={isRecalculating}
          className="rounded-xl"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isRecalculating && "animate-spin")} />
          {isRecalculating ? 'Opdaterer...' : 'Opdater data'}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
          <Clock className="w-3 h-3" />
          <span>Sidst opdateret: {formatLastUpdated(lastCalculatedAt)}</span>
        </div>
      </div>

      {/* Global Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-muted-foreground">Fleet Kunder</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/30 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{globalSummary.totalVehicles}</p>
              <p className="text-xs text-muted-foreground">Biler i alt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-mint/10 to-mint/5 rounded-2xl border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-mint/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-mint" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(globalSummary.totalMonthlyGrossRevenue)}</p>
              <p className="text-xs text-muted-foreground">Brutto kr</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(globalSummary.totalCommission)}</p>
              <p className="text-xs text-muted-foreground">Kommission kr</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-mint/10 to-mint/5 rounded-2xl border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-mint/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-mint" />
            </div>
            <div>
              <p className="text-2xl font-bold">{globalSummary.averageUtilization.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Gns. udnyttelse</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main bento grid */}
      {currentVehicle && (
        <div className="grid grid-cols-12 gap-4 auto-rows-min">
          {/* Monthly Earnings - Donut Chart */}
          <Card className="col-span-12 md:col-span-3 bg-card rounded-3xl shadow-sm border-0 overflow-hidden">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <p className="text-sm font-medium text-foreground mb-4">Månedlig indtjening</p>
              <DonutChart 
                value={currentVehicle?.netPayout || 0}
                gross={currentVehicle?.monthlyGrossRevenue || 0}
                commission={currentVehicle?.lejioCommissionAmount || 0}
              />
            </CardContent>
          </Card>

          {/* Vehicle Hero */}
          <Card className="col-span-12 md:col-span-6 bg-card rounded-3xl shadow-sm border-0 overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center justify-center relative">
              {/* Customer badge */}
              {currentVehicle && (
                <div className="absolute top-4 left-4">
                  <Badge variant="outline" className="bg-muted/50">
                    {customers.find(c => c.id === currentVehicle.owner_id)?.company_name || 
                     customers.find(c => c.id === currentVehicle.owner_id)?.full_name || 
                     'Ukendt kunde'}
                  </Badge>
                </div>
              )}

              {/* Vehicle navigation */}
              {filteredVehicles.length > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-8 w-8"
                    onClick={goToPrevVehicle}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentVehicleIndex + 1} / {filteredVehicles.length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-8 w-8"
                    onClick={goToNextVehicle}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Car image */}
              <div className="w-full h-40 flex items-center justify-center mb-4 mt-6">
                {currentVehicle?.image_url ? (
                  <img 
                    src={currentVehicle.image_url} 
                    alt={`${currentVehicle.make} ${currentVehicle.model}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Car className="w-32 h-32 text-muted-foreground/20" />
                )}
              </div>

              {/* Vehicle info bar */}
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4" />
                  <span>{currentVehicle?.current_odometer?.toLocaleString('da-DK') || '0'} km</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <Car className="w-4 h-4" />
                  <span className="font-semibold text-foreground">
                    {formatCurrency(currentVehicle?.yearlyGrossRevenue || 0)} kr
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-accent">
                  <Star className="w-4 h-4 fill-accent" />
                  <span>4.9</span>
                  <span className="text-muted-foreground">★★★</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Guarantees - Circular gauge */}
          <Card className="col-span-12 md:col-span-3 bg-card rounded-3xl shadow-sm border-0 overflow-hidden">
            <CardContent className="p-6 h-full flex flex-col">
              <p className="text-sm font-medium text-foreground mb-4">Udnyttelsesgaranti</p>
              <div className="flex-1 flex items-center justify-center gap-4">
                <CircularGauge percentage={currentVehicle?.guaranteePercentage || 0} />
                <div className="flex flex-col gap-1">
                  {[100, 75, 50, 25].map((level) => (
                    <div 
                      key={level} 
                      className={cn(
                        "w-4 h-6 rounded-full transition-all",
                        (currentVehicle?.guaranteePercentage || 0) >= level 
                          ? "bg-mint" 
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map 1 - Location overview */}
          <Card className="col-span-6 md:col-span-4 bg-card rounded-3xl shadow-sm border-0 overflow-hidden h-48">
            <CardContent className="p-0 h-full relative">
              <div className="w-full h-full bg-gradient-to-br from-mint/10 to-primary/5 flex items-center justify-center">
                <div className="absolute inset-0 opacity-30">
                  <svg viewBox="0 0 200 150" className="w-full h-full">
                    {[...Array(10)].map((_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 15} x2="200" y2={i * 15} stroke="currentColor" strokeWidth="0.5" className="text-mint/30" />
                    ))}
                    {[...Array(10)].map((_, i) => (
                      <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="150" stroke="currentColor" strokeWidth="0.5" className="text-mint/30" />
                    ))}
                    <rect x="20" y="40" width="40" height="30" rx="4" className="fill-mint/40" />
                    <rect x="80" y="80" width="50" height="25" rx="4" className="fill-mint/40" />
                    <rect x="140" y="20" width="35" height="40" rx="4" className="fill-mint/40" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-mint rounded-full flex items-center justify-center shadow-lg">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map 2 - Route/detail */}
          <Card className="col-span-6 md:col-span-4 bg-card rounded-3xl shadow-sm border-0 overflow-hidden h-48">
            <CardContent className="p-0 h-full relative">
              <div className="w-full h-full bg-gradient-to-br from-primary/5 to-mint/10 flex items-center justify-center">
                <div className="absolute inset-0 opacity-30">
                  <svg viewBox="0 0 200 150" className="w-full h-full">
                    <path d="M0,75 Q50,75 100,50 T200,75" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/20" />
                    <path d="M50,0 Q50,50 100,75 T150,150" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary/20" />
                    <path d="M0,100 Q80,90 120,110 T200,100" fill="none" stroke="currentColor" strokeWidth="12" className="text-secondary/30" />
                    <rect x="10" y="10" width="50" height="40" rx="4" className="fill-mint/30" />
                    <rect x="140" y="100" width="50" height="40" rx="4" className="fill-mint/30" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Service section */}
          <Card className="col-span-12 md:col-span-4 bg-card rounded-3xl shadow-sm border-0 overflow-hidden">
            <CardContent className="p-6 space-y-6">
              {/* Status trails */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Status</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <Car className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">
                      {currentVehicle?.currentStatus === 'rented' ? 'Udlejet' : 
                       currentVehicle?.currentStatus === 'available' ? 'Ledig' :
                       currentVehicle?.currentStatus === 'maintenance' ? 'Værksted' : 'Klargøring'}
                    </span>
                  </div>
                  {currentVehicle?.image_url && (
                    <img 
                      src={currentVehicle.image_url} 
                      alt="" 
                      className="h-10 w-20 object-contain opacity-60"
                    />
                  )}
                </div>
              </div>

              {/* Service log */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Service log</p>
                <div className="space-y-3">
                  <ServiceLogItem 
                    icon={<Wrench className="w-4 h-4" />}
                    label="Vedligeholdelse"
                    date={currentVehicle?.lastServiceLog?.service_date}
                    color="text-primary"
                  />
                  <ServiceLogItem 
                    icon={<Droplets className="w-4 h-4" />}
                    label="Rengøring"
                    date={new Date().toISOString()}
                    color="text-mint"
                  />
                  <ServiceLogItem 
                    icon={<Calendar className="w-4 h-4" />}
                    label="Næste service"
                    date={currentVehicle?.nextServiceDate}
                    color="text-accent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicle list for quick navigation */}
      {filteredVehicles.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filteredVehicles.map((vehicle, index) => (
            <button
              key={vehicle.id}
              onClick={() => setCurrentVehicleIndex(index)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                index === currentVehicleIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {vehicle.registration}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ value, gross, commission }: { value: number; gross: number; commission: number }) => {
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const total = gross || 1;
  const netPercent = (value / total) * 100;
  const commissionPercent = (commission / total) * 100;
  const remaining = 100 - netPercent - commissionPercent;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(48 96% 53%)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - remaining / 100)}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--mint))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (remaining + netPercent) / 100)}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (remaining + netPercent + commissionPercent) / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{formatCurrency(value)}</span>
        <span className="text-xs text-muted-foreground">kr</span>
      </div>
    </div>
  );
};

// Circular Gauge Component
const CircularGauge = ({ percentage }: { percentage: number }) => {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--mint))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{percentage.toFixed(0)}%</span>
        <span className="text-[10px] text-muted-foreground">300 dage</span>
      </div>
    </div>
  );
};

// Service Log Item
const ServiceLogItem = ({ 
  icon, 
  label, 
  date, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  date?: string; 
  color: string;
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center", color)}>
          {icon}
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground">{formatDate(date)}</span>
    </div>
  );
};
