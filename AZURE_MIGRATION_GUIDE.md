# Azure Deployment Guide for Lejio Fri

## Prerequisites

1. **Azure Subscription**
   - Create free account: https://azure.microsoft.com/en-us/free/
   - Note your subscription ID

2. **GitHub Token** (for Static Web Apps)
   - Go to: https://github.com/settings/tokens
   - Create Personal Access Token with `repo` scope
   - Save token securely

3. **Local Tools**
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Install Bicep CLI
   az bicep install
   ```

## Step 1: Login to Azure

```bash
az login
az account set --subscription <YOUR_SUBSCRIPTION_ID>
```

## Step 2: Create Resource Group

```bash
az group create \
  --name lejio-fri-rg \
  --location eastus
```

## Step 3: Update Parameters

Edit `infra/main.parameters.json`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "dev"
    },
    "location": {
      "value": "eastus"  // Change to your region
    },
    "sqlAdminUsername": {
      "value": "sqladmin"
    },
    "sqlAdminPassword": {
      "value": "YourSecurePassword123!"  // CHANGE THIS!
    },
    "githubRepo": {
      "value": "martinjensen9988-sudo/lejio-b75cff1f"
    },
    "githubBranch": {
      "value": "main"
    }
  }
}
```

## Step 4: Validate Deployment

```bash
az deployment group validate \
  --resource-group lejio-fri-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

## Step 5: Preview Deployment (What-If)

```bash
az deployment group what-if \
  --resource-group lejio-fri-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

## Step 6: Deploy Infrastructure

```bash
az deployment group create \
  --name lejio-fri-deployment-$(date +%s) \
  --resource-group lejio-fri-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

Wait for deployment to complete (~5-10 minutes).

## Step 7: Get Deployment Outputs

```bash
az deployment group show \
  --name <DEPLOYMENT_NAME> \
  --resource-group lejio-fri-rg \
  --query properties.outputs
```

You'll get:
- **staticWebAppUrl** - Your frontend URL
- **sqlServerName** - Database server
- **functionAppUrl** - API backend
- **keyVaultUrl** - Secrets manager

## Step 8: Configure GitHub Integration for Static Web Apps

1. Go to Azure Portal → Static Web Apps → `swa-lejio-fri-dev`
2. Copy **Repository token**
3. Go to GitHub → Your repo → Settings → Secrets
4. Add secret: `AZURE_STATIC_WEB_APPS_API_TOKEN=<token>`

GitHub Actions workflow will auto-deploy on push to `main` branch.

## Step 9: Deploy Database Schema

```bash
# Connect to Azure SQL Database
sqlcmd -S <SQL_SERVER>.database.windows.net -U sqladmin -P <PASSWORD> -d lejio-fri

# Run migrations
:r supabase/migrations/azure-sql/001_initial_schema.sql
:r supabase/migrations/azure-sql/006_test_martin_account.sql
```

Or use Azure Data Studio for GUI.

## Step 10: Configure Application Settings

Update Azure Functions with these app settings:

```bash
az functionapp config appsettings set \
  --name func-lejio-fri-dev \
  --resource-group lejio-fri-rg \
  --settings \
    "SQL_CONNECTION_STRING=<FROM_KEY_VAULT>" \
    "STORAGE_CONNECTION_STRING=<FROM_KEY_VAULT>" \
    "JWT_SECRET=<GENERATE_NEW_SECRET>" \
    "NODE_ENV=production"
```

## Step 11: Deploy Frontend & Functions

Frontend:
- Static Web Apps auto-deploys from GitHub

Azure Functions:
```bash
# Install Azure Functions Core Tools
curl https://aka.ms/install-azurefunctions-core-tools

# Deploy functions
func azure functionapp publish func-lejio-fri-dev --build remote
```

## Troubleshooting

**Static Web App not building:**
- Check GitHub Actions logs
- Verify `staticwebapp.config.json` exists
- Ensure build output location is `dist/`

**Can't connect to SQL Database:**
- Check firewall rules
- Verify connection string in Key Vault
- Test with Azure Data Studio

**Functions not working:**
- Check Application Insights logs
- Verify environment variables set
- Check API route mappings

## Cost Optimization

Current setup costs ~$30-50/month:
- Azure SQL Database (Standard tier): ~$25/month
- Static Web Apps (Free tier): $0
- Azure Functions (Consumption): ~$0-5/month
- Storage Account: ~$5-10/month

To reduce:
- Use Database Tier: `Basic` instead of `Standard` (~$10/month)
- Set Storage lifecycle policies (auto-delete old files)

## Security Checklist

- ✅ All secrets in Key Vault (not in .env)
- ✅ Managed Identity for Function authentication
- ✅ HTTPS enforced
- ✅ SQL firewall configured
- ✅ Storage blobs private (no public access)
- ✅ TDE enabled on database
- ✅ Threat detection enabled
- ✅ Network ACLs restrictive

## Next Steps

1. Update frontend code to use Azure SDKs (replace Supabase)
2. Migrate Edge Functions to Azure Functions
3. Setup Azure AD for authentication
4. Configure custom domain in Static Web Apps
5. Setup Application Insights for monitoring
