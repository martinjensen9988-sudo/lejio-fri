import { useEffect, useState } from 'react';
import { azureApi } from '@/integrations/azure/client';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Zap, TrendingUp, DollarSign, Activity } from 'lucide-react';

export const FriAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalLessors: 0,
    activeLessors: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0,
    avgRevenuePerLessor: 0,
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // Fetch lessor counts
        const lessorsResponse = await azureApi.post<any>('/db/query', {
          query: 'SELECT id, subscription_status, created_at FROM fri_lessors',
        });
        const lessorsData = Array.isArray(lessorsResponse?.data)
          ? lessorsResponse.data
          : Array.isArray(lessorsResponse)
            ? lessorsResponse
            : lessorsResponse?.data?.recordset || lessorsResponse?.recordset || [];

        const totalLessors = lessorsData?.length || 0;
        const activeLessors = lessorsData?.filter(l => l.subscription_status === 'active' || l.subscription_status === 'trial').length || 0;

        // Fetch vehicles
        const vehiclesResponse = await azureApi.post<any>('/db/query', {
          query: 'SELECT id FROM fri_vehicles',
        });
        const vehiclesData = Array.isArray(vehiclesResponse?.data)
          ? vehiclesResponse.data
          : Array.isArray(vehiclesResponse)
            ? vehiclesResponse
            : vehiclesResponse?.data?.recordset || vehiclesResponse?.recordset || [];

        // Fetch bookings
        const bookingsResponse = await azureApi.post<any>('/db/query', {
          query: 'SELECT id, total_price, status, pickup_date AS start_date FROM fri_bookings',
        });
        const bookingsData = Array.isArray(bookingsResponse?.data)
          ? bookingsResponse.data
          : Array.isArray(bookingsResponse)
            ? bookingsResponse
            : bookingsResponse?.data?.recordset || bookingsResponse?.recordset || [];

        const totalBookings = bookingsData?.length || 0;
        const totalRevenue = bookingsData?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
        const avgRevenuePerLessor = totalLessors > 0 ? totalRevenue / totalLessors : 0;

        setStats({
          totalLessors,
          activeLessors,
          totalVehicles: vehiclesData?.length || 0,
          totalBookings,
          totalRevenue,
          avgRevenuePerLessor,
        });

        // Calculate monthly revenue
        const monthlyMap = new Map<string, number>();
        bookingsData?.forEach(booking => {
          const month = new Date(booking.start_date).toLocaleDateString('da-DK', { 
            year: 'numeric', 
            month: 'short' 
          });
          monthlyMap.set(month, (monthlyMap.get(month) || 0) + (booking.total_price || 0));
        });

        setMonthlyData(
          Array.from(monthlyMap.entries())
            .map(([month, revenue]) => ({ month, revenue }))
            .slice(-12)
        );

        // Calculate status distribution
        const statusMap = new Map<string, number>();
        bookingsData?.forEach(booking => {
          statusMap.set(booking.status, (statusMap.get(booking.status) || 0) + 1);
        });

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        setStatusDistribution(
          Array.from(statusMap.entries()).map(([status, count], idx) => ({
            name: status,
            value: count,
            color: colors[idx % colors.length],
          }))
        );
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Indlæser...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Oversigt over platformen</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Lessors i alt</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLessors}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Aktive lessors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeLessors}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Biler i alt</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVehicles}</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Bookings i alt</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">kr. {(stats.totalRevenue / 1000).toFixed(0)}k</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Månedlig revenue</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `kr. ${value.toLocaleString('da-DK')}`} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              Ingen data tilgængelig
            </div>
          )}
        </Card>

        {/* Booking Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking status</h3>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              Ingen data tilgængelig
            </div>
          )}
        </Card>
      </div>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Oversigt</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="py-2">
            <p className="text-gray-600">Gennemsnitlig revenue pr. lessor</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">kr. {stats.avgRevenuePerLessor.toLocaleString('da-DK', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="py-2">
            <p className="text-gray-600">Succes rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalBookings > 0 ? `${((statusDistribution.find(s => s.name === 'completed')?.value || 0) / stats.totalBookings * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="py-2">
            <p className="text-gray-600">Gennemsnitlig biler pr. lessor</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalLessors > 0 ? (stats.totalVehicles / stats.totalLessors).toFixed(1) : '0'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
