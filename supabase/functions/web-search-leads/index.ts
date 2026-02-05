import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } 
        }
      );
    }

    const { query, location } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query for finding car rental businesses
    const searchQuery = location 
      ? `${query} ${location} site:dk OR site:com`
      : `${query} Danmark site:dk OR site:com`;

    console.log('Searching for:', searchQuery);

    // Use DuckDuckGo HTML search (no API key required)
    const encodedQuery = encodeURIComponent(searchQuery);
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse results from HTML
    const results: Array<{
      title: string;
      url: string;
      snippet: string;
      domain: string;
    }> = [];

    // Simple regex-based parsing of DuckDuckGo HTML results
    const resultPattern = /<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    
    let match;
    while ((match = resultPattern.exec(html)) !== null && results.length < 20) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      
      // Extract domain
      let domain = '';
      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch {
        domain = url;
      }

      // Filter out obvious non-business results
      if (title && url && !url.includes('duckduckgo.com')) {
        results.push({
          title,
          url,
          snippet,
          domain,
        });
      }
    }

    // If regex didn't work well, try alternative parsing
    if (results.length === 0) {
      // Try to extract unknown links with their text
      const linkPattern = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
      while ((match = linkPattern.exec(html)) !== null && results.length < 20) {
        const url = match[1];
        const title = match[2].trim();
        
        if (title.length > 5 && !url.includes('duckduckgo.com') && !url.includes('bing.com')) {
          let domain = '';
          try {
            domain = new URL(url).hostname.replace('www.', '');
          } catch {
            domain = url;
          }
          
          results.push({
            title,
            url,
            snippet: '',
            domain,
          });
        }
      }
    }

    console.log(`Found ${results.length} results`);

    // Use AI to analyze and extract potential leads
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let analyzedLeads: Array<{
      company_name: string;
      website: string;
      description: string;
      potential_score: number;
      contact_suggestion: string;
    }> = [];

    if (LOVABLE_API_KEY && results.length > 0) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Du er en salgssupport AI for LEJIO, en biludlejningsplatform. 
Analyser søgeresultaterne og identificer potentielle kunder/leads.
Fokuser på: biludlejningsfirmaer, bilforhandlere, leasingselskaber, værksteder med lånebiler.
Returner JSON array med de bedste leads.`
            },
            {
              role: 'user',
              content: `Analyser disse søgeresultater og find potentielle leads for LEJIO:

${JSON.stringify(results, null, 2)}

Returner et JSON array med objekter der har disse felter:
- company_name: Firmanavn
- website: Website URL
- description: Kort beskrivelse af hvad de laver
- potential_score: Score fra 1-10 for hvor god en lead det er
- contact_suggestion: Forslag til hvordan vi skal kontakte dem

Returner KUN valid JSON array, ingen anden tekst.`
            }
          ],
          max_tokens: 2000,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        try {
          // Extract JSON from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            analyzedLeads = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        query: searchQuery,
        raw_results: results,
        analyzed_leads: analyzedLeads,
        total_found: results.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Web search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform web search';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
