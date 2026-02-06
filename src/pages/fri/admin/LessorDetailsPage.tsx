import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { azureApi } from '@/integrations/azure/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, AlertTriangle, DollarSign, Car, TrendingUp, Users, Calendar, BarChart3, Mail, Globe, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LessorDetails {
  id: string;
  email: string;
  company_name: string;
  cvr_number?: string;
  custom_domain: string;
  primary_color: string;
  logo_url: string;
  subscription_plan?: string;
  subscription_status: string;
  created_at: string;
}

interface LessorData {
  vehicles: number;
  bookings: number;
  revenue: number;
  activeBookings: number;
  completedBookings: number;
  monthlyData: any[];
}

export const FriAdminLessorDetailsPage = () => {
  const { lessorId } = useParams();
  const navigate = useNavigate();
  const [lessor, setLessor] = useState<LessorDetails | null>(null);
  const [data, setData] = useState<LessorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  useEffect(() => {
    const fetchLessorDetails = async () => {
      if (!lessorId) return;

      try {
        setLoading(true);

        const safeLessorId = String(lessorId).replace(/'/g, "''");
        const lessorResponse = await azureApi.post<any>('/db-query', {
          query: `SELECT 
            id,
            company_name,
            email,
            custom_domain,
            primary_color,
            logo_url,
            subscription_plan,
            subscription_status,
            created_at
          FROM fri_lessors WHERE id='${safeLessorId}'`,
          admin: true,
        });

        const lessorRows = normalizeRows(lessorResponse);
        const lessorData = lessorRows?.[0] as LessorDetails | undefined;
        if (!lessorData) throw new Error('Lessor ikke fundet');
        setLessor(lessorData);

        const [vehiclesRes, bookingsRes, invoicesRes, activeBookingsRes] = await Promise.all([
          azureApi.post<any>('/db-query', { query: `SELECT id FROM fri_vehicles WHERE lessor_id='${safeLessorId}'`, admin: true }),
          azureApi.post<any>('/db-query', { query: `SELECT id, total_price, status, start_date FROM fri_bookings WHERE lessor_id='${safeLessorId}'`, admin: true }),
          azureApi.post<any>('/db-query', { query: `SELECT id FROM fri_invoices WHERE lessor_id='${safeLessorId}'`, admin: true }),
          azureApi.post<any>('/db-query', { query: `SELECT id FROM fri_bookings WHERE lessor_id='${safeLessorId}' AND status='confirmed'`, admin: true }),
        ]);

        const bookingsData = normalizeRows(bookingsRes);
        const monthlyMap = new Map<string, number>();
        
        bookingsData.forEach(booking => {
          const month = new Date(booking.start_date).toLocaleDateString('da-DK', {
            year: 'numeric',
            month: 'short',
          });
          monthlyMap.set(month, (monthlyMap.get(month) || 0) + (booking.total_price || 0));
        });

        setData({
          vehicles: normalizeRows(vehiclesRes).length || 0,
          bookings: bookingsData.length,
          revenue: bookingsData.reduce((sum, b) => sum + (b.total_price || 0), 0),
          activeBookings: normalizeRows(activeBookingsRes).length || 0,
          completedBookings: bookingsData.filter(b => b.status === 'completed').length,
          monthlyData: Array.from(monthlyMap.entries())
            .map(([month, revenue]) => ({ month, revenue }))
            .slice(-12),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fejl ved indlæsning';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchLessorDetails();
  }, [lessorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400 font-medium">Indlæser lessor...</p>
        </div>
      </div>
    );
  }

  if (error || !lessor || !data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/fri/admin/lessors')}
          className="gap-2 text-gray-500 hover:text-gray-700 rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          Tilbage til lessors
        </Button>
        <Alert variant="destructive" className="rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Lessor ikke fundet'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusConfig = {
    trial: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Prøveperiode' },
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Aktiv' },
    suspended: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Suspenderet' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Annulleret' },
  }[lessor.subscription_status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: lessor.subscription_status };

  const statCards = [
    { label: 'Biler', value: data.vehicles, icon: Car, gradient: 'from-blue-500 to-cyan-400' },
    { label: 'Bookings', value: data.bookings, icon: TrendingUp, gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Revenue', value: `kr. ${(data.revenue / 1000).toFixed(1)}k`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-400' },
    { label: 'Aktive', value: data.activeBookings, icon: Users, gradient: 'from-pink-500 to-rose-400' },
    { label: 'Gennemført', value: data.completedBookings, icon: Calendar, gradient: 'from-amber-500 to-orange-400' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/fri/admin/lessors')}
          className="gap-2 mb-4 text-gray-400 hover:text-gray-700 rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          Tilbage til lessors
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lessor.company_name}</h1>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-1 ${statusConfig.bg}`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              <span className={`text-xs font-semibold ${statusConfig.text}`}>{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Kontooplysninger</h3>
          </div>
          <div className="space-y-4">
            {[
              { icon: Mail, label: 'Email', value: lessor.email },
              { icon: Hash, label: 'CVR', value: lessor.cvr_number || 'N/A' },
              { icon: Calendar, label: 'Oprettet', value: formatDistanceToNow(new Date(lessor.created_at), { locale: da, addSuffix: true }) },
              { icon: Globe, label: 'Domæne', value: lessor.custom_domain || 'Standard' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 text-right max-w-[200px] break-words">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {lessor.subscription_status === 'trial' ? 'Prøveperiode' : 'Abonnement'}
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Status</span>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bg}`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                <span className={`text-xs font-semibold ${statusConfig.text}`}>{statusConfig.label}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Start dato</span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(lessor.created_at).toLocaleDateString('da-DK')}
              </span>
            </div>
            {lessor.subscription_plan && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-semibold text-gray-900">{lessor.subscription_plan}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Månedlig revenue</h3>
        </div>
        {data.monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyData}>
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
    </div>
  );
};
