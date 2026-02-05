import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFleetPremiumVehicles, getCommissionRate, FleetVehicleStats } from '@/hooks/useFleetPremiumVehicles';
import { FleetExportButton } from './FleetExportButton';
import { LoanModuleCard } from './LoanModuleCard';
import { FleetDocumentsCard } from './FleetDocumentsCard';
import { GuaranteeTrackerCard } from './GuaranteeTrackerCard';
import { SettlementDownloadCard } from './SettlementDownloadCard';
import { 
  Car, ChevronLeft, ChevronRight, Wrench, 
  Gauge, MapPin, Star, Calendar, Droplets, Home
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const FleetPremiumDashboard = () => {
  const { 
    vehicles, 
    summary, 
    isLoading, 
    selectedYear, 
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    refetch,
    GUARANTEE_DAYS,
  } = useFleetPremiumVehicles();

  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);

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

  const years = [2024, 2025, 2026, 2027].filter(y => y <= new Date().getFullYear() + 1);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const currentVehicle = vehicles[currentVehicleIndex];

  const goToPrevVehicle = () => {
    setCurrentVehicleIndex(prev => (prev === 0 ? vehicles.length - 1 : prev - 1));
  };

  const goToNextVehicle = () => {
    setCurrentVehicleIndex(prev => (prev === vehicles.length - 1 ? 0 : prev + 1));
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

  if (!summary || vehicles.length === 0) {
    return (
      <Card className="bg-card rounded-3xl shadow-lg">
        <CardContent className="py-16 text-center">
          <Car className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
          <h3 className="text-xl font-semibold mb-3">Ingen biler endnu</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Dine Fleet Premium køretøjer vises her, når de er registreret i systemet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        <FleetExportButton 
          vehicles={vehicles} 
          summary={summary} 
          month={selectedMonth} 
          year={selectedYear} 
        />
      </div>

      {/* Main bento grid */}
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
            {/* Vehicle navigation */}
            {vehicles.length > 1 && (
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
                  {currentVehicleIndex + 1} / {vehicles.length}
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
            <div className="w-full h-40 flex items-center justify-center mb-4">
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
                {[100, 75, 50, 25].map((level, i) => (
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
                  {/* Stylized map grid */}
                  {[...Array(10)].map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 15} x2="200" y2={i * 15} stroke="currentColor" strokeWidth="0.5" className="text-mint/30" />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="150" stroke="currentColor" strokeWidth="0.5" className="text-mint/30" />
                  ))}
                  {/* Green areas */}
                  <rect x="20" y="40" width="40" height="30" rx="4" className="fill-mint/40" />
                  <rect x="80" y="80" width="50" height="25" rx="4" className="fill-mint/40" />
                  <rect x="140" y="20" width="35" height="40" rx="4" className="fill-mint/40" />
                </svg>
              </div>
              {/* Location pin */}
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
                  {/* Roads */}
                  <path d="M0,75 Q50,75 100,50 T200,75" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/20" />
                  <path d="M50,0 Q50,50 100,75 T150,150" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary/20" />
                  {/* River */}
                  <path d="M0,100 Q80,90 120,110 T200,100" fill="none" stroke="currentColor" strokeWidth="12" className="text-blue-300/30" />
                  {/* Green areas */}
                  <rect x="10" y="10" width="50" height="40" rx="4" className="fill-mint/30" />
                  <rect x="140" y="100" width="50" height="40" rx="4" className="fill-mint/30" />
                </svg>
              </div>
              {/* Location marker */}
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

      {/* Guarantee Tracker - User Story 4 */}
      <GuaranteeTrackerCard 
        vehicles={vehicles}
        guaranteeDays={GUARANTEE_DAYS}
      />

      {/* Settlement Download - User Story 5 */}
      <SettlementDownloadCard summary={summary} />

      {/* Loan Module Section */}
      {summary && (
        <LoanModuleCard
          totalLoanBalance={summary.totalLoanBalance}
          monthlyInstallment={summary.totalMonthlyInstallments}
          activeLoan={currentVehicle?.activeLoan || null}
          loanPaymentHistory={currentVehicle?.loanPaymentHistory || []}
          vehicles={vehicles.map(v => ({ id: v.id, registration: v.registration, make: v.make, model: v.model }))}
          onRefresh={refetch}
        />
      )}

      {/* Documents Section */}
      <FleetDocumentsCard />

      {/* Vehicle list for multiple vehicles */}
      {vehicles.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {vehicles.map((vehicle, index) => (
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
  
  // Calculate segments
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
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Yellow segment (remaining/other) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(48 96% 53%)" /* Yellow */
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - remaining / 100)}
          strokeLinecap="round"
        />
        {/* Teal/Mint segment (net) */}
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
        {/* Blue segment (commission) */}
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
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
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
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

// Service Log Item Component
const ServiceLogItem = ({ 
  icon, 
  label, 
  date, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  date?: string | null; 
  color: string;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={cn("w-8 h-8 rounded-full bg-muted flex items-center justify-center", color)}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {date ? format(new Date(date), 'd.MM.yy', { locale: da }) : '-'}
      </span>
      <div className="w-2 h-2 rounded-full bg-accent" />
    </div>
  </div>
);

export default FleetPremiumDashboard;
