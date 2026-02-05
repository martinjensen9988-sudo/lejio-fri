import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Building2, Clock, Phone, Mail, Loader2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDealerLocations } from '@/hooks/useDealerLocations';

const LocationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locations, isLoading } = useDealerLocations(user?.id || '');

  return (
    <DashboardLayout activeTab="locations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mine lokationer</h2>
            <p className="text-muted-foreground">
              Administrer dine udlejningslokationer, åbningstider og forberedelsestid
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/locations/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj lokation
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Ingen lokationer endnu</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Tilføj din første lokation for at kunne administrere åbningstider og forberedelsestid.
              </p>
              <Button onClick={() => navigate('/dashboard/locations/add')}>
                <Plus className="w-4 h-4 mr-2" />
                Tilføj din første lokation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card 
                key={location.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/dashboard/locations/edit/${location.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{location.name}</CardTitle>
                        {location.is_headquarters && (
                          <Badge variant="secondary" className="mt-1 text-xs">Hovedkontor</Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={location.is_active ? "default" : "secondary"}>
                      {location.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{location.address}, {location.postal_code} {location.city}</span>
                  </div>
                  
                  {location.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{location.phone}</span>
                    </div>
                  )}
                  
                  {location.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{location.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Klargøringstid: {location.preparation_time_minutes} min</span>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Rediger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LocationsPage;
