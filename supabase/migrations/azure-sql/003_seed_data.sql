-- ============================================================================
-- Lejio Fri - Seed Data for Development & Testing
-- ============================================================================

-- ============================================================================
-- 1. TEST ADMIN USER
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_admins WHERE id = 'admin-001')
INSERT INTO fri_admins (id, email, admin_name, admin_email, is_super_admin)
VALUES (
    'admin-001',
    'admin@lejio-fri.dk',
    'Admin User',
    'admin@lejio-fri.dk',
    1
)

-- ============================================================================
-- 2. TEST LESSORS
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_lessors WHERE id = 'lessor-001')
INSERT INTO fri_lessors (
    id, email, company_name, cvr_number, custom_domain, primary_color, 
    trial_start_date, trial_end_date, subscription_status
)
VALUES
(
    'lessor-001',
    'john@carrentals.dk',
    'John Car Rentals',
    '12345678',
    'john-car-rentals.lejio-fri.dk',
    '#3b82f6',
    GETUTCDATE(),
    DATEADD(DAY, 14, GETUTCDATE()),
    'trial'
)

IF NOT EXISTS (SELECT 1 FROM fri_lessors WHERE id = 'lessor-002')
INSERT INTO fri_lessors (
    id, email, company_name, cvr_number, custom_domain, primary_color, 
    trial_start_date, trial_end_date, subscription_status
)
VALUES
(
    'lessor-002',
    'maria@mobilityplus.dk',
    'Mobility Plus',
    '87654321',
    'mobility-plus.lejio-fri.dk',
    '#10b981',
    GETUTCDATE(),
    DATEADD(DAY, 365, GETUTCDATE()),
    'active'
)

IF NOT EXISTS (SELECT 1 FROM fri_lessors WHERE id = 'lessor-003')
INSERT INTO fri_lessors (
    id, email, company_name, cvr_number, custom_domain, primary_color, 
    trial_start_date, trial_end_date, subscription_status
)
VALUES
(
    'lessor-003',
    'erik@elrentals.dk',
    'EL Rentals',
    '55555555',
    'el-rentals.lejio-fri.dk',
    '#f59e0b',
    GETUTCDATE(),
    DATEADD(DAY, 7, GETUTCDATE()),
    'trial'
)

-- ============================================================================
-- 3. TEST TEAM MEMBERS
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_lessor_team_members WHERE lessor_id = 'lessor-001' AND email = 'john@carrentals.dk')
INSERT INTO fri_lessor_team_members (
    lessor_id, email, name, role, status, invited_at, accepted_at
)
VALUES
(
    'lessor-001',
    'john@carrentals.dk',
    'John Doe',
    'owner',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
)

IF NOT EXISTS (SELECT 1 FROM fri_lessor_team_members WHERE lessor_id = 'lessor-001' AND email = 'sarah@carrentals.dk')
INSERT INTO fri_lessor_team_members (lessor_id, email, name, role, status, invited_at, accepted_at)
VALUES ('lessor-001', 'sarah@carrentals.dk', 'Sarah Johnson', 'admin', 'active', DATEADD(DAY, -10, GETUTCDATE()), DATEADD(DAY, -9, GETUTCDATE()))

IF NOT EXISTS (SELECT 1 FROM fri_lessor_team_members WHERE lessor_id = 'lessor-001' AND email = 'mike@carrentals.dk')
INSERT INTO fri_lessor_team_members (lessor_id, email, name, role, status, invited_at, accepted_at)
VALUES ('lessor-001', 'mike@carrentals.dk', 'Mike Brown', 'manager', 'active', DATEADD(DAY, -5, GETUTCDATE()), DATEADD(DAY, -4, GETUTCDATE()))

IF NOT EXISTS (SELECT 1 FROM fri_lessor_team_members WHERE lessor_id = 'lessor-002' AND email = 'maria@mobilityplus.dk')
INSERT INTO fri_lessor_team_members (lessor_id, email, name, role, status, invited_at, accepted_at)
VALUES ('lessor-002', 'maria@mobilityplus.dk', 'Maria Garcia', 'owner', 'active', GETUTCDATE(), GETUTCDATE())

IF NOT EXISTS (SELECT 1 FROM fri_lessor_team_members WHERE lessor_id = 'lessor-002' AND email = 'carlos@mobilityplus.dk')
INSERT INTO fri_lessor_team_members (lessor_id, email, name, role, status, invited_at, accepted_at)
VALUES ('lessor-002', 'carlos@mobilityplus.dk', 'Carlos Lopez', 'viewer', 'invited', DATEADD(DAY, -2, GETUTCDATE()), NULL)

-- ============================================================================
-- 4. TEST VEHICLES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'AB12345')
INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, last_mileage)
VALUES ('lessor-001', 'Toyota', 'Corolla', 2022, 'AB12345', 'JTDBRHE20K3123456', 299.00, 300, 'available', 45000)

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'CD67890')
INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, last_mileage)
VALUES ('lessor-001', 'Honda', 'Civic', 2021, 'CD67890', '2HGCV12345H123456', 349.00, 300, 'rented', 52000)

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'EF13579')
INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, last_mileage)
VALUES ('lessor-001', 'Volkswagen', 'Golf', 2023, 'EF13579', 'WVWZZZ3CZ9E123456', 399.00, 250, 'available', 12000)

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'GH24680')
INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, last_mileage)
VALUES ('lessor-002', 'Tesla', 'Model 3', 2023, 'GH24680', '5YJ3E1EA8KF123456', 499.00, 400, 'available', 15000)

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'IJ35791')
INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, last_mileage)
VALUES ('lessor-002', 'Nissan', 'Leaf', 2022, 'IJ35791', 'JN1AZ4EH8C1234567', 399.00, 350, 'available', 28000)

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'KL46802')
INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, last_mileage)
VALUES ('lessor-003', 'BMW', 'i3', 2023, 'KL46802', 'WBXEG4C03K5F12345', 449.00, 300, 'maintenance', 5000)

IF NOT EXISTS (SELECT 1 FROM fri_vehicles WHERE license_plate = 'MN57913')
INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, mileage_limit, availability_status, last_mileage)
VALUES ('lessor-003', 'Volkswagen', 'ID.4', 2023, 'MN57913', 'WVWZZZ3ZZH123456', 459.00, 400, 'available', 8000)

-- ============================================================================
-- 5. TEST BOOKINGS
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_bookings WHERE customer_name = 'Anders Nielsen' AND lessor_id = 'lessor-001')
INSERT INTO fri_bookings (
    lessor_id, vehicle_id, customer_name, email, phone,
    start_date, end_date, rental_days, daily_rate, total_price, status, notes
)
VALUES
(
    'lessor-001',
    (SELECT id FROM fri_vehicles WHERE license_plate = 'CD67890'),
    'Anders Nielsen',
    'anders@email.dk',
    '40123456',
    DATEADD(DAY, 0, CAST(GETUTCDATE() AS DATE)),
    DATEADD(DAY, 3, CAST(GETUTCDATE() AS DATE)),
    3,
    349.00,
    1047.00,
    'confirmed',
    'Business trip to Aarhus'
)

IF NOT EXISTS (SELECT 1 FROM fri_bookings WHERE customer_name = 'Birgitte Larsen' AND lessor_id = 'lessor-001')
INSERT INTO fri_bookings (
    lessor_id, vehicle_id, customer_name, email, phone,
    start_date, end_date, rental_days, daily_rate, total_price, status, notes
)
VALUES
(
    'lessor-001',
    (SELECT id FROM fri_vehicles WHERE license_plate = 'AB12345'),
    'Birgitte Larsen',
    'birgitte@email.dk',
    '40987654',
    DATEADD(DAY, 5, CAST(GETUTCDATE() AS DATE)),
    DATEADD(DAY, 10, CAST(GETUTCDATE() AS DATE)),
    5,
    299.00,
    1495.00,
    'pending',
    'Family vacation'
)

IF NOT EXISTS (SELECT 1 FROM fri_bookings WHERE customer_name = 'Christian Jensen' AND lessor_id = 'lessor-002')
INSERT INTO fri_bookings (
    lessor_id, vehicle_id, customer_name, email, phone,
    start_date, end_date, rental_days, daily_rate, total_price, status, notes
)
VALUES
(
    'lessor-002',
    (SELECT id FROM fri_vehicles WHERE license_plate = 'GH24680' AND lessor_id = 'lessor-002'),
    'Christian Jensen',
    'christian@email.dk',
    '40555555',
    DATEADD(DAY, -3, CAST(GETUTCDATE() AS DATE)),
    DATEADD(DAY, 0, CAST(GETUTCDATE() AS DATE)),
    3,
    499.00,
    1497.00,
    'completed',
    'Airport transfer'
)

IF NOT EXISTS (SELECT 1 FROM fri_bookings WHERE customer_name = 'Dorthe Andersen' AND lessor_id = 'lessor-002')
INSERT INTO fri_bookings (
    lessor_id, vehicle_id, customer_name, email, phone,
    start_date, end_date, rental_days, daily_rate, total_price, status, notes
)
VALUES
(
    'lessor-002',
    (SELECT id FROM fri_vehicles WHERE license_plate = 'IJ35791' AND lessor_id = 'lessor-002'),
    'Dorthe Andersen',
    'dorthe@email.dk',
    '40777777',
    DATEADD(DAY, 1, CAST(GETUTCDATE() AS DATE)),
    DATEADD(DAY, 8, CAST(GETUTCDATE() AS DATE)),
    7,
    399.00,
    2793.00,
    'pending',
    'Week rental'
)

-- ============================================================================
-- 6. TEST INVOICES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_invoices WHERE invoice_number = 'INV-202601-0001')
INSERT INTO fri_invoices (
    lessor_id, booking_id, invoice_number, customer_name, email,
    amount, tax_amount, total_amount, status, payment_method, due_date
)
VALUES
(
    'lessor-001',
    (SELECT TOP 1 id FROM fri_bookings WHERE customer_name = 'Anders Nielsen'),
    'INV-202601-0001',
    'Anders Nielsen',
    'anders@email.dk',
    1047.00,
    209.40,
    1256.40,
    'paid',
    'card',
    DATEADD(DAY, 14, GETUTCDATE())
)

IF NOT EXISTS (SELECT 1 FROM fri_invoices WHERE invoice_number = 'INV-202601-0002')
INSERT INTO fri_invoices (
    lessor_id, booking_id, invoice_number, customer_name, email,
    amount, tax_amount, total_amount, status, payment_method, due_date
)
VALUES
(
    'lessor-001',
    (SELECT TOP 1 id FROM fri_bookings WHERE customer_name = 'Birgitte Larsen'),
    'INV-202601-0002',
    'Birgitte Larsen',
    'birgitte@email.dk',
    1495.00,
    299.00,
    1794.00,
    'draft',
    NULL,
    DATEADD(DAY, 14, GETUTCDATE())
)

IF NOT EXISTS (SELECT 1 FROM fri_invoices WHERE invoice_number = 'INV-202602-0001')
INSERT INTO fri_invoices (
    lessor_id, booking_id, invoice_number, customer_name, email,
    amount, tax_amount, total_amount, status, payment_method, due_date
)
VALUES
(
    'lessor-002',
    (SELECT TOP 1 id FROM fri_bookings WHERE lessor_id = 'lessor-002' AND customer_name = 'Christian Jensen'),
    'INV-202602-0001',
    'Christian Jensen',
    'christian@email.dk',
    1497.00,
    299.40,
    1796.40,
    'paid',
    'bank_transfer',
    DATEADD(DAY, 14, GETUTCDATE())
)

IF NOT EXISTS (SELECT 1 FROM fri_invoices WHERE invoice_number = 'INV-202601-0003')
INSERT INTO fri_invoices (
    lessor_id, booking_id, invoice_number, customer_name, email,
    amount, tax_amount, total_amount, status, payment_method, due_date
)
VALUES
(
    'lessor-001',
    (SELECT TOP 1 id FROM fri_bookings WHERE lessor_id = 'lessor-001' AND customer_name = 'Birgitte Larsen' AND status = 'pending'),
    'INV-202601-0003',
    'Test Customer',
    'test@email.dk',
    500.00,
    100.00,
    600.00,
    'overdue',
    'card',
    DATEADD(DAY, -5, GETUTCDATE())
)

-- ============================================================================
-- 7. TEST PAYMENTS
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_payments WHERE reference = 'TXN-001')
INSERT INTO fri_payments (
    lessor_id, amount, currency, status, payment_method,
    subscription_type, reference, paid_at
)
VALUES
(
    'lessor-001',
    299.00,
    'DKK',
    'completed',
    'card',
    'trial',
    'TXN-001',
    GETUTCDATE()
)

IF NOT EXISTS (SELECT 1 FROM fri_payments WHERE reference = 'TXN-002')
INSERT INTO fri_payments (lessor_id, amount, currency, status, payment_method, subscription_type, reference, paid_at)
VALUES ('lessor-002', 599.00, 'DKK', 'completed', 'bank_transfer', 'monthly', 'TXN-002', DATEADD(DAY, -2, GETUTCDATE()))

IF NOT EXISTS (SELECT 1 FROM fri_payments WHERE reference = 'TXN-003')
INSERT INTO fri_payments (lessor_id, amount, currency, status, payment_method, subscription_type, reference, paid_at)
VALUES ('lessor-002', 599.00, 'DKK', 'pending', 'card', 'monthly', 'TXN-003', NULL)

IF NOT EXISTS (SELECT 1 FROM fri_payments WHERE reference = 'TXN-004')
INSERT INTO fri_payments (lessor_id, amount, currency, status, payment_method, subscription_type, reference, paid_at)
VALUES ('lessor-003', 299.00, 'DKK', 'failed', 'card', 'trial', 'TXN-004', NULL)

-- ============================================================================
-- 8. TEST SUPPORT TICKETS
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_support_tickets WHERE lessor_id = 'lessor-001' AND subject = 'Booking nicht appearing in calendar')
INSERT INTO fri_support_tickets (
    lessor_id, subject, description, category, status, priority
)
VALUES
(
    'lessor-001',
    'Booking nicht appearing in calendar',
    'En af mine bookinger fra i går vises ikke i kalenderen. Kan du hjælpe?',
    'technical',
    'open',
    'high'
)

IF NOT EXISTS (SELECT 1 FROM fri_support_tickets WHERE lessor_id = 'lessor-001' AND subject = 'Invoice template customization')
INSERT INTO fri_support_tickets (lessor_id, subject, description, category, status, priority)
VALUES ('lessor-001', 'Invoice template customization', 'Jeg gerne vil ændre logoet på mine fakturaer til mit eget logo', 'account', 'in_progress', 'medium')

IF NOT EXISTS (SELECT 1 FROM fri_support_tickets WHERE lessor_id = 'lessor-002' AND subject = 'Payment failed - what next?')
INSERT INTO fri_support_tickets (lessor_id, subject, description, category, status, priority)
VALUES ('lessor-002', 'Payment failed - what next?', 'Min subscription betaling blev afvist. Hvad skal jeg gøre?', 'billing', 'resolved', 'urgent')

IF NOT EXISTS (SELECT 1 FROM fri_support_tickets WHERE lessor_id = 'lessor-003' AND subject = 'How to integrate with my CRM')
INSERT INTO fri_support_tickets (lessor_id, subject, description, category, status, priority)
VALUES ('lessor-003', 'How to integrate with my CRM', 'Jeg har spørgsmål om API documentation', 'technical', 'open', 'low')

-- ============================================================================
-- 9. TEST TICKET MESSAGES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_ticket_messages WHERE sender_id = 'lessor-001' AND message LIKE 'Jeg har allerede%')
INSERT INTO fri_ticket_messages (
    ticket_id, sender_id, sender_type, message
)
VALUES
(
    (SELECT TOP 1 id FROM fri_support_tickets WHERE lessor_id = 'lessor-001' AND subject = 'Booking nicht appearing in calendar'),
    'lessor-001',
    'lessor',
    'Jeg har allerede kontrolleret om jeg havde gemt bookingen korrekt.'
)

IF NOT EXISTS (SELECT 1 FROM fri_ticket_messages WHERE sender_id = 'admin-001' AND message LIKE 'Tak for din henvendelse%')
INSERT INTO fri_ticket_messages (ticket_id, sender_id, sender_type, message)
VALUES
(
    (SELECT TOP 1 id FROM fri_support_tickets WHERE lessor_id = 'lessor-001' AND subject = 'Booking nicht appearing in calendar'),
    'admin-001',
    'admin',
    'Tak for din henvendelse. Vi har undersøgt dette og fundet problemet. Det burde nu være løst. Kan du venligst tjekke igen?'
)

IF NOT EXISTS (SELECT 1 FROM fri_ticket_messages WHERE sender_id = 'lessor-001' AND message LIKE 'Tillykke%')
INSERT INTO fri_ticket_messages (ticket_id, sender_id, sender_type, message)
VALUES
(
    (SELECT TOP 1 id FROM fri_support_tickets WHERE lessor_id = 'lessor-001' AND subject = 'Invoice template customization'),
    'lessor-001',
    'lessor',
    'Tillykke! Vi har nu implementeret et logo uploader for invoices. Du finder det i Indstillinger > Fakturaer.'
)

-- ============================================================================
-- 10. TEST API KEYS
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM fri_api_keys WHERE [key] = 'sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')
INSERT INTO fri_api_keys (lessor_id, name, [key], status)
VALUES ('lessor-001', 'Production API', 'sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'active')

IF NOT EXISTS (SELECT 1 FROM fri_api_keys WHERE [key] = 'sk_test_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6')
INSERT INTO fri_api_keys (lessor_id, name, [key], status)
VALUES ('lessor-001', 'Development API', 'sk_test_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6', 'active')

IF NOT EXISTS (SELECT 1 FROM fri_api_keys WHERE [key] = 'sk_live_m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6')
INSERT INTO fri_api_keys (lessor_id, name, [key], status)
VALUES ('lessor-002', 'Main Integration', 'sk_live_m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6', 'active')

IF NOT EXISTS (SELECT 1 FROM fri_api_keys WHERE [key] = 'sk_live_old1old2old3old4old5old6old7')
INSERT INTO fri_api_keys (lessor_id, name, [key], status)
VALUES ('lessor-002', 'Old Key (inactive)', 'sk_live_old1old2old3old4old5old6old7', 'inactive')

-- ============================================================================
-- DONE
-- ============================================================================

PRINT 'Seed data inserted successfully!'
PRINT '- 1 Admin'
PRINT '- 3 Lessors with teams'
PRINT '- 7 Vehicles'
PRINT '- 4 Bookings'
PRINT '- 4 Invoices'
PRINT '- 4 Payments'
PRINT '- 4 Support Tickets'
PRINT '- 3 Ticket Messages'
PRINT '- 4 API Keys'
