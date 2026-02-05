import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Code, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const FleetWidgetDemo = () => {
  const [apiKey, setApiKey] = useState("flk_0387dfab541e4727a70bcf80999d256087d841b0");
  const [showVehicles, setShowVehicles] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [copied, setCopied] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);

  const embedCode = `<!-- Lejio Fleet Widget -->
<div 
  id="lejio-fleet-widget" 
  data-api-key="${apiKey}"${!showVehicles ? '\n  data-show-vehicles="false"' : ''}${!showServices ? '\n  data-show-services="false"' : ''}
></div>
<script src="https://lejio.lovable.app/fleet-widget.js"></script>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success("Kode kopieret til udklipsholder");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Kunne ikke kopiere kode");
    }
  };

  const handleRefreshWidget = () => {
    setWidgetKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Fleet Widget Builder</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Opret en embedbar widget til din hjemmeside der viser dine køretøjer og værkstedsservices i realtid.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Konfiguration
                  </CardTitle>
                  <CardDescription>
                    Tilpas din widget og kopier embed-koden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API-nøgle</Label>
                    <Input
                      id="apiKey"
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="flk_..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find din API-nøgle i <a href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard → API-nøgler</a>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>Visningsindstillinger</Label>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Vis køretøjer</p>
                        <p className="text-xs text-muted-foreground">Vis galleri med tilgængelige køretøjer</p>
                      </div>
                      <Switch
                        checked={showVehicles}
                        onCheckedChange={setShowVehicles}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Vis services</p>
                        <p className="text-xs text-muted-foreground">Vis værkstedsservices med priser</p>
                      </div>
                      <Switch
                        checked={showServices}
                        onCheckedChange={setShowServices}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Embed-kode</CardTitle>
                  <CardDescription>
                    Kopiér denne kode og indsæt den på din hjemmeside
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code className="text-foreground">{embedCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Kopieret
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Kopiér
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleRefreshWidget}
                    >
                      Opdater preview
                    </Button>
                    <Button 
                      variant="outline"
                      asChild
                    >
                      <a href="/fleet-demo" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Fuld demo
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Integration Guide */}
              <Card>
                <CardHeader>
                  <CardTitle>Integration Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="html">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="html">HTML</TabsTrigger>
                      <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                      <TabsTrigger value="react">React</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="html" className="mt-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Indsæt embed-koden direkte i din HTML-fil hvor du vil have widget'en vist.
                      </p>
                      <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                        <li>Kopiér embed-koden ovenfor</li>
                        <li>Indsæt den i din HTML-fil</li>
                        <li>Widget'en indlæses automatisk</li>
                      </ol>
                    </TabsContent>
                    
                    <TabsContent value="wordpress" className="mt-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Brug en "Custom HTML" blok i WordPress Gutenberg editoren.
                      </p>
                      <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                        <li>Åbn siden hvor du vil tilføje widget'en</li>
                        <li>Tilføj en "Custom HTML" blok</li>
                        <li>Indsæt embed-koden</li>
                        <li>Gem og udgiv siden</li>
                      </ol>
                    </TabsContent>
                    
                    <TabsContent value="react" className="mt-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Indlæs widget-scriptet dynamisk i din React-komponent.
                      </p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://lejio.lovable.app/fleet-widget.js';
  document.body.appendChild(script);
  return () => script.remove();
}, []);

return (
  <div 
    id="lejio-fleet-widget" 
    data-api-key="${apiKey}"
  />
);`}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    Sådan ser widget'en ud på din hjemmeside
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    key={widgetKey}
                    className="bg-gray-100 p-4 rounded-lg min-h-[500px]"
                  >
                    <WidgetPreview 
                      apiKey={apiKey} 
                      showVehicles={showVehicles}
                      showServices={showServices}
                    />
                  </div>
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

// Widget Preview Component (simulates the external widget)
const WidgetPreview = ({ 
  apiKey, 
  showVehicles, 
  showServices 
}: { 
  apiKey: string; 
  showVehicles: boolean; 
  showServices: boolean;
}) => {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'services'>('vehicles');

  useEffect(() => {
    const fetchData = async () => {
      if (!apiKey) {
        setError("Mangler API-nøgle");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          'https://aqzggwewjttbkaqnbmrb.supabase.co/functions/v1/fleet-site',
          {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        const result = await response.json();
        
        if (!result.success) {
          setError(result.error || 'Kunne ikke hente data');
        } else {
          setData(result.data);
          // Set initial tab based on available data
          if (showVehicles && result.data.vehicles?.length > 0) {
            setActiveTab('vehicles');
          } else if (showServices && result.data.services?.length > 0) {
            setActiveTab('services');
          }
        }
      } catch (err) {
        setError('Netværksfejl');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiKey, showVehicles, showServices]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mb-3" />
          <span>Indlæser flådedata...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center text-destructive">
        ⚠️ {error}
      </div>
    );
  }

  if (!data) return null;

  const { fleet_owner, vehicles, services } = data;
  const hasVehicles = showVehicles && vehicles?.length > 0;
  const hasServices = showServices && services?.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex items-center gap-4">
        {fleet_owner.logo_url ? (
          <img 
            src={fleet_owner.logo_url} 
            alt={fleet_owner.company_name} 
            className="w-16 h-16 rounded-xl object-cover bg-white/10"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
            🚗
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{fleet_owner.company_name || 'Udlejning'}</h2>
          {fleet_owner.address && (
            <p className="text-white/80 text-sm">📍 {fleet_owner.address}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      {(hasVehicles || hasServices) && (
        <div className="flex border-b bg-gray-50">
          {hasVehicles && (
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'vehicles' 
                  ? 'text-primary border-primary bg-white' 
                  : 'text-muted-foreground border-transparent hover:bg-gray-100'
              }`}
            >
              🚗 Køretøjer ({vehicles.length})
            </button>
          )}
          {hasServices && (
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'services' 
                  ? 'text-primary border-primary bg-white' 
                  : 'text-muted-foreground border-transparent hover:bg-gray-100'
              }`}
            >
              🔧 Services ({services.length})
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {activeTab === 'vehicles' && hasVehicles && (
          <div className="grid gap-4">
            {vehicles.map((vehicle: unknown) => (
              <div key={vehicle.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src={vehicle.image_url || 'https://placehold.co/400x200/f3f4f6/9ca3af?text=Ingen+billede'} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-32 object-cover bg-gray-100"
                />
                <div className="p-3">
                  <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                  <div className="flex gap-2 flex-wrap my-2">
                    {vehicle.year && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{vehicle.year}</span>}
                    {vehicle.fuel_type && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{vehicle.fuel_type}</span>}
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 0 }).format(vehicle.daily_price)}
                    <span className="text-xs font-normal text-muted-foreground"> / dag</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'services' && hasServices && (
          <div className="space-y-3">
            {services.map((service: unknown) => (
              <div key={service.id} className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-semibold">{service.name}</h4>
                  {service.description && (
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 0 }).format(service.price)}
                  </p>
                  {service.estimated_minutes && (
                    <p className="text-xs text-muted-foreground">ca. {service.estimated_minutes} min</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t text-center">
        <a 
          href="https://lejio.lovable.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Powered by Lejio
        </a>
      </div>
    </div>
  );
};

export default FleetWidgetDemo;
