# 🚀 Azure Deployment Checklist for Lejio Fri

## ✅ Completed Setup

### Infrastructure Files (Bicep IaC)
- ✅ `infra/main.bicep` - Main template (updated)
- ✅ `infra/main.parameters.json` - Parameters (updated to use Key Vault)
- ✅ `infra/modules/sql.bicep` - SQL Database with security
- ✅ `infra/modules/functions.bicep` - Azure Functions
- ✅ `infra/modules/staticwebapp.bicep` - Static Web App
- ✅ `infra/modules/storage.bicep` - Storage Account
- ✅ `infra/modules/keyvault.bicep` - Key Vault with purge protection

### Database Schema
- ✅ `infra/migrations/001-init-fri-schema.sql` - Complete 13 tables with indexes

### Configuration
- ✅ `azure.yaml` - Azure Developer CLI config
- ✅ `.env.azure.example` - Environment template
- ✅ `AZURE_SETUP_GUIDE.md` - Step-by-step guide

### Application
- ✅ Build successful (10.93s, 0 errors)
- ✅ All features working and integrated

## 🎯 How to Deploy

### Prerequisites
- [ ] Azure Subscription
- [ ] Azure CLI installed (`az --version`)
- [ ] Azure Developer CLI installed (`azd --version`)
- [ ] Node.js 18+ (`node --version`)
- [ ] GitHub access
- [ ] Resource group created

### Step 3: Validate Deployment
```bash
az deployment group validate \
  --resource-group lejio-fri-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```
- [ ] Validation passed (no errors)

### Step 4: Preview Changes (What-If)
```bash
az deployment group what-if \
  --resource-group lejio-fri-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```
- [ ] Review what will be created
- [ ] Approve resource creation

### Step 5: Deploy Infrastructure
```bash
az deployment group create \
  --name lejio-fri-deployment-$(date +%s) \
  --resource-group lejio-fri-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```
- [ ] Deployment started
- [ ] Wait for completion (~5-10 min)
- [ ] Deployment succeeded

## Retrieve Outputs

```bash
az deployment group show \
  --resource-group lejio-fri-rg \
  --name lejio-fri-deployment-* \
  --query properties.outputs
```

Record these outputs:
- [ ] SQL Server: `____________`
- [ ] Static Web App URL: `____________`
- [ ] Function App URL: `____________`
- [ ] Key Vault URL: `____________`
- [ ] Storage Account: `____________`

## Database Configuration

### Step 1: Connect to Azure SQL Database
```bash
sqlcmd -S <SQL_SERVER>.database.windows.net \
  -U sqladmin \
  -P <PASSWORD> \
  -d lejio-fri
```
Or use Azure Data Studio GUI

### Step 2: Run Migrations
```sql
-- Copy content from supabase/migrations/azure-sql/001_initial_schema.sql
-- Paste and execute in SSMS or sqlcmd
```

- [ ] Schema migrations executed
- [ ] Tables created successfully

### Step 3: Load Test Data (Martin Account)
```sql
-- Copy content from 006_test_martin_account.sql
-- Paste and execute
```

- [ ] Test user created (martin@lejio.dk)
- [ ] Test vehicles created
- [ ] Test lessor account created

## Frontend Configuration

### Step 1: Update Environment Variables
```bash
# Copy template
cp .env.azure.template .env.azure

# Edit with your values
nano .env.azure
```

Fill in:
- [ ] `VITE_API_URL` from Function App URL
- [ ] `VITE_SQL_SERVER` from deployment
- [ ] `VITE_STORAGE_ACCOUNT` from deployment
- [ ] `VITE_AZURE_TENANT_ID`
- [ ] `VITE_AZURE_CLIENT_ID`

### Step 2: Install Dependencies
```bash
npm install
```
- [ ] Azure SDKs installed
- [ ] All dependencies resolved

### Step 3: Build Frontend
```bash
npm run build
```
- [ ] Build succeeded
- [ ] dist/ folder created
- [ ] No TypeScript errors

### Step 4: Test Locally
```bash
npm run preview
```
- [ ] Frontend starts
- [ ] No 404 errors
- [ ] Static Web Apps config working

## GitHub Integration

### Step 1: Configure Static Web Apps
1. Go to Azure Portal → Static Web Apps → `swa-lejio-fri-dev`
2. Settings → Configuration
   - [ ] App location: `/`
   - [ ] API location: empty (using Functions)
   - [ ] Output location: `dist`

### Step 2: Generate Deployment Token
1. Go to Overview → Manage deployment token
   - [ ] Copy token
   - [ ] Save securely

### Step 3: Add GitHub Secret
```bash
# In GitHub: Settings → Secrets and Variables → Actions
# Add new repository secret:
AZURE_STATIC_WEB_APPS_API_TOKEN = <COPIED_TOKEN>
```
- [ ] Secret added to GitHub

### Step 4: Verify Auto-Deploy
1. Push a small change to main branch
2. Check GitHub Actions → Deployments
   - [ ] Build workflow triggered
   - [ ] Deployment successful
   - [ ] Site updated

## Azure Functions Deployment

### Step 1: Prepare Functions
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools

# Test locally
func start
```
- [ ] Functions run locally
- [ ] Auth endpoints respond

### Step 2: Deploy to Azure
```bash
cd azure-functions
func azure functionapp publish func-lejio-fri-dev
```
- [ ] Upload succeeded
- [ ] Functions deployed

### Step 3: Verify Functions
```bash
# Test auth endpoint
curl -X POST https://func-lejio-fri-dev.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"martin@lejio.dk","password":"TestPassword123!"}'
```
- [ ] Returns 200 OK
- [ ] Session token received

## Security Configuration

### Step 1: Key Vault Setup
- [ ] Secrets added to Key Vault
- [ ] Managed Identity permissions set
- [ ] Functions can access Key Vault

### Step 2: SQL Security
- [ ] Firewall rules configured
- [ ] TDE enabled
- [ ] Threat detection enabled
- [ ] Admin password complex

### Step 3: Storage Security
- [ ] Blobs set to private (no public access)
- [ ] Shared Access Signature (SAS) configured
- [ ] HTTPS enforced

### Step 4: Network Security
- [ ] Static Web App HTTPS enabled
- [ ] Functions HTTPS enforced
- [ ] CORS configured properly

## Testing

### Authentication Flow
1. Navigate to https://swa-lejio-fri-dev.azurestaticapps.net
   - [ ] Page loads without errors
   - [ ] Login form visible

2. Login as Martin:
   - Email: `martin@lejio.dk`
   - Password: `TestPassword123!`
   - [ ] Login succeeds
   - [ ] Redirected to dashboard

3. Check browser console:
   - [ ] No auth errors
   - [ ] Session token received
   - [ ] API calls working

### File Upload Test
1. Navigate to vehicle management
2. Upload a test image
   - [ ] File uploads to Blob Storage
   - [ ] Image URL returned
   - [ ] Image displays

### API Test
```bash
# Test database query endpoint
curl -H "Authorization: Bearer <TOKEN>" \
  https://func-lejio-fri-dev.azurewebsites.net/api/lessors/lessor-martin-001

# Should return Martin's lessor data
```
- [ ] Returns lessor data
- [ ] Correct structure

## Monitoring & Logging

### Application Insights
1. Go to Azure Portal → Application Insights
   - [ ] Enable for Function App
   - [ ] Enable for Static Web App

2. Check metrics:
   - [ ] No 5xx errors
   - [ ] Response times normal
   - [ ] Request counts reasonable

### Logs
```bash
# View live logs
az webapp log tail -g lejio-fri-rg -n func-lejio-fri-dev
```
- [ ] No errors in logs
- [ ] Auth tokens present
- [ ] Database queries executing

## Post-Deployment

### Step 1: Custom Domain Setup (Optional)
1. Azure Portal → Static Web Apps → Custom domains
2. Add domain (e.g., `app.lejio.dk`)
   - [ ] CNAME configured
   - [ ] Domain verified
   - [ ] SSL certificate auto-renewed

### Step 2: Backup Configuration
```bash
# Backup database
az sql db export \
  -g lejio-fri-rg \
  -s lejio-fri \
  -n lejio-fri \
  -u sqladmin \
  -p <PASSWORD> \
  -t lejio-fri-backup.bacpac
```
- [ ] Backup strategy defined
- [ ] Automatic backups enabled

### Step 3: Cost Optimization
- [ ] Review recommended cost savings
- [ ] Configure budget alerts
- [ ] Monitor actual spend

### Step 4: Documentation
- [ ] Update team wiki/docs
- [ ] Document connection strings
- [ ] Create runbooks for operations
- [ ] Share access credentials securely

## Production Checklist

Before going live:
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security review completed
- [ ] Backup strategy verified
- [ ] Monitoring configured
- [ ] On-call rotation established
- [ ] Rollback plan documented
- [ ] Load testing completed (optional)

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| 404 on Static Web App | Check `staticwebapp.config.json` |
| Functions not accessible | Verify CORS, Function Auth levels |
| Database connection fails | Check firewall rules, credentials in Key Vault |
| File upload fails | Verify Blob Storage permissions, container exists |
| Auth token invalid | Verify JWT_SECRET set, token generation |
| High costs | Review App Service Plan, reduce Storage retention |

## Rollback Plan

If deployment fails:
1. Delete resource group: `az group delete -n lejio-fri-rg`
2. Keep database backup separately
3. Restore from backup if needed

---

**Deployment Status:** [ ] Started | [ ] In Progress | [ ] Completed

**Deployed By:** ________________

**Deployment Date:** ________________

**Issues Encountered:** ________________

**Resolution:** ________________
