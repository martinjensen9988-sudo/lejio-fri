import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleData {
  registration: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  fuel_type: string;
  color: string;
  vin: string;
  vehicle_id: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

// In-memory rate limiting store (resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  // Try to get real IP from various headers
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return 'unknown';
}

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);

  // Clean up expired entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(clientIP);
  }

  const currentRecord = rateLimitStore.get(clientIP);

  if (!currentRecord) {
    // First request from this IP
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (currentRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((currentRecord.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  currentRecord.count++;
  rateLimitStore.set(clientIP, currentRecord);
  return { allowed: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP);

  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: 'For mange forespørgsler. Prøv igen om lidt.', 
        code: 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfter || 60)
        } 
      }
    );
  }

  try {
    const { registration } = await req.json();
    
    if (!registration) {
      return new Response(
        JSON.stringify({ error: 'Registration number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('KAMELI_API_KEY');
    if (!apiKey) {
      console.error('KAMELI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean registration number (remove spaces, uppercase)
    const cleanedRegistration = registration.replace(/\s/g, '').toUpperCase();
    console.log(`Looking up vehicle: ${cleanedRegistration} from IP: ${clientIP}`);

    // Call Kameli/Nummerplade API - correct endpoint is api.nrpla.de
    const response = await fetch(
      `https://api.nrpla.de/${cleanedRegistration}?advanced=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nummerplade API error: ${response.status} - ${errorText}`);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Køretøj ikke fundet', code: 'NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Ugyldig API-nøgle', code: 'UNAUTHORIZED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Kunne ikke hente bildata', code: 'API_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await response.json();
    console.log('Vehicle data received:', JSON.stringify(responseData));

    // API returns data nested inside a "data" object
    const data = responseData.data || responseData;

    // Map Nummerplade API response to our format
    // API returns: registration, vin, brand, model, version, fuel_type, model_year, color, etc.
    const vehicleData: VehicleData = {
      registration: data.registration || cleanedRegistration,
      make: data.brand || '',
      model: data.model || '',
      variant: data.version || '',
      year: data.model_year || (data.first_registration_date ? parseInt(data.first_registration_date.substring(0, 4)) : 0),
      fuel_type: data.fuel_type || '',
      color: typeof data.color === 'object' ? data.color.name : (data.color || ''),
      vin: data.vin || '',
      vehicle_id: String(data.vehicle_id || data.registration || ''),
    };

    return new Response(
      JSON.stringify({ vehicle: vehicleData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vehicle-lookup function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
