# 🚀 Supabase Migrations - Køring af nye tabeller

## ✅ Status
Migrations-filerne er oprettet og klar til at blive kørt:
- `supabase/migrations/20260126_001_create_saved_searches.sql`
- `supabase/migrations/20260126_002_create_email_campaigns.sql`

## 📋 Hvad skal køres

### Migration 1: Saved Searches
Tabel til gemte søgninger med RLS (Row Level Security):
- Brugere kan gemme egne søgninger
- Supporterer 'lead' og 'deal' typer
- Auto-indexing for performance

### Migration 2: Email Campaigns
Tabeller til email marketing:
- `email_campaigns` - kampagne-metadata
- `email_tracking` - tracking af opens/clicks per lead
- Full RLS og admin-kontrol

## 🔧 Muligheder for at køre

### Mulighed 1: Via Supabase Dashboard (ANBEFALET)
1. Gå til https://app.supabase.com
2. Log ind
3. Vælg projekt: `aqzggwewjttbkaqnbmrb`
4. Gå til **SQL Editor**
5. Klik **New Query**
6. Kopier indholdet fra:
   ```
   supabase/migrations/20260126_001_create_saved_searches.sql
   supabase/migrations/20260126_002_create_email_campaigns.sql
   ```
7. Klik **Run** (⌘ + Enter)

### Mulighed 2: Via Supabase CLI (hvis du har adgang)
```bash
# Kræver at være logged ind
supabase link --project-ref aqzggwewjttbkaqnbmrb
supabase db push
```

### Mulighed 3: Via direkteSQL via CLI med connection string
```bash
# Hvis du har PostgreSQL-klienten installeret
psql "postgresql://postgres:password@db.aqzggwewjttbkaqnbmrb.supabase.co:5432/postgres" < supabase/migrations/20260126_001_create_saved_searches.sql
psql "postgresql://postgres:password@db.aqzggwewjttbkaqnbmrb.supabase.co:5432/postgres" < supabase/migrations/20260126_002_create_email_campaigns.sql
```

## ✨ Efter migrations køres

Når tabellerne er oprettet, vil:
- ✅ Alle TypeScript-fejl forsvinde
- ✅ `useSavedSearches.tsx` funktionere fuldt ud
- ✅ `useEmailCampaigns.tsx` funktionere fuldt ud
- ✅ CRM-dashboardet have fuld funktionalitet

## 🔗 Links
- Supabase Console: https://app.supabase.com
- Projekt ID: `aqzggwewjttbkaqnbmrb`

---

*Migrations blev oprettet: 2026-01-26*
