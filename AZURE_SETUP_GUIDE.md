# Azure Deployment Guide for Lejio Fri

## Quick Start (5-10 minutes)

### Prerequisites
- Azure subscription
- Azure CLI (`az` command)
- Azure Developer CLI (`azd` command)
- Node.js 18+

### Installation

1. **Install Azure CLI** (if not already installed)
   ```powershell
   winget install Microsoft.AzureCLI
   ```

2. **Install Azure Developer CLI (azd)**
   ```powershell
   winget install Microsoft.Azd
   ```

---

## Deployment Steps

### Step 1: Login to Azure
```powershell
az login
azd auth login
```

### Step 2: Initialize the Azure project
```powershell
cd c:\Users\martin\lejio-b75cff1f
azd init
```

When prompted:
- **Environment name**: `dev` (or `prod`)
- **Subscription**: Choose your Azure subscription
- **Location**: `westeurope` (or your preferred region)

### Step 3: Provision Azure Resources (Create Infrastructure)
```powershell
azd provision --preview
```

This will show you what will be created. Review and confirm:
- ✅ Resource Group
- ✅ Azure SQL Database
- ✅ Azure Static Web App
- ✅ Azure Functions (app service plan)
- ✅ Key Vault
- ✅ Storage Account

If everything looks good:
```powershell
azd provision
```

**⏱️ Wait 5-10 minutes** for resources to be created.

### Step 4: Deploy Application
```powershell
azd deploy
```

This will:
- Build your React frontend
- Copy API functions
- Deploy to Static Web App
- Configure environment variables

**⏱️ Wait 2-3 minutes** for deployment to complete.

### Step 5: Initialize Database
After deployment, run the SQL migration:

```powershell
# Get the SQL Server connection details
$sqlServer = azd env get-values | grep SQL_SERVER_NAME
$dbName = "lejio-fri"

# Connect and run migration
sqlcmd -S "$sqlServer.database.windows.net" -U sqladmin -P <your-password> -d $dbName -i "infra/migrations/001-init-fri-schema.sql"
```

---

## What Gets Deployed

### **Azure SQL Database**
- Database name: `lejio-fri`
- Location: West Europe
- Tier: Standard (S0) - 50GB
- **Tables created** (via migration script):
  - `fri_lessors` - lessor accounts
  - `fri_vehicles` - fleet data
  - `fri_bookings` - bookings
  - `fri_invoices` - invoices
  - `fri_customers` - renters
  - `fri_pages` - website pages (page builder)
  - `fri_page_blocks` - page components
  - `fri_lessor_team_members` - team
  - ...and 5 more tables

### **Azure Static Web App**
- Hosting your React frontend
- Auto API routing: `/api/*` → Azure Functions
- GitHub integration for auto-deployment
- Default hostname: `https://<app-name>.azurestaticapps.net`

### **Azure Functions**
- Runtime: Node.js 20
- Endpoints for:
  - Authentication (`/api/AuthLogin`, `/api/AuthMe`)
  - Pages (`/api/GetPages`, `/api/CreatePage`)
  - Bookings (`/api/CreateBooking`)
  - Invoices (`/api/GenerateInvoice`)
  - etc.

### **Azure Key Vault**
- Stores secrets securely:
  - SQL connection string
  - Storage account key
  - JWT signing key
  - API keys

---

## Environment Variables

After deployment, check your environment variables:

```powershell
azd env list
```

You can set new variables:
```powershell
azd env set REACT_APP_API_BASE /api
azd env set DATABASE_URL "Server=tcp:..."
```

---

## Accessing Your App

1. **Frontend**: 
   ```
   https://<your-app-name>.azurestaticapps.net
   ```

2. **Azure Portal**:
   ```
   https://portal.azure.com
   ```

3. **Check deployment status**:
   ```powershell
   azd show
   ```

---

## Database Connection from Azure Functions

All Azure Functions automatically have access to:
- **Connection String**: Stored in Key Vault
- **Environment variable**: `SQLCONNECTIONSTRING`
- **Usage in code**:
   ```javascript
   const connectionString = process.env.SQLCONNECTIONSTRING;
   const client = new sql.ConnectionPool(connectionString);
   ```

---

## Troubleshooting

### Build Failed
```powershell
npm run build  # Test locally first
azd deploy --force  # Force redeploy
```

### Database Connection Error
```powershell
# Check connection string
azd env get-values | grep SQL

# Test SQL connection
sqlcmd -S "<server>.database.windows.net" -U sqladmin -P <password> -Q "SELECT 1"
```

### Static Web App Not Updating
```powershell
azd deploy --force
```

### Check Logs
```powershell
# View deployment logs
azd show
```

---

## Next Steps

1. ✅ **Test the deployment**: Visit your app URL
2. ✅ **Add test data**: Insert sample lessors/vehicles
3. ✅ **Configure DNS**: Point custom domain to Static Web App
4. ✅ **Setup GitHub Actions**: Auto-deploy on push
5. ✅ **Enable monitoring**: Application Insights

---

## Security Checklist

- ✅ SQL password stored in Key Vault (not in code)
- ✅ TLS 1.2+ enforced
- ✅ Firewall configured (allow Azure services)
- ✅ Purge protection enabled on Key Vault
- ✅ Static Web App behind Azure CDN
- ✅ CORS configured for API calls

---

## Cleanup (If needed)

Delete all resources:
```powershell
azd down
```

This removes everything except the Resource Group. To delete that:
```powershell
az group delete --name <resource-group-name>
```

---

## Support

- **Azure Docs**: https://learn.microsoft.com/en-us/azure/
- **azd Docs**: https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/
- **Static Web Apps**: https://learn.microsoft.com/en-us/azure/static-web-apps/

---

## Cost Estimation

| Service | Cost (Monthly) |
|---------|---|
| Static Web Apps | Free tier (1 app) |
| Azure SQL Database (Standard S0) | ~$15 |
| Azure Functions | Pay-per-execution (~$0.20 per 1M) |
| Storage Account | ~$0.50 |
| Key Vault | ~$0.60 |
| **Total** | **~$16/month** |

---

**Status**: ✅ Ready for deployment!

Run `azd provision` to get started.
