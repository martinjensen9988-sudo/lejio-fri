-- Create test lessor for Page Builder demo
-- Email: test@lessor.dk
-- Idempotent: Safe to run multiple times

IF NOT EXISTS (SELECT 1 FROM fri_lessors WHERE id = 'lessor-test-001')
BEGIN
    INSERT INTO fri_lessors (id, email, company_name, cvr_number, primary_color, trial_start_date, trial_end_date, subscription_status, created_at, updated_at)
    VALUES 
    (
        'lessor-test-001',
        'test@lessor.dk',
        'Test Biludlejning',
        '99999999',
        '#3b82f6',
        GETUTCDATE(),
        DATEADD(day, 30, GETUTCDATE()),
        'trial',
        GETUTCDATE(),
        GETUTCDATE()
    )
    PRINT 'Lessor created'
END
ELSE
    PRINT 'Lessor already exists'

-- Insert team member (optional, for access)
IF NOT EXISTS (SELECT 1 FROM fri_lessor_team_members WHERE lessor_id = 'lessor-test-001' AND email = 'test@lessor.dk')
BEGIN
    INSERT INTO fri_lessor_team_members (id, lessor_id, email, name, role, status, invited_at, accepted_at, created_at)
    VALUES
    (
        NEWID(),
        'lessor-test-001',
        'test@lessor.dk',
        'Test User',
        'owner',
        'active',
        GETUTCDATE(),
        GETUTCDATE(),
        GETUTCDATE()
    )
    PRINT 'Team member created'
END

-- Insert test vehicles for the lessor (if not exist)
IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE lessor_id = 'lessor-test-001' AND license_plate = 'TSL-001')
BEGIN
    INSERT INTO fri_vehicles (id, lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, created_at)
    VALUES
    (NEWID(), 'lessor-test-001', 'Tesla', 'Model 3', 2023, 'TSL-001', 'VIN001', 599, 300, 'available', GETUTCDATE()),
    (NEWID(), 'lessor-test-001', 'Volkswagen', 'Golf', 2022, 'VWG-001', 'VIN002', 399, 300, 'available', GETUTCDATE()),
    (NEWID(), 'lessor-test-001', 'Mercedes', 'Sprinter', 2023, 'MER-001', 'VIN003', 899, 500, 'available', GETUTCDATE())
    PRINT 'Vehicles created'
END

PRINT 'Test lessor setup complete!'
PRINT 'Lessor ID: lessor-test-001'
PRINT 'Email: test@lessor.dk'
