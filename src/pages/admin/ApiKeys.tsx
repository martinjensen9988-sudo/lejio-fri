import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminFleetApiKeys } from '@/components/admin/AdminFleetApiKeys';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Loader2 } from 'lucide-react';

const AdminApiKeysPage = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();

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
    <AdminDashboardLayout activeTab="api-keys">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fleet API-nøgler</h2>
        <p className="text-muted-foreground mb-6">Administrer API-nøgler til fleet-ejeres hjemmeside-integrationer</p>
        <AdminFleetApiKeys />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminApiKeysPage;
