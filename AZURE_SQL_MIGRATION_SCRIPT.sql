-- ============================================================================
-- LEJIO FRI MULTI-TENANT DATABASE MIGRATION
-- ============================================================================
-- Run this in Azure Portal -> SQL Database -> Query Editor
-- Or paste into Azure Data Studio
--
-- Steps:
-- 1. Go to: https://portal.azure.com
-- 2. Search for "sql-vqiibdafjcmnc-dev"
-- 3. Click on Database "lejio-fri"
-- 4. Click "Query editor (preview)" in left sidebar
-- 5. Copy-paste everything below
-- 6. Click "Run"
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE TENANTS TABLE
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_tenants')
BEGIN
    CREATE TABLE fri_tenants (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        slug NVARCHAR(100) UNIQUE NOT NULL,
        domain NVARCHAR(255) UNIQUE,
        custom_domain NVARCHAR(255) UNIQUE,
        subdomain NVARCHAR(100) UNIQUE,
        [plan] NVARCHAR(50) NOT NULL DEFAULT 'trial',
        [status] NVARCHAR(50) NOT NULL DEFAULT 'active',
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
    CREATE INDEX idx_fri_tenants_status ON fri_tenants([status]);
    
    PRINT 'fri_tenants table created';
END
ELSE
    PRINT 'fri_tenants table already exists';

-- ============================================================================
-- PART 2: ADD TENANT_ID TO EXISTING TABLES
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

-- Update fri_invoices
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_invoices' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_invoices ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_invoices_tenant ON fri_invoices(tenant_id);
    PRINT 'tenant_id added to fri_invoices';
END
ELSE
    PRINT 'tenant_id already exists in fri_invoices';

-- Update fri_payments
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_payments' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_payments ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_payments_tenant ON fri_payments(tenant_id);
    PRINT 'tenant_id added to fri_payments';
END
ELSE
    PRINT 'tenant_id already exists in fri_payments';

-- Update fri_support_tickets
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_support_tickets' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_support_tickets ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_support_tickets_tenant ON fri_support_tickets(tenant_id);
    PRINT 'tenant_id added to fri_support_tickets';
END
ELSE
    PRINT 'tenant_id already exists in fri_support_tickets';

-- ============================================================================
-- PART 3: INSERT MARTIN AS FIRST TENANT
-- ============================================================================

DECLARE @TenantId NVARCHAR(36) = 'tenant-martin-001';
DECLARE @TrialDays INT = 30;

IF NOT EXISTS (SELECT 1 FROM fri_tenants WHERE id = @TenantId)
BEGIN
    INSERT INTO fri_tenants (
        id,
        name,
        slug,
        subdomain,
        domain,
        [plan],
        [status],
        owner_email,
        cvr_number,
        trial_start_date,
        trial_end_date,
        created_at,
        updated_at
    ) VALUES (
        @TenantId,
        'Martin Biludlejning',
        'martinbiludlejning',
        'martinbiludlejning',
        'martinbiludlejning.lejio-fri.dk',
        'trial',
        'active',
        'martin@lejio.dk',
        '12345678',
        GETUTCDATE(),
        DATEADD(DAY, @TrialDays, GETUTCDATE()),
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT 'Martin tenant created: tenant-martin-001';
END
ELSE
    PRINT 'Martin tenant already exists';

-- ============================================================================
-- PART 4: UPDATE EXISTING DATA WITH TENANT_ID
-- ============================================================================

-- Update lessors
UPDATE fri_lessors 
SET tenant_id = 'tenant-martin-001'
WHERE email = 'martin@lejio.dk';

PRINT 'Updated lessors with tenant_id';

-- Update vehicles
UPDATE fri_vehicles
SET tenant_id = 'tenant-martin-001'
WHERE id IN (
    SELECT v.id 
    FROM fri_vehicles v
    INNER JOIN fri_lessors l ON v.lessor_id = l.id
    WHERE l.email = 'martin@lejio.dk'
);

PRINT 'Updated vehicles with tenant_id';

-- Update bookings
UPDATE fri_bookings
SET tenant_id = 'tenant-martin-001'
WHERE id IN (
    SELECT b.id
    FROM fri_bookings b
    INNER JOIN fri_vehicles v ON b.vehicle_id = v.id
    WHERE v.tenant_id = 'tenant-martin-001'
);

PRINT 'Updated bookings with tenant_id';

-- ============================================================================
-- PART 5: VERIFY MIGRATION
-- ============================================================================

PRINT '';
PRINT '====== MIGRATION VERIFICATION ======';

SELECT 'Tenants' AS [Table], COUNT(*) AS [Count] FROM fri_tenants
UNION ALL
SELECT 'Lessors', COUNT(*) FROM fri_lessors WHERE tenant_id = 'tenant-martin-001'
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM fri_vehicles WHERE tenant_id = 'tenant-martin-001'
UNION ALL
SELECT 'Bookings', COUNT(*) FROM fri_bookings WHERE tenant_id = 'tenant-martin-001';

PRINT '';
PRINT '✅ Multi-tenant migration complete!';
PRINT '';
PRINT 'Tenant Information:';
SELECT id, name, slug, subdomain, [plan], [status], owner_email, trial_end_date FROM fri_tenants WHERE id = 'tenant-martin-001';
