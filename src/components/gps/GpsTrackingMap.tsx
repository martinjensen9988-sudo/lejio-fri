import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/azure/client';
import { GpsDeviceWithLatest } from '@/hooks/useGpsDevices';
import { Geofence } from '@/hooks/useGeofences';
import { MapPin } from 'lucide-react';

interface GpsTrackingMapProps {
  devices: GpsDeviceWithLatest[];
  selectedDevice?: GpsDeviceWithLatest | null;
  onSelectDevice?: (device: GpsDeviceWithLatest) => void;
  geofences?: Geofence[];
}

export const GpsTrackingMap = ({ devices, selectedDevice, onSelectDevice, geofences = [] }: GpsTrackingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const geofenceLayersRef = useRef<string[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError('Kunne ikke hente kortdata');
      } finally {
        setLoading(false);
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
      center: [10.2, 56.2], // Denmark center
      zoom: 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for devices with positions
    const devicesWithPositions = devices.filter((d) => d.latest_position);
    
    devicesWithPositions.forEach((device) => {
      if (!device.latest_position) return;

      const isSelected = selectedDevice?.id === device.id;
      
      // Create custom marker element using safe DOM methods
      const el = document.createElement('div');
      el.className = 'gps-marker';
      
      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'};
        border: 3px solid ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s;
      `;
      
      // Create SVG element safely using createElementNS
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '18');
      svg.setAttribute('height', '18');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', isSelected ? 'white' : 'currentColor');
      svg.setAttribute('stroke-width', '2');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2');
      svg.appendChild(path);
      
      const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle1.setAttribute('cx', '7');
      circle1.setAttribute('cy', '17');
      circle1.setAttribute('r', '2');
      svg.appendChild(circle1);
      
      const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle2.setAttribute('cx', '17');
      circle2.setAttribute('cy', '17');
      circle2.setAttribute('r', '2');
      svg.appendChild(circle2);
      
      markerDiv.appendChild(svg);
      el.appendChild(markerDiv);

      el.addEventListener('click', () => {
        onSelectDevice?.(device);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([device.latest_position.longitude, device.latest_position.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>${device.vehicle?.make} ${device.vehicle?.model}</strong><br/>
              <span style="color: #666;">${device.vehicle?.registration}</span><br/>
              ${device.latest_position.speed !== null ? `<span>Hastighed: ${Math.round(device.latest_position.speed)} km/t</span><br/>` : ''}
              ${device.latest_position.odometer !== null ? `<span>Km-tæller: ${Math.round(device.latest_position.odometer)} km</span>` : ''}
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (devicesWithPositions.length > 0 && !selectedDevice) {
      const bounds = new mapboxgl.LngLatBounds();
      devicesWithPositions.forEach((device) => {
        if (device.latest_position) {
          bounds.extend([device.latest_position.longitude, device.latest_position.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [devices, selectedDevice, onSelectDevice]);

  // Fly to selected device
  useEffect(() => {
    if (!map.current || !selectedDevice?.latest_position) return;

    map.current.flyTo({
      center: [selectedDevice.latest_position.longitude, selectedDevice.latest_position.latitude],
      zoom: 14,
      duration: 1000,
    });
  }, [selectedDevice]);

  // Draw geofences as circles
  useEffect(() => {
    if (!map.current) return;

    const currentMap = map.current;

    const addGeofenceLayers = () => {
      // Remove existing geofence layers
      geofenceLayersRef.current.forEach((layerId) => {
        if (currentMap.getLayer(layerId)) {
          currentMap.removeLayer(layerId);
        }
        if (currentMap.getSource(layerId)) {
          currentMap.removeSource(layerId);
        }
      });
      geofenceLayersRef.current = [];

      // Add geofence shapes (circles or polygons)
      geofences.forEach((geofence) => {
        const sourceId = `geofence-${geofence.id}`;
        const fillLayerId = `geofence-fill-${geofence.id}`;
        const lineLayerId = `geofence-line-${geofence.id}`;

        let coords: [number, number][];

        // Check if this is a polygon geofence with stored coordinates
        const gf = geofence;
        if (gf.geofence_type === 'polygon' && gf.polygon_coordinates && Array.isArray(gf.polygon_coordinates) && gf.polygon_coordinates.length >= 3) {
          // Use stored polygon coordinates
          coords = gf.polygon_coordinates.map((p: number[]) => [p[0], p[1]] as [number, number]);
          // Ensure polygon is closed
          if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
            coords.push(coords[0]);
          }
        } else {
          // Create a circle polygon from center and radius
          const center = [geofence.center_longitude, geofence.center_latitude];
          const radiusKm = geofence.radius_meters / 1000;
          const points = 64;
          coords = [];

          for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const dx = radiusKm * Math.cos(angle);
            const dy = radiusKm * Math.sin(angle);
            const lat = center[1] + (dy / 111.32);
            const lng = center[0] + (dx / (111.32 * Math.cos(center[1] * Math.PI / 180)));
            coords.push([lng, lat]);
          }
          coords.push(coords[0]); // Close the polygon
        }

        currentMap.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { name: geofence.name, isActive: geofence.is_active },
            geometry: {
              type: 'Polygon',
              coordinates: [coords],
            },
          },
        });

        // Fill layer
        currentMap.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': geofence.is_active ? '#22c55e' : '#6b7280',
            'fill-opacity': 0.15,
          },
        });

        // Line layer
        currentMap.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': geofence.is_active ? '#22c55e' : '#6b7280',
            'line-width': 2,
            'line-dasharray': geofence.is_active ? [1] : [2, 2],
          },
        });

        geofenceLayersRef.current.push(sourceId, fillLayerId, lineLayerId);
      });
    };

    // Wait for map style to load
    if (currentMap.isStyleLoaded()) {
      addGeofenceLayers();
    } else {
      currentMap.once('style.load', addGeofenceLayers);
    }
  }, [geofences]);

  if (loading) {
    return (
      <Card className="h-[500px]">
        <CardContent className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[500px]">
        <CardContent className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Live sporing
          {devices.filter((d) => d.latest_position).length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({devices.filter((d) => d.latest_position).length} køretøjer)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-60px)]">
        <div ref={mapContainer} className="w-full h-full" />
      </CardContent>
    </Card>
  );
};
