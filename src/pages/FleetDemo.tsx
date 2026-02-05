import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Wrench, Phone, Mail, MapPin, Clock, Fuel, Calendar } from "lucide-react";

interface FleetOwner {
  id: string;
  company_name: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  registration: string;
  daily_price: number;
  image_url: string | null;
  fuel_type: string | null;
  vehicle_type: string;
  description: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_minutes: number;
}

interface FleetData {
  fleet_owner: FleetOwner;
  vehicles: Vehicle[];
  services: Service[];
}

const FleetDemo = () => {
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await fetch(
          'https://aqzggwewjttbkaqnbmrb.supabase.co/functions/v1/fleet-site',
          { 
            headers: { 
              'x-api-key': 'flk_0387dfab541e4727a70bcf80999d256087d841b0' 
            } 
          }
        );
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Kunne ikke hente data');
        }
      } catch (err) {
        setError('Netværksfejl - prøv igen');
        console.error('Fleet API error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 pt-24 pb-16">
          <div className="container max-w-6xl mx-auto px-4">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive mb-4">{error || 'Ingen data fundet'}</p>
              <Button onClick={() => window.location.reload()}>Prøv igen</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const { fleet_owner, vehicles, services } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Fleet API Demo</Badge>
            <h1 className="text-4xl font-bold mb-4">
              {fleet_owner.company_name || 'Fleet Partner'}
            </h1>
            <div className="flex flex-wrap justify-center gap-4 text-muted-foreground">
              {fleet_owner.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {fleet_owner.address}
                </span>
              )}
              {fleet_owner.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {fleet_owner.phone}
                </span>
              )}
              {fleet_owner.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {fleet_owner.email}
                </span>
              )}
            </div>
          </div>

          {/* Vehicles */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Car className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Køretøjer til leje</h2>
              <Badge>{vehicles.length}</Badge>
            </div>
            
            {vehicles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Ingen køretøjer tilgængelige
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(vehicle => (
                  <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted relative">
                      {vehicle.image_url ? (
                        <img 
                          src={vehicle.image_url} 
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3" variant="secondary">
                        {vehicle.vehicle_type}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {vehicle.make} {vehicle.model}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-3 text-sm text-muted-foreground">
                        {vehicle.year && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {vehicle.year}
                          </span>
                        )}
                        {vehicle.fuel_type && (
                          <span className="flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            {vehicle.fuel_type}
                          </span>
                        )}
                      </div>
                      {vehicle.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {vehicle.description}
                        </p>
                      )}
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {vehicle.daily_price} kr
                        </span>
                        <span className="text-sm text-muted-foreground">/ dag</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Services */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Wrench className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Værkstedsservices</h2>
              <Badge>{services.length}</Badge>
            </div>
            
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Ingen services tilgængelige
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          {service.price} kr
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {service.estimated_minutes} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* API Info */}
          <section className="mt-16">
            <Card className="bg-muted/50">
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Denne side henter data live fra Lejio Fleet API
                  </p>
                  <code className="text-xs bg-background px-3 py-1 rounded">
                    GET /functions/v1/fleet-site
                  </code>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FleetDemo;
