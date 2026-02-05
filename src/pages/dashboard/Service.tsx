import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import ServiceTab from '@/components/dashboard/ServiceTab';
import ServiceRemindersCard from '@/components/dashboard/ServiceRemindersCard';
import { MCMaintenanceCard } from '@/components/dashboard/MCMaintenanceCard';
import { ServiceBookingCard } from '@/components/dashboard/ServiceBookingCard';
import { ServiceTasksCard } from '@/components/dashboard/ServiceTasksCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2 } from 'lucide-react';

const ServicePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vehicles, updateVehicle } = useVehicles();

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
    <DashboardLayout activeTab="service">
      <div>
        <h2 className="text-2xl font-bold mb-2">Værksted & Service</h2>
        <p className="text-muted-foreground mb-6">Administrer service og vedligeholdelse</p>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ServiceTab vehicles={vehicles} onUpdate={updateVehicle} />
            <ServiceRemindersCard vehicles={vehicles.map(v => ({
              id: v.id,
              make: v.make,
              model: v.model,
              registration: v.registration
            }))} />
            <MCMaintenanceCard vehicles={vehicles} />
          </div>
          <div className="space-y-6">
            <ServiceBookingCard />
            <ServiceTasksCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ServicePage;
