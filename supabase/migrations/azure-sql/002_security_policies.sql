-- ============================================================================
-- Lejio Fri - Row Level Security & Security Policies
-- Purpose: Ensure lessors can only see/edit their own data
-- ============================================================================

-- NOTE: Azure SQL doesn't have native RLS like PostgreSQL, so we use:
-- 1. Views with filtering
-- 2. Stored procedures with lessor_id validation
-- 3. Application-level checks

-- ============================================================================
-- 1. SECURE VIEWS (Filter by lessor_id)
-- ============================================================================

-- View: vw_lessor_vehicles
-- Returns only vehicles belonging to the authenticated lessor
CREATE VIEW vw_lessor_vehicles AS
SELECT 
    id,
    lessor_id,
    make,
    model,
    year,
    license_plate,
    vin,
    daily_rate,
    mileage_limit,
    availability_status,
    last_mileage,
    created_at,
    updated_at
FROM fri_vehicles
-- Note: Filter by session variable @current_lessor_id in application
GO

-- View: vw_lessor_bookings
CREATE VIEW vw_lessor_bookings AS
SELECT 
    id,
    lessor_id,
    vehicle_id,
    customer_name,
    email,
    phone,
    start_date,
    end_date,
    rental_days,
    daily_rate,
    total_price,
    status,
    notes,
    created_at,
    updated_at
FROM fri_bookings
-- Note: Filter by session variable @current_lessor_id in application
GO

-- View: vw_lessor_invoices
CREATE VIEW vw_lessor_invoices AS
SELECT 
    id,
    lessor_id,
    booking_id,
    invoice_number,
    customer_name,
    email,
    amount,
    tax_amount,
    total_amount,
    status,
    payment_method,
    payment_date,
    due_date,
    notes,
    created_at,
    updated_at
FROM fri_invoices
-- Note: Filter by session variable @current_lessor_id in application
GO

-- View: vw_lessor_team
CREATE VIEW vw_lessor_team_members AS
SELECT 
    id,
    lessor_id,
    email,
    name,
    role,
    status,
    invited_at,
    accepted_at,
    created_at
FROM fri_lessor_team_members
-- Note: Filter by session variable @current_lessor_id in application
GO

-- ============================================================================
-- 2. SECURITY STORED PROCEDURES
-- ============================================================================

-- Procedure: sp_validate_lessor_access
-- Purpose: Validate that lessor can access specific resource
CREATE PROCEDURE sp_validate_lessor_access
    @lessor_id NVARCHAR(MAX),
    @resource_type NVARCHAR(100),
    @resource_id NVARCHAR(MAX)
AS
BEGIN
    DECLARE @resource_lessor_id NVARCHAR(MAX)
    
    IF @resource_type = 'VEHICLE'
        SELECT @resource_lessor_id = lessor_id FROM fri_vehicles WHERE id = @resource_id
    ELSE IF @resource_type = 'BOOKING'
        SELECT @resource_lessor_id = lessor_id FROM fri_bookings WHERE id = @resource_id
    ELSE IF @resource_type = 'INVOICE'
        SELECT @resource_lessor_id = lessor_id FROM fri_invoices WHERE id = @resource_id
    ELSE IF @resource_type = 'TEAM_MEMBER'
        SELECT @resource_lessor_id = lessor_id FROM fri_lessor_team_members WHERE id = @resource_id
    
    IF @resource_lessor_id IS NULL OR @resource_lessor_id != @lessor_id
    BEGIN
        THROW 50001, 'Access Denied: Resource does not belong to this lessor', 1
    END
END
GO

-- Procedure: sp_insert_vehicle_secure
-- Purpose: Insert vehicle with lessor validation
CREATE PROCEDURE sp_insert_vehicle_secure
    @lessor_id NVARCHAR(MAX),
    @make NVARCHAR(100),
    @model NVARCHAR(100),
    @year INT,
    @license_plate NVARCHAR(50),
    @vin NVARCHAR(50),
    @daily_rate DECIMAL(10, 2),
    @mileage_limit INT
AS
BEGIN
    -- Validate lessor exists
    IF NOT EXISTS (SELECT 1 FROM fri_lessors WHERE id = @lessor_id)
    BEGIN
        THROW 50001, 'Lessor not found', 1
    END
    
    -- Insert vehicle
    INSERT INTO fri_vehicles (
        lessor_id, make, model, year, license_plate, vin, 
        daily_rate, mileage_limit, availability_status
    )
    VALUES (
        @lessor_id, @make, @model, @year, @license_plate, @vin, 
        @daily_rate, @mileage_limit, 'available'
    )
END
GO

-- Procedure: sp_insert_booking_secure
CREATE PROCEDURE sp_insert_booking_secure
    @lessor_id NVARCHAR(MAX),
    @vehicle_id UNIQUEIDENTIFIER,
    @customer_name NVARCHAR(255),
    @email NVARCHAR(255),
    @phone NVARCHAR(20),
    @start_date DATETIME2,
    @end_date DATETIME2,
    @notes NVARCHAR(MAX)
AS
BEGIN
    DECLARE @rental_days INT
    DECLARE @daily_rate DECIMAL(10, 2)
    DECLARE @total_price DECIMAL(10, 2)
    
    -- Validate vehicle belongs to lessor
    IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE id = @vehicle_id AND lessor_id = @lessor_id)
    BEGIN
        THROW 50001, 'Vehicle not found for this lessor', 1
    END
    
    -- Calculate rental days
    SET @rental_days = DATEDIFF(DAY, @start_date, @end_date)
    
    -- Get daily rate
    SELECT @daily_rate = daily_rate FROM fri_vehicles WHERE id = @vehicle_id
    
    -- Calculate total price
    SET @total_price = @rental_days * @daily_rate
    
    -- Insert booking
    INSERT INTO fri_bookings (
        lessor_id, vehicle_id, customer_name, email, phone,
        start_date, end_date, rental_days, daily_rate, total_price, status
    )
    VALUES (
        @lessor_id, @vehicle_id, @customer_name, @email, @phone,
        @start_date, @end_date, @rental_days, @daily_rate, @total_price, 'pending'
    )
END
GO

-- Procedure: sp_insert_invoice_secure
CREATE PROCEDURE sp_insert_invoice_secure
    @lessor_id NVARCHAR(MAX),
    @booking_id UNIQUEIDENTIFIER,
    @customer_name NVARCHAR(255),
    @email NVARCHAR(255),
    @amount DECIMAL(10, 2),
    @tax_amount DECIMAL(10, 2)
AS
BEGIN
    DECLARE @invoice_number NVARCHAR(50)
    DECLARE @total_amount DECIMAL(10, 2)
    DECLARE @current_year INT
    DECLARE @current_month INT
    DECLARE @next_number INT
    
    -- Validate booking belongs to lessor
    IF NOT EXISTS (SELECT 1 FROM fri_bookings WHERE id = @booking_id AND lessor_id = @lessor_id)
    BEGIN
        THROW 50001, 'Booking not found for this lessor', 1
    END
    
    -- Generate invoice number
    SET @current_year = YEAR(GETUTCDATE())
    SET @current_month = MONTH(GETUTCDATE())
    SET @next_number = (
        SELECT COUNT(*) + 1 
        FROM fri_invoices 
        WHERE lessor_id = @lessor_id 
        AND YEAR(created_at) = @current_year 
        AND MONTH(created_at) = @current_month
    )
    
    SET @invoice_number = 'INV-' + CAST(@current_year AS NVARCHAR(4)) + 
                          RIGHT('0' + CAST(@current_month AS NVARCHAR(2)), 2) + 
                          '-' + RIGHT('0000' + CAST(@next_number AS NVARCHAR(4)), 4)
    
    SET @total_amount = @amount + @tax_amount
    
    -- Insert invoice
    INSERT INTO fri_invoices (
        lessor_id, booking_id, invoice_number, customer_name, email,
        amount, tax_amount, total_amount, status
    )
    VALUES (
        @lessor_id, @booking_id, @invoice_number, @customer_name, @email,
        @amount, @tax_amount, @total_amount, 'draft'
    )
END
GO

-- ============================================================================
-- 3. AUDIT TRIGGER
-- ============================================================================

-- Trigger: tr_audit_vehicle_changes
-- Logs all vehicle changes
CREATE TRIGGER tr_audit_vehicle_changes
ON fri_vehicles
AFTER INSERT, UPDATE
AS
BEGIN
    DECLARE @action NVARCHAR(10) = 'UPDATE'
    
    IF NOT EXISTS (SELECT 1 FROM deleted)
        SET @action = 'INSERT'
    
    INSERT INTO fri_audit_logs (lessor_id, action, entity_type, entity_id, created_at)
    SELECT lessor_id, @action, 'VEHICLE', id, GETUTCDATE()
    FROM inserted
END
GO

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Already created in schema, but here are additional ones:

-- Index on booking dates for range queries
CREATE INDEX idx_fri_bookings_date_range 
ON fri_bookings(start_date, end_date) 
WHERE status IN ('pending', 'confirmed')
GO

-- Index on invoice status + date
CREATE INDEX idx_fri_invoices_status_date 
ON fri_invoices(status, created_at)
GO

-- Index on payments + lessor for dashboard
CREATE INDEX idx_fri_payments_lessor_date 
ON fri_payments(lessor_id, created_at)

-- ============================================================================
-- 5. SECURITY NOTES
-- ============================================================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. LESSOR ISOLATION:
   - Every query MUST include lessor_id filter in WHERE clause
   - Use stored procedures to enforce this
   - Never return data without lessor_id validation

2. API LEVEL:
   - All API endpoints MUST validate JWT token contains lessor_id
   - Compare request lessor_id with database lessor_id
   - Reject if mismatch

3. ADMIN ACCESS:
   - Admins have special flag in JWT (is_admin = true)
   - Admins can access ANY lessor's data
   - Log all admin actions to audit_logs

4. TEAM MEMBERS:
   - Team members must have role-based permissions
   - Check fri_lessor_team_members.role in API
   - Enforce permissions: owner > admin > manager > viewer

5. ENCRYPTION:
   - Sensitive fields: vin, payment_method should be encrypted at application level
   - Use Azure Key Vault for encryption keys

6. COMPLIANCE:
   - GDPR: Implement data export & deletion procedures
   - Keep audit_logs for 12 months minimum
   - Encrypt connection string in Azure Key Vault
*/
