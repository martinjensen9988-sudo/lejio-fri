-- Lejio Fri Multi-Tenant Test Data
-- Insert first tenant (Martin Biludlejning) with proper tenant isolation

-- ============================================================================
-- 1. INSERT MARTIN AS FIRST TENANT
-- ============================================================================

DECLARE @TenantId NVARCHAR(36) = 'tenant-martin-001';
DECLARE @TrialDays INT = 30;

-- Check if tenant already exists
IF NOT EXISTS (SELECT 1 FROM fri_tenants WHERE id = @TenantId)
BEGIN
    INSERT INTO fri_tenants (
        id,
        name,
        slug,
        subdomain,
        domain,
        plan,
        status,
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
    PRINT 'Martin tenant created: ' + @TenantId;
END
ELSE
    PRINT 'Martin tenant already exists';

-- ============================================================================
-- 2. UPDATE EXISTING LESSORS WITH TENANT_ID
-- ============================================================================

-- Update lessor to point to Martin tenant
UPDATE fri_lessors 
SET tenant_id = 'tenant-martin-001'
WHERE email = 'martin@lejio.dk';

PRINT 'Updated lessors with tenant_id';

-- ============================================================================
-- 3. UPDATE EXISTING VEHICLES WITH TENANT_ID
-- ============================================================================

UPDATE fri_vehicles
SET tenant_id = 'tenant-martin-001'
WHERE id IN (
    SELECT v.id 
    FROM fri_vehicles v
    INNER JOIN fri_lessors l ON v.lessor_id = l.id
    WHERE l.email = 'martin@lejio.dk'
);

PRINT 'Updated vehicles with tenant_id';

-- ============================================================================
-- 4. UPDATE EXISTING BOOKINGS WITH TENANT_ID
-- ============================================================================

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
-- 5. VERIFY DATA
-- ============================================================================

SELECT 'Tenants' AS Table_Name, COUNT(*) AS Count FROM fri_tenants
UNION ALL
SELECT 'Lessors', COUNT(*) FROM fri_lessors WHERE tenant_id = 'tenant-martin-001'
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM fri_vehicles WHERE tenant_id = 'tenant-martin-001'
UNION ALL
SELECT 'Bookings', COUNT(*) FROM fri_bookings WHERE tenant_id = 'tenant-martin-001';

PRINT 'Multi-tenant test data complete!';
