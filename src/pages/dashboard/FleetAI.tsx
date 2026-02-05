import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AutoDispatchCard } from '@/components/dashboard/AutoDispatchCard';
import { ServiceTasksCard } from '@/components/dashboard/ServiceTasksCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

const FleetAIPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout activeTab="fleet-ai">
      <div>
        <h2 className="text-2xl font-bold mb-2">Flåde AI</h2>
        <p className="text-muted-foreground mb-6">AI-drevet flådestyring og anbefalinger</p>
        <div className="grid lg:grid-cols-2 gap-6">
          <AutoDispatchCard />
          <ServiceTasksCard />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FleetAIPage;
