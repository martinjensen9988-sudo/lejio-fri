import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import VehicleCard from '@/components/dashboard/VehicleCard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Car, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/azure/client';

const VehiclesPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vehicles, isLoading: vehiclesLoading, updateVehicle, deleteVehicle } = useVehicles();
  const [isFleetManaged, setIsFleetManaged] = useState(false);

  // Check if current user has a fleet plan
  useEffect(() => {
    const checkFleetPlan = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('fleet_plan')
        .eq('id', user.id)
        .single();
      setIsFleetManaged(!!data?.fleet_plan);
    };
    checkFleetPlan();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleToggleAvailability = async (id: string, available: boolean) => {
    await updateVehicle(id, { is_available: available });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout activeTab="vehicles">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Mine biler</h2>
            <p className="text-muted-foreground">Administrer dine køretøjer</p>
          </div>
          <Button onClick={() => navigate('/dashboard/vehicles/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj bil
          </Button>
        </div>
        {vehiclesLoading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Ingen biler endnu
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Tilføj din første bil ved at indtaste nummerpladen.
            </p>
            <Button onClick={() => navigate('/dashboard/vehicles/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Tilføj bil
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onToggleAvailability={handleToggleAvailability}
                onUpdate={updateVehicle}
                onDelete={deleteVehicle}
                isFleetManaged={isFleetManaged}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VehiclesPage;
