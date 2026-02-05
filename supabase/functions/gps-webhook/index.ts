import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// Security limits
const MAX_PAYLOAD_SIZE = 100000; // 100KB max payload
const MAX_DEVICE_ID_LENGTH = 100;
const MAX_PROVIDER_LENGTH = 50;
const MAX_OBJECT_DEPTH = 5;
const MAX_DATA_POINTS = 100;

// Limit object depth to prevent stack overflow attacks
const limitObjectDepth = (obj: unknown, maxDepth: number, currentDepth: number = 0): unknown => {
  if (currentDepth >= maxDepth) {
    return '[max depth reached]';
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => limitObjectDepth(item, maxDepth, currentDepth + 1));
  }
  const result: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).slice(0, 50);
  for (const key of keys) {
    result[key] = limitObjectDepth((obj as Record<string, unknown>)[key], maxDepth, currentDepth + 1);
  }
  return result;
};

// Sanitize string for logging (remove potential injection characters)
const sanitizeForLog = (str: string, maxLength: number = 100): string => {
  // eslint-disable-next-line no-control-regex
  return str.slice(0, maxLength).replace(/[\x00-\x1f\x7f]/g, '');
};

interface GpsDataPoint {
  device_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  odometer?: number;
  ignition_on?: boolean;
  fuel_level?: number;
  battery_level?: number;
  recorded_at?: string;
  raw_data?: Record<string, unknown>;
}

interface Geofence {
  id: string;
  vehicle_id: string;
  name: string;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  geofence_type: 'circle' | 'polygon';
  polygon_coordinates: number[][] | null;
  is_active: boolean;
  alert_on_exit: boolean;
  alert_on_enter: boolean;
}

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Ray casting algorithm for point-in-polygon check
const isPointInPolygon = (lat: number, lon: number, polygon: number[][]): boolean => {
  if (!polygon || polygon.length < 3) return false;
  
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    if (((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// Check if point is inside geofence (supports both circle and polygon)
const isInsideGeofence = (lat: number, lon: number, geofence: Geofence): boolean => {
  if (geofence.geofence_type === 'polygon' && geofence.polygon_coordinates && geofence.polygon_coordinates.length >= 3) {
    // Use point-in-polygon algorithm for polygons
    return isPointInPolygon(lat, lon, geofence.polygon_coordinates);
  } else {
    // Use distance-based check for circles
    const distance = calculateDistance(lat, lon, geofence.center_latitude, geofence.center_longitude);
    return distance <= geofence.radius_meters;
  }
};

// Provider-specific data parsers
const parseProviderData = (provider: string, data: Record<string, unknown>): GpsDataPoint | null => {
  try {
    switch (provider) {
      case 'teltonika':
        return parseTeltonika(data);
      case 'ruptela':
        return parseRuptela(data);
      case 'autopi':
        return parseAutoPi(data);
      default:
        return parseGeneric(data);
    }
  } catch (error) {
    console.error(`Error parsing ${provider} data:`, error);
    return null;
  }
};

// Teltonika parser
const parseTeltonika = (data: Record<string, unknown>): GpsDataPoint => {
  return {
    device_id: String(data.imei || data.device_id || data.id),
    latitude: Number(data.latitude || data.lat),
    longitude: Number(data.longitude || data.lng || data.lon),
    speed: data.speed ? Number(data.speed) : undefined,
    heading: data.heading || data.angle ? Number(data.heading || data.angle) : undefined,
    altitude: data.altitude ? Number(data.altitude) : undefined,
    odometer: data.odometer || data.total_odometer ? Number(data.odometer || data.total_odometer) : undefined,
    ignition_on: data.ignition !== undefined ? Boolean(data.ignition) : undefined,
    fuel_level: data.fuel_level ? Number(data.fuel_level) : undefined,
    battery_level: data.battery || data.external_voltage ? Number(data.battery || data.external_voltage) : undefined,
    recorded_at: data.timestamp ? String(data.timestamp) : undefined,
    raw_data: data,
  };
};

// Ruptela parser
const parseRuptela = (data: Record<string, unknown>): GpsDataPoint => {
  const gps = data.gps as Record<string, unknown> | undefined;
  return {
    device_id: String(data.imei || data.deviceId || data.id),
    latitude: Number(data.latitude || data.lat || gps?.lat),
    longitude: Number(data.longitude || data.lng || data.lon || gps?.lng),
    speed: data.speed ? Number(data.speed) : undefined,
    heading: data.direction || data.heading ? Number(data.direction || data.heading) : undefined,
    altitude: data.altitude ? Number(data.altitude) : undefined,
    odometer: data.odometer || data.mileage ? Number(data.odometer || data.mileage) : undefined,
    ignition_on: data.ignition !== undefined ? Boolean(data.ignition) : undefined,
    fuel_level: data.fuel ? Number(data.fuel) : undefined,
    battery_level: data.battery ? Number(data.battery) : undefined,
    recorded_at: data.datetime || data.timestamp ? String(data.datetime || data.timestamp) : undefined,
    raw_data: data,
  };
};

// AutoPi parser
const parseAutoPi = (data: Record<string, unknown>): GpsDataPoint => {
  const position = data.position as Record<string, unknown> | undefined;
  const battery = data.battery as Record<string, unknown> | undefined;
  return {
    device_id: String(data.unit_id || data.device_id || data.id),
    latitude: Number(position?.lat || data.latitude || data.lat),
    longitude: Number(position?.lon || data.longitude || data.lng),
    speed: data.speed ? Number(data.speed) : undefined,
    heading: data.heading || data.track ? Number(data.heading || data.track) : undefined,
    altitude: position?.alt || data.altitude ? Number(position?.alt || data.altitude) : undefined,
    odometer: data.odometer ? Number(data.odometer) : undefined,
    ignition_on: data.engine !== undefined ? Boolean(data.engine) : undefined,
    fuel_level: data.fuel_level ? Number(data.fuel_level) : undefined,
    battery_level: battery?.level ? Number(battery.level) : undefined,
    recorded_at: data.utc || data.timestamp ? String(data.utc || data.timestamp) : undefined,
    raw_data: data,
  };
};

// Generic parser
const parseGeneric = (data: Record<string, unknown>): GpsDataPoint => {
  return {
    device_id: String(data.device_id || data.deviceId || data.imei || data.id || data.tracker_id),
    latitude: Number(data.latitude || data.lat),
    longitude: Number(data.longitude || data.lng || data.lon),
    speed: data.speed ? Number(data.speed) : undefined,
    heading: data.heading || data.bearing || data.direction ? Number(data.heading || data.bearing || data.direction) : undefined,
    altitude: data.altitude || data.alt ? Number(data.altitude || data.alt) : undefined,
    odometer: data.odometer || data.mileage || data.total_distance ? Number(data.odometer || data.mileage || data.total_distance) : undefined,
    ignition_on: data.ignition !== undefined ? Boolean(data.ignition) : (data.engine !== undefined ? Boolean(data.engine) : undefined),
    fuel_level: data.fuel_level || data.fuel ? Number(data.fuel_level || data.fuel) : undefined,
    battery_level: data.battery_level || data.battery ? Number(data.battery_level || data.battery) : undefined,
    recorded_at: data.recorded_at || data.timestamp || data.datetime ? String(data.recorded_at || data.timestamp || data.datetime) : undefined,
    raw_data: data,
  };
};

interface VehicleData {
  owner_id: string;
  make: string;
  model: string;
  registration: string;
}

// Send push notification for geofence alerts
const sendGeofenceNotification = async (
  vehicleId: string,
  geofenceName: string,
  alertType: 'exit' | 'enter'
) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get vehicle owner
    const { data: vehicleData } = await supabaseClient
      .from('vehicles')
      .select('owner_id, make, model, registration')
      .eq('id', vehicleId)
      .single();

    const vehicle = vehicleData as VehicleData | null;
    if (!vehicle) return;

    const title = alertType === 'exit' 
      ? `⚠️ Køretøj forlod zone` 
      : `📍 Køretøj ankom til zone`;
    
    const body = alertType === 'exit'
      ? `${vehicle.make} ${vehicle.model} (${vehicle.registration}) forlod "${geofenceName}"`
      : `${vehicle.make} ${vehicle.model} (${vehicle.registration}) ankom til "${geofenceName}"`;

    // Get user's push subscriptions
    const { data: subscriptions } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', vehicle.owner_id);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions for vehicle owner');
      return;
    }

    // Call send-push-notification function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        userId: vehicle.owner_id,
        title,
        body,
        url: '/gps',
        tag: `geofence-${alertType}`,
      }),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
  } catch (error) {
    console.error('Error sending geofence push notification:', error);
  }
};

// Validate GPS data ranges
const validateGpsData = (data: GpsDataPoint): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.latitude < -90 || data.latitude > 90) {
    errors.push(`Invalid latitude: ${data.latitude} (must be between -90 and 90)`);
  }
  if (data.longitude < -180 || data.longitude > 180) {
    errors.push(`Invalid longitude: ${data.longitude} (must be between -180 and 180)`);
  }
  if (data.speed !== undefined && data.speed < 0) {
    errors.push(`Invalid speed: ${data.speed} (must be >= 0)`);
  }
  if (data.heading !== undefined && (data.heading < 0 || data.heading > 360)) {
    errors.push(`Invalid heading: ${data.heading} (must be between 0 and 360)`);
  }
  if (data.battery_level !== undefined && (data.battery_level < 0 || data.battery_level > 100)) {
    errors.push(`Invalid battery level: ${data.battery_level} (must be between 0 and 100)`);
  }
  if (data.fuel_level !== undefined && (data.fuel_level < 0 || data.fuel_level > 100)) {
    errors.push(`Invalid fuel level: ${data.fuel_level} (must be between 0 and 100)`);
  }
  
  return { valid: errors.length === 0, errors };
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check payload size before parsing
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      console.warn('Payload too large:', contentLength);
      return new Response(
        JSON.stringify({ success: false, error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook secret from header for authentication
    const webhookSecret = req.headers.get('x-webhook-secret');

    // Get provider from query params or header with validation
    const url = new URL(req.url);
    let provider = url.searchParams.get('provider') || req.headers.get('x-gps-provider') || 'generic';
    
    // Validate and sanitize provider string
    if (provider.length > MAX_PROVIDER_LENGTH) {
      console.warn('Provider name too long');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    provider = sanitizeForLog(provider, MAX_PROVIDER_LENGTH);
    
    console.log(`Received GPS webhook from provider: ${provider}`);

    // Parse request body with size check
    const rawText = await req.text();
    if (rawText.length > MAX_PAYLOAD_SIZE) {
      console.warn('Payload too large after reading');
      return new Response(
        JSON.stringify({ success: false, error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const body = JSON.parse(rawText);
    
    // Limit object depth to prevent stack overflow
    const sanitizedBody = limitObjectDepth(body, MAX_OBJECT_DEPTH) as Record<string, unknown> | unknown[];
    
    // Log truncated data for debugging (avoid logging full payload)
    console.log('Webhook data received, size:', rawText.length);

    // Handle both single data point and array of data points
    let dataPoints = Array.isArray(sanitizedBody) 
      ? sanitizedBody 
      : ((sanitizedBody as Record<string, unknown>).data 
          ? (Array.isArray((sanitizedBody as Record<string, unknown>).data) 
              ? (sanitizedBody as Record<string, unknown>).data as unknown[]
              : [(sanitizedBody as Record<string, unknown>).data]) 
          : [sanitizedBody]);
    
    // Limit number of data points to process
    if (dataPoints.length > MAX_DATA_POINTS) {
      console.warn(`Too many data points: ${dataPoints.length}, limiting to ${MAX_DATA_POINTS}`);
      dataPoints = dataPoints.slice(0, MAX_DATA_POINTS);
    }

    const results = [];
    const errors = [];

    for (const rawData of dataPoints) {
      const parsed = parseProviderData(provider, rawData as Record<string, unknown>);
      
      if (!parsed || !parsed.device_id || !parsed.latitude || !parsed.longitude) {
        errors.push({ error: 'INVALID_FORMAT' });
        continue;
      }

      // Validate device_id length
      if (parsed.device_id.length > MAX_DEVICE_ID_LENGTH) {
        console.warn('Device ID too long');
        errors.push({ error: 'INVALID_DEVICE' });
        continue;
      }

      // Validate GPS data ranges
      const validation = validateGpsData(parsed);
      if (!validation.valid) {
        console.warn(`Invalid GPS data for device ${sanitizeForLog(parsed.device_id)}:`, validation.errors);
        errors.push({ error: 'INVALID_DATA' });
        continue;
      }

      // Look up device in database (include webhook_secret for auth)
      const { data: device, error: deviceError } = await supabase
        .from('gps_devices')
        .select('id, vehicle_id, is_active, webhook_secret')
        .eq('device_id', parsed.device_id)
        .single();

      if (deviceError || !device) {
        console.log(`Unknown device: ${sanitizeForLog(parsed.device_id)}`);
        errors.push({ error: 'DEVICE_NOT_FOUND' });
        continue;
      }

      // Validate webhook secret if configured for this device
      if (device.webhook_secret && device.webhook_secret !== webhookSecret) {
        console.warn(`Invalid webhook secret for device: ${sanitizeForLog(parsed.device_id)}`);
        errors.push({ error: 'UNAUTHORIZED' });
        continue;
      }

      if (!device.is_active) {
        console.log(`Inactive device: ${sanitizeForLog(parsed.device_id)}`);
        errors.push({ error: 'DEVICE_INACTIVE' });
        continue;
      }

      // Insert GPS data point
      const { data: insertedPoint, error: insertError } = await supabase
        .from('gps_data_points')
        .insert({
          device_id: device.id,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          speed: parsed.speed,
          heading: parsed.heading,
          altitude: parsed.altitude,
          odometer: parsed.odometer,
          ignition_on: parsed.ignition_on,
          fuel_level: parsed.fuel_level,
          battery_level: parsed.battery_level,
          raw_data: parsed.raw_data,
          recorded_at: parsed.recorded_at ? new Date(parsed.recorded_at).toISOString() : new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting GPS data:', insertError);
        errors.push({ error: 'PROCESSING_ERROR' });
        continue;
      }

      // Update device last_seen_at
      await supabase
        .from('gps_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', device.id);

      // Update vehicle coordinates
      await supabase
        .from('vehicles')
        .update({ 
          latitude: parsed.latitude, 
          longitude: parsed.longitude 
        })
        .eq('id', device.vehicle_id);

      // Check geofences for this vehicle
      const { data: geofences } = await supabase
        .from('geofences')
        .select('*')
        .eq('vehicle_id', device.vehicle_id)
        .eq('is_active', true);

      if (geofences && geofences.length > 0) {
        // Get the previous GPS point to determine if we crossed a boundary
        const { data: prevPoints } = await supabase
          .from('gps_data_points')
          .select('latitude, longitude')
          .eq('device_id', device.id)
          .neq('id', insertedPoint.id)
          .order('recorded_at', { ascending: false })
          .limit(1);

        const prevPoint = prevPoints?.[0];

        for (const geofence of geofences as Geofence[]) {
          const isCurrentlyInside = isInsideGeofence(parsed.latitude, parsed.longitude, geofence);
          const wasInside = prevPoint ? isInsideGeofence(prevPoint.latitude, prevPoint.longitude, geofence) : isCurrentlyInside;

          // Check for exit
          if (geofence.alert_on_exit && wasInside && !isCurrentlyInside) {
            console.log(`Vehicle exited geofence: ${geofence.name}`);
            await supabase.from('geofence_alerts').insert({
              geofence_id: geofence.id,
              device_id: device.id,
              alert_type: 'exit',
              latitude: parsed.latitude,
              longitude: parsed.longitude,
            });

            // Send push notification to vehicle owner
            await sendGeofenceNotification(device.vehicle_id, geofence.name, 'exit');
          }

          // Check for enter
          if (geofence.alert_on_enter && !wasInside && isCurrentlyInside) {
            console.log(`Vehicle entered geofence: ${geofence.name}`);
            await supabase.from('geofence_alerts').insert({
              geofence_id: geofence.id,
              device_id: device.id,
              alert_type: 'enter',
              latitude: parsed.latitude,
              longitude: parsed.longitude,
            });

            // Send push notification to vehicle owner
            await sendGeofenceNotification(device.vehicle_id, geofence.name, 'enter');
          }
        }
      }

      results.push({
        device_id: parsed.device_id,
        point_id: insertedPoint.id,
        recorded_at: insertedPoint.recorded_at,
      });
    }

    console.log(`Processed ${results.length} data points, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        errors: errors.length,
        results,
        ...(errors.length > 0 && { errors })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('GPS webhook error:', error);
    // Return generic error to avoid leaking internal details
    return new Response(
      JSON.stringify({ success: false, error: 'Processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
