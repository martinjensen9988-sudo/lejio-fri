import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGeofences } from '@/hooks/useGeofences';
import { useVehicles } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/azure/client';
import { Circle, Pentagon, Trash2, ArrowLeft, Save, Loader2, MapPin } from 'lucide-react';

// Predefined country boundaries (simplified)
const COUNTRY_BOUNDARIES: Record<string, { name: string; coordinates: number[][] }> = {
  denmark: {
    name: 'Danmark',
    coordinates: [
      [8.0, 54.5], [8.0, 57.8], [10.5, 57.8], [12.7, 56.0], 
      [12.7, 55.3], [15.2, 55.0], [15.2, 54.5], [12.0, 54.5], 
      [10.0, 54.8], [8.0, 54.5]
    ]
  },
  scandinavia: {
    name: 'Skandinavien',
    coordinates: [
      [4.5, 57.8], [5.0, 62.5], [7.0, 65.0], [14.0, 69.0], 
      [31.0, 70.0], [31.0, 60.0], [28.0, 59.5], [23.0, 59.0],
      [18.0, 56.0], [12.5, 55.5], [8.0, 54.5], [4.5, 57.8]
    ]
  },
  eu: {
    name: 'EU',
    coordinates: [
      [-10.0, 36.0], [-10.0, 71.0], [40.0, 71.0], [40.0, 36.0], [-10.0, 36.0]
    ]
  }
};

const AddGeofencePage = () => {
  const navigate = useNavigate();
  const { addGeofence } = useGeofences();
  const { vehicles } = useVehicles();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [geofenceType, setGeofenceType] = useState<'circle' | 'polygon'>('circle');
  const [polygonPoints, setPolygonPoints] = useState<number[][]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    name: '',
    center_latitude: 55.6761,
    center_longitude: 12.5683,
    radius_meters: 5000, // Default 5km
    alert_on_exit: true,
    alert_on_enter: false,
  });

  // Convert radius to km for display
  const radiusKm = formData.radius_meters / 1000;

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [formData.center_longitude, formData.center_latitude],
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add draggable marker
    markerRef.current = new mapboxgl.Marker({ draggable: true, color: '#10B981' })
      .setLngLat([formData.center_longitude, formData.center_latitude])
      .addTo(map.current);

    markerRef.current.on('dragend', () => {
      const lngLat = markerRef.current?.getLngLat();
      if (lngLat) {
        setFormData(prev => ({
          ...prev,
          center_latitude: lngLat.lat,
          center_longitude: lngLat.lng
        }));
      }
    });

    // Click handler
    map.current.on('click', (e) => {
      if (geofenceType === 'polygon') {
        setPolygonPoints(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
      } else {
        setFormData(prev => ({
          ...prev,
          center_latitude: e.lngLat.lat,
          center_longitude: e.lngLat.lng
        }));
        markerRef.current?.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.name) {
      return;
    }

    setIsSaving(true);

    try {
      await addGeofence.mutateAsync({
        vehicle_id: formData.vehicle_id,
        name: formData.name,
        center_latitude: formData.center_latitude,
        center_longitude: formData.center_longitude,
        radius_meters: formData.radius_meters,
        geofence_type: geofenceType,
        polygon_coordinates: geofenceType === 'polygon' ? polygonPoints : null,
        alert_on_exit: formData.alert_on_exit,
        alert_on_enter: formData.alert_on_enter,
      });

      navigate('/gps');
    } catch (error) {
      console.error('Error creating geofence:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadPreset = (presetKey: string) => {
    const preset = COUNTRY_BOUNDARIES[presetKey];
    if (preset) {
      setGeofenceType('polygon');
      setPolygonPoints(preset.coordinates);
      setFormData(prev => ({ ...prev, name: preset.name }));
    }
  };

  return (
    <DashboardLayout activeTab="gps">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Opret geofence
            </h1>
            <p className="text-muted-foreground">Definer et geografisk område for dit køretøj</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Indstillinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label>Køretøj *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="F.eks. 'Kun Danmark'"
                />
              </div>

              {/* Geofence Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Tabs value={geofenceType} onValueChange={(v) => setGeofenceType(v as 'circle' | 'polygon')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="circle" className="flex-1">
                      <Circle className="w-4 h-4 mr-2" />
                      Cirkel
                    </TabsTrigger>
                    <TabsTrigger value="polygon" className="flex-1">
                      <Pentagon className="w-4 h-4 mr-2" />
                      Polygon
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Radius (for circle) */}
              {geofenceType === 'circle' && (
                <div className="space-y-2">
                  <Label>Radius: {radiusKm} km</Label>
                  <Slider
                    value={[formData.radius_meters]}
                    onValueChange={([value]) => setFormData({ ...formData, radius_meters: value })}
                    min={100}
                    max={100000}
                    step={100}
                  />
                </div>
              )}

              {/* Presets (for polygon) */}
              {geofenceType === 'polygon' && (
                <div className="space-y-2">
                  <Label>Forudindstillinger</Label>
                  <Select value={selectedPreset} onValueChange={(v) => { setSelectedPreset(v); loadPreset(v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg område" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="denmark">Danmark</SelectItem>
                      <SelectItem value="scandinavia">Skandinavien</SelectItem>
                      <SelectItem value="eu">EU</SelectItem>
                    </SelectContent>
                  </Select>
                  {polygonPoints.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setPolygonPoints([])}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Nulstil punkter
                    </Button>
                  )}
                </div>
              )}

              {/* Alerts */}
              <div className="space-y-3">
                <Label>Alarmer</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alarm ved udgang</span>
                  <Switch
                    checked={formData.alert_on_exit}
                    onCheckedChange={(checked) => setFormData({ ...formData, alert_on_exit: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alarm ved indgang</span>
                  <Switch
                    checked={formData.alert_on_enter}
                    onCheckedChange={(checked) => setFormData({ ...formData, alert_on_enter: checked })}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Annuller
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.vehicle_id || !formData.name || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Gem
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Kort</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={mapContainer} className="h-[500px] rounded-lg overflow-hidden" />
              <p className="text-xs text-muted-foreground mt-2">
                {geofenceType === 'circle' 
                  ? 'Klik på kortet for at placere centrum, eller træk markøren'
                  : 'Klik på kortet for at tilføje punkter til polygonen'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddGeofencePage;
