import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminVehicleValueVerification from '@/components/admin/AdminVehicleValueVerification';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Loader2 } from 'lucide-react';

const AdminVehicleValuesPage = () => {
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
    <AdminDashboardLayout activeTab="vehicle-values">
      <div>
        <h2 className="text-2xl font-bold mb-2">Bilværdier</h2>
        <p className="text-muted-foreground mb-6">Verificer køretøjsværdier</p>
        <AdminVehicleValueVerification />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminVehicleValuesPage;
