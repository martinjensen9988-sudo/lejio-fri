import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  industry?: string;
  city?: string;
  cvr_number?: string;
  website?: string;
  notes?: string;
  address?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const leadData = lead as LeadData;
    
    const prompt = `Du er en erfaren salgs-coach der hjælper med at forberede opkald til potentielle kunder for LEJIO, en dansk biludlejningsplatform.

Analyser følgende virksomhed og giv konkrete, handlingsorienterede tips til salgssamtalen:

VIRKSOMHEDSDATA:
- Navn: ${leadData.company_name}
- Kontaktperson: ${leadData.contact_name || 'Ikke angivet'}
- Branche: ${leadData.industry || 'Ikke angivet'}
- By: ${leadData.city || 'Ikke angivet'}
- CVR: ${leadData.cvr_number || 'Ikke angivet'}
- Hjemmeside: ${leadData.website || 'Ikke angivet'}
- Adresse: ${leadData.address || 'Ikke angivet'}
- Tidligere noter: ${leadData.notes || 'Ingen'}

=== KOMPLET LEJIO VIDEN (brug aktivt i dine tips) ===

**HVAD ER LEJIO?**
LEJIO er Danmarks førende platform for biludlejning - tænk det som "Hotels.com for biludlejning". Vi forbinder udlejere (lessors) med lejere (renters) og håndterer alt det administrative.

**MÅLGRUPPER:**
1. Private bilejere der vil tjene penge på deres bil
2. Små udlejningsfirmaer (1-15 biler)
3. Mellemstore flåder (15-50 biler)
4. Store bilforhandlere og leasingselskaber
5. Erhvervskunder der har brug for flådestyring

**PRISER & ABONNEMENTER:**
- Private udlejere (CPR): 59 kr pr. booking
- Pro abonnement for erhverv (CVR):
  * Starter: 349 kr/md for 1-5 køretøjer
  * Standard: 599 kr/md for 6-15 køretøjer  
  * Enterprise: 899 kr/md for 16-35 køretøjer
- 3% kommission pr. booking for Pro-brugere

**LEJIO FLEET (Varetager-ordning):**
- "LEJIO Varetager" (15% kommission): Platform + kundeservice
- "LEJIO Varetager Pro" (10% kommission): Alt inkl. afhentning, aflevering, rengøring, genulejning
- Ideel for bilejere der vil have passiv indkomst

**KERNEFUNKTIONER:**

1. DIGITALT KONTRAKTSYSTEM
   - Eget signatur-system (IKKE NemID/MitID!)
   - Juridisk bindende kontrakter
   - Automatisk generering
   - Skadesregistrering integreret

2. LEJIO VISION AI
   - Automatisk nummerplade-scanning
   - Dashboard-aflæsning (km-stand, brændstof)
   - Skadesregistrering med AI-analyse
   - Check-in/Check-out dokumentation

3. GPS & GEOFENCING
   - Live tracking af køretøjer
   - Geofence-advarsler
   - Kørselshistorik
   - Tyveri-beskyttelse

4. BETALING & FORSIKRING
   - Integreret betalingsløsning
   - Selvrisiko-profiler (standard/premium)
   - Automatisk fakturering
   - Depositum-håndtering

5. FLÅDESTYRING
   - Multi-lokations support
   - Service-påmindelser
   - Synsadvarsler
   - Dækskifte-tracking
   - Brændstof-opgørelser

6. BOOKING-SYSTEM
   - Online booking-kalender
   - Automatiske bekræftelser
   - Sæsonpriser
   - Rabatkoder

7. KUNDE-HÅNDTERING
   - Kørekortsverifikation
   - Kunde-segmentering
   - Rating-system
   - Advarsels-system for problematiske lejere

8. ERHVERVS-MODULER
   - Firmakonto-styring
   - Afdelings-allokering
   - EAN-fakturering
   - Månedlige samleafregninger

**UNIKKE FORDELE:**
- Alt-i-én løsning (ingen behov for flere systemer)
- Dansk platform med dansk support
- GDPR-compliant
- Skalerbart fra 1 bil til 1000+ biler
- Ingen bindingsperiode
- Gratis onboarding og support

**TYPISKE INDVENDINGER OG SVAR:**

"Vi har allerede et system"
→ "Hvad savner I ved jeres nuværende løsning? LEJIO integrerer ofte funktioner I betaler ekstra for andre steder."

"Det lyder dyrt"
→ "Med 299 kr/md for op til 5 biler og ingen booking-gebyrer, tjener de fleste det hjem på første booking."

"Vi har ikke tid til omstilling"
→ "Vores onboarding tager typisk under en time, og vi hjælper med at importere eksisterende data."

"Vi foretrækker personlig kontakt"
→ "LEJIO automatiserer det kedelige, så I får mere tid til personlig kundekontakt."

**KONTAKTINFO:**
- Website: lejio.dk
- Support: kontakt@lejio.dk
- Rasmus Damsgaard, Medstifter & Partner

=== SLUT PÅ LEJIO VIDEN ===

Giv dit svar i følgende JSON-format (og KUN JSON, ingen tekst før eller efter):
{
  "companyInsights": [
    "Indsigt 1 om virksomheden baseret på navn, branche, lokation",
    "Indsigt 2...",
    "Indsigt 3..."
  ],
  "keySellingPoints": [
    {
      "point": "Specifikt salgsargument relevant for denne kunde (brug LEJIO-viden)",
      "why": "Hvorfor dette er vigtigt for dem"
    }
  ],
  "conversationStarters": [
    "Åbningssætning 1 der er personlig og relevant",
    "Åbningssætning 2..."
  ],
  "potentialObjections": [
    {
      "objection": "Mulig indvending kunden kan have",
      "response": "Hvordan du kan håndtere den (brug LEJIO-svar)"
    }
  ],
  "questionsToAsk": [
    "Spørgsmål der kan afdække kundens behov",
    "Spørgsmål 2..."
  ],
  "importantHighlights": [
    {
      "highlight": "Vigtigt punkt at huske om LEJIO",
      "priority": "high" | "medium",
      "reason": "Hvorfor dette er vigtigt for denne kunde"
    }
  ],
  "relevantFeatures": [
    {
      "feature": "Relevant LEJIO-funktion for denne kunde",
      "benefit": "Konkret fordel for kunden"
    }
  ],
  "pricingToMention": "Hvilken prismodel er mest relevant for denne kunde og hvorfor",
  "industryContext": "Kort beskrivelse af hvordan biludlejning typisk bruges i denne branche",
  "suggestedApproach": "Anbefalet samtalestrategi for denne specifikke kunde"
}

Vær specifik og konkret. Brug virksomhedens navn og branche til at gøre tipsene relevante. Hvis branche ikke er angivet, gæt baseret på virksomhedsnavnet. Inkluder altid mindst 3 relevante LEJIO-funktioner baseret på kundetypen.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'Du er en erfaren B2B salgs-coach med speciale i dansk biludlejningsbranchen. Du giver altid konkrete, handlingsorienterede råd. Svar KUN med valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'For mange forespørgsler. Prøv igen om lidt.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Betalingskrævet. Kontakt support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    let analysis;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a default structure if parsing fails
      analysis = {
        companyInsights: [`${leadData.company_name} er en potentiel kunde i ${leadData.city || 'Danmark'}`],
        keySellingPoints: [{ point: 'Nem og effektiv biludlejning', why: 'Sparer tid og ressourcer' }],
        conversationStarters: [`Hej, jeg ringer fra LEJIO angående biludlejning for ${leadData.company_name}`],
        potentialObjections: [{ objection: 'Vi har allerede en løsning', response: 'Jeg forstår - må jeg spørge hvad I savner ved jeres nuværende løsning?' }],
        questionsToAsk: ['Hvor mange biler har I i jeres flåde?', 'Hvordan håndterer I booking i dag?'],
        importantHighlights: [{ highlight: 'Fokuser på kundens specifikke behov', priority: 'high', reason: 'Personlig tilgang øger succesraten' }],
        industryContext: 'Virksomheder i denne branche kan ofte drage fordel af fleksibel biludlejning.',
        suggestedApproach: 'Start med at lytte til kundens nuværende udfordringer før du præsenterer LEJIO.'
      };
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing lead:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Kunne ikke analysere lead' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
