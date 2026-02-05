import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import InspectionRemindersTab from '@/components/dashboard/InspectionRemindersTab';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

const InspectionsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vehicles } = useVehicles();

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
    <DashboardLayout activeTab="inspections">
      <div>
        <h2 className="text-2xl font-bold mb-2">Syn</h2>
        <p className="text-muted-foreground mb-6">Hold styr på synstidspunkter</p>
        <InspectionRemindersTab vehicles={vehicles} />
      </div>
    </DashboardLayout>
  );
};

export default InspectionsPage;
