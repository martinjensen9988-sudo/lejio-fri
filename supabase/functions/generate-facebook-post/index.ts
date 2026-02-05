import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VehicleData {
  make: string;
  model: string;
  year: number | null;
  daily_price: number | null;
  weekly_price: number | null;
  monthly_price: number | null;
  description: string | null;
  registration: string;
  fuel_type?: string | null;
  transmission?: string | null;
  seats?: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicle, postType, targetAudience } = await req.json() as { 
      vehicle: VehicleData | null; 
      postType: 'dagens_bil' | 'promotion' | 'custom' | 'lejio_promo';
      targetAudience?: string;
    };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build target audience context
    const audienceContext = targetAudience 
      ? `\n\nMÅLGRUPPE: Opslaget skal målrettes til: ${targetAudience}. Tilpas sproget, tonaliteten og argumenterne til denne specifikke målgruppe.`
      : '';

    const systemPrompt = `Du er en professionel markedsføringsekspert for en biludlejningsplatform kaldet LEJIO. 
    Du skriver engagerende Facebook-opslag på dansk der får folk til at leje biler eller bruge LEJIO platformen.
    Brug emojis passende og gør teksten fængende.
    Hold opslaget under 300 ord.
    Inkluder altid en call-to-action.
    LEJIO er "Hotels.com for biludlejning" - en platform der gør det nemt at leje bil fra private og professionelle udlejere.${audienceContext}`;

    let userPrompt = '';
    
    if (postType === 'lejio_promo') {
      userPrompt = `Skriv et generelt reklameopslag for LEJIO platformen. Dette er IKKE om en specifik bil, men om LEJIO som platform.
      
      Fokuser på:
      - Nem online booking
      - Digitale kontrakter (vi bruger vores eget signatur-system)
      - Stort udvalg af biler fra private og professionelle udlejere
      - Konkurrencedygtige priser
      - Fleksibel udlejning (dag, uge, måned)
      - Tryghed og sikkerhed
      
      Call-to-action: Besøg lejio.dk
      ${targetAudience ? `\nHusk at målrette til: ${targetAudience}` : ''}
      Gør opslaget engagerende og få folk til at ville prøve LEJIO til deres næste biludlejning.`;
    } else if (postType === 'dagens_bil' && vehicle) {
      userPrompt = `Skriv et Facebook-opslag om "Dagens Bil" for følgende køretøj:
      
      Mærke: ${vehicle.make}
      Model: ${vehicle.model}
      Årgang: ${vehicle.year || 'Ikke angivet'}
      Dagspris: ${vehicle.daily_price ? `${vehicle.daily_price} kr` : 'Kontakt os'}
      Ugepris: ${vehicle.weekly_price ? `${vehicle.weekly_price} kr` : 'Kontakt os'}
      Månedspris: ${vehicle.monthly_price ? `${vehicle.monthly_price} kr` : 'Kontakt os'}
      Beskrivelse: ${vehicle.description || 'Ingen beskrivelse'}
      Brændstof: ${vehicle.fuel_type || 'Ikke angivet'}
      Transmission: ${vehicle.transmission || 'Ikke angivet'}
      Antal sæder: ${vehicle.seats || 'Ikke angivet'}
      ${targetAudience ? `\nMålgruppe: ${targetAudience}` : ''}
      
      Gør opslaget spændende og fremhæv at det er dagens særlige tilbud på LEJIO.`;
    } else if (postType === 'promotion' && vehicle) {
      userPrompt = `Skriv et promotions-opslag for følgende køretøj:
      
      Mærke: ${vehicle.make}
      Model: ${vehicle.model}
      Årgang: ${vehicle.year || 'Ikke angivet'}
      Dagspris: ${vehicle.daily_price ? `${vehicle.daily_price} kr` : 'Kontakt os'}
      Beskrivelse: ${vehicle.description || 'Ingen beskrivelse'}
      ${targetAudience ? `\nMålgruppe: ${targetAudience}` : ''}
      
      Fokuser på bilens fordele og hvorfor den er perfekt til udlejning via LEJIO.`;
    } else if (vehicle) {
      userPrompt = `Skriv et generelt Facebook-opslag der promoverer dette køretøj:
      
      ${vehicle.make} ${vehicle.model} (${vehicle.year})
      Pris fra ${vehicle.daily_price} kr/dag
      ${targetAudience ? `\nMålgruppe: ${targetAudience}` : ''}
      
      Gør det kort og fængende.`;
    } else {
      userPrompt = `Skriv et kort og fængende reklameopslag for LEJIO - Danmarks smarteste biludlejningsplatform. Inkluder en call-to-action til lejio.dk.${targetAudience ? ` Målret til: ${targetAudience}` : ''}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit nået, prøv igen senere." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Betalingskrævet, tilføj venligst credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const generatedPost = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ post: generatedPost }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating Facebook post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
