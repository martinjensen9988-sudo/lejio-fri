# Azure SQL Multi-Tenant Migration Guide

## 🚀 Quick Start

### Option 1: Azure Portal Query Editor (Easiest)

1. **Open Azure Portal**
   - Go to https://portal.azure.com
   - Search for: `sql-vqiibdafjcmnc-dev`

2. **Navigate to Database**
   - Click on the SQL Server
   - Click on Database: `lejio-fri`

3. **Open Query Editor**
   - Left sidebar → "Query editor (preview)"
   - Enter SQL credentials (sqladmin + password)

4. **Run Migration Script**
   - Open file: `AZURE_SQL_MIGRATION_SCRIPT.sql` (in repo root)
   - Copy ALL content
   - Paste into Query Editor
   - Click **Run**

5. **Verify Success**
   - You should see output:
   ```
   fri_tenants table created
   tenant_id added to fri_lessors
   tenant_id added to fri_vehicles
   ✅ Multi-tenant migration complete!
   ```

---

### Option 2: Azure Data Studio (Advanced)

1. **Install Azure Data Studio**
   ```bash
   # macOS
   brew install azure-data-studio

   # Windows - Download from:
   # https://learn.microsoft.com/en-us/azure-data-studio/download-azure-data-studio
   ```

2. **Connect to Azure SQL**
   - File → New Connection
   - Server: `sql-vqiibdafjcmnc-dev.database.windows.net`
   - Database: `lejio-fri`
   - Authentication: SQL Login
   - Username: `sqladmin`
   - Password: [Your SQL password]

3. **Run Script**
   - File → Open → `AZURE_SQL_MIGRATION_SCRIPT.sql`
   - Ctrl+Shift+E (Execute)

---

### Option 3: SQLCMD (Command Line)

```bash
# Export credentials
export SQL_PASSWORD="your-password"
export SQL_SERVER="sql-vqiibdafjcmnc-dev.database.windows.net"
export SQL_DATABASE="lejio-fri"
export SQL_USERNAME="sqladmin"

# Install sqlcmd (if not already installed)
npm install -g mssql-cli

# Run migration
sqlcmd -S $SQL_SERVER -U $SQL_USERNAME -P $SQL_PASSWORD -d $SQL_DATABASE -i AZURE_SQL_MIGRATION_SCRIPT.sql
```

---

## 📊 What the Migration Does

1. **Creates `fri_tenants` table**
   - Stores tenant metadata (name, subdomain, plan, trial dates)
   - Unique indexes on slug, subdomain, domain

2. **Adds `tenant_id` column to all tables**
   - `fri_lessors` → tenant_id
   - `fri_vehicles` → tenant_id
   - `fri_bookings` → tenant_id
   - `fri_invoices` → tenant_id
   - `fri_payments` → tenant_id
   - `fri_support_tickets` → tenant_id

3. **Inserts Test Tenant**
   - **ID**: `tenant-martin-001`
   - **Name**: Martin Biludlejning
   - **Subdomain**: `martinbiludlejning`
   - **Domain**: `martinbiludlejning.lejio-fri.dk`
   - **Plan**: trial (30 days)
   - **Owner**: martin@lejio.dk

4. **Associates Existing Data**
   - All existing lessors, vehicles, bookings → assigned to Martin tenant
   - Ready for multi-tenant routing

---

## ✅ Verification

After running the script, you should see:

```
====== MIGRATION VERIFICATION ======

Table           Count
─────────────────────
Tenants         1
Lessors         1
Vehicles        3
Bookings        0

Tenant Information:
┌──────────────────────┬──────────────────────┬──────────────────┐
│ id                   │ name                 │ subdomain        │
├──────────────────────┼──────────────────────┼──────────────────┤
│ tenant-martin-001    │ Martin Biludlejning  │ martinbiludlejning│
└──────────────────────┴──────────────────────┴──────────────────┘
```

---

## 🔧 Troubleshooting

### Error: "Login failed for user 'sqladmin'"
- Check your SQL password
- Verify firewall allows your IP (Azure Portal → SQL Server → Firewall)

### Error: "Cannot find table 'fri_lessors'"
- Schema migration (001_initial_schema.sql) hasn't run
- Run that first: `supabase/migrations/azure-sql/001_initial_schema.sql`

### Error: "Column tenant_id already exists"
- Migration was already run
- That's OK - the script has `IF NOT EXISTS` guards

---

## 🚀 Next Steps After Migration

1. **Database is ready for multi-tenant** ✅
2. **Test tenant signup** → Go to `/fri/tenant/signup`
3. **Verify subdomain routing** → Once DNS is configured
4. **Enable RLS** → Add Row Level Security policies
5. **Deploy to production** → Update DNS to final domain

---

## 📁 Related Files

- Migration script: `AZURE_SQL_MIGRATION_SCRIPT.sql`
- Original migrations: `supabase/migrations/azure-sql/`
- Multi-tenant hook: `src/hooks/useTenant.tsx`
- Signup page: `src/pages/fri/tenant/SignupPage.tsx`

