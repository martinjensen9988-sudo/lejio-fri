import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface FleetSiteResponse {
  success: boolean;
  data?: {
    fleet_owner: {
      id: string;
      company_name: string | null;
      logo_url: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
    };
    vehicles: Array<{
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
    }>;
    services: Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      estimated_minutes: number;
    }>;
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      console.log('Missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'API key required. Include x-api-key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('flk_')) {
      console.log('Invalid API key format');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API key format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for API key lookup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate API key and get fleet owner
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('fleet_api_keys')
      .select('id, fleet_owner_id, allowed_origins, is_active, requests_count')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      console.log('API key not found or inactive:', apiKeyError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check origin if allowed_origins is set
    const origin = req.headers.get('origin');
    if (apiKeyData.allowed_origins && apiKeyData.allowed_origins.length > 0 && origin) {
      const isAllowed = apiKeyData.allowed_origins.some((allowed: string) => 
        origin === allowed || allowed === '*'
      );
      if (!isAllowed) {
        console.log('Origin not allowed:', origin);
        return new Response(
          JSON.stringify({ success: false, error: 'Origin not allowed' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const fleetOwnerId = apiKeyData.fleet_owner_id;
    console.log('Fetching data for fleet owner:', fleetOwnerId);

    // Update API key usage stats (fire and forget)
    supabase
      .from('fleet_api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        requests_count: apiKeyData.requests_count ? apiKeyData.requests_count + 1 : 1
      })
      .eq('id', apiKeyData.id)
      .then(() => console.log('Updated API key usage'));

    // Fetch fleet owner profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_name, avatar_url, address, phone, email')
      .eq('id', fleetOwnerId)
      .single();

    if (profileError || !profile) {
      console.error('Fleet owner not found:', profileError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Fleet owner not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, registration, daily_price, image_url, vehicle_type, description, fuel_type')
      .eq('owner_id', fleetOwnerId)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError.message);
    }

    // Fetch workshop services
    const { data: services, error: servicesError } = await supabase
      .from('workshop_services')
      .select('id, name, description, price, estimated_minutes')
      .eq('fleet_owner_id', fleetOwnerId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (servicesError) {
      console.error('Error fetching services:', servicesError.message);
    }

    // Build response
    const response: FleetSiteResponse = {
      success: true,
      data: {
        fleet_owner: {
          id: profile.id,
          company_name: profile.company_name,
          logo_url: profile.avatar_url,
          address: profile.address,
          phone: profile.phone,
          email: profile.email,
        },
        vehicles: (vehicles || []).map(v => ({
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
          registration: v.registration,
          daily_price: v.daily_price,
          image_url: v.image_url,
          fuel_type: v.fuel_type,
          vehicle_type: v.vehicle_type,
          description: v.description,
        })),
        services: (services || []).map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: Number(s.price),
          estimated_minutes: s.estimated_minutes,
        })),
      },
    };

    console.log(`Returning ${response.data?.vehicles.length} vehicles and ${response.data?.services.length} services`);

    // Set dynamic CORS header based on origin if allowed
    const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
    if (origin && apiKeyData.allowed_origins?.includes(origin)) {
      responseHeaders['Access-Control-Allow-Origin'] = origin;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
