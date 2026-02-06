import React from 'react';
import { useFriAuthContext } from '@/providers/FriAuthProvider';
import { useBrand } from '@/providers/BrandContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useFriStats } from '@/hooks/useFriData';
import { Loader2, TrendingUp, DollarSign, AlertCircle, Car, Calendar, Users, FileText, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import VehiclesTab from '@/components/fri/VehiclesTab';

export function FriDashboard() {
  const { user, signOut, loading, error } = useFriAuthContext();
  const { companyName } = useBrand();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useFriStats();

  const handlePageBuilder = () => navigate('/dashboard/pages');
  const handleLogout = async () => {
    await signOut();
    navigate('/fri');
  };

  if (loading) {
    return (
      <FriDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
        </div>
      </FriDashboardLayout>
    );
  }

  if (error) {
    return (
      <FriDashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Fejl</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <Button onClick={() => navigate('/fri/login')} variant="outline">
            Gå til login
          </Button>
        </div>
      </FriDashboardLayout>
    );
  }

  if (!user) {
    return (
      <FriDashboardLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Du skal være logget ind</h2>
          <Button onClick={() => navigate('/fri/login')} className="mt-4">
            Gå til login
          </Button>
        </div>
      </FriDashboardLayout>
    );
  }

  return (
    <FriDashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Velkommen, {user?.company_name || user?.email?.split('@')[0]}!</h1>
            <p className="text-gray-500 mt-1">Administrer hele din bilutlejningsvirksomhed på ét sted.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Vehicles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fri/dashboard/vehicles')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Aktive Køretøjer</p>
                <div className="flex items-baseline gap-2 mt-2">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">{stats?.activeVehicles || 0}</p>
                      <span className="text-xs text-gray-400">køretøjer</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Bookings This Month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fri/dashboard/bookings')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Bookinger (Denne Måned)</p>
                <div className="flex items-baseline gap-2 mt-2">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">{stats?.bookingsThisMonth || 0}</p>
                      <span className="text-xs text-gray-400">bookinger</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Revenue This Month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fri/dashboard/analytics')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Omsætning (Denne Måned)</p>
                <div className="flex items-baseline gap-2 mt-2">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">kr {(stats?.revenueThisMonth || 0).toLocaleString('da-DK')}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Outstanding Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fri/dashboard/invoices')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Udestående Fakturaer</p>
                <div className="flex items-baseline gap-2 mt-2">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">kr {(stats?.outstandingInvoices || 0).toLocaleString('da-DK')}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Hurtig Adgang</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={() => navigate('/fri/dashboard/vehicles')}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm font-medium h-12"
              size="lg"
            >
              <Car className="w-4 h-4 mr-2" />
              Tilføj Køretøj
            </Button>
            <Button
              onClick={() => navigate('/fri/dashboard/bookings')}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm font-medium h-12"
              size="lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ny Booking
            </Button>
            <Button
              onClick={() => navigate('/fri/dashboard/invoices')}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm font-medium h-12"
              size="lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              Opret Faktura
            </Button>
            <Button
              onClick={handlePageBuilder}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm font-medium h-12"
              size="lg"
            >
              🌐 Lav Hjemmeside
            </Button>
          </div>
        </div>

        {/* Bottom Grid: Navigation Cards + Getting Started */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Køretøjer', desc: 'Administrer din flåde', icon: Car, path: '/fri/dashboard/vehicles', color: 'bg-blue-50 text-blue-600' },
              { title: 'Bookinger', desc: 'Se og opret reservationer', icon: Calendar, path: '/fri/dashboard/bookings', color: 'bg-green-50 text-green-600' },
              { title: 'Fakturaer', desc: 'Fakturer og betalinger', icon: FileText, path: '/fri/dashboard/invoices', color: 'bg-purple-50 text-purple-600' },
              { title: 'Team', desc: 'Administrer medarbejdere', icon: Users, path: '/fri/dashboard/team', color: 'bg-orange-50 text-orange-600' },
              { title: 'Analytik', desc: 'Omsætning og statistik', icon: TrendingUp, path: '/fri/dashboard/analytics', color: 'bg-pink-50 text-pink-600' },
              { title: 'Betalinger', desc: 'Transaktioner og udbetalinger', icon: DollarSign, path: '/fri/dashboard/payments', color: 'bg-emerald-50 text-emerald-600' },
            ].map((item) => (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-pink-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>  
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-pink-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Getting Started Checklist */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-pink-500" />
              Kom Godt I Gang
            </h3>
            <div className="space-y-3">
              {[
                { text: 'Opret din profil', done: true },
                { text: 'Tilføj dit første køretøj', done: (stats?.activeVehicles || 0) > 0 },
                { text: 'Opret en booking', done: (stats?.bookingsThisMonth || 0) > 0 },
                { text: 'Inviter teammedlemmer', done: false },
                { text: 'Opsæt betalingsmetode', done: false },
                { text: 'Lav din hjemmeside', done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FriDashboardLayout>
  );
}
