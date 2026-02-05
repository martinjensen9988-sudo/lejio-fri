import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FleetVehicleStats } from '@/hooks/useFleetPremiumVehicles';

interface GuaranteeTrackerCardProps {
  vehicles: FleetVehicleStats[];
  guaranteeDays: number;
}

export const GuaranteeTrackerCard = ({ vehicles, guaranteeDays }: GuaranteeTrackerCardProps) => {
  const formatNumber = (num: number) => num.toLocaleString('da-DK');

  // Calculate status for each vehicle
  const getStatus = (vehicle: FleetVehicleStats) => {
    // Calculate expected days based on current date in the year
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.ceil((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const expectedDaysRented = (guaranteeDays / 365) * dayOfYear;
    
    const percentOfExpected = (vehicle.daysRentedThisYear / expectedDaysRented) * 100;
    
    if (percentOfExpected >= 90) return 'green';
    if (percentOfExpected >= 70) return 'yellow';
    return 'red';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'green': return 'På sporet';
      case 'yellow': return 'Under observation';
      case 'red': return 'Kritisk';
      default: return 'Ukendt';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-mint/20 text-mint border-mint/30';
      case 'yellow': return 'bg-accent/20 text-accent border-accent/30';
      case 'red': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Summary stats
  const totalDaysRented = vehicles.reduce((sum, v) => sum + v.daysRentedThisYear, 0);
  const totalGuaranteeDays = vehicles.length * guaranteeDays;
  const overallProgress = totalGuaranteeDays > 0 ? (totalDaysRented / totalGuaranteeDays) * 100 : 0;

  const greenCount = vehicles.filter(v => getStatus(v) === 'green').length;
  const yellowCount = vehicles.filter(v => getStatus(v) === 'yellow').length;
  const redCount = vehicles.filter(v => getStatus(v) === 'red').length;

  return (
    <Card className="bg-card rounded-2xl shadow-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Garantitæller (10 mdr / 300 dage)
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date().getFullYear()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-mint/10 rounded-xl p-4 text-center border border-mint/20">
            <p className="text-2xl font-bold text-mint">{greenCount}</p>
            <p className="text-xs text-muted-foreground">På sporet</p>
          </div>
          <div className="bg-accent/10 rounded-xl p-4 text-center border border-accent/20">
            <p className="text-2xl font-bold text-accent">{yellowCount}</p>
            <p className="text-xs text-muted-foreground">Under observation</p>
          </div>
          <div className="bg-destructive/10 rounded-xl p-4 text-center border border-destructive/20">
            <p className="text-2xl font-bold text-destructive">{redCount}</p>
            <p className="text-xs text-muted-foreground">Kritisk</p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Samlet fremgang</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={Math.min(overallProgress, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">
            {formatNumber(totalDaysRented)} af {formatNumber(totalGuaranteeDays)} garantidage
          </p>
        </div>

        {/* Per-vehicle breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Dine køretøjer</p>
          {vehicles.map((vehicle) => {
            const status = getStatus(vehicle);
            const progress = Math.min(vehicle.guaranteePercentage, 100);
            
            return (
              <div 
                key={vehicle.id}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  status === 'red' && "bg-destructive/5 border-destructive/20",
                  status === 'yellow' && "bg-accent/5 border-accent/20",
                  status === 'green' && "bg-mint/5 border-mint/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{vehicle.registration}</span>
                    <span className="text-sm text-muted-foreground">
                      {vehicle.make} {vehicle.model}
                    </span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(status)}>
                    {status === 'green' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {status === 'red' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {getStatusLabel(status)}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={progress} 
                    className={cn(
                      "h-2",
                      status === 'red' && "[&>div]:bg-destructive",
                      status === 'yellow' && "[&>div]:bg-accent",
                      status === 'green' && "[&>div]:bg-mint"
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {vehicle.daysRentedThisYear} dage udlejet
                    </span>
                    <span>Mål: {guaranteeDays} dage</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
