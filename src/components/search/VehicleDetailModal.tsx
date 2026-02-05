import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Fuel,
  Calendar,
  Gauge,
  Check,
  Shield,
  Star,
  Truck,
  Tent,
  Users,
  ChefHat,
  Bath,
  Umbrella,
  Weight,
  MapPin,
  CreditCard,
  Clock,
  Thermometer,
  Tv,
  Bike,
  Dog,
  Cigarette,
  Music,
  Plug,
  Ruler,
  Timer,
  Package,
  Flame,
  Snowflake,
  Droplets,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchVehicle, SearchFiltersState } from "@/pages/Search";
import { LessorStatusBadge } from "@/components/ratings/LessorStatusBadge";

interface VehicleDetailModalProps {
  vehicle: SearchVehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SearchFiltersState;
}

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

export const VehicleDetailModal = ({
  vehicle,
  open,
  onOpenChange,
  filters,
}: VehicleDetailModalProps) => {
  const navigate = useNavigate();

  // Get vehicle type icon
  const VehicleIcon = useMemo(() => {
    if (!vehicle) return Car;
    switch (vehicle.vehicle_type) {
      case "trailer":
        return Truck;
      case "campingvogn":
        return Tent;
      default:
        return Car;
    }
  }, [vehicle?.vehicle_type]);

  // Get vehicle type label
  const vehicleTypeLabel = useMemo(() => {
    if (!vehicle) return "Bil";
    switch (vehicle.vehicle_type) {
      case "trailer":
        return "Trailer";
      case "campingvogn":
        return "Campingvogn";
      default:
        return "Bil";
    }
  }, [vehicle?.vehicle_type]);

  // Calculate pricing based on period type
  const pricing = useMemo(() => {
    if (!vehicle) return { unitPrice: 0, unitLabel: "", totalPrice: 0, periodCount: 0, periodLabel: "" };

    const { periodType, periodCount } = filters;

    let unitPrice = 0;
    let unitLabel = "";
    let periodLabel = "";

    switch (periodType) {
      case "monthly":
        unitPrice = vehicle.monthly_price || (vehicle.daily_price || 0) * 30;
        unitLabel = "/måned";
        periodLabel = periodCount === 1 ? "måned" : "måneder";
        break;
      case "weekly":
        unitPrice = vehicle.weekly_price || (vehicle.daily_price || 0) * 7;
        unitLabel = "/uge";
        periodLabel = periodCount === 1 ? "uge" : "uger";
        break;
      default:
        unitPrice = vehicle.daily_price || 0;
        unitLabel = "/dag";
        periodLabel = periodCount === 1 ? "dag" : "dage";
    }

    const totalPrice = unitPrice * periodCount;

    return {
      unitPrice,
      unitLabel,
      totalPrice,
      periodCount,
      periodLabel,
    };
  }, [filters, vehicle]);

  // Calculate load capacity for trailers
  const loadCapacity = useMemo(() => {
    if (!vehicle || vehicle.vehicle_type !== 'trailer') return null;
    // Estimate: egenvægt is typically ~30% of totalvægt for trailers
    if (vehicle.total_weight) {
      const estimatedEmptyWeight = Math.round(vehicle.total_weight * 0.3);
      return vehicle.total_weight - estimatedEmptyWeight;
    }
    return null;
  }, [vehicle]);

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Image Header */}
        <div className="relative h-64 w-full">
          {vehicle.image_url ? (
            <img
              src={vehicle.image_url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <VehicleIcon className="w-24 h-24 text-muted-foreground" />
            </div>
          )}
          
          {/* Badges on image */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge className="bg-secondary text-secondary-foreground">
              <VehicleIcon className="w-3 h-3 mr-1" />
              {vehicleTypeLabel}
            </Badge>
            {vehicle.vehicle_type === 'trailer' && vehicle.trailer_type && (
              <Badge variant="outline" className="bg-background/80">
                {TRAILER_TYPE_LABELS[vehicle.trailer_type] || vehicle.trailer_type}
              </Badge>
            )}
            {vehicle.unlimited_km && vehicle.vehicle_type === "bil" && (
              <Badge className="bg-accent text-accent-foreground">
                <Check className="w-3 h-3 mr-1" />
                Fri km
              </Badge>
            )}
            {vehicle.tempo_approved && (
              <Badge className="bg-mint text-mint-foreground">
                <Timer className="w-3 h-3 mr-1" />
                Tempo 100
              </Badge>
            )}
          </div>
          
          {vehicle.owner_fleet_plan && (
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
              <Shield className="w-3 h-3 mr-1" />
              LEJIO Varetager
            </Badge>
          )}
        </div>

        <div className="p-6">
          {/* Title & Price */}
          <DialogHeader className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {vehicle.make} {vehicle.model}
                </DialogTitle>
                {vehicle.variant && (
                  <p className="text-muted-foreground mt-1">{vehicle.variant}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {pricing.unitPrice.toLocaleString("da-DK")} kr
                </div>
                <span className="text-muted-foreground">{pricing.unitLabel}</span>
              </div>
            </div>
          </DialogHeader>

          {/* Owner Info */}
          {vehicle.owner_lessor_status && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <LessorStatusBadge status={vehicle.owner_lessor_status} size="md" />
              {vehicle.owner_average_rating && vehicle.owner_average_rating > 0 && (
                <span className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {vehicle.owner_average_rating.toFixed(1)} stjerner
                </span>
              )}
            </div>
          )}

          <Separator className="my-4" />

          {/* Vehicle Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {vehicle.year && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Årgang:</span>
                <span className="font-medium">{vehicle.year}</span>
              </div>
            )}
            
            {vehicle.color && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">Farve:</span>
                <span className="font-medium">{vehicle.color}</span>
              </div>
            )}

            {/* Car-specific */}
            {vehicle.vehicle_type === "bil" && vehicle.fuel_type && (
              <div className="flex items-center gap-2 text-sm">
                <Fuel className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Brændstof:</span>
                <span className="font-medium">{vehicle.fuel_type}</span>
              </div>
            )}

            {vehicle.vehicle_type === "bil" && (
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Kilometer:</span>
                <span className="font-medium">
                  {vehicle.unlimited_km
                    ? "Fri kilometer"
                    : `${vehicle.included_km || 0} km/dag inkl.`}
                </span>
              </div>
            )}

            {/* TRAILER-SPECIFIC DETAILS */}
            {vehicle.vehicle_type === "trailer" && (
              <>
                {vehicle.total_weight && (
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Totalvægt:</span>
                    <span className="font-medium">{vehicle.total_weight} kg</span>
                  </div>
                )}

                {loadCapacity && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Lasteevne:</span>
                    <span className="font-medium">~{loadCapacity} kg</span>
                  </div>
                )}

                {/* Internal dimensions */}
                {(vehicle.internal_length_cm || vehicle.internal_width_cm) && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ladmål (LxBxH):</span>
                    <span className="font-medium">
                      {vehicle.internal_length_cm || '?'} x {vehicle.internal_width_cm || '?'} x {vehicle.internal_height_cm || '?'} cm
                    </span>
                  </div>
                )}

                {vehicle.plug_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plug className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Stik:</span>
                    <span className="font-medium">{vehicle.plug_type === '7-pin' ? '7-polet' : '13-polet'}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Kørekort:</span>
                  <span className="font-medium">
                    {vehicle.requires_b_license ? "B-kørekort OK" : "Kræver BE-kort"}
                  </span>
                </div>
              </>
            )}

            {/* CAMPINGVOGN-SPECIFIC DETAILS */}
            {vehicle.vehicle_type === "campingvogn" && (
              <>
                {(vehicle.adult_sleeping_capacity || vehicle.sleeping_capacity) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sovepladser:</span>
                    <span className="font-medium">
                      {vehicle.adult_sleeping_capacity 
                        ? `${vehicle.adult_sleeping_capacity} voksne${vehicle.child_sleeping_capacity ? ` + ${vehicle.child_sleeping_capacity} børn` : ''}`
                        : vehicle.sleeping_capacity}
                    </span>
                  </div>
                )}

                {vehicle.layout_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Indretning:</span>
                    <span className="font-medium">{LAYOUT_TYPE_LABELS[vehicle.layout_type] || vehicle.layout_type}</span>
                  </div>
                )}

                {vehicle.total_weight && (
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Totalvægt:</span>
                    <span className="font-medium">{vehicle.total_weight} kg</span>
                  </div>
                )}
              </>
            )}

            {/* Location */}
            {vehicle.location_city && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Lokation:</span>
                <span className="font-medium">
                  {vehicle.location_address && `${vehicle.location_address}, `}
                  {vehicle.location_postal_code} {vehicle.location_city}
                </span>
              </div>
            )}
          </div>

          {/* Trailer Accessories */}
          {vehicle.vehicle_type === "trailer" && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Tilbehør</h4>
              <div className="flex flex-wrap gap-2">
                {vehicle.has_ramps && <Badge variant="secondary">Ramper</Badge>}
                {vehicle.has_winch && <Badge variant="secondary">Spil</Badge>}
                {vehicle.has_tarpaulin && <Badge variant="secondary">Presenning</Badge>}
                {vehicle.has_net && <Badge variant="secondary">Net</Badge>}
                {vehicle.has_jockey_wheel && <Badge variant="secondary">Næsehjul</Badge>}
                {vehicle.has_lock_included && <Badge variant="secondary">Lås inkl.</Badge>}
                {vehicle.has_adapter && <Badge variant="secondary">Adapter</Badge>}
                {!vehicle.has_ramps && !vehicle.has_winch && !vehicle.has_tarpaulin && 
                 !vehicle.has_net && !vehicle.has_jockey_wheel && !vehicle.has_lock_included && 
                 !vehicle.has_adapter && (
                  <span className="text-sm text-muted-foreground">Intet ekstra tilbehør</span>
                )}
              </div>
            </div>
          )}

          {/* Campingvogn Facilities */}
          {vehicle.vehicle_type === "campingvogn" && (
            <>
              {/* Kitchen & Bath */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Køkken & Bad</h4>
                <div className="flex flex-wrap gap-2">
                  {vehicle.has_fridge && (
                    <Badge variant="secondary">
                      <Snowflake className="w-3 h-3 mr-1" />
                      Køleskab
                    </Badge>
                  )}
                  {vehicle.has_freezer && <Badge variant="secondary">Fryser</Badge>}
                  {vehicle.has_gas_burner && (
                    <Badge variant="secondary">
                      <Flame className="w-3 h-3 mr-1" />
                      Gasblus
                    </Badge>
                  )}
                  {vehicle.has_toilet && (
                    <Badge variant="secondary">
                      <Bath className="w-3 h-3 mr-1" />
                      Toilet
                    </Badge>
                  )}
                  {vehicle.has_shower && (
                    <Badge variant="secondary">
                      <Droplets className="w-3 h-3 mr-1" />
                      Brusebad
                    </Badge>
                  )}
                  {vehicle.has_hot_water && <Badge variant="secondary">Varmt vand</Badge>}
                  {vehicle.has_kitchen && !vehicle.has_fridge && !vehicle.has_gas_burner && (
                    <Badge variant="secondary">
                      <ChefHat className="w-3 h-3 mr-1" />
                      Køkken
                    </Badge>
                  )}
                  {vehicle.has_bathroom && !vehicle.has_toilet && !vehicle.has_shower && (
                    <Badge variant="secondary">
                      <Bath className="w-3 h-3 mr-1" />
                      Bad/WC
                    </Badge>
                  )}
                </div>
              </div>

              {/* Equipment */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Udstyr</h4>
                <div className="flex flex-wrap gap-2">
                  {vehicle.has_awning_tent && <Badge variant="secondary">Fortelt</Badge>}
                  {vehicle.has_awning && (
                    <Badge variant="secondary">
                      <Umbrella className="w-3 h-3 mr-1" />
                      Markise
                    </Badge>
                  )}
                  {vehicle.has_mover && <Badge variant="secondary">Mover</Badge>}
                  {vehicle.has_bike_rack && (
                    <Badge variant="secondary">
                      <Bike className="w-3 h-3 mr-1" />
                      Cykelstativ
                    </Badge>
                  )}
                  {vehicle.has_ac && (
                    <Badge variant="secondary">
                      <Thermometer className="w-3 h-3 mr-1" />
                      Aircondition
                    </Badge>
                  )}
                  {vehicle.has_floor_heating && <Badge variant="secondary">Gulvvarme</Badge>}
                  {vehicle.has_tv && (
                    <Badge variant="secondary">
                      <Tv className="w-3 h-3 mr-1" />
                      TV
                    </Badge>
                  )}
                </div>
              </div>

              {/* Included Items */}
              {(vehicle.service_included || vehicle.camping_furniture_included || vehicle.gas_bottle_included) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Medfølger</h4>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.service_included && <Badge className="bg-mint/20 text-mint-foreground border-mint/30">Service/bestik inkl.</Badge>}
                    {vehicle.camping_furniture_included && <Badge className="bg-mint/20 text-mint-foreground border-mint/30">Campingmøbler inkl.</Badge>}
                    {vehicle.gas_bottle_included && <Badge className="bg-mint/20 text-mint-foreground border-mint/30">Gasflaske inkl.</Badge>}
                  </div>
                </div>
              )}

              {/* Rules */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Regler</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={vehicle.pets_allowed ? "secondary" : "outline"} className={!vehicle.pets_allowed ? "opacity-50" : ""}>
                    <Dog className="w-3 h-3 mr-1" />
                    {vehicle.pets_allowed ? "Husdyr tilladt" : "Ingen husdyr"}
                  </Badge>
                  <Badge variant={vehicle.smoking_allowed ? "secondary" : "outline"} className={!vehicle.smoking_allowed ? "opacity-50" : ""}>
                    <Cigarette className="w-3 h-3 mr-1" />
                    {vehicle.smoking_allowed ? "Rygning tilladt" : "Ikke-ryger"}
                  </Badge>
                  <Badge variant={vehicle.festival_use_allowed ? "secondary" : "outline"} className={!vehicle.festival_use_allowed ? "opacity-50" : ""}>
                    <Music className="w-3 h-3 mr-1" />
                    {vehicle.festival_use_allowed ? "Festival OK" : "Ingen festival"}
                  </Badge>
                </div>
              </div>
            </>
          )}

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Ekstra udstyr</h4>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feature, i) => (
                  <Badge key={i} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pricing breakdown */}
          {vehicle.deposit_required && vehicle.deposit_amount && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Prisdetaljer</h4>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Depositum:</span>
                <span className="font-medium">{vehicle.deposit_amount.toLocaleString("da-DK")} kr</span>
              </div>
              {!vehicle.unlimited_km && vehicle.extra_km_price && vehicle.vehicle_type === 'bil' && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ekstra km:</span>
                  <span className="font-medium">{vehicle.extra_km_price} kr/km</span>
                </div>
              )}
            </div>
          )}

          <Separator className="my-4" />

          {/* Total price & Book button */}
          <div className="flex items-center justify-between">
            {filters.startDate ? (
              <div>
                <span className="text-sm text-muted-foreground">
                  Total for {pricing.periodCount} {pricing.periodLabel}:
                </span>
                <div className="text-2xl font-bold text-foreground">
                  {pricing.totalPrice.toLocaleString("da-DK")} kr
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Vælg datoer for at se total pris</span>
              </div>
            )}
            <Button
              variant="warm"
              size="lg"
              onClick={() => {
                onOpenChange(false);
                navigate(`/booking/${vehicle.id}`);
              }}
            >
              Lej nu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};