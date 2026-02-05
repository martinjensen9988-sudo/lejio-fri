import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CVRData {
  cvr: string;
  companyName: string;
  address?: string;
  city?: string;
  postalCode?: string;
  status?: string;
  companyType?: string;
  startDate?: string;
  isActive: boolean;
  phone?: string;
  email?: string;
  industry?: string;
  vatRegistered: boolean;
  vatNumber?: string;
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
    const { cvr } = await req.json();

    if (!cvr || typeof cvr !== 'string') {
      console.error('Invalid CVR number provided');
      return new Response(
        JSON.stringify({ error: 'CVR-nummer er påkrævet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CVR number - only digits, 8 characters
    const cleanCvr = cvr.replace(/\D/g, '');
    
    if (cleanCvr.length !== 8) {
      console.error('Invalid CVR length:', cleanCvr.length);
      return new Response(
        JSON.stringify({ error: 'CVR-nummer skal være 8 cifre' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Looking up CVR: ${cleanCvr} from IP: ${clientIP}`);

    // Use the Danish CVR API (cvrapi.dk - free for basic lookups)
    const apiUrl = `https://cvrapi.dk/api?search=${cleanCvr}&country=dk`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LEJIO - Biludlejning Platform',
      },
    });

    if (!response.ok) {
      console.error('CVR API error:', response.status, await response.text());
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'CVR-nummer ikke fundet', isActive: false }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Kunne ikke slå CVR op', isActive: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('CVR API response:', JSON.stringify(data));

    // Check if company is active based on companydesc or other indicators
    // Danish companies that are dissolved/inactive typically have terms like:
    // "Ophørt", "Under konkurs", "Tvangsopløst", "Under frivillig likvidation"
    const inactiveTerms = ['ophørt', 'konkurs', 'tvangsopløst', 'likvidation', 'opløst', 'afmeldt'];
    const statusText = (data.companydesc || '').toLowerCase();
    const isActive = !inactiveTerms.some(term => statusText.includes(term)) && data.name;

    // Check VAT registration - Danish VAT number is "DK" + CVR number
    // Note: cvrapi.dk free API doesn't always have accurate VAT data
    // We check multiple fields and also assume active companies in certain industries are VAT registered
    const hasVatField = data.vat === true || data.vatregistered === true;
    
    // Industries that typically require VAT registration in Denmark
    const vatRequiredIndustries = ['udlejning', 'leasing', 'bilforhandler', 'autohandel', 'transport'];
    const industryText = (data.industrydesc || '').toLowerCase();
    const likelyVatRegistered = vatRequiredIndustries.some(term => industryText.includes(term));
    
    // If company is active and in a VAT-typical industry, assume VAT registered
    // Users can always override this manually if needed
    const vatRegistered = hasVatField || (isActive && likelyVatRegistered);
    const vatNumber = vatRegistered ? `DK${cleanCvr}` : undefined;

    console.log('VAT registration status:', { vatRegistered, vatNumber, rawVat: data.vat, hasVatField, likelyVatRegistered, industry: industryText });

    // Map the response to our format with extended info
    const cvrData: CVRData = {
      cvr: cleanCvr,
      companyName: data.name || '',
      address: data.address || '',
      city: data.city || '',
      postalCode: data.zipcode?.toString() || '',
      status: data.companydesc || 'Aktiv',
      companyType: data.companytype || '',
      startDate: data.startdate || '',
      isActive: isActive,
      phone: data.phone || '',
      email: data.email || '',
      industry: data.industrydesc || '',
      vatRegistered: vatRegistered,
      vatNumber: vatNumber,
    };

    console.log('Returning CVR data:', JSON.stringify(cvrData));

    // Note: We no longer block inactive companies here - the frontend handles the validation
    // This allows showing informational data even for inactive companies

    return new Response(
      JSON.stringify(cvrData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CVR lookup error:', error);
    return new Response(
      JSON.stringify({ error: 'Der opstod en fejl ved CVR-opslag', isActive: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
