import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MINUTES = 1; // 1 minute window

// Database-backed rate limiting using Supabase RPC
async function checkRateLimitDB(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Rate limit DB not configured, falling back to allow");
      return { allowed: true };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: 'live-chat-ai',
      p_max_requests: RATE_LIMIT,
      p_window_minutes: RATE_WINDOW_MINUTES
    });
    
    if (error) {
      console.error("Rate limit check error:", error);
      // On error, allow the request but log the issue
      return { allowed: true };
    }
    
    if (data && data.length > 0) {
      const result = data[0];
      return { 
        allowed: result.allowed, 
        retryAfter: result.retry_after_seconds > 0 ? result.retry_after_seconds : undefined 
      };
    }
    
    return { allowed: true };
  } catch (err) {
    console.error("Rate limit exception:", err);
    return { allowed: true };
  }
}

// Input validation constants
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

// Forbidden patterns for AI output validation (detect potential leaks)
const FORBIDDEN_OUTPUT_PATTERNS = [
  /LOVABLE_API_KEY/i,
  /SUPABASE_.*_KEY/i,
  /Bearer\s+[A-Za-z0-9_-]{20,}/,
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /password\s*[:=]\s*["'][^"']{8,}["']/i,
];

// Validate AI output doesn't contain leaked secrets
function validateAIOutput(output: string): string {
  let filtered = output;
  for (const pattern of FORBIDDEN_OUTPUT_PATTERNS) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[REDACTED]');
      console.warn('Potential sensitive data filtered from AI output');
    }
  }
  return filtered;
}

// Sanitize message content to prevent prompt injection attempts
function sanitizeMessageContent(content: string): string {
  // Remove potential system prompt injection patterns - including unicode bypasses
  const sanitized = content
    // Normalize unicode characters that could bypass filters
    .normalize('NFKC')
    // Remove attempts to override system instructions (case insensitive + unicode resistant)
    .replace(/\[\s*S\s*Y\s*S\s*T\s*E\s*M\s*\]/gi, '[filtered]')
    .replace(/\[\s*A\s*D\s*M\s*I\s*N\s*\]/gi, '[filtered]')
    .replace(/\[\s*O\s*V\s*E\s*R\s*R\s*I\s*D\s*E\s*\]/gi, '[filtered]')
    .replace(/SYSTEM\s*:/gi, 'user:')
    .replace(/IGNORE\s+(PREVIOUS|ABOVE|ALL)\s+INSTRUCTIONS/gi, '[filtered]')
    .replace(/DISREGARD\s+(PREVIOUS|ABOVE|ALL)/gi, '[filtered]')
    .replace(/NEW\s+INSTRUCTIONS?:/gi, '[filtered]')
    // Remove control characters except newlines and tabs
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit consecutive whitespace
    .replace(/\s{10,}/g, '          ');
  
  return sanitized.trim();
}

interface SanitizedMessage {
  role: 'user' | 'assistant';
  content: string;
}

function validateMessages(messages: unknown): { valid: boolean; error?: string; sanitized?: SanitizedMessage[] } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "Messages must be an array" };
  }
  
  if (messages.length === 0) {
    return { valid: false, error: "At least one message is required" };
  }
  
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Maximum ${MAX_MESSAGES} messages allowed` };
  }
  
  const sanitized: SanitizedMessage[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: `Invalid message at index ${i}` };
    }
    
    if (typeof msg.content !== 'string') {
      return { valid: false, error: `Message content must be a string at index ${i}` };
    }
    
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message at index ${i} exceeds ${MAX_MESSAGE_LENGTH} characters` };
    }
    
    if (typeof msg.role !== 'string' || !['user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: `Invalid role at index ${i}. Must be 'user' or 'assistant'` };
    }
    
    // Sanitize content before adding
    sanitized.push({
      role: msg.role as 'user' | 'assistant',
      content: sanitizeMessageContent(msg.content)
    });
  }
  
  return { valid: true, sanitized };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP using database-backed persistent storage
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    const rateLimitResult = await checkRateLimitDB(clientIP);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: "For mange forespørgsler. Vent venligst et øjeblik." }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter || 60)
        },
      });
    }

    const body = await req.json();
    const { messages } = body;
    
    // Validate and sanitize input messages
    const validation = validateMessages(messages);
    if (!validation.valid) {
      console.log(`Invalid input: ${validation.error}`);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Use sanitized messages
    const sanitizedMessages = validation.sanitized!;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with", sanitizedMessages.length, "messages");

    const systemPrompt = `Du er LEJIO's hjælpsomme AI-assistent. LEJIO er Danmarks førende platform for køretøjsudlejning, der forbinder private udlejere og professionelle forhandlere med lejere.

## LEJIO PLATFORMOVERSIGT
LEJIO er "Hotels.com for køretøjsudlejning" - en komplet digital løsning til biludlejning med AI-drevet teknologi.

## KØRETØJSTYPER
Vi understøtter udlejning af:
- Biler (personbiler, varevogne, SUV'er)
- Motorcykler og scootere (med kørekortsvalidering for MC-kategorier A1, A2, A)
- Trailere (med dimensioner, vægt, trækkoblingstype)
- Campingvogne/caravans (med sovepladser, køkken, bad, udstyr)

## PRISER OG ABONNEMENTER

### Private udlejere (uden CVR)
- 59 kr pr. booking

### Pro/Professionelle udlejere (med CVR)
- Starter: 349 kr/måned (1-5 køretøjer)
- Standard: 599 kr/måned (6-15 køretøjer)
- Enterprise: 899 kr/måned (16-35 køretøjer)
- 3% kommission pr. booking for alle Pro-kunder

### LEJIO Fleet (vi styrer din flåde)
- Fleet Basic: 15% kommission - LEJIO håndterer platform, booking og kundeservice
- Fleet Premium: 10% kommission - LEJIO håndterer ALT inkl. afhentning, aflevering og rengøring

## BETALINGSMULIGHEDER
Udlejere kan acceptere:
- Kortbetaling
- MobilePay
- Bankoverførsel
- Kontant

Lejere kan vælge mellem:
- Forudbetaling (hele beløbet på én gang)
- Månedligt abonnement (løbende trækning) - kun ved leje på min. 1 måned

## PRISFLEKSIBILITET
Udlejere kan sætte individuelle priser for:
- Dagspris
- Ugepris
- Månedspris
- Ubegrænset kilometer eller km-inkluderet + tillæg pr. ekstra km

## DIGITALE KONTRAKTER
- Juridisk bindende digitale kontrakter
- Digital underskrift fra både lejer og udlejer
- Automatisk PDF-generering og e-mail
- Skadesregistrering med før/efter billeder
- Vanvidskørsel-ansvarserklæring

## AI-FUNKTIONER
- Vision AI til automatisk aflæsning af km-stand og brændstofniveau fra dashboard-billeder
- AI prisforslag baseret på markedsdata
- AI-drevet skadesanalyse fra billeder
- AI-drevet førerkortverificering
- Live AI-chat support (det er mig!)

## GPS TRACKING
- Realtids GPS-sporing af køretøjer
- Geofence-advarsler (alarm ved kørsel udenfor område)
- Historisk rutevisning
- Webhook-integration

## BOOKINGFLOW
1. Lejer finder køretøj og vælger periode (dag/uge/måned)
2. Udfylder personlige oplysninger
3. Vælger betalingsmetode og evt. abonnement
4. Udlejer modtager notifikation
5. Digital kontrakt sendes til underskrift
6. Check-in med billeddokumentation
7. Check-out med km-aflæsning og skadesgennemgang

## FOR LEJERE
- Profilside med alle lejeaftaler under "Mine lejeaftaler"
- Aktive bookinger og historik
- Alle kontrakter og fakturaer samlet under "Dokumenter"
- Download af PDF-kontrakter
- Rutevejledning til afhentningssted
- Mulighed for genbooking af tidligere lejede køretøjer

## FOR UDLEJERE
- Komplet dashboard med statistik og analytics
- Bookingkalender med overblik
- Køretøjsadministration med flere lokationer
- Kundesegmentering (VIP, gentagende kunder)
- Automatiske servicepåmindelser
- Bøde-tracking og videresendelse
- Fakturagenerering
- Dækstyring

## SIKKERHED
- Førerkortsverificering med AI
- Depositumhåndtering
- Selvrisikoforsikring tilbydes
- Skadesrapporter med fotodokumentation

## KONTAKT
Ved komplekse spørgsmål kan du kontakte:
- Rasmus Damsgaard, Medstifter & Partner
- Telefon: 91 99 89 29
- E-mail: rasmus@lejio.dk

## INSTRUKTIONER
- Svar altid på dansk
- Vær venlig, professionel og hjælpsom
- Hold svarene korte og præcise
- Hvis du ikke kan besvare et spørgsmål, eller brugeren specifikt beder om at tale med kundeservice, så svar med præcis denne tekst på en ny linje: "[NEEDS_HUMAN_SUPPORT]"
- VIGTIGT: Nævn ALDRIG NemID eller MitID - LEJIO bruger sin egen digitale signatur`;


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
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørgsler. Prøv igen om lidt." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-tjenesten er midlertidigt utilgængelig." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI-fejl. Prøv igen." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ukendt fejl";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
