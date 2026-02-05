import { useMemo, useState, useCallback } from "react";
import { Car, Fuel, Calendar, Check, Shield, Star, Truck, Tent, Users, ChefHat, Bath, Umbrella, Weight, MapPin, ArrowRight, Zap, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchVehicle, SearchFiltersState } from "@/pages/Search";
import { LessorStatusBadge } from "@/components/ratings/LessorStatusBadge";
import FavoriteButton from "@/components/search/FavoriteButton";

interface VehicleSearchCardProps {
  vehicle: SearchVehicle;
  isSelected: boolean;
  onSelect: () => void;
  filters: SearchFiltersState;
  viewMode?: 'grid' | 'list' | 'map';
}

const VehicleSearchCard = ({
  vehicle,
  isSelected,
  onSelect,
  filters,
  viewMode = 'grid',
}: VehicleSearchCardProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use images array if available, otherwise fall back to single image_url
  const images = useMemo(() => {
    if (vehicle.images && vehicle.images.length > 0) {
      return vehicle.images;
    }
    if (!vehicle.image_url) return [];
    return [vehicle.image_url];
  }, [vehicle.images, vehicle.image_url]);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % Math.max(images.length, 1));
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % Math.max(images.length, 1));
  }, [images.length]);

  const VehicleIcon = useMemo(() => {
    switch (vehicle.vehicle_type) {
      case 'trailer': return Truck;
      case 'campingvogn': return Tent;
      default: return Car;
    }
  }, [vehicle.vehicle_type]);

  const vehicleTypeLabel = useMemo(() => {
    switch (vehicle.vehicle_type) {
      case 'trailer': return 'Trailer';
      case 'campingvogn': return 'Campingvogn';
      default: return 'Bil';
    }
  }, [vehicle.vehicle_type]);

  const pricing = useMemo(() => {
    const { periodType, periodCount } = filters;

    let unitPrice = 0;
    let unitLabel = "";
    let periodLabel = "";

    switch (periodType) {
      case "monthly":
        unitPrice = vehicle.monthly_price || (vehicle.daily_price || 0) * 30;
        unitLabel = "/md";
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

  const location = vehicle.location_city || vehicle.location_postal_code || 'Danmark';
  const isElectric = vehicle.fuel_type?.toLowerCase() === 'el';
  const isDealer = vehicle.owner_company_name && vehicle.owner_fleet_plan;

  // Abonnement tilgængelig hvis monthly_price og dealer har Stripe
  const subscriptionAvailable = !!vehicle.monthly_price && isDealer;

  if (viewMode === 'list') {
    return (
      <div
        className={`group glass-strong rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover-lift ${
          isSelected
            ? "border-primary glow-primary"
            : "border-border/50 hover:border-primary/40"
        }`}
        onClick={onSelect}
      >
        <div className="flex">
          {/* Image with carousel */}
          <div className="w-72 h-52 relative shrink-0 group/image">
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <VehicleIcon className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}
            
            {/* Carousel controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/90 rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/90 rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Dots indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Top floating badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {isElectric && (
                <Badge className="bg-green-500/90 backdrop-blur-sm text-white shadow-lg border-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Elbil
                </Badge>
              )}
              {isDealer && (
                <Badge className="bg-blue-500/90 backdrop-blur-sm text-white shadow-lg border-0">
                  <Building2 className="w-3 h-3 mr-1" />
                  Forhandler
                </Badge>
              )}
              {vehicle.owner_fleet_plan && (
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  LEJIO
                </Badge>
              )}
            </div>

            <FavoriteButton 
              vehicleId={vehicle.id} 
              className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  {vehicle.variant && (
                    <p className="text-muted-foreground">{vehicle.variant}</p>
                  )}
                </div>
                {/* Price hierarchy - Monthly prominent */}
                <div className="text-right">
                  <div className="font-display text-2xl font-black text-primary">
                    {pricing.unitPrice.toLocaleString("da-DK")} kr
                  </div>
                  <span className="text-sm text-muted-foreground">{pricing.unitLabel}</span>
                  <p className="text-xs text-muted-foreground mt-1">Inkl. forsikring</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {vehicle.year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {vehicle.year}
                  </span>
                )}
                {vehicle.vehicle_type === 'bil' && vehicle.fuel_type && (
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-4 h-4" />
                    {vehicle.fuel_type}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {location}
                </span>
                {vehicle.unlimited_km && (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <Check className="w-4 h-4" />
                    Fri km
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {filters.startDate ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">{pricing.periodCount} {pricing.periodLabel}:</span>
                  <span className="ml-2 font-bold text-foreground">{pricing.totalPrice.toLocaleString("da-DK")} kr</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Vælg datoer for total pris</span>
              )}
              {subscriptionAvailable ? (
                <Button
                  className="bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/booking/${vehicle.id}?plan=subscription`);
                  }}
                >
                  Book abonnement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/booking/${vehicle.id}`);
                  }}
                >
                  Lej nu
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default) - Modern card with carousel
  return (
    <div
      className={`group glass-strong rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover-lift ${
        isSelected
          ? "border-primary glow-primary"
          : "border-border/50 hover:border-primary/40"
      }`}
      onClick={onSelect}
    >
      {/* Image with carousel */}
      <div className="relative h-52 overflow-hidden group/image">
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex]}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <VehicleIcon className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/90 rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg hover:bg-background"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/90 rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg hover:bg-background"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* Dots indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Gradient overlay for better badge visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        
        {/* Top floating badges - stacked for mobile */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
          {isElectric && (
            <Badge className="bg-green-500/90 backdrop-blur-sm text-white shadow-lg border-0 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Elbil
            </Badge>
          )}
          {isDealer && (
            <Badge className="bg-blue-500/90 backdrop-blur-sm text-white shadow-lg border-0 text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              Forhandler
            </Badge>
          )}
          {vehicle.vehicle_type !== 'bil' && (
            <Badge className="bg-secondary/90 backdrop-blur-sm text-secondary-foreground shadow-lg border-0 text-xs">
              <VehicleIcon className="w-3 h-3 mr-1" />
              {vehicleTypeLabel}
            </Badge>
          )}
          {vehicle.unlimited_km && vehicle.vehicle_type === 'bil' && (
            <Badge className="bg-accent/90 backdrop-blur-sm text-white shadow-lg border-0 text-xs">
              <Check className="w-3 h-3 mr-1" />
              Fri km
            </Badge>
          )}
        </div>

        {/* Favorite button */}
        <FavoriteButton 
          vehicleId={vehicle.id} 
          className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
        />

        {/* Fleet badge - bottom right */}
        {vehicle.owner_fleet_plan && (
          <Badge className="absolute bottom-3 right-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg border-0">
            <Shield className="w-3 h-3 mr-1" />
            LEJIO
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <div className="mb-2">
          <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.variant && (
            <p className="text-sm text-muted-foreground truncate">{vehicle.variant}</p>
          )}
        </div>

        {/* Rating & Status */}
        {(vehicle.owner_lessor_status || vehicle.owner_average_rating) && (
          <div className="flex items-center gap-2 mb-3">
            {vehicle.owner_lessor_status && (
              <LessorStatusBadge status={vehicle.owner_lessor_status} size="sm" />
            )}
            {vehicle.owner_average_rating && vehicle.owner_average_rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-secondary text-secondary" />
                {vehicle.owner_average_rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* Features pills */}
        <div className="flex flex-wrap gap-1.5 mb-3 text-xs">
          {vehicle.year && (
            <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {vehicle.year}
            </span>
          )}
          {vehicle.vehicle_type === 'bil' && vehicle.fuel_type && (
            <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full text-muted-foreground">
              <Fuel className="w-3 h-3" />
              {vehicle.fuel_type}
            </span>
          )}
          {vehicle.vehicle_type === 'trailer' && vehicle.total_weight && (
            <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full text-muted-foreground">
              <Weight className="w-3 h-3" />
              {vehicle.total_weight} kg
            </span>
          )}
          {vehicle.vehicle_type === 'campingvogn' && vehicle.sleeping_capacity && (
            <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full text-muted-foreground">
              <Users className="w-3 h-3" />
              {vehicle.sleeping_capacity} pers.
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>

        {/* Campingvogn amenities */}
        {vehicle.vehicle_type === 'campingvogn' && (
          <div className="flex flex-wrap gap-1 mb-4">
            {vehicle.has_kitchen && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <ChefHat className="w-3 h-3 mr-1" />
                Køkken
              </Badge>
            )}
            {vehicle.has_bathroom && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <Bath className="w-3 h-3 mr-1" />
                Bad
              </Badge>
            )}
            {vehicle.has_awning && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <Umbrella className="w-3 h-3 mr-1" />
                Markise
              </Badge>
            )}
          </div>
        )}

        {/* Price section - Monthly price prominent */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-black text-primary">
                  {pricing.unitPrice.toLocaleString("da-DK")}
                </span>
                <span className="text-sm font-medium text-muted-foreground">kr{pricing.unitLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground">Inkl. forsikring & afgift</p>
            </div>
            {filters.startDate && (
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">{pricing.periodCount} {pricing.periodLabel}</span>
                <span className="font-bold text-foreground text-sm">
                  {pricing.totalPrice.toLocaleString("da-DK")} kr
                </span>
              </div>
            )}
          </div>
          {subscriptionAvailable ? (
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary/80 font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/booking/${vehicle.id}?plan=subscription`);
              }}
            >
              Book abonnement
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary/80 font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/booking/${vehicle.id}`);
              }}
            >
              Lej nu
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
              {/* Badge for abonnement */}
              {subscriptionAvailable && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold shadow">Abonnement</Badge>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default VehicleSearchCard;
