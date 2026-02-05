# Forbedret AI Lead Finder System

## Oversigt

Den gamle `ai-find-leads` funktion er blevet massivt forbedret til at være **meget mere kraftfuld og automatiseret**. Systemet kan nu:

- 🤖 **Automatisk finde 20+ nye leads dagligt**
- 🔍 **Berige leads med kontaktinfo** (email, telefon, website, CVR)
- ⭐ **Intelligent scoring** (1-10 baseret på industri, by, kontaktinfo)
- 📧 **Sende automatiske velkomst-emails** til nye leads
- 💾 **Gemme alt til database** automatisk
- 📊 **Detaljeret statistik** over hvad der blev fundet

## Nye Features

### 1. Automatisk Kontakt-Enrichment

**Hvad:** AI finder automatisk email, telefon, website og CVR for hver lead

**Hvordan:**
```typescript
// Alle disse felter bliver fyldt automatisk
lead.contact_email      // fx "info@bilforhandler.dk"
lead.contact_phone      // fx "+4512345678"
lead.website           // fx "https://bilforhandler.dk"
lead.cvr               // fx "12345678"
lead.enriched          // true hvis data blev fundet
```

**Resultat:** Hver lead har nu konkret kontaktinfo, klar til outreach

### 2. Intelligent Scoring (1-10)

**Algoritme:** Multi-faktor scoring baseret på:

```
Base score (fra AI)              = 5 point
+ Enriched data (email+phone)    = +1,5 point
+ Email fundet                   = +1 point
+ Telefon fundet                 = +0,5 point
+ Website fundet                 = +0,5 point
+ CVR fundet                     = +0,5 point
+ High-value industri            = +1 point  (billeasing, bilforhandler, værksted)
+ Major city (KBH, AAU, m.m.)    = +0,5 point
- Already exists in database     = -3 point

MAX = 10 point
```

**Eksempel:**
```
- Billeasing i København med email og website = 9/10
- Ukendt værksted med email = 7/10
- Uden kontaktinfo = 5/10
```

### 3. Automatisk Database-Opbygning

Hver lead bliver automatisk gemt til `leads` tabel:

```sql
INSERT INTO leads (
  company_name, industry, city, reason, score,
  search_query, source, contact_email, contact_phone,
  website, cvr, enriched, status
) VALUES (...)
```

**Duplikat-håndtering:** Hvis lead allerede findes → springes over

### 4. Email-Sending (Valgfrit)

**Hvis `sendEmails: true`:**
- AI genererer personaliseret sales-email for hver lead
- Email indeholder:
  - Personlig hilsen med virksomhedsnavn
  - Branche-specifikt pitch (tilpasset industri)
  - Call-to-action: "Booke demo"
  - LEJIO signatur

**Eksempel email:**
```
Hej [Virksomhed],

Vi har set at I arbejder inden for [industri], og det kunne passe perfekt 
med vores LEJIO biludlejnings-platform...

Vil I gerne høre mere om hvordan vi kan hjælpe jer?

Med venlig hilsen,
LEJIO Sales Team
```

### 5. Detaljeret Statistik

Hver kald returnerer nu stats:

```typescript
{
  success: true,
  suggestions: [...],        // Top leads sorted by score
  enriched: 18,              // Leads med kontaktinfo
  stats: {
    with_email: 18,          // Leads med email
    with_phone: 12,          // Leads med telefon
    with_website: 15,        // Leads med website
    with_cvr: 8,            // Leads med CVR
  },
  savedLeads: 42,           // Gemt til database
  total: 50
}
```

## Hvordan Bruges Det

### Fra Frontend (React Hook)

#### Mode 1: Smart Recommendations (fra eksisterende leads)

```typescript
import { useAILeadFinder } from '@/hooks/useAILeadFinder';

const { suggestions, isLoading, findSmartRecommendations } = useAILeadFinder();

// Find leads lignende de du allerede har
const handleFindSimilar = async () => {
  const result = await findSmartRecommendations(existingLeads, {
    autoEnrich: true,    // Udfyld kontaktinfo
    sendEmails: false,   // Ikke send emails endnu
    batchSize: 20
  });
  
  console.log('Found:', result?.enriched, 'enriched leads');
  console.log('Stats:', result?.stats);
};

return (
  <button onClick={handleFindSimilar} disabled={isLoading}>
    {isLoading ? 'Finder leads...' : 'Find lignende'}
  </button>
);
```

#### Mode 2: Discovery (find helt nye leads)

```typescript
const handleDiscoverNew = async () => {
  const result = await discoverNewLeads({
    autoEnrich: true,     // Altid benrich
    sendEmails: false,    // Generer email content først
    batchSize: 20         // Find 20 nye
  });
  
  // Brug suggestions til UI
  suggestions.forEach(lead => {
    console.log(`${lead.company_name} (${lead.score}/10)`);
    console.log(`  Email: ${lead.contact_email}`);
    console.log(`  Telefon: ${lead.contact_phone}`);
    console.log(`  Website: ${lead.website}`);
  });
};

return (
  <button onClick={handleDiscoverNew}>
    Opdag nye leads
  </button>
);
```

#### Mode 3: Med Email-Sending

```typescript
const handleDiscoverAndEmail = async () => {
  const result = await discoverNewLeads({
    autoEnrich: true,
    sendEmails: true,    // 🚀 Send emails!
    batchSize: 15
  });
  
  toast.success(`${result?.savedLeads} leads gemt og emails sendt!`);
};
```

### Direkte Edge Function Kald

```typescript
// Eksempel request
const { data, error } = await supabase.functions.invoke('ai-find-leads', {
  body: {
    mode: 'discovery',
    autoEnrich: true,
    sendEmails: false,
    batchSize: 20,
    includeScoring: true,
    targetIndustries: [
      'biludlejning',
      'bilforhandler',
      'autoværksted'
    ]
  }
});

console.log('Found:', data.total, 'suggestions');
console.log('Enriched:', data.enriched);
console.log('With email:', data.stats.with_email);
```

## Konfiguration

### Tilgængelige Options

```typescript
interface FindLeadsOptions {
  mode: 'discovery' | 'smart_recommendations';     // Hvad skal søges efter
  autoEnrich?: boolean;                             // Automatisk find kontaktinfo
  sendEmails?: boolean;                             // Send velkomst-emails
  batchSize?: number;                               // Antal leads at finde (default: 20)
  includeScoring?: boolean;                         // Intelligent scoring
  targetIndustries?: string[];                      // Hvilke brancher
  existingLeads?: LeadSuggestion[];                // For smart_recommendations
}
```

### Industrier der Søges Efter

```typescript
[
  'biludlejning',           // Car rental companies
  'billeasing',            // Leasing companies
  'bilforhandler',         // Car dealers
  'autoværksted',          // Auto repair shops
  'autoudlejning',         // Auto rental
  'lånebiler',             // Loan cars
  'bilsalg',              // Car sales
  'motorcykeludlejning',  // Motorcycle rental
  'taxiselskab',          // Taxi companies
  'transportfirma'        // Transport companies
]
```

### Høj-værdi-industrier (Scorer bonus)

```typescript
['billeasing', 'bilforhandler', 'autoværksted']  // +1 point
```

### Major-byer (Scorer bonus)

```typescript
['København', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg']  // +0,5 point
```

## Database Integration

### Tabel: `leads`

Hver lead bliver gemt med:

```sql
INSERT INTO leads (
  company_name,      -- Virksomhedsnavn
  industry,          -- Branche
  city,              -- By
  reason,            -- Hvorfor det er relevant
  score,             -- 1-10 score
  search_query,      -- AI søgeforespørgsel
  source,            -- 'ai_recommendation' eller 'ai_discovery'
  contact_email,     -- Email (hvis fundet)
  contact_phone,     -- Telefon (hvis fundet)
  website,           -- Website (hvis fundet)
  cvr,               -- CVR nummer (hvis fundet)
  enriched,          -- true hvis kontaktinfo blev fundet
  status             -- 'new', 'contacted', 'qualified', osv.
) VALUES (...)
```

### Duplikat-Check

Systemet tjekker automatisk:
```sql
SELECT id FROM leads WHERE company_name = 'Nye Virksomhed'
-- Hvis findes → springer over
-- Hvis ikke findes → indsætter
```

## Workflow Eksempler

### Eksempel 1: Daglig Automatisk Discovery

```typescript
// Trigger hver morgen kl. 9 via scheduler
async function dailyLeadDiscovery() {
  const { discoverNewLeads } = useAILeadFinder();
  
  const result = await discoverNewLeads({
    autoEnrich: true,
    sendEmails: false,   // Generer først, send manuelt
    batchSize: 20
  });
  
  // Log results
  console.log(`
    Dag: ${new Date().toLocaleDateString()}
    Fundet: ${result.total}
    Berigede: ${result.enriched}
    Med email: ${result.stats.with_email}
  `);
}
```

### Eksempel 2: Analyse af Eksisterende + Find Lignende

```typescript
async function findSimilarLeads() {
  // Hent top performers
  const topLeads = leads.filter(l => l.status === 'qualified').slice(0, 10);
  
  // Find lignende
  const { suggestions } = useAILeadFinder();
  
  const similar = await findSmartRecommendations(topLeads, {
    autoEnrich: true,
    sendEmails: false,
    batchSize: 20
  });
  
  // Top 5 nye lead-kandidater
  return similar.slice(0, 5);
}
```

### Eksempel 3: Bulk Import + Email Campaign

```typescript
async function importAndEmailLeads() {
  const { suggestions } = useAILeadFinder();
  
  // Find nye leads
  const result = await discoverNewLeads({
    autoEnrich: true,
    sendEmails: false,     // Først find + enrich
    batchSize: 30
  });
  
  // Filtrer de bedste (score > 7, har email)
  const goodLeads = result.suggestions.filter(
    l => l.score >= 7 && l.contact_email
  );
  
  console.log(`${goodLeads.length} leads klar til email campaign`);
  
  // Nu kan du sende emails via email-campaign system
  return goodLeads;
}
```

## Performance & Limits

### Hastighed

- **Lead Generation:** ~2-3 sek per batch
- **Enrichment:** ~5-8 sek per 10 leads (AI lookup)
- **Email Generation:** ~2 sek per email
- **Database Saves:** ~1 sek per 10 leads

**Total for 20 leads med enrichment:**
- Uden emails: ~15 sek
- Med emails: ~25 sek

### Rate Limits

- Lovable AI API: Standard rate limits
- Supabase: Max 10,000 requests/dag (enterprise)
- Email sending: Depends on email provider

### Batch Size Recommendations

```
- Desktop/Manual: 20-30 leads per batch
- Daily Automation: 20-25 leads
- Weekly Batch: 50-100 leads
- Monthly Campaign: 200+ leads (split into batches)
```

## Fejlhåndtering

### Common Errors

```typescript
// 1. Enrichment fejler (AI kan ikke finde info)
if (!lead.enriched) {
  console.warn(`${lead.company_name} ikke berigede`);
  // Fallback: Mark som manuel søgning
}

// 2. Email generation fejler
if (lead.email_status === 'error') {
  // Generer email manuelt eller skip
}

// 3. Database save fejler
if (!savedLeads.includes(lead)) {
  // Log og retry
}
```

### Debug Mode

```typescript
// Tænd verbose logging
const result = await discoverNewLeads({
  autoEnrich: true,
  sendEmails: false,
  batchSize: 5  // Mindre batch for debugging
});

console.log(JSON.stringify(result, null, 2));
```

## Forbedringer vs Original

| Feature | Original | Forbedret |
|---------|----------|-----------|
| Lead Generation | ✅ | ✅✅ (10+ brancher + target områder) |
| Kontaktinfo | ❌ | ✅✅ (Email, telefon, website, CVR) |
| Scoring | Simpelt (1-10) | Intelligent (Multi-faktor) |
| Database Lagring | ❌ | ✅ (Auto-save, duplikat-check) |
| Email Integration | ❌ | ✅ (Auto-generate personalized) |
| Duplikat Håndtering | ❌ | ✅ (Automatisk check) |
| Statistik | Basis | Detaljeret (Email%, telefon%, osv) |
| Batch Size | Fixed (8-10) | Configurable (5-100) |
| Industries | 8 | 10+ med custom support |
| Speed | 5-10 sek | 15-25 sek (for fuld enrich) |

## Næste Skridt

### Setup & Deployment

1. **Bekræft environment variables:**
   ```
   LOVABLE_API_KEY=xxx
   SUPABASE_URL=xxx
   SUPABASE_SERVICE_ROLE_KEY=xxx
   ```

2. **Deploy opdateret funktion:**
   ```bash
   supabase functions deploy ai-find-leads
   ```

3. **Test manuelt:**
   ```bash
   curl -X POST https://xxx.functions.supabase.co/ai-find-leads \
     -H "Authorization: Bearer xxx" \
     -H "Content-Type: application/json" \
     -d '{
       "mode": "discovery",
       "autoEnrich": true,
       "batchSize": 5
     }'
   ```

### Automatisering

- **Option A:** EasyCron - Trigger hver dag kl. 09:00
- **Option B:** AWS EventBridge - Serverless scheduler
- **Option C:** Manuel trigger via admin dashboard

### Monitoring

- Track succes-rate af enrichment
- Monitor email delivery rates
- Log lead quality over time
- Alert hvis scoring ændrer sig

---

**Version:** 2.0 (Forbedret)  
**Sidst opdateret:** Jan 27, 2026  
**Status:** Produktionsklar ✅
