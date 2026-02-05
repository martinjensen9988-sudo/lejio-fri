import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicleLookup } from '@/hooks/useVehicleLookup';
import { useVehicles, VehicleInsert } from '@/hooks/useVehicles';
import { useDealerLocations } from '@/hooks/useDealerLocations';
import { supabase } from '@/integrations/azure/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Car, Check, ArrowLeft, Edit, Truck, Tent, Bike } from 'lucide-react';
import { toast } from 'sonner';

type VehicleType = 'bil' | 'trailer' | 'campingvogn' | 'motorcykel' | 'scooter';

interface SubscriptionLimits {
  max_vehicles: number;
  subscribed: boolean;
  is_trial: boolean;
  tier: string | null;
}

const VEHICLE_TYPES = [
  { value: 'bil' as VehicleType, label: 'Bil', icon: Car, description: 'Personbiler og varevogne' },
  { value: 'motorcykel' as VehicleType, label: 'Motorcykel', icon: Bike, description: 'MC i alle kategorier' },
  { value: 'scooter' as VehicleType, label: 'Scooter', icon: Bike, description: 'Scooter 30/45 km/t' },
  { value: 'trailer' as VehicleType, label: 'Trailer', icon: Truck, description: 'Alle typer trailere' },
  { value: 'campingvogn' as VehicleType, label: 'Campingvogn', icon: Tent, description: 'Campingvogne og autocampere' },
];

const AddVehiclePage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { vehicle, isLoading: lookupLoading, error, lookupVehicle, reset } = useVehicleLookup();
  const { vehicles, addVehicle, isLoading: addingVehicle } = useVehicles();
  const { locations } = useDealerLocations(user?.id);

  const [registration, setRegistration] = useState('');
  const [step, setStep] = useState<'type' | 'lookup' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<VehicleType>('bil');
  const [vehicleDetails, setVehicleDetails] = useState<Partial<VehicleInsert>>({});
  const [subscriptionLimits, setSubscriptionLimits] = useState<SubscriptionLimits | null>(null);

  const isProfessional = profile?.user_type === 'professionel';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkLimits = async () => {
      if (!isProfessional) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-pro-subscription');
        if (!error && data) {
          setSubscriptionLimits(data);
        }
      } catch (err) {
        console.error('Error checking subscription limits:', err);
      }
    };
    
    if (user && isProfessional) {
      checkLimits();
    }
  }, [user, isProfessional]);

  const isAtVehicleLimit = isProfessional && subscriptionLimits && vehicles.length >= subscriptionLimits.max_vehicles;

  const handleSelectType = (type: VehicleType) => {
    setSelectedType(type);
    setStep('lookup');
  };

  const handleLookup = async () => {
    const result = await lookupVehicle(registration);
    if (result) {
      setVehicleDetails({
        registration: result.registration,
        make: result.make,
        model: result.model,
        variant: result.variant,
        year: result.year > 0 ? result.year : undefined,
        fuel_type: result.fuel_type,
        color: result.color,
        vin: result.vin,
        daily_price: selectedType === 'bil' ? 499 : selectedType === 'trailer' ? 199 : 599,
        vehicle_type: selectedType,
      });
      setStep('details');
    }
  };

  const handleAddVehicle = async () => {
    if (!vehicleDetails.registration || !vehicleDetails.make || !vehicleDetails.model) return;
    
    if (isAtVehicleLimit) {
      toast.error('Du har nået grænsen for antal biler på dit abonnement');
      return;
    }

    const result = await addVehicle(vehicleDetails as VehicleInsert);
    if (result) {
      navigate('/dashboard/vehicles');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const VehicleIcon = VEHICLE_TYPES.find(t => t.value === selectedType)?.icon || Car;

  return (
    <DashboardLayout activeTab="vehicles">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/vehicles')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {step === 'type' ? 'Vælg køretøjstype' : 
               step === 'lookup' ? 'Find dit køretøj' : 
               'Bekræft oplysninger'}
            </h2>
            <p className="text-muted-foreground">Tilføj et nyt køretøj til din flåde</p>
          </div>
        </div>

        <Card>
          <CardContent className="py-6">
            {step === 'type' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleSelectType(type.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <type.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-semibold text-sm">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 'lookup' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Nummerplade</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="AB 12 345"
                      value={registration}
                      onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                      className="text-center text-xl font-bold uppercase tracking-widest"
                      maxLength={8}
                    />
                    <Button onClick={handleLookup} disabled={lookupLoading || !registration.trim()}>
                      {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                {vehicle && (
                  <div className="p-4 rounded-xl bg-mint/10 border border-mint/20 animate-scale-in">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-mint/20 flex items-center justify-center">
                        <VehicleIcon className="w-6 h-6 text-mint" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-foreground">
                          {vehicle.make} {vehicle.model}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year > 0 && `${vehicle.year} • `}
                          {vehicle.fuel_type && vehicle.fuel_type}
                        </p>
                      </div>
                      <Check className="w-5 h-5 text-mint ml-auto" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('type')} className="flex-1">
                    Tilbage
                  </Button>
                </div>
              </div>
            )}

            {step === 'details' && vehicleDetails && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <VehicleIcon className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-bold">{vehicleDetails.make} {vehicleDetails.model}</h4>
                      <p className="text-sm text-muted-foreground">
                        {vehicleDetails.registration} • {vehicleDetails.year}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Dagspris (kr)</Label>
                    <Input
                      type="number"
                      value={vehicleDetails.daily_price || ''}
                      onChange={(e) => setVehicleDetails(prev => ({ ...prev, daily_price: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('lookup')} className="flex-1">
                    Tilbage
                  </Button>
                  <Button 
                    onClick={handleAddVehicle} 
                    disabled={addingVehicle || isAtVehicleLimit}
                    className="flex-1"
                  >
                    {addingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tilføj køretøj'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddVehiclePage;
