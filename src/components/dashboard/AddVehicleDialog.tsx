import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useVehicleLookup } from '@/hooks/useVehicleLookup';
import { useVehicles, VehicleInsert } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { useDealerLocations } from '@/hooks/useDealerLocations';
import { supabase } from '@/integrations/azure/client';
import { Plus, Search, Loader2, Car, Check, CreditCard, CalendarClock, MapPin, AlertTriangle, Lock, Edit, Truck, Tent, Bike } from 'lucide-react';
import { toast } from 'sonner';
import { TrailerFields } from './TrailerFields';
import { CaravanFields } from './CaravanFields';
import { MotorcycleFields } from './MotorcycleFields';
interface SubscriptionLimits {
  max_vehicles: number;
  subscribed: boolean;
  is_trial: boolean;
  tier: string | null;
}

type VehicleType = 'bil' | 'trailer' | 'campingvogn' | 'motorcykel' | 'scooter';

// Extended vehicle details type to support new MC fields not yet in generated Supabase types
type VehicleDetailsState = Partial<VehicleInsert> & {
  mc_category?: string;
  mc_daily_km_limit?: number;
  engine_cc?: number;
  engine_kw?: number;
  has_abs?: boolean;
  seat_height_mm?: number;
  helmet_included?: boolean;
  helmet_size?: string;
  has_disc_lock?: boolean;
  has_chain_lock?: boolean;
  has_steering_lock?: boolean;
  has_top_box?: boolean;
  has_side_bags?: boolean;
  has_tank_bag?: boolean;
  has_phone_mount?: boolean;
  has_usb_outlet?: boolean;
  has_heated_grips?: boolean;
  has_windscreen?: boolean;
  rain_guarantee_enabled?: boolean;
  winter_deactivated?: boolean;
};

const VEHICLE_TYPES = [
  { value: 'bil' as VehicleType, label: 'Bil', icon: Car, description: 'Personbiler og varevogne' },
  { value: 'motorcykel' as VehicleType, label: 'Motorcykel', icon: Bike, description: 'MC i alle kategorier' },
  { value: 'scooter' as VehicleType, label: 'Scooter', icon: Bike, description: 'Scooter 30/45 km/t' },
  { value: 'trailer' as VehicleType, label: 'Trailer', icon: Truck, description: 'Alle typer trailere' },
  { value: 'campingvogn' as VehicleType, label: 'Campingvogn', icon: Tent, description: 'Campingvogne og autocampere' },
];

const AddVehicleDialog = () => {
  const [open, setOpen] = useState(false);
  const [registration, setRegistration] = useState('');
  const [step, setStep] = useState<'type' | 'lookup' | 'details' | 'manual'>('type');
  const [selectedType, setSelectedType] = useState<VehicleType>('bil');
  const [manualMode, setManualMode] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetailsState>({});
  const [subscriptionLimits, setSubscriptionLimits] = useState<SubscriptionLimits | null>(null);
  const [checkingLimits, setCheckingLimits] = useState(false);
  
  const { vehicle, isLoading: lookupLoading, error, lookupVehicle, reset } = useVehicleLookup();
  const { vehicles, addVehicle, isLoading: addingVehicle } = useVehicles();
  const { profile, user } = useAuth();
  const { locations } = useDealerLocations(user?.id);

  const isProfessional = profile?.user_type === 'professionel';

  // Check subscription limits for professional users
  useEffect(() => {
    const checkLimits = async () => {
      if (!isProfessional) return;
      
      setCheckingLimits(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-pro-subscription');
        if (!error && data) {
          setSubscriptionLimits(data);
        }
      } catch (err) {
        console.error('Error checking subscription limits:', err);
      } finally {
        setCheckingLimits(false);
      }
    };
    
    if (open && isProfessional) {
      checkLimits();
    }
  }, [open, isProfessional]);

  const isAtVehicleLimit = isProfessional && subscriptionLimits && vehicles.length >= subscriptionLimits.max_vehicles;
  const canAddVehicle = !isProfessional || !isAtVehicleLimit;

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
        daily_price: selectedType === 'bil' ? 499 : selectedType === 'trailer' ? 199 : selectedType === 'motorcykel' ? 599 : selectedType === 'scooter' ? 299 : 799,
        weekly_price: selectedType === 'bil' ? 2800 : selectedType === 'trailer' ? 999 : selectedType === 'motorcykel' ? 3500 : selectedType === 'scooter' ? 1800 : 4500,
        monthly_price: selectedType === 'bil' ? 9900 : selectedType === 'trailer' ? 2900 : selectedType === 'motorcykel' ? 12900 : selectedType === 'scooter' ? 5900 : 14900,
        included_km: selectedType === 'bil' ? 100 : (selectedType === 'motorcykel' || selectedType === 'scooter') ? 200 : undefined,
        extra_km_price: selectedType === 'bil' ? 2.50 : (selectedType === 'motorcykel' || selectedType === 'scooter') ? 2.00 : undefined,
        deposit_required: false,
        deposit_amount: 0,
        prepaid_rent_enabled: false,
        prepaid_rent_months: 1,
        payment_schedule: 'upfront' as const,
        use_custom_location: false,
        location_address: '',
        location_postal_code: '',
        location_city: '',
        vehicle_value: undefined,
        vehicle_type: selectedType,
        // Trailer/campingvogn specific
        total_weight: undefined,
        requires_b_license: selectedType === 'trailer' ? true : undefined,
        sleeping_capacity: selectedType === 'campingvogn' ? 4 : undefined,
        has_kitchen: selectedType === 'campingvogn' ? false : undefined,
        has_bathroom: selectedType === 'campingvogn' ? false : undefined,
        has_awning: selectedType === 'campingvogn' ? false : undefined,
        // MC/Scooter specific defaults
        mc_category: selectedType === 'scooter' ? 'scooter_45' : selectedType === 'motorcykel' ? 'a2' : undefined,
        mc_daily_km_limit: (selectedType === 'motorcykel' || selectedType === 'scooter') ? 200 : undefined,
      });
      setStep('details');
    }
  };

  const handleAddVehicle = async () => {
    if (!vehicleDetails.registration || !vehicleDetails.make || !vehicleDetails.model) return;
    
    // Check vehicle limit for professional users
    if (!canAddVehicle) {
      toast.error('Du har nået grænsen for antal biler på dit abonnement', {
        description: 'Opgrader dit abonnement for at tilføje flere biler.',
      });
      return;
    }
    
    const finalDetails = { ...vehicleDetails };
    
    // Geocode the address if custom location is enabled
    if (vehicleDetails.use_custom_location && vehicleDetails.location_address) {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: {
            address: vehicleDetails.location_address,
            postalCode: vehicleDetails.location_postal_code,
            city: vehicleDetails.location_city,
          },
        });
        
        if (!error && data?.latitude && data?.longitude) {
          finalDetails.latitude = data.latitude;
          finalDetails.longitude = data.longitude;
        }
      } catch (err) {
        console.error('Geocoding failed:', err);
        // Continue without coordinates
      }
    }
    
    const result = await addVehicle(finalDetails as VehicleInsert);
    if (result) {
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setRegistration('');
    setStep('type');
    setSelectedType('bil');
    setManualMode(false);
    setVehicleDetails({});
    reset();
  };

  const startManualEntry = () => {
    setManualMode(true);
    setVehicleDetails({
      registration: registration || '',
      make: '',
      model: '',
      variant: '',
      year: undefined,
      fuel_type: selectedType === 'bil' ? '' : undefined,
      color: '',
      vin: '',
      daily_price: selectedType === 'bil' ? 499 : selectedType === 'trailer' ? 199 : selectedType === 'motorcykel' ? 599 : selectedType === 'scooter' ? 299 : 799,
      weekly_price: selectedType === 'bil' ? 2800 : selectedType === 'trailer' ? 999 : selectedType === 'motorcykel' ? 3500 : selectedType === 'scooter' ? 1800 : 4500,
      monthly_price: selectedType === 'bil' ? 9900 : selectedType === 'trailer' ? 2900 : selectedType === 'motorcykel' ? 12900 : selectedType === 'scooter' ? 5900 : 14900,
      included_km: selectedType === 'bil' ? 100 : (selectedType === 'motorcykel' || selectedType === 'scooter') ? 200 : undefined,
      extra_km_price: selectedType === 'bil' ? 2.50 : (selectedType === 'motorcykel' || selectedType === 'scooter') ? 2.00 : undefined,
      deposit_required: false,
      deposit_amount: 0,
      prepaid_rent_enabled: false,
      prepaid_rent_months: 1,
      payment_schedule: 'upfront' as const,
      use_custom_location: false,
      location_address: '',
      location_postal_code: '',
      location_city: '',
      vehicle_value: undefined,
      vehicle_type: selectedType,
      // Trailer/campingvogn specific
      total_weight: undefined,
      requires_b_license: selectedType === 'trailer' ? true : undefined,
      sleeping_capacity: selectedType === 'campingvogn' ? 4 : undefined,
      has_kitchen: selectedType === 'campingvogn' ? false : undefined,
      has_bathroom: selectedType === 'campingvogn' ? false : undefined,
      has_awning: selectedType === 'campingvogn' ? false : undefined,
      // MC/Scooter specific defaults
      mc_category: selectedType === 'scooter' ? 'scooter_45' : selectedType === 'motorcykel' ? 'a2' : undefined,
      mc_daily_km_limit: (selectedType === 'motorcykel' || selectedType === 'scooter') ? 200 : undefined,
    });
    setStep('manual');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetForm();
  };

  const getVehicleTypeLabel = () => {
    const type = VEHICLE_TYPES.find(t => t.value === selectedType);
    return type?.label.toLowerCase() || 'køretøj';
  };

  const VehicleIcon = VEHICLE_TYPES.find(t => t.value === selectedType)?.icon || Car;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="warm" className="gap-2" disabled={isAtVehicleLimit}>
          {isAtVehicleLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAtVehicleLimit ? 'Opgrader' : 'Tilføj køretøj'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {step === 'type' ? 'Vælg køretøjstype' : 
             step === 'lookup' ? `Find din ${getVehicleTypeLabel()}` : 
             step === 'manual' ? `Indtast ${getVehicleTypeLabel()}oplysninger` : 
             `Bekræft ${getVehicleTypeLabel()}oplysninger`}
          </DialogTitle>
        </DialogHeader>

        {/* Vehicle limit warning for professional users */}
        {isProfessional && subscriptionLimits && step !== 'type' && (
          <div className={`p-3 rounded-xl border ${isAtVehicleLimit ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50 border-border'}`}>
            <div className="flex items-center gap-2 text-sm">
              <VehicleIcon className="w-4 h-4" />
              <span>
                {vehicles.length} af {subscriptionLimits.max_vehicles === 999 ? '∞' : subscriptionLimits.max_vehicles} køretøjer brugt
              </span>
              {subscriptionLimits.is_trial && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  Prøveperiode
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Choose vehicle type */}
        {step === 'type' ? (
          <div className="space-y-4 py-4">
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
          </div>
        ) : step === 'lookup' ? (
          <div className="space-y-6 py-4">
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
              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={startManualEntry} className="gap-2">
                    <Edit className="w-4 h-4" />
                    Indtast manuelt i stedet
                  </Button>
                </div>
              )}
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

            {/* Manual entry button */}
            <div className="pt-2 border-t border-border space-y-2">
              <Button variant="ghost" onClick={startManualEntry} className="w-full gap-2 text-muted-foreground hover:text-foreground">
                <Edit className="w-4 h-4" />
                Eller indtast {getVehicleTypeLabel()}oplysninger manuelt
              </Button>
              <Button variant="outline" onClick={() => setStep('type')} className="w-full">
                Tilbage til valg af køretøjstype
              </Button>
            </div>
          </div>
        ) : step === 'manual' ? (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Manual vehicle info entry */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{selectedType === 'bil' ? 'Biloplysninger' : selectedType === 'trailer' ? 'Traileroplysninger' : 'Campingvognoplysninger'}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Nummerplade *</Label>
                  <Input
                    value={vehicleDetails.registration || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, registration: e.target.value.toUpperCase() }))}
                    placeholder="AB 12 345"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Årgang</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.year || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, year: parseInt(e.target.value) || undefined }))}
                    placeholder="2020"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Mærke *</Label>
                  <Input
                    value={vehicleDetails.make || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, make: e.target.value }))}
                    placeholder={selectedType === 'bil' ? 'F.eks. Toyota' : selectedType === 'trailer' ? 'F.eks. Brenderup' : 'F.eks. Hobby'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Model *</Label>
                  <Input
                    value={vehicleDetails.model || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, model: e.target.value }))}
                    placeholder={selectedType === 'bil' ? 'F.eks. Corolla' : selectedType === 'trailer' ? 'F.eks. 2500' : 'F.eks. De Luxe 495'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Variant</Label>
                  <Input
                    value={vehicleDetails.variant || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, variant: e.target.value }))}
                    placeholder="Valgfrit"
                  />
                </div>
                {selectedType === 'bil' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Brændstof</Label>
                    <Input
                      value={vehicleDetails.fuel_type || ''}
                      onChange={(e) => setVehicleDetails(prev => ({ ...prev, fuel_type: e.target.value }))}
                      placeholder="F.eks. Benzin"
                    />
                  </div>
                )}
                {(selectedType === 'trailer' || selectedType === 'campingvogn') && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Totalvægt (kg)</Label>
                    <Input
                      type="number"
                      value={vehicleDetails.total_weight || ''}
                      onChange={(e) => setVehicleDetails(prev => ({ ...prev, total_weight: parseInt(e.target.value) || undefined }))}
                      placeholder="F.eks. 750"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Farve</Label>
                  <Input
                    value={vehicleDetails.color || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="F.eks. Hvid"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Stelnummer (VIN)</Label>
                  <Input
                    value={vehicleDetails.vin || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                    placeholder="Valgfrit"
                    className="uppercase"
                  />
                </div>
              </div>
              
              {/* Trailer specific fields */}
              {selectedType === 'trailer' && (
                <TrailerFields 
                  vehicleDetails={vehicleDetails as Record<string, unknown>}
                  setVehicleDetails={setVehicleDetails as (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void}
                />
              )}

              {/* Campingvogn specific fields */}
              {selectedType === 'campingvogn' && (
                <CaravanFields 
                  vehicleDetails={vehicleDetails as Record<string, unknown>}
                  setVehicleDetails={setVehicleDetails as (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void}
                />
              )}

              {/* MC/Scooter specific fields */}
              {(selectedType === 'motorcykel' || selectedType === 'scooter') && (
                <MotorcycleFields 
                  formData={vehicleDetails}
                  onChange={(field, value) => setVehicleDetails(prev => ({ ...prev, [field]: value }))}
                />
              )}
            </div>

            {/* Prices */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Priser</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. dag (kr)</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.daily_price || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, daily_price: parseFloat(e.target.value) || undefined }))}
                    placeholder="499"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. uge (kr)</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.weekly_price || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, weekly_price: parseFloat(e.target.value) || undefined }))}
                    placeholder="2.800"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. måned (kr)</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.monthly_price || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || undefined }))}
                    placeholder="9.900"
                  />
                </div>
              </div>
            </div>

            {/* Location Assignment */}
            {locations.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Placering (afdeling)
                </Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={vehicleDetails.current_location_id || ''}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, current_location_id: e.target.value || undefined }))}
                >
                  <option value="">Vælg lokation (valgfrit)</option>
                  {locations.filter(l => l.is_active).map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Vehicle Value */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Køretøjets værdi (ansvar)</Label>
              <Input
                type="number"
                value={vehicleDetails.vehicle_value || ''}
                onChange={(e) => setVehicleDetails(prev => ({ ...prev, vehicle_value: parseFloat(e.target.value) || undefined }))}
                placeholder="F.eks. 150.000"
              />
            </div>

            {/* KM Settings - Only for cars */}
            {selectedType === 'bil' && (
              <>
                <div 
                  className="flex items-center space-x-3 p-3 rounded-xl bg-mint/10 border border-mint/20 cursor-pointer"
                  onClick={() => setVehicleDetails(prev => ({ ...prev, unlimited_km: !prev.unlimited_km }))}
                >
                  <Checkbox
                    id="manual_unlimited_km"
                    checked={vehicleDetails.unlimited_km || false}
                    onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, unlimited_km: !!checked }))}
                  />
                  <label htmlFor="manual_unlimited_km" className="text-sm font-medium cursor-pointer select-none">
                    Fri km (ingen km-begrænsning)
                  </label>
                </div>

                {!vehicleDetails.unlimited_km && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Inkl. km/dag</Label>
                      <Input
                        type="number"
                        value={vehicleDetails.included_km || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, included_km: parseInt(e.target.value) || undefined }))}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ekstra km pris (kr)</Label>
                      <Input
                        type="number"
                        step="0.50"
                        value={vehicleDetails.extra_km_price || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, extra_km_price: parseFloat(e.target.value) || undefined }))}
                        placeholder="2,50"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => { setStep('lookup'); setManualMode(false); }} className="flex-1">
                Tilbage
              </Button>
              <Button 
                onClick={handleAddVehicle} 
                disabled={addingVehicle || !vehicleDetails.registration || !vehicleDetails.make || !vehicleDetails.model || !canAddVehicle}
                className="flex-1"
              >
                {addingVehicle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Tilføj {getVehicleTypeLabel()}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <VehicleIcon className="w-5 h-5 text-primary" />
                <span className="font-display font-bold">
                  {vehicleDetails.make} {vehicleDetails.model}
                </span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {vehicleDetails.registration}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {vehicleDetails.year && (
                  <div>
                    <span className="text-muted-foreground">Årgang:</span>
                    <span className="ml-1 font-medium">{vehicleDetails.year}</span>
                  </div>
                )}
                {vehicleDetails.fuel_type && selectedType === 'bil' && (
                  <div>
                    <span className="text-muted-foreground">Brændstof:</span>
                    <span className="ml-1 font-medium capitalize">{vehicleDetails.fuel_type}</span>
                  </div>
                )}
                {vehicleDetails.color && (
                  <div>
                    <span className="text-muted-foreground">Farve:</span>
                    <span className="ml-1 font-medium capitalize">{vehicleDetails.color}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trailer/campingvogn specific fields */}
            {(selectedType === 'trailer' || selectedType === 'campingvogn') && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {selectedType === 'trailer' ? 'Trailer-oplysninger' : 'Campingvogn-oplysninger'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Totalvægt (kg)</Label>
                    <Input
                      type="number"
                      value={vehicleDetails.total_weight || ''}
                      onChange={(e) => setVehicleDetails(prev => ({ ...prev, total_weight: parseInt(e.target.value) || undefined }))}
                      placeholder="F.eks. 750"
                    />
                  </div>
                  {selectedType === 'campingvogn' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Antal sovepladser</Label>
                      <Input
                        type="number"
                        value={vehicleDetails.sleeping_capacity || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, sleeping_capacity: parseInt(e.target.value) || undefined }))}
                        placeholder="F.eks. 4"
                      />
                    </div>
                  )}
                </div>
                
                {selectedType === 'trailer' && (
                  <div 
                    className="flex items-center space-x-3 p-3 rounded-xl bg-lavender/10 border border-lavender/20 cursor-pointer"
                    onClick={() => setVehicleDetails(prev => ({ ...prev, requires_b_license: !prev.requires_b_license }))}
                  >
                    <Checkbox
                      id="detail_requires_b_license"
                      checked={vehicleDetails.requires_b_license ?? true}
                      onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, requires_b_license: !!checked }))}
                    />
                    <label htmlFor="detail_requires_b_license" className="text-sm font-medium cursor-pointer select-none">
                      Kræver kun B-kørekort (under 750 kg)
                    </label>
                  </div>
                )}

                {selectedType === 'campingvogn' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div 
                      className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 border border-border cursor-pointer"
                      onClick={() => setVehicleDetails(prev => ({ ...prev, has_kitchen: !prev.has_kitchen }))}
                    >
                      <Checkbox
                        id="detail_has_kitchen"
                        checked={vehicleDetails.has_kitchen || false}
                        onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, has_kitchen: !!checked }))}
                      />
                      <label htmlFor="detail_has_kitchen" className="text-xs cursor-pointer select-none">Køkken</label>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 border border-border cursor-pointer"
                      onClick={() => setVehicleDetails(prev => ({ ...prev, has_bathroom: !prev.has_bathroom }))}
                    >
                      <Checkbox
                        id="detail_has_bathroom"
                        checked={vehicleDetails.has_bathroom || false}
                        onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, has_bathroom: !!checked }))}
                      />
                      <label htmlFor="detail_has_bathroom" className="text-xs cursor-pointer select-none">Bad/WC</label>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50 border border-border cursor-pointer"
                      onClick={() => setVehicleDetails(prev => ({ ...prev, has_awning: !prev.has_awning }))}
                    >
                      <Checkbox
                        id="detail_has_awning"
                        checked={vehicleDetails.has_awning || false}
                        onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, has_awning: !!checked }))}
                      />
                      <label htmlFor="detail_has_awning" className="text-xs cursor-pointer select-none">Markise</label>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-base font-semibold">Priser</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. dag (kr)</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.daily_price || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, daily_price: parseFloat(e.target.value) || undefined }))}
                    placeholder={selectedType === 'bil' ? '499' : selectedType === 'trailer' ? '199' : '799'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. uge (kr)</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.weekly_price || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, weekly_price: parseFloat(e.target.value) || undefined }))}
                    placeholder={selectedType === 'bil' ? '2.800' : selectedType === 'trailer' ? '999' : '4.500'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. måned (kr)</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.monthly_price || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || undefined }))}
                    placeholder={selectedType === 'bil' ? '9.900' : selectedType === 'trailer' ? '2.900' : '14.900'}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Value */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Køretøjets værdi (ansvar)</Label>
              <div className="space-y-2">
                <Input
                  type="number"
                  value={vehicleDetails.vehicle_value || ''}
                  onChange={(e) => setVehicleDetails(prev => ({ ...prev, vehicle_value: parseFloat(e.target.value) || undefined }))}
                  placeholder="F.eks. 150.000"
                />
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-yellow-600 mb-1">Vigtig information</p>
                      <p>Denne værdi bruges i lejekontrakten. Værdien må <strong>aldrig</strong> være højere end den faktiske købspris.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unlimited KM checkbox - Only for cars */}
            {selectedType === 'bil' && (
              <>
                <div 
                  className="flex items-center space-x-3 p-3 rounded-xl bg-mint/10 border border-mint/20 cursor-pointer"
                  onClick={() => setVehicleDetails(prev => ({ ...prev, unlimited_km: !prev.unlimited_km }))}
                >
                  <Checkbox
                    id="unlimited_km"
                    checked={vehicleDetails.unlimited_km || false}
                    onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, unlimited_km: !!checked }))}
                  />
                  <label htmlFor="unlimited_km" className="text-sm font-medium cursor-pointer select-none">
                    Fri km (ingen km-begrænsning)
                  </label>
                </div>

                {!vehicleDetails.unlimited_km && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Inkl. km/dag</Label>
                      <Input
                        type="number"
                        value={vehicleDetails.included_km || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, included_km: parseInt(e.target.value) || undefined }))}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ekstra km pris (kr)</Label>
                      <Input
                        type="number"
                        step="0.50"
                        value={vehicleDetails.extra_km_price || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, extra_km_price: parseFloat(e.target.value) || undefined }))}
                        placeholder="2,50"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Deposit Section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Depositum & Forudbetaling</Label>
              
              {/* Deposit checkbox */}
              <div 
                className="flex items-center space-x-3 p-3 rounded-xl bg-lavender/10 border border-lavender/20 cursor-pointer"
                onClick={() => setVehicleDetails(prev => ({ ...prev, deposit_required: !prev.deposit_required }))}
              >
                <Checkbox
                  id="deposit_required"
                  checked={vehicleDetails.deposit_required || false}
                  onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, deposit_required: !!checked }))}
                />
                <label htmlFor="deposit_required" className="text-sm font-medium cursor-pointer select-none">
                  Kræv depositum
                </label>
              </div>

              {vehicleDetails.deposit_required && (
                <div className="space-y-2 pl-6">
                  <Label className="text-xs text-muted-foreground">Depositum beløb (kr)</Label>
                  <Input
                    type="number"
                    value={vehicleDetails.deposit_amount || ''}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, deposit_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="2.500"
                  />
                </div>
              )}

              {/* Prepaid rent checkbox */}
              <div 
                className="flex items-center space-x-3 p-3 rounded-xl bg-accent/10 border border-accent/20 cursor-pointer"
                onClick={() => setVehicleDetails(prev => ({ ...prev, prepaid_rent_enabled: !prev.prepaid_rent_enabled }))}
              >
                <Checkbox
                  id="prepaid_rent"
                  checked={vehicleDetails.prepaid_rent_enabled || false}
                  onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, prepaid_rent_enabled: !!checked }))}
                />
                <label htmlFor="prepaid_rent" className="text-sm font-medium cursor-pointer select-none">
                  Kræv forudbetalt leje
                </label>
              </div>

              {vehicleDetails.prepaid_rent_enabled && (
                <div className="space-y-2 pl-6">
                  <Label className="text-xs text-muted-foreground">Antal måneder forudbetaling</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={vehicleDetails.prepaid_rent_months || 1}
                    onChange={(e) => setVehicleDetails(prev => ({ ...prev, prepaid_rent_months: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lejer skal betale {vehicleDetails.prepaid_rent_months || 1} måneds leje forud ved første betaling
                  </p>
                </div>
              )}
            </div>

            {/* Payment Schedule */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Betalingsplan</Label>
              <RadioGroup
                value={vehicleDetails.payment_schedule || 'upfront'}
                onValueChange={(value: 'upfront' | 'monthly') => 
                  setVehicleDetails(prev => ({ ...prev, payment_schedule: value }))
                }
                className="space-y-2"
              >
                <div 
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    vehicleDetails.payment_schedule === 'upfront' 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setVehicleDetails(prev => ({ ...prev, payment_schedule: 'upfront' as const }))}
                >
                  <RadioGroupItem value="upfront" id="payment_upfront" />
                  <CreditCard className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <label htmlFor="payment_upfront" className="text-sm font-medium cursor-pointer">
                      Forudbetaling
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Lejer betaler hele lejeperioden på forhånd
                    </p>
                  </div>
                </div>
                <div 
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    vehicleDetails.payment_schedule === 'monthly' 
                      ? 'bg-coral/10 border-coral/30' 
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setVehicleDetails(prev => ({ ...prev, payment_schedule: 'monthly' as const }))}
                >
                  <RadioGroupItem value="monthly" id="payment_monthly" />
                  <CalendarClock className="w-4 h-4 text-coral" />
                  <div className="flex-1">
                    <label htmlFor="payment_monthly" className="text-sm font-medium cursor-pointer">
                      Månedlig opkrævning
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Automatisk trækning fra lejers kort hver måned
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Custom Location */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Afhentningssted</Label>
              
              <div 
                className="flex items-center space-x-3 p-3 rounded-xl bg-primary/10 border border-primary/20 cursor-pointer"
                onClick={() => setVehicleDetails(prev => ({ ...prev, use_custom_location: !prev.use_custom_location }))}
              >
                <Checkbox
                  id="use_custom_location"
                  checked={vehicleDetails.use_custom_location || false}
                  onCheckedChange={(checked) => setVehicleDetails(prev => ({ ...prev, use_custom_location: !!checked }))}
                />
                <MapPin className="w-4 h-4 text-primary" />
                <label htmlFor="use_custom_location" className="text-sm font-medium cursor-pointer select-none">
                  Bilen står på en anden adresse
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {vehicleDetails.use_custom_location 
                  ? 'Indtast adressen hvor bilen kan afhentes' 
                  : 'Bilen vises på din firmaadresse på kortet'}
              </p>

              {vehicleDetails.use_custom_location && (
                <div className="space-y-3 pl-6 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Adresse</Label>
                    <Input
                      value={vehicleDetails.location_address || ''}
                      onChange={(e) => setVehicleDetails(prev => ({ ...prev, location_address: e.target.value }))}
                      placeholder="Gade og husnummer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Postnummer</Label>
                      <Input
                        value={vehicleDetails.location_postal_code || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, location_postal_code: e.target.value }))}
                        placeholder="2100"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">By</Label>
                      <Input
                        value={vehicleDetails.location_city || ''}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, location_city: e.target.value }))}
                        placeholder="København"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('lookup')}>
                Tilbage
              </Button>
              <Button variant="warm" className="flex-1" onClick={handleAddVehicle} disabled={addingVehicle}>
                {addingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : `Tilføj ${getVehicleTypeLabel()}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
