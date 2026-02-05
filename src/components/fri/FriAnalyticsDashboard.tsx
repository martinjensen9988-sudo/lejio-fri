import { useFriAnalytics } from '@/hooks/useFriAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BookOpen, DollarSign, AlertCircle, Zap } from 'lucide-react';

interface FriAnalyticsDashboardProps {
  lessorId: string | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function FriAnalyticsDashboard({ lessorId }: FriAnalyticsDashboardProps) {
  const { analytics, loading } = useFriAnalytics(lessorId);

  if (loading) {
    return <div className="text-center py-12">Indlæser analytik...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-600">Ingen data tilgængelig endnu</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Samlet omsætning</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                kr. {analytics.totalRevenue.toLocaleString('da-DK')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Denne måned</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                kr. {analytics.monthlyRevenue.toLocaleString('da-DK')}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg border border-purple-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bookinger</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{analytics.totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.activeBookings} aktive
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg border border-orange-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Køretøjer</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{analytics.totalVehicles}</p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.availableVehicles} ledige
              </p>
            </div>
            <Zap className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        {analytics.overdueInvoices > 0 && (
          <div className="bg-red-50 rounded-lg border border-red-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Forfaldne fakturaer</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{analytics.overdueInvoices}</p>
                <p className="text-xs text-gray-500 mt-1">
                  kr. {analytics.outstandingBalance.toLocaleString('da-DK')}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Månedlig omsætning (sidste 12 mdr)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyRevenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `kr. ${value.toLocaleString('da-DK')}`} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Bookinger efter status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.bookingsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.bookingsByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} stk`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Køretøjer efter status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.vehicleDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Bookings (Last 30 days) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Daglige bookinger (sidste 30 dage)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.dailyBookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Vehicles */}
      {analytics.topVehicles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Top køretøjer</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-900">Køretøj</th>
                  <th className="text-right py-2 px-4 font-semibold text-gray-900">Bookinger</th>
                  <th className="text-right py-2 px-4 font-semibold text-gray-900">Omsætning</th>
                  <th className="text-right py-2 px-4 font-semibold text-gray-900">Pr. booking</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topVehicles.map((vehicle, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">
                      {vehicle.bookings}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 font-medium">
                      kr. {vehicle.revenue.toLocaleString('da-DK')}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-500">
                      kr. {(vehicle.revenue / vehicle.bookings).toLocaleString('da-DK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div>
          <p className="text-sm text-gray-600">Gennemsnitlig booking værdi</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            kr. {analytics.averageBookingValue.toLocaleString('da-DK')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Fuldførelsesrate</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {analytics.totalBookings > 0
              ? (
                  (analytics.completedBookings / analytics.totalBookings) *
                  100
                ).toFixed(1)
              : '0'}
            %
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Køretøj-udnyttelse</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {analytics.bookingRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Betalingsrate</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {analytics.totalInvoices > 0
              ? ((analytics.paidInvoices / analytics.totalInvoices) * 100).toFixed(1)
              : '0'}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
