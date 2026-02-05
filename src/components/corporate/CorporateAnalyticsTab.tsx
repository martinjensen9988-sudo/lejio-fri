import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Gauge, 
  Leaf, 
  Car, 
  MapPin,
  BarChart3,
  PieChart
} from 'lucide-react';
import { 
  CorporateUsageStats, 
  CorporateDepartment, 
  CorporateBooking,
  CorporateFleetVehicle 
} from '@/hooks/useCorporateFleet';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface CorporateAnalyticsTabProps {
  usageStats: CorporateUsageStats[];
  departments: CorporateDepartment[];
  bookings: CorporateBooking[];
  fleetVehicles: CorporateFleetVehicle[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CorporateAnalyticsTab = ({ 
  usageStats, 
  departments, 
  bookings,
  fleetVehicles 
}: CorporateAnalyticsTabProps) => {
  // Calculate department usage
  const departmentUsage = departments.map((dept, index) => {
    const deptBookings = bookings.filter(b => b.department_id === dept.id);
    const totalCost = deptBookings.reduce((sum, b) => sum + (b.cost_allocated || 0), 0);
    const totalKm = deptBookings.reduce((sum, b) => sum + (b.km_driven || 0), 0);
    return {
      name: dept.name,
      bookings: deptBookings.length,
      cost: totalCost,
      km: totalKm,
      color: COLORS[index % COLORS.length],
    };
  });

  // Monthly trend data
  const monthlyData = usageStats.map(stat => ({
    month: format(new Date(stat.period_month), 'MMM', { locale: da }),
    bookings: stat.total_bookings,
    km: stat.total_km_driven,
    cost: stat.total_cost,
    co2: stat.co2_emissions_kg,
  })).reverse();

  // Calculate CO2 savings (assuming electric vehicles)
  const totalKm = usageStats.reduce((sum, s) => sum + s.total_km_driven, 0);
  const estimatedCO2Saved = Math.round(totalKm * 0.12); // kg CO2 saved vs traditional fleet

  // Utilization by vehicle
  const vehicleUtilization = fleetVehicles.map(vehicle => {
    const vehicleBookings = bookings.filter(b => b.fleet_vehicle_id === vehicle.id);
    return {
      id: vehicle.id.slice(0, 8),
      bookings: vehicleBookings.length,
      utilization: Math.min(100, vehicleBookings.length * 10), // Simplified calculation
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Flådeanalyse</h2>
        <p className="text-muted-foreground">
          Indsigt i virksomhedens flådebrug og omkostninger
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gns. udnyttelse</p>
                <p className="text-3xl font-bold">
                  {usageStats[0]?.avg_utilization_rate?.toFixed(0) || 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500">+5%</span>
              <span className="text-muted-foreground">vs. sidste måned</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total km kørt</p>
                <p className="text-3xl font-bold">
                  {totalKm.toLocaleString('da-DK')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Sidste 12 måneder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CO₂ sparet</p>
                <p className="text-3xl font-bold text-green-600">
                  {estimatedCO2Saved.toLocaleString('da-DK')} kg
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              vs. traditionel flåde
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pris pr. km</p>
                <p className="text-3xl font-bold">
                  {totalKm > 0 
                    ? (usageStats.reduce((s, u) => s + u.total_cost, 0) / totalKm).toFixed(2)
                    : '0'
                  } kr
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-green-500">-8%</span>
              <span className="text-muted-foreground">vs. egen flåde</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Månedligt forbrug
            </CardTitle>
            <CardDescription>
              Bookinger og omkostninger over tid
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Ikke nok data endnu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Bookinger"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Omkostning (kr)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Forbrug pr. afdeling
            </CardTitle>
            <CardDescription>
              Fordeling af flådebrug på afdelinger
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departmentUsage.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Ingen afdelinger oprettet
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <RechartsPie>
                    <Pie
                      data={departmentUsage}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="bookings"
                    >
                      {departmentUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {departmentUsage.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: dept.color }}
                        />
                        <span className="text-sm">{dept.name}</span>
                      </div>
                      <span className="text-sm font-medium">{dept.bookings} bookinger</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Udnyttelse pr. køretøj
          </CardTitle>
          <CardDescription>
            Se hvilke køretøjer der bruges mest
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicleUtilization.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Ingen køretøjer i flåden
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vehicleUtilization} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} unit="%" className="text-xs" />
                <YAxis dataKey="id" type="category" width={80} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Udnyttelse']}
                />
                <Bar dataKey="utilization" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateAnalyticsTab;
