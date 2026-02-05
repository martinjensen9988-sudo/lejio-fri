-- ============================================================================
-- COMPLETE LEJIO FRI DATABASE SETUP
-- ============================================================================
-- This script creates the complete database schema with multi-tenant support
-- 
-- Run in: Azure Portal → SQL Database "lejio-fri" → Query Editor
-- 
-- Parts:
-- 1. Initial schema (fri_admins, fri_lessors, fri_vehicles, etc.)
-- 2. Multi-tenant schema (fri_tenants, tenant_id columns)
-- 3. Test data (Martin as first tenant)
-- ============================================================================

PRINT '====== PART 1: INITIAL SCHEMA ======'

-- ============================================================================
-- 1. ADMIN TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_admins')
BEGIN
    CREATE TABLE fri_admins (
        id NVARCHAR(36) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        admin_name NVARCHAR(255) NOT NULL,
        admin_email NVARCHAR(255) UNIQUE NOT NULL,
        is_super_admin BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX idx_fri_admins_email ON fri_admins(email);
    PRINT '✓ fri_admins created';
END
ELSE
    PRINT '⚠ fri_admins already exists';

-- ============================================================================
-- 2. LESSOR TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_lessors')
BEGIN
    CREATE TABLE fri_lessors (
        id NVARCHAR(36) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        company_name NVARCHAR(255) NOT NULL,
        cvr_number NVARCHAR(50) UNIQUE,
        custom_domain NVARCHAR(255) UNIQUE,
        primary_color NVARCHAR(7) DEFAULT '#3b82f6',
        logo_url NVARCHAR(MAX),
        trial_start_date DATETIME2 NOT NULL,
        trial_end_date DATETIME2 NOT NULL,
        subscription_status NVARCHAR(50) NOT NULL DEFAULT 'trial',
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX idx_fri_lessors_email ON fri_lessors(email);
    CREATE INDEX idx_fri_lessors_domain ON fri_lessors(custom_domain);
    CREATE INDEX idx_fri_lessors_status ON fri_lessors(subscription_status);
    PRINT '✓ fri_lessors created';
END
ELSE
    PRINT '⚠ fri_lessors already exists';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_lessor_team_members')
BEGIN
    CREATE TABLE fri_lessor_team_members (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'invited',
        invited_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        accepted_at DATETIME2,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
        CONSTRAINT uq_team_member UNIQUE (lessor_id, email)
    );

    CREATE INDEX idx_fri_team_lessor ON fri_lessor_team_members(lessor_id);
    CREATE INDEX idx_fri_team_email ON fri_lessor_team_members(email);
    PRINT '✓ fri_lessor_team_members created';
END
ELSE
    PRINT '⚠ fri_lessor_team_members already exists';

-- ============================================================================
-- 3. VEHICLE TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_vehicles')
BEGIN
    CREATE TABLE fri_vehicles (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        make NVARCHAR(100) NOT NULL,
        model NVARCHAR(100) NOT NULL,
        year INT NOT NULL,
        license_plate NVARCHAR(50) UNIQUE NOT NULL,
        vin NVARCHAR(50) UNIQUE,
        daily_rate DECIMAL(10, 2) NOT NULL,
        mileage_limit INT DEFAULT 300,
        availability_status NVARCHAR(50) NOT NULL DEFAULT 'available',
        last_mileage INT DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );

    CREATE INDEX idx_fri_vehicles_lessor ON fri_vehicles(lessor_id);
    CREATE INDEX idx_fri_vehicles_plate ON fri_vehicles(license_plate);
    CREATE INDEX idx_fri_vehicles_status ON fri_vehicles(availability_status);
    PRINT '✓ fri_vehicles created';
END
ELSE
    PRINT '⚠ fri_vehicles already exists';

-- ============================================================================
-- 4. BOOKING TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_bookings')
BEGIN
    CREATE TABLE fri_bookings (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        vehicle_id UNIQUEIDENTIFIER NOT NULL,
        customer_name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(20),
        start_date DATETIME2 NOT NULL,
        end_date DATETIME2 NOT NULL,
        rental_days INT NOT NULL,
        daily_rate DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'pending',
        notes NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
        FOREIGN KEY (vehicle_id) REFERENCES fri_vehicles(id)
    );

    CREATE INDEX idx_fri_bookings_lessor ON fri_bookings(lessor_id);
    CREATE INDEX idx_fri_bookings_vehicle ON fri_bookings(vehicle_id);
    CREATE INDEX idx_fri_bookings_status ON fri_bookings([status]);
    CREATE INDEX idx_fri_bookings_dates ON fri_bookings(start_date, end_date);
    PRINT '✓ fri_bookings created';
END
ELSE
    PRINT '⚠ fri_bookings already exists';

-- ============================================================================
-- 5. INVOICE TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_invoices')
BEGIN
    CREATE TABLE fri_invoices (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        booking_id UNIQUEIDENTIFIER,
        invoice_number NVARCHAR(50) UNIQUE NOT NULL,
        customer_name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'draft',
        payment_method NVARCHAR(50),
        payment_date DATETIME2,
        due_date DATETIME2,
        notes NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
        FOREIGN KEY (booking_id) REFERENCES fri_bookings(id)
    );

    CREATE INDEX idx_fri_invoices_lessor ON fri_invoices(lessor_id);
    CREATE INDEX idx_fri_invoices_status ON fri_invoices([status]);
    CREATE INDEX idx_fri_invoices_number ON fri_invoices(invoice_number);
    PRINT '✓ fri_invoices created';
END
ELSE
    PRINT '⚠ fri_invoices already exists';

-- ============================================================================
-- 6. PAYMENT TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_payments')
BEGIN
    CREATE TABLE fri_payments (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency NVARCHAR(3) DEFAULT 'DKK',
        [status] NVARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_method NVARCHAR(50) NOT NULL,
        subscription_type NVARCHAR(50) NOT NULL,
        reference NVARCHAR(255),
        notes NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        paid_at DATETIME2,
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );

    CREATE INDEX idx_fri_payments_lessor ON fri_payments(lessor_id);
    CREATE INDEX idx_fri_payments_status ON fri_payments([status]);
    PRINT '✓ fri_payments created';
END
ELSE
    PRINT '⚠ fri_payments already exists';

-- ============================================================================
-- 7. SUPPORT TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_support_tickets')
BEGIN
    CREATE TABLE fri_support_tickets (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        subject NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        category NVARCHAR(50) NOT NULL DEFAULT 'other',
        [status] NVARCHAR(50) NOT NULL DEFAULT 'open',
        priority NVARCHAR(50) NOT NULL DEFAULT 'medium',
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );

    CREATE INDEX idx_fri_tickets_lessor ON fri_support_tickets(lessor_id);
    CREATE INDEX idx_fri_tickets_status ON fri_support_tickets([status]);
    CREATE INDEX idx_fri_tickets_priority ON fri_support_tickets(priority);
    PRINT '✓ fri_support_tickets created';
END
ELSE
    PRINT '⚠ fri_support_tickets already exists';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_ticket_messages')
BEGIN
    CREATE TABLE fri_ticket_messages (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ticket_id UNIQUEIDENTIFIER NOT NULL,
        sender_id NVARCHAR(36) NOT NULL,
        sender_type NVARCHAR(50) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (ticket_id) REFERENCES fri_support_tickets(id)
    );

    CREATE INDEX idx_fri_messages_ticket ON fri_ticket_messages(ticket_id);
    PRINT '✓ fri_ticket_messages created';
END
ELSE
    PRINT '⚠ fri_ticket_messages already exists';

-- ============================================================================
-- 8. API KEYS TABLE
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_api_keys')
BEGIN
    CREATE TABLE fri_api_keys (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        [key] NVARCHAR(255) UNIQUE NOT NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'active',
        last_used_at DATETIME2,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        expires_at DATETIME2,
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );

    CREATE INDEX idx_fri_api_keys_lessor ON fri_api_keys(lessor_id);
    CREATE INDEX idx_fri_api_keys_key ON fri_api_keys([key]);
    PRINT '✓ fri_api_keys created';
END
ELSE
    PRINT '⚠ fri_api_keys already exists';

-- ============================================================================
-- 9. AUDIT LOG TABLE
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'fri_audit_logs')
BEGIN
    CREATE TABLE fri_audit_logs (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36),
        user_id NVARCHAR(36),
        action NVARCHAR(100) NOT NULL,
        entity_type NVARCHAR(100),
        entity_id NVARCHAR(MAX),
        changes NVARCHAR(MAX),
        ip_address NVARCHAR(50),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );

    CREATE INDEX idx_fri_audit_lessor ON fri_audit_logs(lessor_id);
    CREATE INDEX idx_fri_audit_date ON fri_audit_logs(created_at);
    PRINT '✓ fri_audit_logs created';
END
ELSE
    PRINT '⚠ fri_audit_logs already exists';

PRINT ''
PRINT '====== PART 2: MULTI-TENANT SCHEMA ======'

-- ============================================================================
-- CREATE TENANTS TABLE
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
    
    PRINT '✓ fri_tenants created';
END
ELSE
    PRINT '⚠ fri_tenants already exists';

-- ============================================================================
-- ADD TENANT_ID TO EXISTING TABLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_lessors' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_lessors ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_lessors_tenant ON fri_lessors(tenant_id);
    PRINT '✓ tenant_id added to fri_lessors';
END
ELSE
    PRINT '⚠ tenant_id already exists in fri_lessors';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_vehicles' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_vehicles ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_vehicles_tenant ON fri_vehicles(tenant_id);
    PRINT '✓ tenant_id added to fri_vehicles';
END
ELSE
    PRINT '⚠ tenant_id already exists in fri_vehicles';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_bookings' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_bookings ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_bookings_tenant ON fri_bookings(tenant_id);
    PRINT '✓ tenant_id added to fri_bookings';
END
ELSE
    PRINT '⚠ tenant_id already exists in fri_bookings';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_invoices' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_invoices ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_invoices_tenant ON fri_invoices(tenant_id);
    PRINT '✓ tenant_id added to fri_invoices';
END
ELSE
    PRINT '⚠ tenant_id already exists in fri_invoices';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_payments' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_payments ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_payments_tenant ON fri_payments(tenant_id);
    PRINT '✓ tenant_id added to fri_payments';
END
ELSE
    PRINT '⚠ tenant_id already exists in fri_payments';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fri_support_tickets' AND COLUMN_NAME = 'tenant_id')
BEGIN
    ALTER TABLE fri_support_tickets ADD tenant_id NVARCHAR(36) NULL;
    CREATE INDEX idx_fri_support_tickets_tenant ON fri_support_tickets(tenant_id);
    PRINT '✓ tenant_id added to fri_support_tickets';
END
ELSE
    PRINT '⚠ tenant_id already exists in fri_support_tickets';

PRINT ''
PRINT '====== PART 3: TEST DATA ======'

-- ============================================================================
-- INSERT MARTIN AS FIRST TENANT
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
    PRINT '✓ Martin tenant created';
END
ELSE
    PRINT '⚠ Martin tenant already exists';

-- Insert test lessor for Martin
IF NOT EXISTS (SELECT 1 FROM fri_lessors WHERE email = 'martin@lejio.dk')
BEGIN
    INSERT INTO fri_lessors (
        id,
        email,
        company_name,
        cvr_number,
        trial_start_date,
        trial_end_date,
        subscription_status,
        tenant_id,
        created_at,
        updated_at
    ) VALUES (
        'lessor-martin-001',
        'martin@lejio.dk',
        'Martin Biludlejning',
        '12345678',
        GETUTCDATE(),
        DATEADD(DAY, 30, GETUTCDATE()),
        'trial',
        @TenantId,
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT '✓ Martin lessor account created';
END
ELSE
    PRINT '⚠ Martin lessor account already exists';

-- Insert test vehicles for Martin
IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'AB12345')
BEGIN
    INSERT INTO fri_vehicles (id, lessor_id, make, model, year, license_plate, vin, daily_rate, tenant_id)
    VALUES (NEWID(), 'lessor-martin-001', 'BMW', '320i', 2023, 'AB12345', 'VIN2023BMW320I001', 500.00, @TenantId);
    PRINT '✓ BMW 320i created';
END

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'AB12346')
BEGIN
    INSERT INTO fri_vehicles (id, lessor_id, make, model, year, license_plate, vin, daily_rate, tenant_id)
    VALUES (NEWID(), 'lessor-martin-001', 'Audi', 'A4', 2023, 'AB12346', 'VIN2023AUDIA4001', 450.00, @TenantId);
    PRINT '✓ Audi A4 created';
END

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'AB12347')
BEGIN
    INSERT INTO fri_vehicles (id, lessor_id, make, model, year, license_plate, vin, daily_rate, tenant_id)
    VALUES (NEWID(), 'lessor-martin-001', 'Volvo', 'XC90', 2023, 'AB12347', 'VIN2023VOLVOXC90', 600.00, @TenantId);
    PRINT '✓ Volvo XC90 created';
END

PRINT ''
PRINT '====== VERIFICATION ======'

SELECT 'Tenants' AS [Table], COUNT(*) AS [Count] FROM fri_tenants
UNION ALL
SELECT 'Lessors', COUNT(*) FROM fri_lessors
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM fri_vehicles
UNION ALL
SELECT 'Bookings', COUNT(*) FROM fri_bookings
UNION ALL
SELECT 'Invoices', COUNT(*) FROM fri_invoices
UNION ALL
SELECT 'Payments', COUNT(*) FROM fri_payments
UNION ALL
SELECT 'Support Tickets', COUNT(*) FROM fri_support_tickets
UNION ALL
SELECT 'API Keys', COUNT(*) FROM fri_api_keys;

PRINT ''
PRINT '✅ DATABASE SETUP COMPLETE!'
PRINT ''
PRINT 'Tenant Information:'
SELECT id, name, slug, subdomain, [plan], [status], owner_email FROM fri_tenants;
