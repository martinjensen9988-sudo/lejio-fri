import React from 'react';
import { useFriAuthContext } from '@/providers/FriAuthProvider';
import { useBrand } from '@/providers/BrandContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useFriStats } from '@/hooks/useFriData';
import { Loader2, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Velkommen!</h1>
          <p className="text-gray-600 mt-2">Administrer hele din bilutlejningsvirksomhed på ét sted.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Vehicles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Aktive Køretøjer</p>
                <div className="flex items-baseline gap-2 mt-3">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">{stats?.activeVehicles || 0}</p>
                      <span className="text-xs text-gray-500">køretøjer</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">🚗</span>
              </div>
            </div>
          </div>

          {/* Bookings This Month */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Bookinger (Denne Måned)</p>
                <div className="flex items-baseline gap-2 mt-3">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">{stats?.bookingsThisMonth || 0}</p>
                      <span className="text-xs text-gray-500">bookinger</span>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">📅</span>
              </div>
            </div>
          </div>

          {/* Revenue This Month */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Omsætning (Denne Måned)</p>
                <div className="flex items-baseline gap-2 mt-3">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">kr {(stats?.revenueThisMonth || 0).toLocaleString('da-DK')}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Outstanding Invoices */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Udestående Invoicer</p>
                <div className="flex items-baseline gap-2 mt-3">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900">kr {(stats?.outstandingInvoices || 0).toLocaleString('da-DK')}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] rounded-lg shadow-md p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Hurtigudfør</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/fri/dashboard/vehicles')}
              className="bg-white text-[#4CAF50] hover:bg-gray-100 font-semibold"
              size="lg"
            >
              ➕ Tilføj Køretøj
            </Button>
            <Button
              onClick={() => navigate('/fri/dashboard/bookings')}
              className="bg-white text-[#4CAF50] hover:bg-gray-100 font-semibold"
              size="lg"
            >
              📅 Se Bookinger
            </Button>
            <Button
              onClick={handlePageBuilder}
              className="bg-white text-[#4CAF50] hover:bg-gray-100 font-semibold"
              size="lg"
            >
              🌐 Lav Hjemmeside
            </Button>
          </div>
        </div>
      </div>
    </FriDashboardLayout>
  );
}
