# Azure Functions Configuration Guide

## Overview
This guide shows how to configure Azure Functions for Lejio Fri with proper database connectivity.

## Database Credentials

**Server:** `lejio-fri-db.database.windows.net`  
**Database:** `lejio_fri`  
**Username:** `martin_lejio_user`  
**Password:** `TestPassword123!`

### Connection String
```
Server=tcp:lejio-fri-db.database.windows.net,1433;Initial Catalog=lejio_fri;Persist Security Info=False;User ID=martin_lejio_user;Password=TestPassword123!;Encrypt=True;Connection Timeout=30;
```

## Step 1: Create Database User (Server Admin Only)

The SQL user `martin_lejio_user` must be created on the SQL Server first. This requires **server admin credentials**.

### Prerequisites
- Access to SQL Server as server admin (or contact Azure SQL admin)
- SSMS or sqlcmd installed

### Run this in SQL Server (Master Database)
```sql
USE master;

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'martin_lejio_user')
BEGIN
    CREATE LOGIN martin_lejio_user WITH PASSWORD = 'TestPassword123!';
    PRINT 'Login martin_lejio_user created';
END
ELSE
    PRINT 'Login martin_lejio_user already exists';
```

### Then in lejio_fri Database
```sql
USE lejio_fri;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'martin_lejio_user' AND type = 'U')
BEGIN
    CREATE USER martin_lejio_user FOR LOGIN martin_lejio_user;
    ALTER ROLE db_datareader ADD MEMBER martin_lejio_user;
    ALTER ROLE db_datawriter ADD MEMBER martin_lejio_user;
    PRINT 'Database user martin_lejio_user created with read/write permissions';
END
ELSE
    PRINT 'Database user martin_lejio_user already exists';
```

### Verify Connection
```powershell
$env:SQLCMDPASSWORD='TestPassword123!'
sqlcmd -S tcp:lejio-fri-db.database.windows.net,1433 -U martin_lejio_user -d "lejio_fri" -C -Q "SELECT 1 AS test"
```

## Step 2: Configure Environment Variables

### In Azure Static Web Apps Settings
Add these environment variables in the Azure Portal → Static Web Apps → Configuration:

```
DB_SERVER=lejio-fri-db.database.windows.net
DB_NAME=lejio_fri
DB_USER=martin_lejio_user
DB_PASSWORD=TestPassword123!
```

Or in `staticwebapp.config.json`:
```json
{
  "env": {
    "DB_SERVER": "lejio-fri-db.database.windows.net",
    "DB_NAME": "lejio_fri",
    "DB_USER": "martin_lejio_user",
    "DB_PASSWORD": "TestPassword123!"
  }
}
```

### Locally in `.env.azure`
```
# Database User Credentials
DB_SERVER=lejio-fri-db.database.windows.net
DB_NAME=lejio_fri
DB_USER=martin_lejio_user
DB_PASSWORD=TestPassword123!
```

## Step 3: Update API Functions

All Azure Functions in `api/**/*.js` already use this config pattern:

```javascript
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    // Your SQL query here
    const result = await pool.request()
      .query('SELECT * FROM fri_vehicles');
    
    await pool.close();
    context.res = { body: result.recordset };
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
  }
};
```

## Step 4: Deploy to Azure

### Using GitHub Actions
The repository includes GitHub Actions workflows that automatically:
1. Build the project (`npm run build`)
2. Deploy to Azure Static Web Apps
3. Set environment variables from repository secrets

### Manual Deployment
```powershell
# Build the project
npm run build

# Deploy using Azure CLI
az staticwebapp publish --name <app-name> --source-language typescript
```

## Step 5: Verify Deployment

Test a Function endpoint:
```powershell
# Test GetVehicles endpoint
$uri = "https://your-static-app.azurestaticapps.net/api/GetVehicles"
$response = Invoke-WebRequest -Uri $uri -Method GET
$response.Content | ConvertFrom-Json
```

## Troubleshooting

### Login Failed Error
**Problem:** "Login failed for user 'martin_lejio_user'"

**Solution:** 
- Verify SQL user exists: Run the SQL script in Step 1
- Check firewall: Allow Azure services in SQL Server firewall
- Verify credentials: Ensure password is `TestPassword123!` (exactly)

### Connection Timeout
**Problem:** "A network-related or instance-specific error occurred"

**Solution:**
- Check server name: `lejio-fri-db.database.windows.net` (not `lejio-fri-db` alone)
- Check firewall rules in Azure SQL → Firewall settings
- Allow "Azure services and resources" access

### Cannot Find Table
**Problem:** "Invalid object name 'fri_vehicles'"

**Solution:**
- Verify database is `lejio_fri` (not `lejio-fri`)
- Run migrations: `npm run migrate:azure`
- Check table schema: `SELECT * FROM INFORMATION_SCHEMA.TABLES`

## API Endpoints

All endpoints are in `api/` folder and follow this pattern:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/GetVehicles` | GET | List lessor's vehicles |
| `/api/CreateVehicle` | POST | Add new vehicle |
| `/api/UpdateVehicle` | PUT | Update vehicle |
| `/api/DeleteVehicle` | DELETE | Remove vehicle |
| `/api/GetBookings` | GET | List bookings |
| `/api/GetInvoices` | GET | List invoices |
| `/api/AuthLogin` | POST | User login |
| `/api/AuthSignup` | POST | User registration |
| `/api/GetPages` | GET | Page builder pages |
| `/api/CreatePage` | POST | Create page |
| `/api/UpdatePage` | PUT | Update page |

## Security Notes

⚠️ **Important:** These credentials are for development. For production:

1. **Use Azure Key Vault** to store passwords
2. **Use Managed Identities** instead of SQL credentials
3. **Rotate passwords** regularly
4. **Enable firewall rules** to restrict access
5. **Use HTTPS only** for all connections
6. **Audit logging** on all database access

### Using Azure Key Vault (Recommended)
```javascript
const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");

const credential = new DefaultAzureCredential();
const client = new SecretClient("https://kv-xxxxx.vault.azure.net/", credential);

const password = await client.getSecret("db-password");
```

## Contact

For issues or questions about database setup:
- Contact Azure SQL Admin
- Check Azure Portal → Static Web Apps → Function Logs
- Review Azure SQL query logs
