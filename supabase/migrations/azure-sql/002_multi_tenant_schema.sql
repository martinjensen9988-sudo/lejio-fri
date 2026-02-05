-- Lejio Fri Multi-Tenant Database Migration
-- Adds tenant isolation and Row Level Security (RLS)
-- Run this after 001_initial_schema.sql

-- ============================================================================
-- 1. CREATE TENANTS TABLE
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_tenants')
BEGIN
    CREATE TABLE fri_tenants (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        slug NVARCHAR(100) UNIQUE NOT NULL,  -- martinjensen, aarhusrent, etc.
        domain NVARCHAR(255) UNIQUE,          -- martinbiludlejning.lejio-fri.dk
        custom_domain NVARCHAR(255) UNIQUE,   -- rent.martinbiludlejning.dk (later)
        subdomain NVARCHAR(100) UNIQUE,       -- auto-generated from name
        plan NVARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, starter, pro, enterprise
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, cancelled
        owner_email NVARCHAR(255) NOT NULL,
        cvr_number NVARCHAR(50),
        primary_color NVARCHAR(7) DEFAULT '#3b82f6',
        logo_url NVARCHAR(MAX),
        trial_start_date DATETIME2 NOT NULL,
        trial_end_date DATETIME2 NOT NULL,
        subscription_start_date DATETIME2,
        stripe_customer_id NVARCHAR(255),
        stripe_subscription_id NVARCHAR(255),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX idx_fri_tenants_slug ON fri_tenants(slug);
    CREATE INDEX idx_fri_tenants_subdomain ON fri_tenants(subdomain);
    CREATE INDEX idx_fri_tenants_domain ON fri_tenants(domain);
    CREATE INDEX idx_fri_tenants_status ON fri_tenants(status);
    
    PRINT 'fri_tenants table created';
END
ELSE
    PRINT 'fri_tenants table already exists';

-- ============================================================================
-- 2. ADD TENANT_ID TO EXISTING TABLES
-- ============================================================================

-- Update fri_lessors
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_lessors' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_lessors ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_lessors_tenant ON fri_lessors(tenant_id);
    PRINT 'tenant_id added to fri_lessors';
END
ELSE
    PRINT 'tenant_id already exists in fri_lessors';

-- Update fri_vehicles
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_vehicles' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_vehicles ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_vehicles_tenant ON fri_vehicles(tenant_id);
    PRINT 'tenant_id added to fri_vehicles';
END
ELSE
    PRINT 'tenant_id already exists in fri_vehicles';

-- Update fri_bookings
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_bookings' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_bookings ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_bookings_tenant ON fri_bookings(tenant_id);
    PRINT 'tenant_id added to fri_bookings';
END
ELSE
    PRINT 'tenant_id already exists in fri_bookings';

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) - TENANT ISOLATION
-- ============================================================================

-- Create context function to get current tenant
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[fn_get_tenant_id]') AND type in (N'FN', N'IF', N'TF', N'FS', N'FT'))
BEGIN
    CREATE FUNCTION dbo.fn_get_tenant_id() RETURNS NVARCHAR(36)
    AS BEGIN
        -- Get tenant_id from SESSION_CONTEXT (set by application)
        RETURN CAST(SESSION_CONTEXT(N'tenant_id') AS NVARCHAR(36))
    END
    PRINT 'fn_get_tenant_id function created';
END

-- Note: Full RLS implementation would require:
-- 1. Security policies on each table
-- 2. Session context setup in application code
-- For now, we rely on application-level filtering and the tenant_id column

PRINT 'Multi-tenant database migration complete!';
PRINT 'Next: Create tenants in fri_tenants table before using the system';
