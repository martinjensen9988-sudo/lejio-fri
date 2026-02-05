
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Clock, Calendar, Sparkles, BarChart3, MessageCircle, Flag, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const AdminDashboard = () => {
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

  // Dashboard overview content
  return (
    <AdminDashboardLayout activeTab="overview">
      {/* AdminDashboardLayout will render stats and navigation. Optionally add a welcome header here. */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Velkommen til Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg">Få et hurtigt overblik over platformens aktivitet og status.</p>
      </div>
      {/* children is empty, so layout shows stats and navigation */}
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
