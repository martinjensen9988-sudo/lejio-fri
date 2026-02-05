import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, postalCode, city, reverse, latitude, longitude } = await req.json();
    
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    if (!mapboxToken) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reverse geocoding: coordinates to address
    if (reverse && latitude !== undefined && longitude !== undefined) {
      console.log('Reverse geocoding:', { latitude, longitude });
      
      const reverseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&limit=1&types=address,place`;
      
      const response = await fetch(reverseUrl);
      
      if (!response.ok) {
        console.error('Mapbox reverse geocode error:', response.status, await response.text());
        return new Response(
          JSON.stringify({ error: 'Reverse geocoding request failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        console.log('No reverse geocoding results found');
        return new Response(
          JSON.stringify({ error: 'Address not found', address: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const placeName = data.features[0].place_name;
      
      console.log('Reverse geocoded successfully:', placeName);

      return new Response(
        JSON.stringify({ 
          address: placeName,
          latitude,
          longitude,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward geocoding: address to coordinates
    if (!address && !postalCode && !city) {
      return new Response(
        JSON.stringify({ error: 'Address information required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build full address string for geocoding
    const addressParts = [address, postalCode, city, 'Denmark'].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    const encodedAddress = encodeURIComponent(fullAddress);

    console.log('Geocoding address:', fullAddress);

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=DK&limit=1`;
    
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      console.error('Mapbox API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Geocoding request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log('No geocoding results found for:', fullAddress);
      return new Response(
        JSON.stringify({ error: 'Address not found', latitude: null, longitude: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [lon, lat] = data.features[0].center;
    const placeName = data.features[0].place_name;
    
    console.log('Geocoded successfully:', { lat, lon, placeName });

    return new Response(
      JSON.stringify({ 
        latitude: lat, 
        longitude: lon, 
        placeName,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in geocode-address function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
