import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminFleetManagement from '@/components/admin/AdminFleetManagement';
import { AdminFleetPremiumDashboard } from '@/components/admin/AdminFleetPremiumDashboard';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { AdminServiceQueue } from '@/components/admin/AdminServiceQueue';
import { AdminLoanRequests } from '@/components/admin/AdminLoanRequests';
import { AdminCoverageShortfalls } from '@/components/admin/AdminCoverageShortfalls';
import { AdminPartnerAlerts } from '@/components/admin/AdminPartnerAlerts';
import { AdminFleetRiskOverview } from '@/components/admin/AdminFleetRiskOverview';
import { AdminFleetFinance } from '@/components/admin/AdminFleetFinance';
import { AdminRedZoneVehicles } from '@/components/admin/AdminRedZoneVehicles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BarChart3, Settings, Wrench, Wallet, AlertTriangle, TrendingDown, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/azure/client';

const AdminFleetPage = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fleetVehicles, setFleetVehicles] = useState<{ id: string; registration: string; make: string; model: string; owner_id: string }[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, navigate]);

  // Fetch fleet vehicles for service queue
  useEffect(() => {
    const fetchFleetVehicles = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .not('fleet_plan', 'is', null);

      if (profiles && profiles.length > 0) {
        const ownerIds = profiles.map(p => p.id);
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('id, registration, make, model, owner_id')
          .in('owner_id', ownerIds);
        
        setFleetVehicles(vehicles || []);
      }
    };
    fetchFleetVehicles();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminDashboardLayout activeTab="fleet">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fleet Management</h2>
        <p className="text-muted-foreground mb-6">Oversigt over alle fleet-kunder og deres køretøjer</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Finans & Lån
            </TabsTrigger>
            <TabsTrigger value="redzone" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Rød Zone
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Servicekø
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Administration
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alarmer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminFleetPremiumDashboard />
          </TabsContent>

          <TabsContent value="finance">
            <div className="space-y-6">
              <AdminFleetRiskOverview />
              <AdminFleetFinance />
              <AdminLoanRequests />
              <AdminCoverageShortfalls />
            </div>
          </TabsContent>

          <TabsContent value="redzone">
            <AdminRedZoneVehicles />
          </TabsContent>

          <TabsContent value="service">
            <AdminServiceQueue fleetVehicles={fleetVehicles} />
          </TabsContent>

          <TabsContent value="management">
            <AdminFleetManagement />
          </TabsContent>

          <TabsContent value="alerts">
            <AdminPartnerAlerts />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminFleetPage;
