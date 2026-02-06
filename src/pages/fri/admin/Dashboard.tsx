import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { azureApi } from '@/integrations/azure/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Zap, TrendingUp, DollarSign, Activity, ArrowUpRight, Sparkles, BarChart3, ChevronRight, Car } from 'lucide-react';

export const FriAdminDashboard = () => {
  const navigate = useNavigate();
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
        const lessorsResponse = await azureApi.post<any>('/db-query', {
          query: 'SELECT id, subscription_status, created_at FROM fri_lessors',
          admin: true,
        });
        const lessorsData = Array.isArray(lessorsResponse?.data)
          ? lessorsResponse.data
          : Array.isArray(lessorsResponse)
            ? lessorsResponse
            : lessorsResponse?.data?.recordset || lessorsResponse?.recordset || [];

        const totalLessors = lessorsData?.length || 0;
        const activeLessors = lessorsData?.filter(l => l.subscription_status === 'active' || l.subscription_status === 'trial').length || 0;

        const vehiclesResponse = await azureApi.post<any>('/db-query', {
          query: 'SELECT id FROM fri_vehicles',
          admin: true,
        });
        const vehiclesData = Array.isArray(vehiclesResponse?.data)
          ? vehiclesResponse.data
          : Array.isArray(vehiclesResponse)
            ? vehiclesResponse
            : vehiclesResponse?.data?.recordset || vehiclesResponse?.recordset || [];

        const bookingsResponse = await azureApi.post<any>('/db-query', {
          query: 'SELECT id, total_price, status, start_date FROM fri_bookings',
          admin: true,
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

        const statusMap = new Map<string, number>();
        bookingsData?.forEach(booking => {
          statusMap.set(booking.status, (statusMap.get(booking.status) || 0) + 1);
        });

        const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'];
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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400 font-medium">Indlæser dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Lessors i alt', value: stats.totalLessors, icon: Users, gradient: 'from-violet-500 to-indigo-500', path: '/fri/admin/lessors' },
    { label: 'Aktive lessors', value: stats.activeLessors, icon: Activity, gradient: 'from-emerald-500 to-teal-400', path: '/fri/admin/lessors' },
    { label: 'Biler i alt', value: stats.totalVehicles, icon: Car, gradient: 'from-blue-500 to-cyan-400', path: '/fri/admin/lessors' },
    { label: 'Bookings i alt', value: stats.totalBookings, icon: TrendingUp, gradient: 'from-pink-500 to-rose-400', path: '/fri/admin/dashboard' },
    { label: 'Total revenue', value: `kr. ${(stats.totalRevenue / 1000).toFixed(0)}k`, icon: DollarSign, gradient: 'from-amber-500 to-orange-400', path: '/fri/admin/payments' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Godmorgen';
    if (h < 18) return 'God eftermiddag';
    return 'God aften';
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-4 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            {new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {greeting()}, Admin
          </h1>
          <p className="text-gray-400 text-lg">
            Her er dit overblik over hele platformen.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue - takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Månedlig revenue</h3>
            </div>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`kr. ${value.toLocaleString('da-DK')}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-400">Ingen data tilgængelig</p>
            </div>
          )}
        </div>

        {/* Booking Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Booking status</h3>
          </div>
          {statusDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={4}
                    cornerRadius={4}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 capitalize">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-400">Ingen data tilgængelig</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Gns. revenue pr. lessor', value: `kr. ${stats.avgRevenuePerLessor.toLocaleString('da-DK', { maximumFractionDigits: 0 })}`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-400' },
          { label: 'Succes rate', value: stats.totalBookings > 0
            ? `${((statusDistribution.find(s => s.name === 'completed')?.value || 0) / stats.totalBookings * 100).toFixed(1)}%`
            : 'N/A', icon: TrendingUp, gradient: 'from-violet-500 to-purple-400' },
          { label: 'Gns. biler pr. lessor', value: stats.totalLessors > 0 ? (stats.totalVehicles / stats.totalLessors).toFixed(1) : '0', icon: Car, gradient: 'from-blue-500 to-cyan-400' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Hurtig navigation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Administrer Lessors', desc: 'Se og administrer alle lessors', path: '/fri/admin/lessors', color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
            { label: 'Support Tickets', desc: 'Besvar support henvendelser', path: '/fri/admin/support', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
            { label: 'Betalinger', desc: 'Oversigt over transaktioner', path: '/fri/admin/payments', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${action.color} group`}
            >
              <div className="text-left">
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{action.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
