# 🏗️ LEJIO FRI - MULTI-TENANT PROVISIONING SYSTEM

## Overview

Automatisk system til at migrere kunder fra **shared trial server** til **dedikeret tenant** når deres prøveperiode udløber eller de vælger et abonnement.

## Architecture

```
TRIAL SERVER (Shared)
    ↓
   [14 days or subscription selected]
    ↓
AUTO-PROVISIONING SYSTEM
    ├── ProvisionTenant (create tenant record + start migration)
    ├── AutoTriggerProvisioning (cron: find expiring trials)
    ├── CheckTenantProvisioningStatus (monitor progress)
    └── GetTenantByDomain (domain routing)
    ↓
DEDICATED TENANT SERVER
    ├── Unique subdomain: customer.lejio-fri.dk
    ├── Custom domain support
    ├── Isolated database context
    ├── Full LEJIO FRI functionality
    └── Independent operations
```

## Database Schema

### 1. fri_tenants
```sql
id                    VARCHAR(36) PRIMARY KEY
name                  VARCHAR(255)              -- Company name
slug                  VARCHAR(100) UNIQUE       -- URL-safe slug
domain                VARCHAR(255)              -- lejio-fri.dk subdomain
custom_domain         VARCHAR(255) UNIQUE       -- Custom domain if provided
subdomain             VARCHAR(100) UNIQUE       -- customer-name
plan                  VARCHAR(50)               -- dealer_start, dealer_plus, etc
status                VARCHAR(50)               -- active, provisioning, paused
owner_email           VARCHAR(255)
trial_end_date        TIMESTAMP
subscription_start_date TIMESTAMP
stripe_customer_id    VARCHAR(255)
stripe_subscription_id VARCHAR(255)
```

### 2. fri_tenant_provisioning
```sql
id                    UUID PRIMARY KEY
tenant_id             VARCHAR(36)               -- FK to fri_tenants
lessor_id             VARCHAR(36)               -- FK to fri_lessors
status                VARCHAR(50)               -- pending→provisioning→completed→failed
step                  VARCHAR(100)              -- Initialize, schema, migrate, etc
progress_percent      INTEGER (0-100)
error_message         TEXT
provisioned_at        TIMESTAMP
estimated_completion  TIMESTAMP
trial_end_timestamp   TIMESTAMP
attempted_count       INTEGER
```

### 3. fri_tenant_migrations
```sql
id                    UUID PRIMARY KEY
tenant_id             VARCHAR(36)
lessor_id             VARCHAR(36)
migration_type        VARCHAR(50)               -- trial_to_paid, data_sync
status                VARCHAR(50)               -- pending→in_progress→completed
started_at            TIMESTAMP
completed_at          TIMESTAMP
records_migrated      INTEGER
error_details         JSONB
```

## API Endpoints

### 1. POST /ProvisionTenant
Manuelt eller automatisk trigger af tenant provisioning

**Input:**
```json
{
  "lessor_id": "uuid",
  "subscription_tier": "dealer_plus",
  "custom_domain": "optional-domain.com"
}
```

**Output:**
```json
{
  "success": true,
  "tenant_id": "uuid",
  "company_name": "Company A/S",
  "subdomain": "company-a",
  "domain": "company-a.lejio-fri.dk",
  "status": "provisioning",
  "url": "https://company-a.lejio-fri.dk",
  "message": "Tenant provisioning initiated. Setup will complete automatically within 5-10 minutes."
}
```

### 2. GET /CheckTenantProvisioningStatus
Check status for ongoing provisioning

**Input:**
```
GET /CheckTenantProvisioningStatus?tenant_id={id}
GET /CheckTenantProvisioningStatus?lessor_id={id}
```

**Output:**
```json
{
  "provisioning": {
    "tenantId": "uuid",
    "status": "provisioning",
    "step": "data_migration",
    "progressPercent": 60,
    "errorMessage": null,
    "provisionedAt": null,
    "estimatedCompletion": "2026-02-09T11:30:00Z"
  },
  "tenant": {
    "name": "Company A/S",
    "domain": "company-a.lejio-fri.dk",
    "subdomain": "company-a",
    "plan": "dealer_plus",
    "status": "provisioning",
    "url": "https://company-a.lejio-fri.dk"
  },
  "migrations": [
    {
      "id": "uuid",
      "type": "trial_to_paid",
      "status": "in_progress",
      "recordsMigrated": 0
    }
  ],
  "readyForUse": false
}
```

### 3. GET /AutoTriggerProvisioning
Cron endpoint - automatisk find og provision expiring trial customers

**Usage:**
```bash
# Call every 15 minutes via external cron service
curl -X POST https://lejio-fri.onrender.com/api/AutoTriggerProvisioning \
  -H "Content-Type: application/json"
```

**Output:**
```json
{
  "success": true,
  "timestamp": "2026-02-09T10:15:00.000Z",
  "stats": {
    "pendingTrialExpirations": 5,
    "activeWithoutTenant": 2,
    "totalProcessed": 7,
    "provisioned": 6,
    "failed": 1,
    "alreadyProvisioning": 0
  },
  "results": [
    {
      "lessor_id": "uuid",
      "company_name": "Company B",
      "tenant_id": "uuid",
      "status": "provisioning_started",
      "url": "https://company-b.lejio-fri.dk"
    }
  ]
}
```

### 4. GET /GetTenantByDomain
Domain routing lookup

**Input:**
```
GET /GetTenantByDomain?domain=company-a.lejio-fri.dk
GET /GetTenantByDomain?subdomain=company-a
GET /GetTenantByDomain?domain=custom.example.com
```

**Output:**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "Company A/S",
    "slug": "company-a",
    "domain": "company-a.lejio-fri.dk",
    "subdomain": "company-a",
    "plan": "dealer_plus",
    "status": "active",
    "primaryColor": "#a17a4d"
  },
  "provisioning": {
    "status": "completed",
    "progressPercent": 100,
    "isReady": true
  },
  "isActive": true
}
```

## Workflow

### A. Trial Customer Lifecycle

```
1. SIGNUP (Shared Trial Server)
   └─ Create fri_lessors record
   └─ subscription_status = 'trial'
   └─ trial_end_date = CURRENT_DATE + 14 days

2. TRIAL RUNNING
   └─ Customer uses LEJIO FRI features
   └─ All data stored on shared server
   └─ Isolated via RLS (lessor_id)

3. TRIAL EXPIRING (T-48h)
   └─ AutoTriggerProvisioning detects this
   └─ status changes: trial → trial_ending

4. PROVISIONING STARTS (T-0)
   ├─ ProvisionTenant called
   ├─ fri_tenants record created
   ├─ Unique subdomain assigned
   ├─ fri_tenant_provisioning tracking started
   └─ fri_tenant_migrations created

5. DURING PROVISIONING
   ├─ Step 1: Initialize (5%)
   ├─ Step 2: Schema Setup (40%)
   ├─ Step 3: Data Migration (60%)
   ├─ Step 4: Verification (90%)
   └─ Step 5: Activation (100%)

6. PROVISIONING COMPLETE
   ├─ tenant.status = 'active'
   ├─ lessor updated with tenant_id
   ├─ subscription_status = 'active'
   └─ Notification sent to customer

7. CUSTOMER REDIRECTED
   └─ Automatic redirect to their unique domain
   └─ Full access to dedicated LEJIO FRI instance
```

### B. Manual Subscription Upgrade

```
1. Customer upgrades on landing page
   └─ subscription_status = 'active'
   └─ subscription_tier = selected_plan

2. System detects active without tenant
   └─ AutoTriggerProvisioning finds this
   └─ ProvisionTenant called immediately

3. Rest of flow same as above (steps 4-7)
```

## Tenant Routing

### How Domain Resolution Works

1. **Request arrives** at `company-a.lejio-fri.dk`
2. **Node.js middleware** (`tenant-routing.js`) extracts subdomain
3. **Cache lookup** checks if tenant resolved before (5 min cache)
4. **Database query** looks up in `fri_tenants` table
5. **Context injection** sets `context.tenantId` for request
6. **RLS enforcement** applies tenant isolation in queries

### Middleware Integration

```javascript
// In your API endpoint handler before database operations:
const { tenantResolutionMiddleware, enforceRLSContext } = require('../tenant-routing');

await tenantResolutionMiddleware(context, req);

// Context now has:
// context.tenantId           // Tenant ID
// context.tenantInfo.name    // Tenant name
// context.tenantInfo.domain  // Full domain
```

## Cron Job Setup

### Option 1: External Cron Service (EasyCron, etc)

```bash
# Schedule every 15 minutes
URL: https://lejio-fri.onrender.com/api/AutoTriggerProvisioning
METHOD: POST
FREQUENCY: Every 15 minutes
TIMEOUT: 30 seconds
```

### Option 2: Render Background Job

```yaml
# render.yaml
services:
  - type: background_worker
    name: tenant-provisioning
    env: node
    buildCommand: npm install
    startCommand: node scripts/tenant-provisioning-worker.js
    envVars:
      - key: PROVISION_CHECK_INTERVAL_MS
        value: 900000  # 15 minutes
```

### Option 3: Cloud Scheduler

```bash
# Google Cloud Scheduler
gcloud scheduler jobs create http tenant-provisioning-trigger \
  --schedule="*/15 * * * *" \
  --uri="https://lejio-fri.onrender.com/api/AutoTriggerProvisioning" \
  --http-method=POST \
  --message-body='{}'
```

## RLS Configuration

Each tenant uses RLS context variables:

```sql
-- In tenant database context
SET app.tenant_id = 'uuid-here';
SET app.lessor_id = 'uuid-here';

-- Now queries are automatically filtered:
SELECT * FROM fri_vehicles;  -- Only returns FRIVehicles for this tenant+lessor
```

## DNS Configuration

### Subdomain Routing (Automatic)

```
*.lejio-fri.dk  →  CNAME lejio-fri.onrender.com
```

All subdomains automatically resolve to application, which routes based on subdomain part.

### Custom Domain Support

```
customer.com  →  CNAME lejio-fri.onrender.com

# Customer adds this to their DNS settings
```

## Monitoring & Troubleshooting

### Check Provisioning Progress
```bash
curl https://lejio-fri.onrender.com/api/CheckTenantProvisioningStatus?tenant_id={id}
```

### View Recent Provisioning Activity
```sql
SELECT * FROM fri_tenant_provisioning 
ORDER BY updated_at DESC 
LIMIT 20;
```

### Check Migration Status
```sql
SELECT * FROM fri_tenant_migrations 
WHERE updated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

### Clear Tenant Cache (if needed)
```
POST /api/ClearTenantCache
{"tenant_id": "uuid"}
```

## Error Handling

```
STATUS: pending
└─ Waiting to be processed

STATUS: provisioning
├─ STEP: initializing (0-5%)
├─ STEP: schema_provisioning (5-40%)
├─ STEP: data_migration (40-60%)
├─ STEP: verification (60-90%)
└─ STEP: provisioning_complete (90-100%)

STATUS: completed
└─ Ready for customer use

STATUS: failed
├─ error_message: Human-readable error
├─ attempted_count: Number of retry attempts
└─ last_attempt_at: When last retry happened
```

## Security Considerations

✅ **Tenant Isolation**
- RLS policies enforce lessor_id isolation
- Tenants cannot access other tenants' data
- Domain isolation prevents cross-tenant requests

✅ **Data Privacy**
- Migration logs stored with error details
- Customer data only visible to their tenant
- Audit logs track all provisioning actions

✅ **API Security**
- All endpoints require valid lessor context
- Domain verification in routing middleware
- Failed provisioning attempts tracked

## Scaling

### Shared Trial Server
- Handles unlimited free trial users
- Auto-provisions when they upgrade
- RLS prevents data mixing

### Dedicated Tenant Servers
- Each active paying customer gets own context
- Can be scaled to separate database if needed
- Faster performance for high-volume users

### Current Setup
- Single database with RLS tenant isolation
- Can be migrated to separate databases per tenant later
- Migration transparent to application

---

**Last Updated:** Feb 9, 2026
**Status:** ✅ Production Ready
