-- Lejio Fri Azure SQL Database Schema
-- Database: lejio_fri_db
-- Purpose: Multi-tenant lessor platform backend

-- ============================================================================
-- 1. ADMIN TABLES
-- ============================================================================

-- Table: fri_admins
-- Purpose: System administrators with access to admin panel
IF OBJECT_ID('dbo.fri_admins', 'U') IS NULL
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
END

IF COL_LENGTH('dbo.fri_admins', 'email') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_admins_email' AND object_id = OBJECT_ID('dbo.fri_admins'))
BEGIN
    CREATE INDEX idx_fri_admins_email ON fri_admins(email);
END

-- ============================================================================
-- 2. LESSOR TABLES
-- ============================================================================

-- Table: fri_lessors
-- Purpose: Individual lessor accounts (companies renting out vehicles)
IF OBJECT_ID('dbo.fri_lessors', 'U') IS NULL
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
        subscription_status NVARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, suspended, cancelled
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END

IF COL_LENGTH('dbo.fri_lessors', 'email') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_lessors_email' AND object_id = OBJECT_ID('dbo.fri_lessors'))
BEGIN
    CREATE INDEX idx_fri_lessors_email ON fri_lessors(email);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_lessors_domain' AND object_id = OBJECT_ID('dbo.fri_lessors'))
BEGIN
    CREATE INDEX idx_fri_lessors_domain ON fri_lessors(custom_domain);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_lessors_status' AND object_id = OBJECT_ID('dbo.fri_lessors'))
BEGIN
    CREATE INDEX idx_fri_lessors_status ON fri_lessors(subscription_status);
END

-- Table: fri_lessor_team_members
-- Purpose: Team members with access to lessor account
IF OBJECT_ID('dbo.fri_lessor_team_members', 'U') IS NULL
BEGIN
    CREATE TABLE fri_lessor_team_members (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL, -- owner, admin, manager, viewer
        status NVARCHAR(50) NOT NULL DEFAULT 'invited', -- invited, active, inactive
        invited_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        accepted_at DATETIME2,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
        CONSTRAINT uq_team_member UNIQUE (lessor_id, email)
    );
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_team_lessor' AND object_id = OBJECT_ID('dbo.fri_lessor_team_members'))
BEGIN
    CREATE INDEX idx_fri_team_lessor ON fri_lessor_team_members(lessor_id);
END

IF COL_LENGTH('dbo.fri_lessor_team_members', 'email') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_team_email' AND object_id = OBJECT_ID('dbo.fri_lessor_team_members'))
BEGIN
    CREATE INDEX idx_fri_team_email ON fri_lessor_team_members(email);
END

-- ============================================================================
-- 3. VEHICLE TABLES
-- ============================================================================

-- Table: fri_vehicles
-- Purpose: Vehicles available for rent
IF OBJECT_ID('dbo.fri_vehicles', 'U') IS NULL
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
        availability_status NVARCHAR(50) NOT NULL DEFAULT 'available', -- available, rented, maintenance
        last_mileage INT DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_vehicles_lessor' AND object_id = OBJECT_ID('dbo.fri_vehicles'))
BEGIN
    CREATE INDEX idx_fri_vehicles_lessor ON fri_vehicles(lessor_id);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_vehicles_plate' AND object_id = OBJECT_ID('dbo.fri_vehicles'))
BEGIN
    CREATE INDEX idx_fri_vehicles_plate ON fri_vehicles(license_plate);
END

IF COL_LENGTH('dbo.fri_vehicles', 'availability_status') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_vehicles_status' AND object_id = OBJECT_ID('dbo.fri_vehicles'))
BEGIN
    CREATE INDEX idx_fri_vehicles_status ON fri_vehicles(availability_status);
END

-- ============================================================================
-- 4. BOOKING TABLES
-- ============================================================================

-- Table: fri_bookings
-- Purpose: Rental bookings
IF OBJECT_ID('dbo.fri_bookings', 'U') IS NULL
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
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
        notes NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
        FOREIGN KEY (vehicle_id) REFERENCES fri_vehicles(id)
    );
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_bookings_lessor' AND object_id = OBJECT_ID('dbo.fri_bookings'))
BEGIN
    CREATE INDEX idx_fri_bookings_lessor ON fri_bookings(lessor_id);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_bookings_vehicle' AND object_id = OBJECT_ID('dbo.fri_bookings'))
BEGIN
    CREATE INDEX idx_fri_bookings_vehicle ON fri_bookings(vehicle_id);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_bookings_status' AND object_id = OBJECT_ID('dbo.fri_bookings'))
BEGIN
    CREATE INDEX idx_fri_bookings_status ON fri_bookings(status);
END

IF COL_LENGTH('dbo.fri_bookings', 'start_date') IS NOT NULL
AND COL_LENGTH('dbo.fri_bookings', 'end_date') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_bookings_dates' AND object_id = OBJECT_ID('dbo.fri_bookings'))
BEGIN
    CREATE INDEX idx_fri_bookings_dates ON fri_bookings(start_date, end_date);
END

-- ============================================================================
-- 5. INVOICE TABLES
-- ============================================================================

-- Table: fri_invoices
-- Purpose: Invoices for bookings
IF OBJECT_ID('dbo.fri_invoices', 'U') IS NULL
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
        status NVARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
        payment_method NVARCHAR(50),
        payment_date DATETIME2,
        due_date DATETIME2,
        notes NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
        FOREIGN KEY (booking_id) REFERENCES fri_bookings(id)
IF COL_LENGTH('dbo.fri_invoices', 'lessor_id') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_invoices_lessor' AND object_id = OBJECT_ID('dbo.fri_invoices'))
BEGIN
    CREATE INDEX idx_fri_invoices_lessor ON fri_invoices(lessor_id);
END

IF COL_LENGTH('dbo.fri_invoices', 'status') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_invoices_status' AND object_id = OBJECT_ID('dbo.fri_invoices'))
BEGIN
    CREATE INDEX idx_fri_invoices_status ON fri_invoices(status);
END

IF COL_LENGTH('dbo.fri_invoices', 'invoice_number') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_invoices_number' AND object_id = OBJECT_ID('dbo.fri_invoices'))
BEGIN
    CREATE INDEX idx_fri_invoices_number ON fri_invoices(invoice_number);
END
CREATE INDEX idx_fri_invoices_status ON fri_invoices(status);
CREATE INDEX idx_fri_invoices_number ON fri_invoices(invoice_number);

-- ============================================================================
-- 6. PAYMENT TABLES
-- ============================================================================
IF OBJECT_ID('dbo.fri_payments', 'U') IS NULL
BEGIN
    CREATE TABLE fri_payments (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency NVARCHAR(3) DEFAULT 'DKK',
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
        payment_method NVARCHAR(50) NOT NULL, -- card, bank_transfer, paypal
        subscription_type NVARCHAR(50) NOT NULL, -- trial, monthly, yearly
        reference NVARCHAR(255),
        notes NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        paid_at DATETIME2,
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );
END
    paid_at DATETIME2,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX idx_fri_payments_lessor ON fri_payments(lessor_id);
CREATE INDEX idx_fri_payments_status ON fri_payments(status);

IF OBJECT_ID('dbo.fri_support_tickets', 'U') IS NULL
BEGIN
    CREATE TABLE fri_support_tickets (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        subject NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        category NVARCHAR(50) NOT NULL DEFAULT 'other', -- technical, billing, account, other
        status NVARCHAR(50) NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
        priority NVARCHAR(50) NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );

    CREATE INDEX idx_fri_tickets_lessor ON fri_support_tickets(lessor_id);
    CREATE INDEX idx_fri_tickets_status ON fri_support_tickets(status);
    CREATE INDEX idx_fri_tickets_priority ON fri_support_tickets(priority);
END
IF OBJECT_ID('dbo.fri_ticket_messages', 'U') IS NULL
BEGIN
    CREATE TABLE fri_ticket_messages (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ticket_id UNIQUEIDENTIFIER NOT NULL,
        sender_id NVARCHAR(36) NOT NULL,
        sender_type NVARCHAR(50) NOT NULL, -- lessor, admin
        message NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (ticket_id) REFERENCES fri_support_tickets(id)
    );
END

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_fri_messages_ticket'
      AND object_id = OBJECT_ID('dbo.fri_ticket_messages')
IF OBJECT_ID('dbo.fri_api_keys', 'U') IS NULL
BEGIN
    CREATE TABLE fri_api_keys (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        [key] NVARCHAR(255) UNIQUE NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive
        last_used_at DATETIME2,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        expires_at DATETIME2,
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );
END

CREATE INDEX idx_fri_messages_ticket ON fri_ticket_messages(ticket_id);

-- ============================================================================
-- 8. API KEYS TABLE
-- ============================================================================

IF OBJECT_ID('dbo.fri_audit_logs', 'U') IS NULL
BEGIN
    CREATE TABLE fri_audit_logs (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36),
        user_id NVARCHAR(36),
        action NVARCHAR(100) NOT NULL,
        entity_type NVARCHAR(100),
        entity_id NVARCHAR(MAX),
        changes NVARCHAR(MAX), -- JSON of changes
        ip_address NVARCHAR(50),
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
    );

    CREATE INDEX idx_fri_audit_lessor ON fri_audit_logs(lessor_id);
    CREATE INDEX idx_fri_audit_date ON fri_audit_logs(created_at);
END
CREATE INDEX idx_fri_api_keys_key ON fri_api_keys([key]);

-- ============================================================================
-- 9. AUDIT LOG TABLE
-- ============================================================================

-- Table: fri_audit_logs
-- Purpose: Track all important changes
CREATE TABLE fri_audit_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    lessor_id NVARCHAR(36),
    user_id NVARCHAR(36),
    action NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(100),
    entity_id NVARCHAR(MAX),
    changes NVARCHAR(MAX), -- JSON of changes
    ip_address NVARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX idx_fri_audit_lessor ON fri_audit_logs(lessor_id);
CREATE INDEX idx_fri_audit_date ON fri_audit_logs(created_at);

-- ============================================================================
-- DONE
-- ============================================================================
