import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Car, Fuel, Calendar, Gauge, Check, Shield, Star, Truck, Tent, Users,
  ChefHat, Bath, Umbrella, Weight, MapPin, CreditCard, Clock, Thermometer,
  Tv, Bike, Dog, Cigarette, Plug, Ruler, Package, Flame, Snowflake, Droplets,
  ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/azure/client';
import { LessorStatusBadge } from '@/components/ratings/LessorStatusBadge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const TRAILER_TYPE_LABELS: Record<string, string> = {
  open: 'Åben trailer',
  closed: 'Lukket kassetrailer',
  horse: 'Hestetrailer',
  boat: 'Bådtrailer',
  auto: 'Auto-trailer',
  tipper: 'Tiptrailer',
};

const LAYOUT_TYPE_LABELS: Record<string, string> = {
  double_bed: 'Dobbeltseng',
  single_beds: 'Enkeltsenge',
  french_bed: 'Fransk seng',
  round_seating: 'Rundsiddegruppe',
};

const FEATURE_ICONS: Record<string, unknown> = {
  aircon: Thermometer,
  gps: MapPin,
  bluetooth: Car,
  cruise_control: Gauge,
  parking_sensors: Car,
  backup_camera: Car,
  heated_seats: Flame,
  leather_seats: Car,
  sunroof: Car,
  keyless: Car,
  apple_carplay: Car,
  android_auto: Car,
  roof_rack: Package,
  tow_hitch: Truck,
  child_seat: Users,
  winter_tires: Snowflake,
};

const VehicleDetailPage = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Parse filters from URL
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const periodType = searchParams.get('periodType') || 'daily';
  const periodCount = parseInt(searchParams.get('periodCount') || '1');

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) return;

      try {
        const { data, error } = await supabase
          .from('vehicles_public')
          .select('*')
          .eq('id', vehicleId)
          .single();

        if (error) throw error;
        setVehicle(data);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  const VehicleIcon = useMemo(() => {
    if (!vehicle) return Car;
    switch (vehicle.vehicle_type) {
      case 'trailer': return Truck;
      case 'campingvogn': return Tent;
      case 'motorcykel':
      case 'scooter': return Bike;
      default: return Car;
    }
  }, [vehicle?.vehicle_type]);

  const vehicleTypeLabel = useMemo(() => {
    if (!vehicle) return 'Bil';
    switch (vehicle.vehicle_type) {
      case 'trailer': return 'Trailer';
      case 'campingvogn': return 'Campingvogn';
      case 'motorcykel': return 'Motorcykel';
      case 'scooter': return 'Scooter';
      default: return 'Bil';
    }
  }, [vehicle?.vehicle_type]);

  const pricing = useMemo(() => {
    if (!vehicle) return { unitPrice: 0, unitLabel: '' };
    switch (periodType) {
      case 'monthly':
        return { unitPrice: vehicle.monthly_price || (vehicle.daily_price || 0) * 30, unitLabel: 'pr. måned' };
      case 'weekly':
        return { unitPrice: vehicle.weekly_price || (vehicle.daily_price || 0) * 7, unitLabel: 'pr. uge' };
      default:
        return { unitPrice: vehicle.daily_price || 0, unitLabel: 'pr. dag' };
    }
  }, [vehicle, periodType]);

  const handleBook = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('periodType', periodType);
    params.set('periodCount', periodCount.toString());
    navigate(`/search/booking/${vehicleId}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Køretøj ikke fundet</h2>
          <Button variant="outline" onClick={() => navigate('/search')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage til søgning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  <VehicleIcon className="w-3 h-3 mr-1" />
                  {vehicleTypeLabel}
                </Badge>
                {vehicle.lessor_status && <LessorStatusBadge status={vehicle.lessor_status} size="sm" />}
              </div>
              <h1 className="text-2xl font-display font-bold">
                {vehicle.make} {vehicle.model} {vehicle.variant}
              </h1>
              {vehicle.year && <p className="text-muted-foreground">{vehicle.year}</p>}
            </div>
          </div>

          {/* Image */}
          <Card className="overflow-hidden">
            <img
              src={vehicle.image_url || '/placeholder.svg'}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-80 object-cover"
            />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {vehicle.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Beskrivelse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{vehicle.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Specs */}
              <Card>
                <CardHeader>
                  <CardTitle>Specifikationer</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {vehicle.fuel_type && (
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{vehicle.fuel_type}</span>
                    </div>
                  )}
                  {vehicle.color && (
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{vehicle.color}</span>
                    </div>
                  )}
                  {vehicle.total_weight && (
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{vehicle.total_weight} kg</span>
                    </div>
                  )}
                  {vehicle.sleeping_capacity && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{vehicle.sleeping_capacity} sovepladser</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Features */}
              {vehicle.features?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Udstyr</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.features.map((feature: string) => {
                        const Icon = FEATURE_ICONS[feature] || Check;
                        return (
                          <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {feature}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pricing & Booking */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pris</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-primary">
                      {pricing.unitPrice.toLocaleString('da-DK')} kr
                    </span>
                    <span className="text-muted-foreground ml-1">{pricing.unitLabel}</span>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    {vehicle.unlimited_km ? (
                      <div className="flex items-center gap-2 text-mint">
                        <Check className="w-4 h-4" />
                        Fri kilometer
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inkl. km/dag:</span>
                        <span>{vehicle.included_km || 0} km</span>
                      </div>
                    )}
                    {vehicle.deposit_required && vehicle.deposit_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Depositum:</span>
                        <span>{vehicle.deposit_amount.toLocaleString('da-DK')} kr</span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full" size="lg" onClick={handleBook}>
                    Book nu
                  </Button>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Placering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.display_city || vehicle.location_city || 'Ikke angivet'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VehicleDetailPage;
