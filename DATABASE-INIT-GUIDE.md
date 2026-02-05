# Lejio Fri Database Initialization Guide

## 🚀 Quick Start

Follow these two simple steps to initialize your Lejio Fri Azure SQL database.

### Step 1: Drop Existing Tables (ONLY IF UPGRADING)

**If you're starting fresh, skip this step.**

If you have existing `fri_*` tables, you need to drop them first.

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for and open your SQL Database: **lejio-fri**
3. Click **Query editor (preview)**
4. Enter login credentials:
   - **Login**: sqladmin
   - **Password**: [Your admin password from initial setup]
5. **Copy and paste ALL the contents of `STEP1-DROP-TABLES.sql`** into the query editor
6. Click **Run** and wait for completion

### Step 2: Create All 13 Tables (REQUIRED)

1. Still in Query Editor (or re-open it)
2. **Copy and paste ALL the contents of `STEP2-CREATE-TABLES.sql`** into the query editor
3. Click **Run** and wait for completion
4. Scroll down and verify the result shows:
   - **TotalTablesCreated: 13** ✅
   - List of all tables starting with `fri_`

## 📋 What Gets Created?

The database schema includes 13 tables organized into 7 categories:

### 1. **Lessor Management** (2 tables)
- `fri_lessors` - Lessor accounts
- `fri_lessor_team_members` - Team members with roles

### 2. **Fleet Management** (2 tables)
- `fri_vehicles` - Vehicle inventory
- `fri_vehicle_maintenance` - Maintenance logs

### 3. **Booking System** (2 tables)
- `fri_customers` - Customer/renter profiles
- `fri_bookings` - Rental reservations

### 4. **Invoicing & Payments** (2 tables)
- `fri_invoices` - Generated invoices
- `fri_payments` - Payment records

### 5. **Page Builder** (3 tables)
- `fri_pages` - Website pages
- `fri_page_blocks` - Page components
- `fri_custom_domains` - Custom domain mapping

### 6. **Audit Logging** (1 table)
- `fri_audit_logs` - Activity logs

### 7. **API Integration** (1 table)
- `fri_api_keys` - API keys and secrets

## ✅ Verification

After running STEP2, you should see output similar to:

```
TotalTablesCreated
13

TABLE_NAME
fri_api_keys
fri_audit_logs
fri_bookings
fri_custom_domains
fri_customers
fri_invoices
fri_lessor_team_members
fri_lessors
fri_page_blocks
fri_pages
fri_payments
fri_vehicles
fri_vehicle_maintenance
```

## 🔄 Troubleshooting

### Connection Issues
- **Firewall blocked**: Firewall rule already created for your IP (37.97.0.187)
- **Login failed**: Double-check your sqladmin password from initial deployment
- **Syntax errors**: Make sure you're using Azure SQL (not MySQL or PostgreSQL)

### Script Execution Issues
- Copy the **entire script** including comments
- Run each STEP separately (wait for one to complete before starting next)
- If a table already exists, the `DROP TABLE IF EXISTS` will handle it gracefully

### Empty Results
If you see 0 tables created:
- Check for error messages in the Query Editor output
- Verify the scripts ran without errors
- Look for constraint violations (e.g., foreign key issues)

## 📝 Files Included

- **STEP1-DROP-TABLES.sql** - Drop all fri_* tables (run if upgrading)
- **STEP2-CREATE-TABLES.sql** - Create all 13 tables with indexes
- **infra/migrations/002-init-fri-schema-clean.sql** - Clean migration version
- **scripts/initialize-database.ps1** - PowerShell automation (future use)

## 🔐 Security Notes

- All tables use UNIQUEIDENTIFIER (GUID) for IDs
- Foreign key constraints enforce data integrity
- Soft deletes with `is_active` flag for sensitive data
- Timestamp columns for audit trails (`created_at`, `updated_at`)
- Check constraints on status/role enumerations

## 🚀 Next Steps

After database initialization:

1. ✅ Database schema is ready
2. ⏳ Create Azure Functions to connect frontend to database
3. ⏳ Implement row-level security (RLS) policies
4. ⏳ Create stored procedures for complex queries
5. ⏳ Set up automated backups
6. ⏳ Add monitoring and alerts

## 📞 Support

If you encounter issues:
1. Check the error message in Query Editor output
2. Verify Azure firewall rules
3. Ensure you're using the correct credentials
4. Check database size limits (current: Standard tier)

---

**Last Updated**: February 3, 2026
**Lejio Fri Database Schema**: v1.0
