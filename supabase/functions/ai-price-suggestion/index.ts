import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  fuel_type: string | null;
  vehicle_type: string;
  daily_price: number | null;
  weekly_price: number | null;
  monthly_price: number | null;
  features: string[];
}

// Input validation constants
const MAX_VEHICLES = 50;
const MAX_STRING_LENGTH = 200;
const MAX_FEATURES = 30;

function sanitizeString(str: unknown, maxLen: number): string {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLen).replace(/[<>]/g, '');
}

function validateVehicles(vehicles: unknown): { valid: boolean; error?: string; sanitized?: Vehicle[] } {
  if (!Array.isArray(vehicles)) {
    return { valid: false, error: 'Vehicles must be an array' };
  }
  
  if (vehicles.length === 0) {
    return { valid: false, error: 'No vehicles provided' };
  }
  
  if (vehicles.length > MAX_VEHICLES) {
    return { valid: false, error: `Maximum ${MAX_VEHICLES} vehicles allowed` };
  }
  
  const sanitized: Vehicle[] = [];
  
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    if (!v || typeof v !== 'object') {
      return { valid: false, error: `Invalid vehicle at index ${i}` };
    }
    
    // Sanitize and validate each vehicle
    const sanitizedVehicle: Vehicle = {
      id: sanitizeString(v.id, 100),
      make: sanitizeString(v.make, MAX_STRING_LENGTH),
      model: sanitizeString(v.model, MAX_STRING_LENGTH),
      year: typeof v.year === 'number' && v.year > 1900 && v.year < 2100 ? v.year : null,
      fuel_type: sanitizeString(v.fuel_type, 50) || null,
      vehicle_type: sanitizeString(v.vehicle_type, 50) || 'unknown',
      daily_price: typeof v.daily_price === 'number' && v.daily_price >= 0 ? v.daily_price : null,
      weekly_price: typeof v.weekly_price === 'number' && v.weekly_price >= 0 ? v.weekly_price : null,
      monthly_price: typeof v.monthly_price === 'number' && v.monthly_price >= 0 ? v.monthly_price : null,
      features: Array.isArray(v.features) 
        ? v.features.slice(0, MAX_FEATURES).map((f: unknown) => sanitizeString(f, 100)).filter(Boolean)
        : []
    };
    
    if (!sanitizedVehicle.id || !sanitizedVehicle.make || !sanitizedVehicle.model) {
      return { valid: false, error: `Vehicle at index ${i} missing required fields (id, make, model)` };
    }
    
    sanitized.push(sanitizedVehicle);
  }
  
  return { valid: true, sanitized };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize vehicles input
    const validation = validateVehicles(body.vehicles);
    if (!validation.valid) {
      console.log('Input validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const vehicles = validation.sanitized!;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get current month for seasonal context
    const currentMonth = new Date().toLocaleString('da-DK', { month: 'long' });
    const currentSeason = getSeasonFromMonth(new Date().getMonth());

    const vehicleDescriptions = vehicles.map(v => 
      `- ID: "${v.id}", ${v.make} ${v.model} (${v.year || 'ukendt år'}), ${v.fuel_type || 'ukendt brændstof'}, type: ${v.vehicle_type}, nuværende dagspris: ${v.daily_price || 'ikke sat'} kr, ugepris: ${v.weekly_price || 'ikke sat'} kr, månedspris: ${v.monthly_price || 'ikke sat'} kr, features: ${v.features?.join(', ') || 'ingen'}`
    ).join('\n');

    const systemPrompt = `Du er en ekspert i biludlejning i Danmark. Analyser køretøjerne og giv prisforslag baseret på:
- Markedstrends i Danmark
- Sæson (det er ${currentMonth}, ${currentSeason})
- Køretøjstype og kvalitet
- Aktuelle priser hvis de er sat

VIGTIGT: Brug det præcise ID som angivet for hvert køretøj (starter med UUID format).

Svar ALTID med et JSON-array med objekter der har disse felter:
- vehicleId: det PRÆCISE ID fra inputtet (IKKE bilens navn, men den UUID der er angivet)
- suggestedDailyPrice: foreslået dagspris i kr
- suggestedWeeklyPrice: foreslået ugepris i kr (typisk 6x dagspris)
- suggestedMonthlyPrice: foreslået månedspris i kr (typisk 20x dagspris)
- reasoning: kort begrundelse på dansk (max 50 ord)
- confidence: "høj", "middel" eller "lav"
- seasonalTip: kort tip om sæsonpris (max 30 ord)

Vær realistisk med danske markedspriser. En standard bil koster typisk 300-600 kr/dag, premium 600-1200 kr/dag.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analysér disse køretøjer og giv prisforslag:\n\n${vehicleDescriptions}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit overskredet, prøv igen senere." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Betalingskrævet for AI-tjenesten." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    const suggestions = JSON.parse(jsonContent);

    return new Response(
      JSON.stringify({ suggestions, season: currentSeason, month: currentMonth }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-price-suggestion:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getSeasonFromMonth(month: number): string {
  if (month >= 2 && month <= 4) return "forår";
  if (month >= 5 && month <= 7) return "sommer (højsæson)";
  if (month >= 8 && month <= 10) return "efterår";
  return "vinter (lavsæson)";
}
