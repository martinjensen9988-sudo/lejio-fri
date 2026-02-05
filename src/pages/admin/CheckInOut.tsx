import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminCheckInOutSettings } from '@/components/admin/AdminCheckInOutSettings';
import { AdminFleetCheckInOut } from '@/components/admin/AdminFleetCheckInOut';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Car, Settings } from 'lucide-react';

const AdminCheckInOutPage = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('fleet');

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminDashboardLayout activeTab="checkinout">
      <div>
        <h2 className="text-2xl font-bold mb-2">Check-in/Check-out</h2>
        <p className="text-muted-foreground mb-6">Administrer udlevering og indlevering af køretøjer</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="fleet" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Fleet Håndtering
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Indstillinger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fleet">
            <AdminFleetCheckInOut />
          </TabsContent>

          <TabsContent value="settings">
            <AdminCheckInOutSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCheckInOutPage;
