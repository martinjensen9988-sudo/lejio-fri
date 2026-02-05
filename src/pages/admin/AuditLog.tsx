import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminAuditLog } from '@/components/admin/AdminAuditLog';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Loader2 } from 'lucide-react';

const AdminAuditLogPage = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading, isSuperAdmin } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess || !isSuperAdmin)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, isSuperAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <AdminDashboardLayout activeTab="audit-log">
      <div>
        <h2 className="text-2xl font-bold mb-2">Audit Log</h2>
        <p className="text-muted-foreground mb-6">Komplet sporbarhed på alle admin-handlinger i systemet</p>
        <AdminAuditLog />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminAuditLogPage;
