import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertTriangle, Car, TrendingDown, Target, 
  Calendar, Building2, Loader2, Bell
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, startOfYear, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

interface VehicleOccupancy {
  id: string;
  make: string;
  model: string;
  registration: string;
  owner_id: string;
  owner_name: string;
  owner_company: string | null;
  daysRentedYTD: number;
  daysAvailableYTD: number;
  occupancyRate: number;
  projectedAnnualDays: number;
  guaranteeTarget: number;
  gapToTarget: number;
  status: 'green' | 'yellow' | 'red';
  monthlyRentDays: number;
  requiredDailyRate: number;
}

const GUARANTEE_DAYS = 300; // 10 months guarantee

export const AdminRedZoneVehicles = () => {
  const [vehicles, setVehicles] = useState<VehicleOccupancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicleOccupancy = async () => {
    setIsLoading(true);
    try {
      const yearStart = startOfYear(new Date());
      const now = new Date();
      const daysIntoYear = differenceInDays(now, yearStart) + 1;
      const daysRemainingInYear = 365 - daysIntoYear;

      // Fetch fleet customers
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .not('fleet_plan', 'is', null);

      if (!profiles || profiles.length === 0) {
        setVehicles([]);
        setIsLoading(false);
        return;
      }

      const ownerIds = profiles.map(p => p.id);

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, make, model, registration, owner_id')
        .in('owner_id', ownerIds);

      if (!vehiclesData || vehiclesData.length === 0) {
        setVehicles([]);
        setIsLoading(false);
        return;
      }

      // Fetch bookings for this year
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('vehicle_id, start_date, end_date, status')
        .in('vehicle_id', vehiclesData.map(v => v.id))
        .gte('end_date', yearStart.toISOString())
        .in('status', ['confirmed', 'completed', 'active']);

      // Calculate occupancy for each vehicle
      const vehicleOccupancyList: VehicleOccupancy[] = vehiclesData.map(vehicle => {
        const owner = profiles.find(p => p.id === vehicle.owner_id);
        const vehicleBookings = (bookingsData || []).filter(b => b.vehicle_id === vehicle.id);

        // Calculate days rented this year
        let daysRentedYTD = 0;
        vehicleBookings.forEach(booking => {
          const bookingStart = new Date(Math.max(new Date(booking.start_date).getTime(), yearStart.getTime()));
          const bookingEnd = new Date(Math.min(new Date(booking.end_date).getTime(), now.getTime()));
          if (bookingEnd >= bookingStart) {
            daysRentedYTD += differenceInDays(bookingEnd, bookingStart) + 1;
          }
        });

        // Calculate monthly average rent days
        const monthsIntoYear = Math.max(1, now.getMonth() + 1);
        const monthlyRentDays = daysRentedYTD / monthsIntoYear;

        // Project annual days based on current pace
        const projectedAnnualDays = Math.round((daysRentedYTD / daysIntoYear) * 365);

        // Calculate gap to 300-day target
        const gapToTarget = GUARANTEE_DAYS - projectedAnnualDays;

        // Calculate required daily rate to meet target
        const requiredRemainingDays = Math.max(0, GUARANTEE_DAYS - daysRentedYTD);
        const requiredDailyRate = daysRemainingInYear > 0 
          ? (requiredRemainingDays / daysRemainingInYear) * 100 
          : 0;

        // Determine status
        let status: 'green' | 'yellow' | 'red' = 'green';
        const expectedDaysAtThisPoint = (daysIntoYear / 365) * GUARANTEE_DAYS;
        const performanceRatio = daysRentedYTD / expectedDaysAtThisPoint;

        if (performanceRatio < 0.7) {
          status = 'red';
        } else if (performanceRatio < 0.9) {
          status = 'yellow';
        }

        const occupancyRate = daysIntoYear > 0 ? (daysRentedYTD / daysIntoYear) * 100 : 0;

        return {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          registration: vehicle.registration,
          owner_id: vehicle.owner_id,
          owner_name: owner?.full_name || owner?.company_name || 'Ukendt',
          owner_company: owner?.company_name,
          daysRentedYTD,
          daysAvailableYTD: daysIntoYear,
          occupancyRate,
          projectedAnnualDays,
          guaranteeTarget: GUARANTEE_DAYS,
          gapToTarget,
          status,
          monthlyRentDays: Math.round(monthlyRentDays * 10) / 10,
          requiredDailyRate: Math.round(requiredDailyRate * 10) / 10,
        };
      });

      // Sort by status (red first), then by gap to target
      vehicleOccupancyList.sort((a, b) => {
        const statusOrder = { red: 0, yellow: 1, green: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return b.gapToTarget - a.gapToTarget;
      });

      setVehicles(vehicleOccupancyList);
    } catch (error) {
      console.error('Error fetching vehicle occupancy:', error);
      toast.error('Kunne ikke hente belægningsdata');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleOccupancy();
  }, []);

  const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'red':
        return <Badge variant="destructive">Kritisk</Badge>;
      case 'yellow':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Advarsel</Badge>;
      case 'green':
        return <Badge className="bg-mint hover:bg-mint/80">På sporet</Badge>;
    }
  };

  const getProgressColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'red': return '[&>div]:bg-destructive';
      case 'yellow': return '[&>div]:bg-amber-500';
      case 'green': return '[&>div]:bg-mint';
    }
  };

  // Stats
  const redZoneCount = vehicles.filter(v => v.status === 'red').length;
  const yellowZoneCount = vehicles.filter(v => v.status === 'yellow').length;
  const greenZoneCount = vehicles.filter(v => v.status === 'green').length;
  const avgOccupancy = vehicles.length > 0 
    ? vehicles.reduce((sum, v) => sum + v.occupancyRate, 0) / vehicles.length 
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Beregner belægning...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{redZoneCount}</p>
                <p className="text-xs text-muted-foreground">I rød zone</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{yellowZoneCount}</p>
                <p className="text-xs text-muted-foreground">Advarsel</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-mint/10 border-mint/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mint/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-mint" />
              </div>
              <div>
                <p className="text-2xl font-bold">{greenZoneCount}</p>
                <p className="text-xs text-muted-foreground">På sporet</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgOccupancy.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Gns. belægning</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Red Zone Alert */}
      {redZoneCount > 0 && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  {redZoneCount} {redZoneCount === 1 ? 'bil' : 'biler'} i rød zone!
                </p>
                <p className="text-sm text-muted-foreground">
                  Disse biler risikerer ikke at nå 300-dages garantien. Salgsteamet bør prioritere at pushe disse.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            10-Måneders Garanti Status
          </CardTitle>
          <CardDescription>
            Oversigt over belægning og forventet opnåelse af 300-dages garantien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Køretøj</TableHead>
                <TableHead>Ejer</TableHead>
                <TableHead className="text-right">Dage udlejet YTD</TableHead>
                <TableHead>Fremgang</TableHead>
                <TableHead className="text-right">Projiceret årligt</TableHead>
                <TableHead className="text-right">Gap til 300</TableHead>
                <TableHead className="text-right">Krævet tempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map(vehicle => (
                <TableRow key={vehicle.id} className={cn(
                  vehicle.status === 'red' && 'bg-destructive/5',
                  vehicle.status === 'yellow' && 'bg-amber-500/5'
                )}>
                  <TableCell>
                    {getStatusBadge(vehicle.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{vehicle.registration}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{vehicle.owner_company || vehicle.owner_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {vehicle.daysRentedYTD} / {vehicle.daysAvailableYTD}
                  </TableCell>
                  <TableCell>
                    <div className="w-32">
                      <Progress 
                        value={(vehicle.daysRentedYTD / GUARANTEE_DAYS) * 100} 
                        className={cn("h-2", getProgressColor(vehicle.status))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {((vehicle.daysRentedYTD / GUARANTEE_DAYS) * 100).toFixed(0)}% af mål
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-semibold",
                      vehicle.projectedAnnualDays >= GUARANTEE_DAYS ? "text-mint" : "text-destructive"
                    )}>
                      {vehicle.projectedAnnualDays} dage
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {vehicle.gapToTarget > 0 ? (
                      <span className="text-destructive font-semibold">-{vehicle.gapToTarget}</span>
                    ) : (
                      <span className="text-mint font-semibold">+{Math.abs(vehicle.gapToTarget)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "text-sm",
                      vehicle.requiredDailyRate > 100 && "text-destructive font-semibold",
                      vehicle.requiredDailyRate > 80 && vehicle.requiredDailyRate <= 100 && "text-amber-500",
                    )}>
                      {vehicle.requiredDailyRate > 100 ? '>100' : vehicle.requiredDailyRate.toFixed(0)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {vehicles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ingen fleet-biler endnu
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
