import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchVehicle } from "@/pages/Search";
import { supabase } from '@/integrations/azure/client';
import { Loader2 } from "lucide-react";

interface SearchMapProps {
  vehicles: SearchVehicle[];
  selectedVehicle: string | null;
  onVehicleSelect: (id: string | null) => void;
}

function SearchMap({ vehicles, selectedVehicle, onVehicleSelect }: SearchMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setError("Mapbox token ikke konfigureret");
        }
      } catch (err: unknown) {
        console.error("Error fetching mapbox token:", err);
        setError("Kunne ikke hente kort-konfiguration");
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [10.5, 55.8], // Center of Denmark
      zoom: 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add new markers
    vehicles.forEach((vehicle) => {
      if (!vehicle.lat || !vehicle.lng) return;

      const isSelected = selectedVehicle === vehicle.id;

      // Create custom marker element using safe DOM manipulation
      const el = document.createElement("div");
      el.className = "custom-car-marker";
      
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent = "center";
      wrapper.style.width = "40px";
      wrapper.style.height = "40px";
      wrapper.style.borderRadius = "50%";
      wrapper.style.backgroundColor = isSelected ? "hsl(225, 100%, 57%)" : "white";
      wrapper.style.color = isSelected ? "white" : "hsl(225, 100%, 57%)";
      wrapper.style.border = "2px solid hsl(225, 100%, 57%)";
      wrapper.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      wrapper.style.transform = isSelected ? "scale(1.25)" : "scale(1)";
      wrapper.style.transition = "all 0.2s";
      wrapper.style.cursor = "pointer";
      
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "20");
      svg.setAttribute("height", "20");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      
      const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path1.setAttribute("d", "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2");
      
      const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle1.setAttribute("cx", "7");
      circle1.setAttribute("cy", "17");
      circle1.setAttribute("r", "2");
      
      const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path2.setAttribute("d", "M9 17h6");
      
      const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle2.setAttribute("cx", "17");
      circle2.setAttribute("cy", "17");
      circle2.setAttribute("r", "2");
      
      svg.appendChild(path1);
      svg.appendChild(circle1);
      svg.appendChild(path2);
      svg.appendChild(circle2);
      wrapper.appendChild(svg);
      el.appendChild(wrapper);

      el.addEventListener("click", () => {
        onVehicleSelect(vehicle.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([vehicle.lng, vehicle.lat])
        .addTo(map.current!);

      markersRef.current[vehicle.id] = marker;
    });
  }, [vehicles, selectedVehicle, onVehicleSelect, mapboxToken]);

  // Fly to selected vehicle
  useEffect(() => {
    if (!map.current || !selectedVehicle) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicle);
    if (vehicle?.lat && vehicle?.lng) {
      map.current.flyTo({
        center: [vehicle.lng, vehicle.lat],
        zoom: 12,
        duration: 500,
      });
    }
  }, [selectedVehicle, vehicles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-2xl">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="h-full w-full rounded-2xl" />;
}

export default SearchMap;
