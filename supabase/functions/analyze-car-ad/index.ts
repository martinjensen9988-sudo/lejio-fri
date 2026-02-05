import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);

  if (record && now > record.resetTime) {
    rateLimitStore.delete(clientIP);
  }

  const currentRecord = rateLimitStore.get(clientIP);

  if (!currentRecord) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (currentRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((currentRecord.resetTime - now) / 1000) };
  }

  currentRecord.count++;
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: 'For mange forespørgsler. Prøv igen om lidt.' }),
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
    const { imageBase64, imageUrl } = await req.json();

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Billede er påkrævet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI API nøgle ikke konfigureret' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing car ad image...');

    const imageContent = imageBase64 
      ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const systemPrompt = `Du er en professionel salgskonsulent for LEJIO - Danmarks førende platform for privat biludlejning.

Din opgave er at analysere billeder af bilannoncer fra Facebook (eller andre steder) hvor folk vil SÆLGE deres bil, og skrive en overbevisende besked der får dem til at overveje at UDLEJE bilen i stedet via LEJIO Fleet.

VIGTIGT - Korrekte salgsargumenter for LEJIO Fleet:
- Behold bilen OG tjen penge på den (passiv indkomst)
- Typisk kan en bil tjene 3.000-8.000 kr/måned ved udlejning
- Du bestemmer selv priser og hvornår bilen er tilgængelig
- Ingen binding - du kan stoppe når som helst
- LEJIO håndterer alt det praktiske (kontrakter, booking, kundeservice) - du modtager betaling direkte fra lejeren
- LEJIO Fleet kan håndtere mindre reparationer og vedligeholdelse for dig
- Reparationsomkostninger kan trækkes fra din månedlige lejeindtægt - så du ikke skal betale alt på én gang
- Du modtager månedlig afregning med overblik over indtægter og eventuelle udgifter
- LEJIO tager kun en lille kommission af indtægten

VIGTIGT - Du må IKKE sige:
- At LEJIO forsikrer bilen (ejeren bruger sin egen forsikring)
- At LEJIO håndterer forsikringen
- Noget som helst om forsikring - undlad emnet helt

Når du analyserer billedet:
1. Identificer bilmærke, model og årgang hvis muligt
2. Noter eventuelle særlige features nævnt i annoncen
3. Estimer potentiel lejeindtægt baseret på biltype
4. Skriv en personlig og venlig besked der refererer til deres specifikke bil
5. Fremhæv altid at LEJIO Fleet kan hjælpe med vedligeholdelse og at udgifter kan trækkes fra indtægten

Beskedens tone skal være:
- Venlig og uformel (ikke aggressivt sælgende)
- Empatisk (anerkend at de måske har brug for penge)
- Informativ (forklar fordelene tydeligt)
- Med et klart call-to-action

Svar i JSON format:
{
  "carInfo": {
    "make": "bilmærke",
    "model": "model",
    "year": "årgang",
    "estimatedValue": "ca. pris",
    "features": ["feature1", "feature2"]
  },
  "estimatedMonthlyRental": "estimeret månedlig lejeindtægt i kr",
  "message": "den personlige salgsbesked til sælgeren",
  "shortMessage": "kortere version til messenger/sms (max 300 tegn)"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Analyser denne bilannonce og skriv en overbevisende besked til sælgeren om at leje bilen ud i stedet for at sælge den:' },
              imageContent
            ]
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'For mange forespørgsler. Prøv igen om lidt.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits opbrugt. Kontakt support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Kunne ikke analysere billedet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Ingen respons fra AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received:', content.substring(0, 200));

    // Try to parse JSON from the response
    let result;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return the raw content as message if JSON parsing fails
      result = {
        carInfo: null,
        estimatedMonthlyRental: 'Ikke estimeret',
        message: content,
        shortMessage: content.substring(0, 300)
      };
    }

    console.log('Successfully analyzed car ad');

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing car ad:', error);
    return new Response(
      JSON.stringify({ error: 'Der opstod en fejl ved analyse af annoncen' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
