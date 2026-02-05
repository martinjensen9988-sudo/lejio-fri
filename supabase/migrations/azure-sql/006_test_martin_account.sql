-- Create test Martin account for Lejio Fri
-- Email: martin@lejio.dk
-- Idempotent: Safe to run multiple times

IF NOT EXISTS (SELECT 1 FROM fri_lessors WHERE id = 'lessor-martin-001')
BEGIN
    INSERT INTO fri_lessors (id, email, company_name, cvr_number, primary_color, trial_start_date, trial_end_date, subscription_status, created_at, updated_at)
    VALUES 
    (
        'lessor-martin-001',
        'martin@lejio.dk',
        'Martin Biludlejning',
        '88888888',
        '#3b82f6',
        GETUTCDATE(),
        DATEADD(day, 90, GETUTCDATE()),
        'trial',
        GETUTCDATE(),
        GETUTCDATE()
    )
    PRINT 'Martin lessor created'
END
ELSE
    PRINT 'Martin lessor already exists'

-- Insert team member
IF NOT EXISTS (SELECT 1 FROM fri_lessor_team_members WHERE lessor_id = 'lessor-martin-001' AND email = 'martin@lejio.dk')
BEGIN
    INSERT INTO fri_lessor_team_members (id, lessor_id, email, name, role, status, invited_at, accepted_at, created_at)
    VALUES
    (
        NEWID(),
        'lessor-martin-001',
        'martin@lejio.dk',
        'Martin Jensen',
        'owner',
        'active',
        GETUTCDATE(),
        GETUTCDATE(),
        GETUTCDATE()
    )
    PRINT 'Martin team member created'
END

-- Insert test vehicles for Martin
IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE lessor_id = 'lessor-martin-001' AND license_plate = 'MAR-001')
BEGIN
    INSERT INTO fri_vehicles (id, lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, created_at)
    VALUES
    (NEWID(), 'lessor-martin-001', 'BMW', '320i', 2024, 'MAR-001', 'VIN-MAR-001', 699, 350, 'available', GETUTCDATE()),
    (NEWID(), 'lessor-martin-001', 'Audi', 'A4', 2023, 'MAR-002', 'VIN-MAR-002', 649, 350, 'available', GETUTCDATE()),
    (NEWID(), 'lessor-martin-001', 'Volvo', 'XC90', 2024, 'MAR-003', 'VIN-MAR-003', 999, 500, 'available', GETUTCDATE())
    PRINT 'Martin vehicles created'
END

PRINT 'Martin account setup complete!'
PRINT 'Lessor ID: lessor-martin-001'
PRINT 'Email: martin@lejio.dk'
PRINT 'Note: Create auth user in Supabase with same email & password: TestPassword123!'
