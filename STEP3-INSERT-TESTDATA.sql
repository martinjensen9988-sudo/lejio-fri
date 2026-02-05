-- ============================================
-- STEP 3: INSERT TEST DATA
-- ============================================
-- Run this THIRD in Azure Portal Query Editor
-- Populates with sample lessors, vehicles, customers, bookings

PRINT '=== Inserting test data ==='

-- ============================================
-- 1. Insert test lessors
-- ============================================

DECLARE @lessor_id_1 UNIQUEIDENTIFIER = NEWID();
DECLARE @lessor_id_2 UNIQUEIDENTIFIER = NEWID();

INSERT INTO fri_lessors (id, company_name, contact_email, contact_phone, subscription_plan, subscription_status, primary_color, secondary_color, is_active)
VALUES 
  (@lessor_id_1, 'Test Biludlejning ApS', 'martin@testlejio.dk', '+4540123456', 'professional', 'active', '#0066cc', '#00cc99', 1),
  (@lessor_id_2, 'Premium Car Rentals', 'info@premiumrentals.dk', '+4540654321', 'business', 'active', '#ff6600', '#0099cc', 1);

PRINT '✅ Inserted 2 lessors';

-- ============================================
-- 2. Insert test team members
-- ============================================

INSERT INTO fri_lessor_team_members (lessor_id, full_name, email, phone, role, is_active, joined_at)
VALUES 
  (@lessor_id_1, 'Martin Jensen', 'martin@testlejio.dk', '+4540123456', 'owner', 1, GETUTCDATE()),
  (@lessor_id_1, 'Anne Andersen', 'anne@testlejio.dk', '+4540111111', 'manager', 1, GETUTCDATE()),
  (@lessor_id_2, 'Peter Petersen', 'peter@premiumrentals.dk', '+4540654321', 'owner', 1, GETUTCDATE());

PRINT '✅ Inserted 3 team members';

-- ============================================
-- 3. Insert test vehicles
-- ============================================

DECLARE @vehicle_id_1 UNIQUEIDENTIFIER = NEWID();
DECLARE @vehicle_id_2 UNIQUEIDENTIFIER = NEWID();
DECLARE @vehicle_id_3 UNIQUEIDENTIFIER = NEWID();

INSERT INTO fri_vehicles (id, lessor_id, make, model, year, license_plate, vin, daily_rate, status, fuel_type, transmission, seats, insurance_expiry, registration_expiry, is_active)
VALUES 
  (@vehicle_id_1, @lessor_id_1, 'Toyota', 'Corolla', 2023, 'AB12345', 'JTDJKRFV5D3123456', 299.00, 'available', 'Benzin', 'Automatisk', 5, '2026-12-31', '2026-12-31', 1),
  (@vehicle_id_2, @lessor_id_1, 'Volkswagen', 'Passat', 2023, 'CD56789', 'WVWZZZ3CZ9E123456', 399.00, 'available', 'Diesel', 'Automatisk', 5, '2026-12-31', '2026-12-31', 1),
  (@vehicle_id_3, @lessor_id_2, 'BMW', '3 Series', 2024, 'EF01234', 'WBADT43452G936421', 599.00, 'available', 'Diesel', 'Automatisk', 5, '2027-03-15', '2027-03-15', 1);

PRINT '✅ Inserted 3 vehicles';

-- ============================================
-- 4. Insert test customers
-- ============================================

DECLARE @customer_id_1 UNIQUEIDENTIFIER = NEWID();
DECLARE @customer_id_2 UNIQUEIDENTIFIER = NEWID();
DECLARE @customer_id_3 UNIQUEIDENTIFIER = NEWID();

INSERT INTO fri_customers (id, lessor_id, full_name, email, phone, driver_license_number, driver_license_expiry, address, city, postal_code, country, is_verified)
VALUES 
  (@customer_id_1, @lessor_id_1, 'John Doe', 'john@example.dk', '+4530000001', 'DK123456789', '2027-01-15', 'Hovedgaden 1', 'København', '2100', 'Danmark', 1),
  (@customer_id_2, @lessor_id_1, 'Jane Smith', 'jane@example.dk', '+4530000002', 'DK987654321', '2027-02-20', 'Kirkegården 42', 'Aarhus', '8000', 'Danmark', 1),
  (@customer_id_3, @lessor_id_2, 'Bob Wilson', 'bob@example.com', '+4530000003', 'DK555666777', '2027-05-10', 'Strandvej 15', 'Odense', '5000', 'Danmark', 1);

PRINT '✅ Inserted 3 customers';

-- ============================================
-- 5. Insert test bookings
-- ============================================

DECLARE @booking_id_1 UNIQUEIDENTIFIER = NEWID();
DECLARE @booking_id_2 UNIQUEIDENTIFIER = NEWID();
DECLARE @booking_id_3 UNIQUEIDENTIFIER = NEWID();

INSERT INTO fri_bookings (id, lessor_id, vehicle_id, customer_id, pickup_date, return_date, pickup_location, return_location, daily_rate, number_of_days, base_price, additional_fees, total_price, status)
VALUES 
  (@booking_id_1, @lessor_id_1, @vehicle_id_1, @customer_id_1, '2026-02-10 10:00:00', '2026-02-15 10:00:00', 'København CPH', 'København CPH', 299.00, 5, 1495.00, 0, 1495.00, 'confirmed'),
  (@booking_id_2, @lessor_id_1, @vehicle_id_2, @customer_id_2, '2026-02-20 14:00:00', '2026-02-25 14:00:00', 'Aarhus Center', 'Aarhus Center', 399.00, 5, 1995.00, 200.00, 2195.00, 'pending'),
  (@booking_id_3, @lessor_id_2, @vehicle_id_3, @customer_id_3, '2026-03-01 09:00:00', '2026-03-08 09:00:00', 'Odense Station', 'Odense Station', 599.00, 7, 4193.00, 300.00, 4493.00, 'confirmed');

PRINT '✅ Inserted 3 bookings';

-- ============================================
-- 6. Insert test invoices
-- ============================================

DECLARE @invoice_id_1 UNIQUEIDENTIFIER = NEWID();
DECLARE @invoice_id_2 UNIQUEIDENTIFIER = NEWID();

INSERT INTO fri_invoices (id, lessor_id, booking_id, customer_id, invoice_number, invoice_date, due_date, total_amount, tax_amount, discount_amount, net_amount, status, pdf_url)
VALUES 
  (@invoice_id_1, @lessor_id_1, @booking_id_1, @customer_id_1, 'INV-2026-001', '2026-02-10', '2026-02-24', 1495.00, 299.00, 0, 1196.00, 'paid', NULL),
  (@invoice_id_2, @lessor_id_1, @booking_id_2, @customer_id_2, 'INV-2026-002', '2026-02-20', '2026-03-06', 2195.00, 439.00, 100.00, 1656.00, 'sent', NULL);

PRINT '✅ Inserted 2 invoices';

-- ============================================
-- 7. Insert test payments
-- ============================================

INSERT INTO fri_payments (invoice_id, payment_date, amount, payment_method, transaction_id, status)
VALUES 
  (@invoice_id_1, '2026-02-12 15:30:00', 1495.00, 'MobilePay', 'TXN-001-ABC', 'completed');

PRINT '✅ Inserted 1 payment';

-- ============================================
-- 8. Insert test pages
-- ============================================

DECLARE @page_id_1 UNIQUEIDENTIFIER = NEWID();
DECLARE @page_id_2 UNIQUEIDENTIFIER = NEWID();

INSERT INTO fri_pages (id, lessor_id, title, slug, meta_description, status, layout_json, created_at, published_at)
VALUES 
  (@page_id_1, @lessor_id_1, 'Hjem', 'hjem', 'Velkommen til vores biludlejning', 'published', '{"blocks":[]}', GETUTCDATE(), GETUTCDATE()),
  (@page_id_2, @lessor_id_1, 'Om os', 'om-os', 'Læs mere om vores virksomhed', 'draft', '{"blocks":[]}', GETUTCDATE(), NULL);

PRINT '✅ Inserted 2 pages';

-- ============================================
-- 9. Insert test page blocks
-- ============================================

INSERT INTO fri_page_blocks (page_id, lessor_id, block_type, position, config_json)
VALUES 
  (@page_id_1, @lessor_id_1, 'hero', 1, '{"title":"Velkommen","subtitle":"Find din næste eventyr"}'),
  (@page_id_1, @lessor_id_1, 'vehicles', 2, '{"showPrice":true,"limit":6}'),
  (@page_id_1, @lessor_id_1, 'cta', 3, '{"text":"Book nu","link":"/booking"}');

PRINT '✅ Inserted 3 page blocks';

-- ============================================
-- VERIFICATION
-- ============================================

PRINT '=== Verification ==='

SELECT 'Lessors' as Entity, COUNT(*) as Count FROM fri_lessors
UNION ALL
SELECT 'Team Members', COUNT(*) FROM fri_lessor_team_members
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM fri_vehicles
UNION ALL
SELECT 'Customers', COUNT(*) FROM fri_customers
UNION ALL
SELECT 'Bookings', COUNT(*) FROM fri_bookings
UNION ALL
SELECT 'Invoices', COUNT(*) FROM fri_invoices
UNION ALL
SELECT 'Payments', COUNT(*) FROM fri_payments
UNION ALL
SELECT 'Pages', COUNT(*) FROM fri_pages
UNION ALL
SELECT 'Page Blocks', COUNT(*) FROM fri_page_blocks;

PRINT '=== Sample Data Summary ==='
PRINT '✅ Test data inserted successfully!'
PRINT 'Lessor 1: Test Biludlejning ApS - martin@testlejio.dk'
PRINT 'Lessor 2: Premium Car Rentals - info@premiumrentals.dk'
PRINT ''
PRINT 'You can now test the frontend with real database data.'
