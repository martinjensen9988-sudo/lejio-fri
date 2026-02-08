# RLS (Row Level Security) Deployment Guide

## Status
✅ **Kode opdateret**: Alle endpoints bruger nu `withLessorClient()` for RLS beskyttelse  
⚠️ **Database**: RLS policies skal aktiveres i Render Postgres

## Hvad er rettet?

### 1. API Endpoints (✅ Completed)
- **UpdateSubscriptionTier**: Bruger nu `withLessorClient()` for sikker opdatering af subscription tier
- **GetModules**: Bruger nu `withLessorClient()` for sikker hentning af moduler
- **SetModule**: Bruger nu `withLessorClient()` for sikker aktivering/deaktivering af moduler
- **rls.js**: Tilføjet `getLessorIdFromSession()` der korrekt resolver lessor_id fra user_id

### 2. Frontend Bug Fix (✅ Completed)
- **SettingsPage**: Rettet `setPlanDialogOpen(false)` → `setShowPlanPicker(false)`

## Database Setup (⚠️ Required)

RLS policies skal aktiveres i Render Postgres for at sikre data isolation mellem lessors.

### Trin 1: Connect til Render Database

#### Option A: Via Render Dashboard
1. Gå til [Render Dashboard](https://dashboard.render.com)
2. Vælg din PostgreSQL database: `lejio-fri-db`
3. Klik på "Connect" → "External Connection"
4. Kopier `PSQL Command`

#### Option B: Via Terminal (hvis DATABASE_URL er sat)
```bash
psql $DATABASE_URL
```

### Trin 2: Kør RLS Policies Script

Når du er connectet til databasen, kør:

```sql
-- Fra psql prompt
\i database/rls.policies.sql
```

**Eller** kopier hele indholdet af `database/rls.policies.sql` og kør det direkte.

### Trin 3: Verificer RLS er aktiveret

```sql
-- Tjek at RLS er enabled på tabeller
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fri_%'
ORDER BY tablename;

-- Forvented output: rowsecurity = true for tabeller som fri_vehicles, fri_bookings, etc.

-- Tjek policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Forvented: Policies for SELECT, INSERT, UPDATE, DELETE på alle RLS-enabled tabeller
```

## Hvad gør RLS Policies?

RLS beskytter data ved at:

1. **Sætte lessor context**: `withLessorClient()` sætter `app.lessor_id` per request
2. **Håndhæve isolation**: Database policies bruger `current_setting('app.lessor_id')` til at filtrere data
3. **Automatisk sikkerhed**: Selv hvis SQL er forkert, kan lessors kun se deres egen data

### Eksempel Flow:

```
User Login (lessor_id: abc-123)
    ↓
Session (user_id: xyz-789)
    ↓
withLessorClient() 
    → Resolver: user_id (xyz-789) → lessor_id (abc-123)
    → SET LOCAL app.lessor_id = 'abc-123'
    ↓
Database Query: SELECT * FROM fri_vehicles
    → RLS Policy: WHERE lessor_id = current_setting('app.lessor_id')
    → Result: Kun vehicles for lessor abc-123
```

## Tabeller MED RLS (efter script køres)

- ✅ fri_vehicles
- ✅ fri_bookings
- ✅ fri_invoices
- ✅ fri_payments
- ✅ fri_pages
- ✅ fri_page_blocks (via parent page lessor_id)
- ✅ fri_lessor_team_members
- ✅ fri_support_tickets
- ✅ fri_api_keys
- ✅ fri_audit_logs

## Tabeller UDEN RLS (intentional)

- ❌ fri_users (auth table, accessed by auth endpoints only)
- ❌ fri_sessions (session table, accessed by session.js only)
- ❌ fri_admins (admin table, accessed by admin auth only)
- ❌ fri_lessors (no lessor_id column, uses id as PK, queried via WHERE id=)
- ❌ fri_subscription_plans (shared lookup table, public readable)
- ❌ fri_tenants (multi-tenant config, no lessor_id column)

## Testing RLS

Efter deployment, test ved at:

1. **Log ind som lessor A**
2. **Opret/hent data** (vehicles, bookings, etc.)
3. **Log ud og log ind som lessor B**
4. **Verificer at lessor B IKKE kan se lessor A's data**

## Troubleshooting

### Problem: "current_setting('app.lessor_id') returned null"
**Løsning**: Endpoint bruger ikke `withLessorClient()`. Check at API handler wrapper alle queries i `withLessorClient(req, async (client, lessorId) => { ... })`.

### Problem: "permission denied for table"
**Løsning**: RLS policies er ikke kørt. Kør `database/rls.policies.sql` scriptet.

### Problem: "User can see other lessor's data"
**Løsning**: 
1. Verificer RLS er enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename='fri_vehicles';`
2. Verificer policies eksisterer: `SELECT * FROM pg_policies WHERE tablename='fri_vehicles';`
3. Tjek at `withLessorClient()` bruges i endpoint

## Deployment Checklist

- [x] Code changes committed & pushed
- [ ] Connect to Render Postgres database
- [ ] Run `database/rls.policies.sql` script
- [ ] Verify RLS policies with SQL commands above
- [ ] Test data isolation between lessors
- [ ] Monitor logs for RLS-related errors

## Support

Hvis der opstår problemer efter RLS deployment:
1. Tjek server logs i Render dashboard
2. Verificer database policies med SQL commands ovenfor
3. Test endpoints med forskellige lessor accounts
4. Check at session cookies indeholder korrekt user_id

---

**Deploy Date**: 2026-02-08  
**RLS Script**: `database/rls.policies.sql`  
**Modified Endpoints**: UpdateSubscriptionTier, GetModules, SetModule  
**Modified Files**: api/rls.js, src/pages/fri/dashboard/SettingsPage.tsx
