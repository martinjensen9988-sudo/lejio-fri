import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminSalesAI from '@/components/admin/AdminSalesAI';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Loader2 } from 'lucide-react';

const AdminSalesAIPage = () => {
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
    <AdminDashboardLayout activeTab="sales-ai">
      <AdminSalesAI />
    </AdminDashboardLayout>
  );
};

export default AdminSalesAIPage;