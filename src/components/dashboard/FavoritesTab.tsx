import { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/azure/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heart, Car, MapPin, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FavoriteVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  daily_price: number | null;
  image_url: string | null;
  location_city: string | null;
  vehicle_type: string;
}

const FavoritesTab = () => {
  const { favorites, removeFavorite, isLoading: favoritesLoading } = useFavorites();
  const [vehicles, setVehicles] = useState<FavoriteVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavoriteVehicles = async () => {
      if (favorites.length === 0) {
        setVehicles([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vehicles_public')
        .select('id, make, model, year, daily_price, image_url, location_city, vehicle_type')
        .in('id', favorites);

      if (error) {
        console.error('Error fetching favorite vehicles:', error);
      } else {
        setVehicles(data || []);
      }
      setIsLoading(false);
    };

    if (!favoritesLoading) {
      fetchFavoriteVehicles();
    }
  }, [favorites, favoritesLoading]);

  const handleRemove = async (vehicleId: string) => {
    await removeFavorite(vehicleId);
  };

  const handleViewVehicle = (vehicleId: string) => {
    navigate(`/search?vehicle=${vehicleId}`);
  };

  if (isLoading || favoritesLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Ingen favoritter endnu
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Når du finder køretøjer du kan lide, kan du gemme dem her ved at trykke på hjertet.
        </p>
        <Button onClick={() => navigate('/search')}>
          <Car className="w-4 h-4 mr-2" />
          Find køretøjer
        </Button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map(vehicle => (
        <Card key={vehicle.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="relative aspect-video bg-muted">
            {vehicle.image_url ? (
              <img
                src={vehicle.image_url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <Badge 
              className="absolute top-3 left-3 capitalize"
              variant="secondary"
            >
              {vehicle.vehicle_type}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background text-red-500"
              onClick={() => handleRemove(vehicle.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  {vehicle.make} {vehicle.model}
                </h3>
                {vehicle.year && (
                  <p className="text-sm text-muted-foreground">{vehicle.year}</p>
                )}
              </div>
              {vehicle.daily_price && (
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">
                    {vehicle.daily_price.toLocaleString('da-DK')} kr
                  </p>
                  <p className="text-xs text-muted-foreground">pr. dag</p>
                </div>
              )}
            </div>
            
            {vehicle.location_city && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                <MapPin className="w-3 h-3" />
                {vehicle.location_city}
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={() => handleViewVehicle(vehicle.id)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Se detaljer
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FavoritesTab;
