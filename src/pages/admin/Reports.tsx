import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLessorReports from '@/components/admin/AdminLessorReports';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Loader2 } from 'lucide-react';

const AdminReportsPage = () => {
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
    <AdminDashboardLayout activeTab="lessor-reports">
      <div>
        <h2 className="text-2xl font-bold mb-2">Rapporter</h2>
        <p className="text-muted-foreground mb-6">Se udlejer rapporter</p>
        <AdminLessorReports />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReportsPage;
