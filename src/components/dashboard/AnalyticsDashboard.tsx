import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Car, RefreshCw, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

const AnalyticsDashboard = () => {
  const { monthlyStats, vehicleStats, summary, isLoading, refetch } = useAnalytics(6);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Ingen data endnu
        </h3>
        <p className="text-muted-foreground">
          Analytics vil vises når du har bookinger.
        </p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(value);
  };

  const pieData = [
    { name: 'Gennemført', value: summary.completedBookings },
    { name: 'Afventende', value: summary.pendingBookings },
    { name: 'Annulleret', value: summary.cancelledBookings },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground">Omsætningsrapporter og booking-trends</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Opdater
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Total omsætning"
          value={formatCurrency(summary.totalRevenue)}
          trend={summary.revenueGrowth}
          trendLabel="vs. sidste måned"
        />
        <SummaryCard
          icon={Calendar}
          label="Total bookinger"
          value={summary.totalBookings.toString()}
          trend={summary.bookingsGrowth}
          trendLabel="vs. sidste måned"
        />
        <SummaryCard
          icon={Car}
          label="Gns. booking værdi"
          value={formatCurrency(summary.avgBookingValue)}
        />
        <SummaryCard
          icon={Repeat}
          label="Aktive abonnementer"
          value={summary.activeRecurringRentals.toString()}
          highlight
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Månedlig omsætning</CardTitle>
            <CardDescription>Omsætning de sidste 6 måneder</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Omsætning']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings Trend Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Booking trend</CardTitle>
            <CardDescription>Antal bookinger per måned</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value, 'Bookinger']}
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Status Pie */}
        {pieData.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Booking status</CardTitle>
              <CardDescription>Fordeling af booking statuser</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Køretøjs performance</CardTitle>
            <CardDescription>Top køretøjer efter omsætning</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicleStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen data</p>
            ) : (
              <div className="space-y-3">
                {vehicleStats.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">{vehicle.registration}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(vehicle.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.bookings} bookinger</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  highlight?: boolean;
}

const SummaryCard = ({ icon: Icon, label, value, trend, trendLabel, highlight }: SummaryCardProps) => (
  <Card className={`border-border ${highlight ? 'border-primary shadow-glow' : ''}`}>
    <CardContent className="pt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlight ? 'bg-primary/20' : 'bg-muted'}`}>
          <Icon className={`w-5 h-5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </div>
      <p className="font-display text-2xl font-black text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </CardContent>
  </Card>
);

export default AnalyticsDashboard;
