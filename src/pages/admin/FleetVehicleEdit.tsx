import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/azure/client';
import { ArrowLeft, Loader2, Upload, X, Car, CreditCard, CalendarClock, MapPin, AlertTriangle, Truck, Tent, Save } from 'lucide-react';
import { toast } from 'sonner';
import { TrailerFields } from '@/components/dashboard/TrailerFields';
import { CaravanFields } from '@/components/dashboard/CaravanFields';
import { Vehicle, PaymentScheduleType } from '@/hooks/useVehicles';

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

const FleetVehicleEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [ownerName, setOwnerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

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
    const fetchVehicle = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch vehicle directly (admin can see all)
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single();

        if (vehicleError || !vehicleData) {
          toast.error('Køretøj ikke fundet');
          navigate('/admin/fleet');
          return;
        }

        setVehicle(vehicleData as Vehicle);

        // Fetch owner name
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('full_name, company_name, email')
          .eq('id', vehicleData.owner_id)
          .single();

        if (ownerData) {
          setOwnerName(ownerData.company_name || ownerData.full_name || ownerData.email || 'Ukendt');
        }

        // Populate form
        setFormData({
          daily_price: vehicleData.daily_price || undefined,
          weekly_price: vehicleData.weekly_price || undefined,
          monthly_price: vehicleData.monthly_price || undefined,
          included_km: vehicleData.included_km || 100,
          extra_km_price: vehicleData.extra_km_price || 2.5,
          unlimited_km: vehicleData.unlimited_km || false,
          description: vehicleData.description || '',
          image_url: vehicleData.image_url || '',
          features: vehicleData.features || [],
          deposit_required: vehicleData.deposit_required || false,
          deposit_amount: vehicleData.deposit_amount || 0,
          prepaid_rent_enabled: vehicleData.prepaid_rent_enabled || false,
          prepaid_rent_months: vehicleData.prepaid_rent_months || 1,
          payment_schedule: (vehicleData.payment_schedule || 'upfront') as PaymentScheduleType,
          use_custom_location: vehicleData.use_custom_location || false,
          location_address: vehicleData.location_address || '',
          location_postal_code: vehicleData.location_postal_code || '',
          location_city: vehicleData.location_city || '',
          latitude: vehicleData.latitude || undefined,
          longitude: vehicleData.longitude || undefined,
          vehicle_value: vehicleData.vehicle_value || undefined,
          trailer_type: vehicleData.trailer_type || '',
          internal_length_cm: vehicleData.internal_length_cm || undefined,
          internal_width_cm: vehicleData.internal_width_cm || undefined,
          internal_height_cm: vehicleData.internal_height_cm || undefined,
          plug_type: vehicleData.plug_type || '',
          tempo_approved: vehicleData.tempo_approved || false,
          requires_b_license: vehicleData.requires_b_license ?? true,
          has_ramps: vehicleData.has_ramps || false,
          has_winch: vehicleData.has_winch || false,
          has_tarpaulin: vehicleData.has_tarpaulin || false,
          has_net: vehicleData.has_net || false,
          has_jockey_wheel: vehicleData.has_jockey_wheel || false,
          has_lock_included: vehicleData.has_lock_included || false,
          has_adapter: vehicleData.has_adapter || false,
          adult_sleeping_capacity: vehicleData.adult_sleeping_capacity || undefined,
          child_sleeping_capacity: vehicleData.child_sleeping_capacity || undefined,
          layout_type: vehicleData.layout_type || '',
          has_fridge: vehicleData.has_fridge || false,
          has_freezer: vehicleData.has_freezer || false,
          has_gas_burner: vehicleData.has_gas_burner || false,
          has_toilet: vehicleData.has_toilet || false,
          has_shower: vehicleData.has_shower || false,
          has_hot_water: vehicleData.has_hot_water || false,
          has_awning_tent: vehicleData.has_awning_tent || false,
          has_mover: vehicleData.has_mover || false,
          has_bike_rack: vehicleData.has_bike_rack || false,
          has_ac: vehicleData.has_ac || false,
          has_floor_heating: vehicleData.has_floor_heating || false,
          has_tv: vehicleData.has_tv || false,
          service_included: vehicleData.service_included || false,
          camping_furniture_included: vehicleData.camping_furniture_included || false,
          gas_bottle_included: vehicleData.gas_bottle_included || false,
          pets_allowed: vehicleData.pets_allowed || false,
          smoking_allowed: vehicleData.smoking_allowed || false,
          festival_use_allowed: vehicleData.festival_use_allowed || false,
          total_weight: vehicleData.total_weight || undefined,
          has_kitchen: vehicleData.has_kitchen || false,
          has_bathroom: vehicleData.has_bathroom || false,
          has_awning: vehicleData.has_awning || false,
        });
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        toast.error('Kunne ikke hente køretøj');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [id, navigate]);

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

    setIsSaving(true);

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

    // Use admin edge function to bypass RLS
    const { data: result, error } = await supabase.functions.invoke('admin-update-vehicle', {
      body: {
        vehicleId: vehicle.id,
        updates: finalData,
      },
    });

    setIsSaving(false);

    if (error || !result?.success) {
      console.error('Error updating vehicle:', error || result?.error);
      toast.error(result?.error || 'Kunne ikke opdatere køretøj');
    } else {
      toast.success('Køretøj opdateret!');
      navigate('/admin/fleet');
    }
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout activeTab="fleet">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <AdminDashboardLayout activeTab="fleet">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Køretøj ikke fundet</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  const VehicleIcon = vehicle.vehicle_type === 'trailer' ? Truck : vehicle.vehicle_type === 'campingvogn' ? Tent : Car;

  return (
    <AdminDashboardLayout activeTab="fleet">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/fleet')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Rediger {vehicle.make} {vehicle.model}</h1>
            <p className="text-muted-foreground">{vehicle.registration} • Ejer: {ownerName}</p>
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

          {/* Kilometer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kilometer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex items-center space-x-3 p-3 rounded-xl bg-primary/10 border border-primary/20 cursor-pointer"
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
                    <Label className="text-xs text-muted-foreground">Pris pr. ekstra km</Label>
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
                className="flex items-center space-x-3 p-3 rounded-xl bg-muted cursor-pointer"
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
                    value={formData.deposit_amount || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      deposit_amount: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="5000"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Beskrivelse</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskriv køretøjet..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Udstyr & Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {VEHICLE_FEATURES.map(feature => (
                  <div
                    key={feature.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      formData.features.includes(feature.id)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => handleFeatureToggle(feature.id)}
                  >
                    <Checkbox checked={formData.features.includes(feature.id)} />
                    <Label className="text-sm cursor-pointer">{feature.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trailer specific fields */}
          {vehicle.vehicle_type === 'trailer' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Trailer detaljer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrailerFields vehicleDetails={formData} setVehicleDetails={setFormData} />
              </CardContent>
            </Card>
          )}

          {/* Caravan specific fields */}
          {vehicle.vehicle_type === 'campingvogn' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tent className="w-4 h-4" />
                  Campingvogn detaljer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CaravanFields vehicleDetails={formData} setVehicleDetails={setFormData} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/fleet')}>
            Annuller
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Gem ændringer
          </Button>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default FleetVehicleEditPage;
