import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vehicle } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Calendar, Fuel, Trash2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import ImageCarousel from '@/components/shared/ImageCarousel';
import { supabase } from '@/integrations/azure/client';

interface VehicleCardProps {
  vehicle: Vehicle;
  onToggleAvailability: (id: string, available: boolean) => void;
  onUpdate: (id: string, updates: Partial<Vehicle>) => Promise<boolean>;
  onDelete: (id: string) => void;
  isFleetManaged?: boolean;
}

const VehicleCard = ({ vehicle, onToggleAvailability, onUpdate, onDelete, isFleetManaged = false }: VehicleCardProps) => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);

  // Fetch vehicle images from the new table
  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from('vehicle_images')
        .select('image_url')
        .eq('vehicle_id', vehicle.id)
        .order('display_order', { ascending: true });
      
      const imageUrls = (data || []).map((img: { image_url: string }) => img.image_url);
      
      // Combine legacy image with new images
      const allImages = [
        ...(vehicle.image_url ? [vehicle.image_url] : []),
        ...imageUrls.filter(url => url !== vehicle.image_url),
      ];
      
      setImages(allImages);
    };

    fetchImages();
  }, [vehicle.id, vehicle.image_url]);

  return (
    <div className="bg-card rounded-2xl shadow-soft border border-border hover:shadow-lg transition-shadow overflow-hidden">
      {/* Vehicle Image Carousel */}
      <ImageCarousel 
        images={images}
        alt={`${vehicle.make} ${vehicle.model}`}
        className="h-32"
        aspectRatio="auto"
        showIndicators={images.length > 1}
        showArrows={images.length > 1}
        fallbackIcon={<Car className="w-12 h-12 text-primary/30" />}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-foreground">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {vehicle.registration}
            </p>
          </div>
          <Badge variant={vehicle.is_available ? 'default' : 'secondary'}>
            {vehicle.is_available ? 'Tilgængelig' : 'Ikke tilgængelig'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mb-4 text-sm">
          {vehicle.year && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{vehicle.year}</span>
            </div>
          )}
          {vehicle.fuel_type && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Fuel className="w-3.5 h-3.5" />
              <span className="capitalize">{vehicle.fuel_type}</span>
            </div>
          )}
        </div>

        {/* Features badges */}
        {vehicle.features && vehicle.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {vehicle.features.slice(0, 4).map(feature => (
              <span 
                key={feature} 
                className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent"
              >
                {feature === 'aircon' && 'AC'}
                {feature === 'gps' && 'GPS'}
                {feature === 'bluetooth' && 'BT'}
                {feature === 'cruise_control' && 'Fartpilot'}
                {feature === 'parking_sensors' && 'P-sensor'}
                {feature === 'backup_camera' && 'Bakkamera'}
                {feature === 'heated_seats' && 'Sædevarme'}
                {feature === 'leather_seats' && 'Læder'}
                {feature === 'sunroof' && 'Panorama'}
                {feature === 'keyless' && 'Keyless'}
                {feature === 'apple_carplay' && 'CarPlay'}
                {feature === 'android_auto' && 'Android'}
                {feature === 'roof_rack' && 'Tagbøjler'}
                {feature === 'tow_hitch' && 'Træk'}
                {feature === 'child_seat' && 'Barnestol'}
                {feature === 'winter_tires' && 'Vinterdæk'}
              </span>
            ))}
            {vehicle.features.length > 4 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{vehicle.features.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3 p-3 rounded-xl bg-muted/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Dag</p>
            <p className="font-bold text-foreground text-sm">
              {vehicle.daily_price ? `${vehicle.daily_price} kr` : '-'}
            </p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground mb-1">Uge</p>
            <p className="font-bold text-foreground text-sm">
              {vehicle.weekly_price ? `${vehicle.weekly_price} kr` : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Måned</p>
            <p className="font-bold text-foreground text-sm">
              {vehicle.monthly_price ? `${vehicle.monthly_price} kr` : '-'}
            </p>
          </div>
        </div>

        {/* Km info */}
        <div className="text-xs text-center mb-4 text-muted-foreground">
          {vehicle.unlimited_km ? (
            <span className="text-accent font-medium">✓ Fri km inkluderet</span>
          ) : (
            <span>
              {vehicle.included_km || 100} km/dag inkl. • {vehicle.extra_km_price || 2.5} kr/ekstra km
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {!isFleetManaged && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => onToggleAvailability(vehicle.id, !vehicle.is_available)}
            >
              {vehicle.is_available ? (
                <>
                  <ToggleRight className="w-4 h-4 mr-1 text-accent" />
                  Deaktiver
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 mr-1" />
                  Aktiver
                </>
              )}
            </Button>
          )}
          {isFleetManaged && (
            <span className="flex-1 text-xs text-muted-foreground text-center">
              Administreres af Fleet
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => navigate(`/dashboard/vehicles/edit/${vehicle.id}`)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {!isFleetManaged && (
            <Button
              variant="ghost" 
              size="sm" 
              className="text-destructive text-xs" 
              onClick={() => onDelete(vehicle.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
