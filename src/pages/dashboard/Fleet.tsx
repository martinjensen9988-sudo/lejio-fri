import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FleetDashboard } from '@/components/fleet/FleetDashboard';
import { Loader2 } from 'lucide-react';

const FleetPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="fleet">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fleet Management</h2>
        <p className="text-muted-foreground mb-6">
          Lad LEJIO varetage din biludlejning
        </p>
        <FleetDashboard />
      </div>
    </DashboardLayout>
  );
};

export default FleetPage;
