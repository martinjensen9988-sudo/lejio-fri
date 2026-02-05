import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVehicles, Vehicle, PaymentScheduleType } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/azure/client';
import { ArrowLeft, Loader2, Upload, X, Car, CreditCard, CalendarClock, MapPin, AlertTriangle, Truck, Tent, Save } from 'lucide-react';
import { toast } from 'sonner';
import { TrailerFields } from '@/components/dashboard/TrailerFields';
import { CaravanFields } from '@/components/dashboard/CaravanFields';

const VEHICLE_FEATURES = [
  { id: 'aircon', label: 'Aircondition' },
  { id: 'gps', label: 'GPS/Navigation' },
  { id: 'bluetooth', label: 'Bluetooth' },
  { id: 'cruise_control', label: 'Fartpilot' },
  { id: 'parking_sensors', label: 'Parkeringssensorer' },
  { id: 'backup_camera', label: 'Bakkamera' },
  { id: 'heated_seats', label: 'Sædevarme' },
  { id: 'leather_seats', label: 'Lædersæder' },
  { id: 'sunroof', label: 'Panoramatag' },
  { id: 'keyless', label: 'Nøglefri start' },
  { id: 'apple_carplay', label: 'Apple CarPlay' },
  { id: 'android_auto', label: 'Android Auto' },
  { id: 'roof_rack', label: 'Tagbøjler' },
  { id: 'tow_hitch', label: 'Anhængertræk' },
  { id: 'child_seat', label: 'Barnestol inkl.' },
  { id: 'winter_tires', label: 'Vinterdæk' },
];

const EditVehiclePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, updateVehicle } = useVehicles();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFleetVehicle, setIsFleetVehicle] = useState(false);
  const [checkingFleet, setCheckingFleet] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  
  const vehicle = vehicles.find(v => v.id === id);

  // Check if this vehicle belongs to a fleet user
  useEffect(() => {
    const checkFleetStatus = async () => {
      if (!vehicle) {
        setCheckingFleet(false);
        return;
      }
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('fleet_plan')
          .eq('id', vehicle.owner_id)
          .single();
        
        if (profile?.fleet_plan) {
          setIsFleetVehicle(true);
        }
      } catch (error) {
        console.error('Error checking fleet status:', error);
      } finally {
        setCheckingFleet(false);
      }
    };
    
    checkFleetStatus();
  }, [vehicle]);

  const [formData, setFormData] = useState({
    daily_price: undefined as number | undefined,
    weekly_price: undefined as number | undefined,
    monthly_price: undefined as number | undefined,
    included_km: 100,
    extra_km_price: 2.5,
    unlimited_km: false,
    description: '',
    image_url: '',
    features: [] as string[],
    deposit_required: false,
    deposit_amount: 0,
    prepaid_rent_enabled: false,
    prepaid_rent_months: 1,
    payment_schedule: 'upfront' as PaymentScheduleType,
    use_custom_location: false,
    location_address: '',
    location_postal_code: '',
    location_city: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    vehicle_value: undefined as number | undefined,
    // Trailer fields
    trailer_type: '',
    internal_length_cm: undefined as number | undefined,
    internal_width_cm: undefined as number | undefined,
    internal_height_cm: undefined as number | undefined,
    plug_type: '',
    tempo_approved: false,
    requires_b_license: true,
    has_ramps: false,
    has_winch: false,
    has_tarpaulin: false,
    has_net: false,
    has_jockey_wheel: false,
    has_lock_included: false,
    has_adapter: false,
    // Caravan fields
    adult_sleeping_capacity: undefined as number | undefined,
    child_sleeping_capacity: undefined as number | undefined,
    layout_type: '',
    has_fridge: false,
    has_freezer: false,
    has_gas_burner: false,
    has_toilet: false,
    has_shower: false,
    has_hot_water: false,
    has_awning_tent: false,
    has_mover: false,
    has_bike_rack: false,
    has_ac: false,
    has_floor_heating: false,
    has_tv: false,
    service_included: false,
    camping_furniture_included: false,
    gas_bottle_included: false,
    pets_allowed: false,
    smoking_allowed: false,
    festival_use_allowed: false,
    total_weight: undefined as number | undefined,
    has_kitchen: false,
    has_bathroom: false,
    has_awning: false,
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        daily_price: vehicle.daily_price || undefined,
        weekly_price: vehicle.weekly_price || undefined,
        monthly_price: vehicle.monthly_price || undefined,
        included_km: vehicle.included_km || 100,
        extra_km_price: vehicle.extra_km_price || 2.5,
        unlimited_km: vehicle.unlimited_km || false,
        description: vehicle.description || '',
        image_url: vehicle.image_url || '',
        features: vehicle.features || [],
        deposit_required: vehicle.deposit_required || false,
        deposit_amount: vehicle.deposit_amount || 0,
        prepaid_rent_enabled: vehicle.prepaid_rent_enabled || false,
        prepaid_rent_months: vehicle.prepaid_rent_months || 1,
        payment_schedule: (vehicle.payment_schedule || 'upfront') as PaymentScheduleType,
        use_custom_location: vehicle.use_custom_location || false,
        location_address: vehicle.location_address || '',
        location_postal_code: vehicle.location_postal_code || '',
        location_city: vehicle.location_city || '',
        latitude: vehicle.latitude || undefined,
        longitude: vehicle.longitude || undefined,
        vehicle_value: vehicle.vehicle_value || undefined,
        trailer_type: vehicle.trailer_type || '',
        internal_length_cm: vehicle.internal_length_cm || undefined,
        internal_width_cm: vehicle.internal_width_cm || undefined,
        internal_height_cm: vehicle.internal_height_cm || undefined,
        plug_type: vehicle.plug_type || '',
        tempo_approved: vehicle.tempo_approved || false,
        requires_b_license: vehicle.requires_b_license ?? true,
        has_ramps: vehicle.has_ramps || false,
        has_winch: vehicle.has_winch || false,
        has_tarpaulin: vehicle.has_tarpaulin || false,
        has_net: vehicle.has_net || false,
        has_jockey_wheel: vehicle.has_jockey_wheel || false,
        has_lock_included: vehicle.has_lock_included || false,
        has_adapter: vehicle.has_adapter || false,
        adult_sleeping_capacity: vehicle.adult_sleeping_capacity || undefined,
        child_sleeping_capacity: vehicle.child_sleeping_capacity || undefined,
        layout_type: vehicle.layout_type || '',
        has_fridge: vehicle.has_fridge || false,
        has_freezer: vehicle.has_freezer || false,
        has_gas_burner: vehicle.has_gas_burner || false,
        has_toilet: vehicle.has_toilet || false,
        has_shower: vehicle.has_shower || false,
        has_hot_water: vehicle.has_hot_water || false,
        has_awning_tent: vehicle.has_awning_tent || false,
        has_mover: vehicle.has_mover || false,
        has_bike_rack: vehicle.has_bike_rack || false,
        has_ac: vehicle.has_ac || false,
        has_floor_heating: vehicle.has_floor_heating || false,
        has_tv: vehicle.has_tv || false,
        service_included: vehicle.service_included || false,
        camping_furniture_included: vehicle.camping_furniture_included || false,
        gas_bottle_included: vehicle.gas_bottle_included || false,
        pets_allowed: vehicle.pets_allowed || false,
        smoking_allowed: vehicle.smoking_allowed || false,
        festival_use_allowed: vehicle.festival_use_allowed || false,
        total_weight: vehicle.total_weight || undefined,
        has_kitchen: vehicle.has_kitchen || false,
        has_bathroom: vehicle.has_bathroom || false,
        has_awning: vehicle.has_awning || false,
      });
    }
  }, [vehicle]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Kun billedfiler er tilladt');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Billedet må max være 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const imageBase64 = await fileToBase64(file);

      // Upload via backend function (service role handles storage + DB insert)
      const { data: uploadData, error: uploadFnError } = await supabase.functions.invoke('upload-vehicle-image', {
        body: {
          vehicleId: vehicle.id,
          imageBase64,
          contentType: file.type,
          fileExt,
        },
      });

      if (uploadFnError) throw uploadFnError;
      const result = uploadData as { publicUrl?: string } | null;
      if (!result?.publicUrl) throw new Error('Missing publicUrl from upload function');

      // Keep legacy image_url in sync for preview (gallery uses vehicle_images)
      setFormData(prev => ({ ...prev, image_url: result.publicUrl! }));
      toast.success('Billede uploadet!');
    } catch (error) {
      console.error('Upload error:', error);
      const msg = typeof (error)?.message === 'string' ? (error).message : '';
      if (msg.toLowerCase().includes('forbidden')) {
        toast.error('Du har ikke rettighed til at uploade billeder til dette køretøj');
      } else {
        toast.error('Kunne ikke uploade billede');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const handleSave = async () => {
    if (!vehicle) return;
    
    setIsLoading(true);
    
    let finalData = { ...formData };
    
    if (formData.use_custom_location && formData.location_address) {
      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: {
            address: formData.location_address,
            postalCode: formData.location_postal_code,
            city: formData.location_city,
          },
        });
        
        if (!error && data?.latitude && data?.longitude) {
          finalData = {
            ...finalData,
            latitude: data.latitude,
            longitude: data.longitude,
          };
        }
      } catch (err) {
        console.error('Geocoding failed:', err);
      }
    } else if (!formData.use_custom_location) {
      finalData = {
        ...finalData,
        latitude: undefined,
        longitude: undefined,
      };
    }
    
    const success = await updateVehicle(vehicle.id, finalData);
    setIsLoading(false);
    if (success) {
      navigate('/dashboard/vehicles');
    }
  };

  if (checkingFleet) {
    return (
      <DashboardLayout activeTab="vehicles">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout activeTab="vehicles">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Køretøj ikke fundet</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isFleetVehicle) {
    return (
      <DashboardLayout activeTab="vehicles">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Fleet-køretøj</h2>
            <p className="text-muted-foreground">
              Dette køretøj administreres af LEJIO Fleet og kan kun redigeres af administratorer.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard/vehicles')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage til køretøjer
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const VehicleIcon = vehicle.vehicle_type === 'trailer' ? Truck : vehicle.vehicle_type === 'campingvogn' ? Tent : Car;

  return (
    <DashboardLayout activeTab="vehicles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/vehicles')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Rediger {vehicle.make} {vehicle.model}</h1>
            <p className="text-muted-foreground">{vehicle.registration}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vehicle Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billede</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                  {formData.image_url ? (
                    <img 
                      src={formData.image_url} 
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <VehicleIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload billede
                  </Button>
                  {formData.image_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Fjern
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Priser</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. dag (kr)</Label>
                  <Input
                    type="number"
                    value={formData.daily_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      daily_price: parseFloat(e.target.value) || undefined 
                    }))}
                    placeholder="499"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. uge (kr)</Label>
                  <Input
                    type="number"
                    value={formData.weekly_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      weekly_price: parseFloat(e.target.value) || undefined 
                    }))}
                    placeholder="2.800"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pr. måned (kr)</Label>
                  <Input
                    type="number"
                    value={formData.monthly_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      monthly_price: parseFloat(e.target.value) || undefined 
                    }))}
                    placeholder="9.900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bilens værdi (vanvidskørsel)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                value={formData.vehicle_value || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  vehicle_value: parseFloat(e.target.value) || undefined 
                }))}
                placeholder="F.eks. 150.000"
              />
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-yellow-600 mb-1">Vigtig information</p>
                    <p>Denne værdi bruges ved vanvidskørsel-ansvar i lejekontrakten.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kilometer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kilometer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center space-x-3 p-3 rounded-xl bg-mint/10 border border-mint/20 cursor-pointer"
                onClick={() => setFormData(prev => ({ ...prev, unlimited_km: !prev.unlimited_km }))}
              >
                <Checkbox
                  checked={formData.unlimited_km || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, unlimited_km: !!checked }))}
                />
                <Label>Fri kilometer</Label>
              </div>
              
              {!formData.unlimited_km && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Inkl. km/dag</Label>
                    <Input
                      type="number"
                      value={formData.included_km}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        included_km: parseInt(e.target.value) || 100 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Ekstra km pris (kr)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.extra_km_price}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        extra_km_price: parseFloat(e.target.value) || 2.5 
                      }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Udstyr</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {VEHICLE_FEATURES.map((feature) => (
                  <div
                    key={feature.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      formData.features.includes(feature.id)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => handleFeatureToggle(feature.id)}
                  >
                    <Checkbox checked={formData.features.includes(feature.id)} />
                    <span className="text-sm">{feature.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deposit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Depositum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 cursor-pointer"
                onClick={() => setFormData(prev => ({ ...prev, deposit_required: !prev.deposit_required }))}
              >
                <Checkbox
                  checked={formData.deposit_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, deposit_required: !!checked }))}
                />
                <Label>Kræv depositum</Label>
              </div>
              
              {formData.deposit_required && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Beløb (kr)</Label>
                  <Input
                    type="number"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deposit_amount: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Afhentningssted
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 cursor-pointer"
                onClick={() => setFormData(prev => ({ ...prev, use_custom_location: !prev.use_custom_location }))}
              >
                <Checkbox
                  checked={formData.use_custom_location}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_custom_location: !!checked }))}
                />
                <Label>Brug anden adresse end forhandler</Label>
              </div>
              
              {formData.use_custom_location && (
                <div className="space-y-3">
                  <Input
                    placeholder="Adresse"
                    value={formData.location_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Postnummer"
                      value={formData.location_postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_postal_code: e.target.value }))}
                    />
                    <Input
                      placeholder="By"
                      value={formData.location_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="w-4 h-4" />
                Betalingsplan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.payment_schedule}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_schedule: value as PaymentScheduleType }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <div className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer ${formData.payment_schedule === 'upfront' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="upfront" id="upfront" />
                  <div>
                    <Label htmlFor="upfront" className="font-medium cursor-pointer">Forudbetaling</Label>
                    <p className="text-xs text-muted-foreground">Fuld betaling ved booking</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer ${formData.payment_schedule === 'monthly' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="monthly" id="monthly" />
                  <div>
                    <Label htmlFor="monthly" className="font-medium cursor-pointer">Månedlig</Label>
                    <p className="text-xs text-muted-foreground">Betaling hver måned</p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Trailer-specific fields */}
          {vehicle.vehicle_type === 'trailer' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Trailer-specifikke oplysninger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrailerFields 
                  vehicleDetails={formData as Record<string, unknown>} 
                  setVehicleDetails={(fn) => setFormData(prev => ({ ...prev, ...fn(prev as Record<string, unknown>) }))} 
                />
              </CardContent>
            </Card>
          )}

          {/* Caravan-specific fields */}
          {vehicle.vehicle_type === 'campingvogn' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tent className="w-4 h-4" />
                  Campingvogn-specifikke oplysninger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CaravanFields 
                  vehicleDetails={formData as Record<string, unknown>} 
                  setVehicleDetails={(fn) => setFormData(prev => ({ ...prev, ...fn(prev as Record<string, unknown>) }))} 
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate('/dashboard/vehicles')}>
            Annuller
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Gem ændringer
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditVehiclePage;
