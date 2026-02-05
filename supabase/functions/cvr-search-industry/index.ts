import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyResult {
  cvr: string;
  companyName: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  industry?: string;
  isActive: boolean;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute per IP (more restrictive for search)

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  return 'unknown';
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
    const retryAfter = Math.ceil((currentRecord.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  currentRecord.count++;
  rateLimitStore.set(clientIP, currentRecord);
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'For mange forespørgsler. Prøv igen om lidt.', 
        code: 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter 
      }),
      { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter || 60) } 
      }
    );
  }

  try {
    const { searchType, query, postalCode } = await req.json();

    // Validate search type
    if (!searchType || !['industry', 'name'].includes(searchType)) {
      return new Response(
        JSON.stringify({ error: 'Ugyldig søgetype. Brug "industry" eller "name"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`CVR industry search: type=${searchType}, query=${query}, postalCode=${postalCode}`);

    // Build search URL based on search type
    let searchTerm = '';
    
    if (searchType === 'industry') {
      // Search for car rental related companies
      // Industry codes: 77.11.00 = Udlejning og leasing af biler og lette motorkøretøjer
      searchTerm = query || 'biludlejning';
    } else {
      searchTerm = query || '';
    }

    if (!searchTerm) {
      return new Response(
        JSON.stringify({ error: 'Søgeterm er påkrævet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The cvrapi.dk API supports searching by name/industry text
    const apiUrl = `https://cvrapi.dk/api?search=${encodeURIComponent(searchTerm)}&country=dk`;
    
    console.log(`Fetching from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LEJIO - Biludlejning Platform',
      },
    });

    if (!response.ok) {
      console.error('CVR API error:', response.status);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ results: [], message: 'Ingen virksomheder fundet' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Kunne ikke søge i CVR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('CVR API response type:', typeof data, Array.isArray(data));

    // The API can return a single object or array
    let companies = Array.isArray(data) ? data : [data];
    
    // Filter for active companies only
    const inactiveTerms = ['ophørt', 'konkurs', 'tvangsopløst', 'likvidation', 'opløst', 'afmeldt'];
    
    // Filter by postal code if provided
    if (postalCode) {
      companies = companies.filter((company: unknown) => {
        const zip = company.zipcode?.toString() || '';
        return zip.startsWith(postalCode.toString().substring(0, 2));
      });
    }

    // Filter for car rental related companies if searching by industry
    if (searchType === 'industry') {
      companies = companies.filter((company: unknown) => {
        const industry = (company.industrydesc || '').toLowerCase();
        const name = (company.name || '').toLowerCase();
        
        // Look for car rental related terms
        const rentalTerms = ['udlejning', 'leasing', 'biludlejning', 'billeasing', 'autoudlejning', 'rent', 'car'];
        return rentalTerms.some(term => industry.includes(term) || name.includes(term));
      });
    }

    const results: CompanyResult[] = companies.map((company: unknown) => {
      const statusText = (company.companydesc || '').toLowerCase();
      const isActive = !inactiveTerms.some(term => statusText.includes(term)) && company.name;

      return {
        cvr: company.vat?.toString() || '',
        companyName: company.name || '',
        address: company.address || '',
        city: company.city || '',
        postalCode: company.zipcode?.toString() || '',
        phone: company.phone || '',
        email: company.email || '',
        industry: company.industrydesc || '',
        isActive: isActive,
      };
    }).filter((company: CompanyResult) => company.isActive && company.cvr);

    console.log(`Found ${results.length} active companies`);

    return new Response(
      JSON.stringify({ 
        results: results.slice(0, 50), // Limit to 50 results
        total: results.length,
        message: results.length === 0 ? 'Ingen aktive virksomheder fundet' : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CVR search error:', error);
    return new Response(
      JSON.stringify({ error: 'Der opstod en fejl ved søgning' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
