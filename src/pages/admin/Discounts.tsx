import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminDiscountCodes from '@/components/admin/AdminDiscountCodes';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Loader2 } from 'lucide-react';

const AdminDiscountsPage = () => {
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
    <AdminDashboardLayout activeTab="discounts">
      <div>
        <h2 className="text-2xl font-bold mb-2">Rabatkoder</h2>
        <p className="text-muted-foreground mb-6">Administrer rabatkoder</p>
        <AdminDiscountCodes />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDiscountsPage;
