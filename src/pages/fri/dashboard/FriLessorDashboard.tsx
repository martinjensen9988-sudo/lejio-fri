import { useState, useEffect } from 'react';
import { useFriLessor } from '@/hooks/useFriLessor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { azureApi } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VehicleRevenueData {
  vehicle_id: string;
  vehicle_name: string;
  daily_rate: number;
  current_revenue: number;
  utilization_rate: number;
  booking_count: number;
  average_booking: number;
  trend: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  target: number;
  bookings: number;
}

interface RevenueAlert {
  vehicle_id: string;
  vehicle_name: string;
  severity: 'warning' | 'critical';
  message: string;
}

const FriLessorDashboard = () => {
  const { vehicles, bookings, friLessor, refetch, isLoading } = useFriLessor();
  const [revenueData, setRevenueData] = useState<VehicleRevenueData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [alerts, setAlerts] = useState<RevenueAlert[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

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

      // Hent bookinger for denne måned
      const monthlyBookingsResponse = await azureApi.post<any>('/db/query', {
        query: `SELECT *, pickup_date AS start_date, return_date AS end_date FROM fri_bookings WHERE lessor_id='${safeLessorId}' AND pickup_date >= '${startIso}' AND return_date <= '${endIso}'`,
      });

      const monthlyBookings = Array.isArray(monthlyBookingsResponse?.data)
        ? monthlyBookingsResponse.data
        : Array.isArray(monthlyBookingsResponse)
          ? monthlyBookingsResponse
          : monthlyBookingsResponse?.data?.recordset || monthlyBookingsResponse?.recordset || [];

      // Beregn revenue data pr. køretøj
      const revenueMap = new Map<string, VehicleRevenueData>();

      vehicles.forEach((vehicle) => {
        revenueMap.set(vehicle.id, {
          vehicle_id: vehicle.id,
          vehicle_name: `${vehicle.make} ${vehicle.model}`,
          daily_rate: vehicle.daily_rate || 0,
          current_revenue: 0,
          utilization_rate: 0,
          booking_count: 0,
          average_booking: 0,
          trend: 0,
        });
      });

      // Aggreger revenue fra bookinger
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

      // Beregn procenter og gennemsnit
      const daysInMonth = lastDay.getDate();
      const processedData: VehicleRevenueData[] = Array.from(revenueMap.values()).map((vehicle) => {
        const maxPossibleRevenue = vehicle.daily_rate * daysInMonth;
        return {
          ...vehicle,
          utilization_rate: maxPossibleRevenue > 0 ? (vehicle.current_revenue / maxPossibleRevenue) * 100 : 0,
          average_booking: vehicle.booking_count > 0 ? vehicle.current_revenue / vehicle.booking_count : 0,
        };
      });

      setRevenueData(processedData);

      // Opret advarsler
      const newAlerts: RevenueAlert[] = [];
      processedData.forEach((vehicle) => {
        if (vehicle.utilization_rate < 30) {
          newAlerts.push({
            vehicle_id: vehicle.vehicle_id,
            vehicle_name: vehicle.vehicle_name,
            severity: 'warning',
            message: `Lav udnyttelse: ${vehicle.utilization_rate.toFixed(1)}% (kun ${vehicle.booking_count} bookinger)`,
          });
        }
      });

      setAlerts(newAlerts);

      // Generer månedtrend (de sidste 6 måneder)
      const trendData: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' });

        const totalRevenue = processedData.reduce((sum, v) => sum + (i === 0 ? v.current_revenue : 0), 0);
        const totalTarget = processedData.reduce((sum, v) => sum + (v.daily_rate * 20), 0);
        const totalBookings = bookings.filter((b: any) => {
          const bookDate = new Date(b.start_date);
          return bookDate.getMonth() === date.getMonth() && bookDate.getFullYear() === date.getFullYear();
        }).length;

        trendData.push({
          month,
          revenue: totalRevenue,
          target: totalTarget,
          bookings: totalBookings,
        });
      }
      setMonthlyTrend(trendData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error('Kunne ikke indlæse omsætningsdata');
    } finally {
      setIsLoadingData(false);
    }
  };

  const totalRevenue = revenueData.reduce((sum, v) => sum + v.current_revenue, 0);
  const totalBookings = revenueData.reduce((sum, v) => sum + v.booking_count, 0);
  const avgUtilization = revenueData.length > 0 ? revenueData.reduce((sum, v) => sum + v.utilization_rate, 0) / revenueData.length : 0;
  const lowUtilizationVehicles = revenueData.filter((v) => v.utilization_rate < 30).length;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Omsætning & Udnyttelse</h2>
        <Button onClick={loadRevenueData} disabled={isLoadingData} variant="outline">
          {isLoadingData ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Indlæser...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Opdater
            </>
          )}
        </Button>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.vehicle_id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.vehicle_name}</strong>: {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Samlet Omsætning</p>
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                    totalRevenue
                  )}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Samlede Bookinger</p>
                <p className="text-3xl font-bold">{totalBookings}</p>
                <p className="text-xs text-muted-foreground mt-1">Denne måned</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gennemsnitlig Udnyttelse</p>
                <p className="text-3xl font-bold">{avgUtilization.toFixed(1)}%</p>
              </div>
              <TrendingUp className={`w-10 h-10 opacity-20 ${avgUtilization > 50 ? 'text-green-500' : 'text-orange-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Køretøjer Under 30%</p>
                <p className="text-3xl font-bold">{lowUtilizationVehicles}</p>
                <p className="text-xs text-muted-foreground mt-1">af {vehicles.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Omsætning Trend (6 Måneder)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(value as number)
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Omsætning" />
                <Line type="monotone" dataKey="target" stroke="#3b82f6" name="Target" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Omsætning pr. Køretøj</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData.slice(0, 5)}
                  dataKey="current_revenue"
                  nameKey="vehicle_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {revenueData.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(value as number)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Køretøj Omsætning Oversigt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {revenueData.map((vehicle) => (
              <div key={vehicle.vehicle_id} className="space-y-2 pb-4 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{vehicle.vehicle_name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                      vehicle.current_revenue
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 items-center">
                  <Progress
                    value={Math.min(vehicle.utilization_rate, 100)}
                    className="flex-1"
                  />
                  <span className={`text-sm font-semibold min-w-fit ${
                    vehicle.utilization_rate > 70 ? 'text-green-600' :
                    vehicle.utilization_rate > 30 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {vehicle.utilization_rate.toFixed(1)}%
                  </span>
                </div>

                {/* Details */}
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">{vehicle.booking_count}</span> bookinger
                  </div>
                  <div>
                    Dagstakst: {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                      vehicle.daily_rate
                    )}
                  </div>
                  <div>
                    Gennemsnit pr. booking: {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                      vehicle.average_booking
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriLessorDashboard;
