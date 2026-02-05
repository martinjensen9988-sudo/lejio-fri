# 🚀 Quick Reference - Database Setup

## Current Status: ✅ READY FOR DATABASE USER CREATION

### Configuration Summary
```
Server:   lejio-fri-db.database.windows.net:1433
Database: lejio_fri
User:     martin_lejio_user
Password: TestPassword123!
```

### Files Ready
```
✅ dist/                    → Production build (11 MB)
✅ .env.azure               → Environment variables configured
✅ api/**/*.js              → Azure Functions ready
✅ src/                     → Frontend code compiled
```

---

## Step 1: Create SQL User (Azure SQL Server Admin)

### In SQL Server Management Studio (SSMS)

**Connection:** `lejio-fri-db.database.windows.net` (as server admin)

**Master Database:**
```sql
USE master;
CREATE LOGIN martin_lejio_user WITH PASSWORD = 'TestPassword123!';
```

**lejio_fri Database:**
```sql
USE lejio_fri;
CREATE USER martin_lejio_user FOR LOGIN martin_lejio_user;
ALTER ROLE db_datareader ADD MEMBER martin_lejio_user;
ALTER ROLE db_datawriter ADD MEMBER martin_lejio_user;
```

---

## Step 2: Test Connection

```powershell
$env:SQLCMDPASSWORD='TestPassword123!'
sqlcmd -S tcp:lejio-fri-db.database.windows.net,1433 `
  -U martin_lejio_user -d "lejio_fri" -C `
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='dbo' ORDER BY TABLE_NAME;"
```

**Expected:** Should list 14 tables (fri_admins, fri_bookings, fri_vehicles, etc.)

---

## Step 3: Run Migrations (Optional)

If database schema isn't initialized:

```powershell
npm run migrate:azure
```

---

## Step 4: Start Development

### Development Mode
```powershell
npm run dev
```
Access at: `http://localhost:8080`

### Production Build
```powershell
npm run build
npm run preview
```

---

## Step 5: Deploy to Azure

### Automatic (via GitHub)
Push to main branch → GitHub Actions automatically:
1. Runs `npm run build`
2. Deploys to Azure Static Web Apps
3. Sets environment variables

### Manual Deployment
```powershell
# Using Azure CLI
az staticwebapp publish --name zealous-stone-04c86dd03 --source-language typescript --app-location "dist" --api-location "api"
```

---

## API Endpoints (After Deployment)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/GetVehicles` | GET | List vehicles |
| `/api/CreateVehicle` | POST | Add vehicle |
| `/api/GetBookings` | GET | List bookings |
| `/api/GetInvoices` | GET | List invoices |
| `/api/AuthLogin` | POST | User login |
| `/api/AuthSignup` | POST | Register user |

---

## Environment Variables Setup

### Azure Portal Configuration
Go to: **Static Web Apps** → **Configuration** → Add:

```
DB_SERVER        = lejio-fri-db.database.windows.net
DB_NAME          = lejio_fri
DB_USER          = martin_lejio_user
DB_PASSWORD      = TestPassword123!
VITE_API_URL     = https://zealous-stone-04c86dd03.azurestaticapps.net/api
VITE_ENVIRONMENT = production
```

---

## Troubleshooting

### ❌ "Login failed for user 'martin_lejio_user'"
→ SQL user hasn't been created yet (Step 1 not complete)

### ❌ "Server is not found or not accessible"
→ Use full hostname: `lejio-fri-db.database.windows.net`
→ Check firewall allows your IP

### ❌ "Cannot find table 'fri_vehicles'"
→ Run migrations: `npm run migrate:azure`

### ❌ API returns 500 error
→ Check Azure Functions logs in Portal
→ Verify environment variables are set
→ Ensure database user has permissions

---

## Important Notes

⚠️ **Keep credentials secure:**
- Never commit `.env.azure` to public repositories
- Use Azure Key Vault in production
- Rotate passwords regularly
- Use Managed Identities when possible

📚 **Full Documentation:**
- `AZURE_FUNCTIONS_GUIDE.md` - Complete setup guide
- `DATABASE_SETUP_COMPLETE.md` - Detailed instructions
- `README.md` - General project info

---

## What's Running

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- TanStack React Query for data fetching

### Backend
- Azure Functions (Node.js)
- Azure SQL Database
- Azure Static Web Apps (hosting)
- Azure Blob Storage (files)

### Database
- 14 tables for Fri system
- Row-Level Security (RLS) ready
- Multi-tenant architecture
- Audit logging enabled

---

**Ready to proceed? Run:** `npm run dev`
