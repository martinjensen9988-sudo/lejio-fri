# Azure Migration Summary

## ✅ Completed

### Infrastructure (Bicep IaC)
- [x] **infra/main.bicep** - Main orchestration template
- [x] **infra/modules/sql.bicep** - Azure SQL Database with security
- [x] **infra/modules/keyvault.bicep** - Azure Key Vault for secrets
- [x] **infra/modules/storage.bicep** - Azure Blob Storage with containers
- [x] **infra/modules/functions.bicep** - Azure Functions (serverless backend)
- [x] **infra/modules/staticwebapp.bicep** - Azure Static Web Apps (frontend)
- [x] **AZURE_MIGRATION_GUIDE.md** - Complete deployment guide

### Frontend Code
- [x] **src/integrations/azure/client.ts** - Azure SDK wrapper (replaces Supabase)
  - Auth via Azure Functions
  - Blob Storage for file uploads
  - REST API client for backend communication
  - Migration layer (supabase-compatible API)

### Backend Functions
- [x] **azure-functions/AuthLogin/index.ts** - Authentication endpoint
- [x] **azure-functions/AuthLogin/function.json** - Function binding

## 📋 Todo: Code Migration

### Quick wins (already compatible):
- ✅ Auth pages can use new Azure client
- ✅ File uploads use Blob Storage
- ✅ API calls use REST endpoints

### Remaining work:
1. **Replace Supabase imports** across codebase
   - Change: `import { supabase } from "@/integrations/supabase/client"`
   - To: `import { supabase } from "@/integrations/azure/client"`

2. **Migrate remaining Azure Functions:**
   - `auth/logout`
   - `auth/session`
   - `db/query` - Generic query endpoint
   - `users/*` - User management
   - `vehicles/*` - Vehicle CRUD
   - `bookings/*` - Booking operations
   - `chat/*` - Live chat
   - `damage/*` - Damage reports
   - `price-suggestion` - AI pricing

3. **Update environment variables:**
   ```env
   # Remove Supabase:
   # VITE_SUPABASE_URL=...
   # VITE_SUPABASE_PUBLISHABLE_KEY=...
   
   # Add Azure:
   VITE_API_URL=https://func-lejio-fri-dev.azurewebsites.net/api
   VITE_SQL_SERVER=lejio-fri.database.windows.net
   VITE_STORAGE_ACCOUNT=stlejiofriev
   VITE_ENVIRONMENT=production
   ```

4. **Database connection:**
   - Update connection strings in Key Vault
   - Run migrations against Azure SQL DB

5. **Testing:**
   - Test authentication flow
   - Test file uploads
   - Test API endpoints
   - Test database queries

## 🚀 Deployment Steps

```bash
# 1. Login to Azure
az login

# 2. Create resource group
az group create -n lejio-fri-rg -l eastus

# 3. Validate deployment
az deployment group validate \
  -g lejio-fri-rg \
  -f infra/main.bicep \
  -p infra/main.parameters.json

# 4. Deploy infrastructure
az deployment group create \
  -g lejio-fri-rg \
  -f infra/main.bicep \
  -p infra/main.parameters.json

# 5. Get outputs
az deployment group show \
  -g lejio-fri-rg \
  -n lejio-fri-deployment-* \
  --query properties.outputs
```

## 🔑 Key Files to Update

Priority order:

1. **src/pages/Auth.tsx** - Switch to Azure auth
2. **src/hooks/useAuth.tsx** - Azure authentication hook
3. **src/hooks/useAdminAuth.tsx** - Admin auth for Azure
4. **src/components/chat/LiveChatWidget.tsx** - API endpoint
5. **src/components/damage/ARDamageScanner.tsx** - API endpoint
6. **src/pages/corporate/*** - All corporate pages with API calls

## 📊 Cost Estimate (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Azure SQL DB | Standard (20 DTU) | ~$25 |
| Azure Storage | GRS | ~$5-10 |
| Azure Functions | Consumption | ~$0-5 |
| Static Web Apps | Free | $0 |
| Key Vault | Standard | ~$0.60 |
| **Total** | | **~$30-41** |

## ✨ Security Improvements vs Supabase

- ✅ Managed Identity (no hardcoded credentials)
- ✅ Azure Key Vault (secrets rotation)
- ✅ TDE (transparent encryption)
- ✅ Threat Detection
- ✅ Network ACLs
- ✅ HTTPS enforced
- ✅ Private Blob Storage
- ✅ Function-level auth

## 🎯 Next Steps

1. **Deploy infrastructure** (`az deployment group create ...`)
2. **Update .env** with Azure endpoints
3. **Update imports** to use Azure client
4. **Test auth flow** with Martin account
5. **Deploy Functions** (`func azure functionapp publish ...`)
6. **Migrate all Edge Functions** to Azure Functions
7. **Run database migrations**
8. **Test full application**

---

**Status:** Infrastructure ready → Code migration in progress
