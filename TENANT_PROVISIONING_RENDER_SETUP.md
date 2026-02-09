# 🏢 MULTI-TENANT PROVISIONING - RENDER DEPLOYMENT GUIDE

## Quick Start

### Phase 1: Database Update (Now)

```sql
-- In Render PostgreSQL Console, run:
-- All tables already in schema.postgres.sql

-- Verify new tables:
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'fri_tenant%';
```

### Phase 2: API Deployment (Already Done)

Auto-deployed via git push. Endpoints live:
- ✅ `/api/ProvisionTenant`
- ✅ `/api/AutoTriggerProvisioning`
- ✅ `/api/CheckTenantProvisioningStatus`
- ✅ `/api/GetTenantByDomain`

**Verify:**
```bash
curl https://lejio-fri.onrender.com/api/AutoTriggerProvisioning -X POST
# Should return 200 with empty stats (no trials yet)
```

### Phase 3: DNS Wildcard Setup (CRITICAL)

**In Render Dashboard → Your App → Custom Domains:**

Add: `*.lejio-fri.dk`
Render handles SSL automatically.

**Verify:**
```bash
nslookup test.lejio-fri.dk
# Should resolve to Render IP
```

### Phase 4: Cron Job Setup (IMMEDIATE)

**Option A: EasyCron (Simplest)**

1. Go to https://www.easycron.com
2. **Create new cron job:**
   - URL: `https://lejio-fri.onrender.com/api/AutoTriggerProvisioning`
   - Frequency: `*/15 * * * *` (every 15 min)
   - Method: POST

This automatically finds customers ending their trial and provisions them.

**Option B: Render Background Worker**

In `render.yaml`, add:
```yaml
services:
  - type: background_worker
    name: tenant-provisioning
    env: node
    startCommand: node scripts/tenant-provisioning-worker.js
```

## System Overview

```
CUSTOMER SIGNUP → TRIAL (shared server)
                    ↓
              TRIAL EXPIRES (48h warning)
                    ↓
        AutoTriggerProvisioning detects
                    ↓
          ProvisionTenant creates entry
                    ↓
      Unique subdomain assigned & migrated
                    ↓
        Customer gets own LEJIO FRI
           (company.lejio-fri.dk)
```

## Testing

### Test 1: Manual Provisioning

```bash
# Find a test lessor (or use any UUID for testing)
LESSOR_UUID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST https://lejio-fri.onrender.com/api/ProvisionTenant \
  -H "Content-Type: application/json" \
  -d "{
    \"lessor_id\": \"$LESSOR_UUID\",
    \"subscription_tier\": \"dealer_plus\"
  }"

# Response should be:
{
  "success": true,
  "tenant_id": "...",
  "subdomain": "...",
  "domain": "....lejio-fri.dk",
  "status": "provisioning"
}
```

### Test 2: Check Status

```bash
TENANT_UUID="[from response above]"

curl "https://lejio-fri.onrender.com/api/CheckTenantProvisioningStatus?tenant_id=$TENANT_UUID"

# Should show progress increasing: 5% → 40% → 60% → 100%
```

### Test 3: Verify Domain Works

```bash
# After provisioning completes (progress_percent = 100)
curl https://[subdomain].lejio-fri.dk

# Should load LEJIO FRI for that customer
```

## Monitoring

### Via Database

```sql
-- Check active provisioning
SELECT tenant_id, status, step, progress_percent 
FROM fri_tenant_provisioning
ORDER BY updated_at DESC
LIMIT 10;

-- Check completed migrations
SELECT tenant_id, migration_type, status, completed_at
FROM fri_tenant_migrations  
WHERE status = 'completed'
ORDER BY completed_at DESC;

-- Active tenants
SELECT id, name, subdomain, status, plan
FROM fri_tenants
WHERE status = 'active'
ORDER BY created_at DESC;
```

### Via API

```bash
# See automatic provisioning runs
curl https://lejio-fri.onrender.com/api/AutoTriggerProvisioning

# Returns stats on last run:
{
  "stats": {
    "pendingTrialExpirations": 5,
    "provisioned": 4,
    "failed": 0,
    "alreadyProvisioning": 1
  }
}
```

## Troubleshooting

### "Domain not found" errors

```bash
# 1. Verify DNS is set
nslookup [subdomain].lejio-fri.dk

# 2. If not resolving:
#    - Check Render Custom Domains setting
#    - Wildcard must be: *.lejio-fri.dk
#    - Wait 10 min for DNS propagation

# 3. Flush local DNS
# macOS: sudo dscacheutil -flushcache  
# Windows: ipconfig /flushdns
```

### "Provisioning stuck" 

```sql
-- Check for errors
SELECT error_message FROM fri_tenant_provisioning
WHERE status = 'provisioning'
AND updated_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';

-- Manually complete if stalled
UPDATE fri_tenant_provisioning
SET status = 'completed', progress_percent = 100
WHERE tenant_id = '...';
```

### Cron job not running

```bash
# Option 1: Manual test
curl -X POST https://lejio-fri.onrender.com/api/AutoTriggerProvisioning

# Option 2: Check Render logs
# Dashboard → Your App → Logs
# Look for: "Found X lessors pending provisioning"

# Option 3: Verify EasyCron job exists
# https://www.easycron.com → Check execution log
```

## Cost Summary

| Component | Cost | Notes |
|-----------|------|-------|
| Render App (existing) | $7/mo | No change |
| PostgreSQL (existing) | $15/mo | No change |
| Cron service (EasyCron) | Free | Free tier sufficient |
| SSL Wildcard cert | Included | Render included |
| **Total Monthly** | **$22/mo** | No additional cost |

## Next Phase: Stripe Integration

When you're ready:
1. Setup Stripe webhook for subscription events
2. Automatically trigger provisioning on payment
3. Handle subscription upgrades/downgrades
4. Daily/weekly billing reports

---

**Status:** ✅ Production Ready
**Deployment:** Push to main → Auto-deployed
**Go-Live:** Cron job running → Auto-provisions customers
