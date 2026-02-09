-- ============================================================================
-- LEJIO FRI - POSTGRESQL SCHEMA
-- ============================================================================
-- PostgreSQL version of COMPLETE_DATABASE_SETUP.sql
-- Run this in Render PostgreSQL database
-- ============================================================================

-- ============================================================================
-- 1. ADMIN TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_admins (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) UNIQUE NOT NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fri_admins_email ON fri_admins(email);

-- ============================================================================
-- 1b. USER AUTHENTICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    user_type VARCHAR(20) DEFAULT 'professionel',
    company_name VARCHAR(255),
    cvr_number VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fri_users_email ON fri_users(email);

-- ============================================================================
-- 1c. SESSIONS TABLE (GDPR compliant - server-side sessions)
-- ============================================================================

-- Drop old sessions table if exists with wrong column type
DROP TABLE IF EXISTS fri_sessions CASCADE;

CREATE TABLE IF NOT EXISTS fri_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_fri_sessions_user_id ON fri_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fri_sessions_expires ON fri_sessions(expires_at);

-- ============================================================================
-- 2. LESSOR TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_lessors (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    cvr_number VARCHAR(50) UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    logo_url TEXT,
    subscription_tier VARCHAR(50),
    selected_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    trial_start_date TIMESTAMP NOT NULL,
    trial_end_date TIMESTAMP NOT NULL,
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial',
    tenant_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fri_lessors_email ON fri_lessors(email);
CREATE INDEX IF NOT EXISTS idx_fri_lessors_domain ON fri_lessors(custom_domain);
CREATE INDEX IF NOT EXISTS idx_fri_lessors_status ON fri_lessors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_fri_lessors_tenant ON fri_lessors(tenant_id);

-- ============================================================================
-- 2b. SUBSCRIPTION PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_monthly INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'DKK',
    description TEXT,
    price_note VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fri_plans_category ON fri_subscription_plans(category);

INSERT INTO fri_subscription_plans (id, category, name, price_monthly, description, sort_order)
VALUES
    ('dealer_start', 'dealer', 'Bilforhandler Start', 599, 'Basis salg, leads og kampagner.', 10),
    ('dealer_plus', 'dealer', 'Bilforhandler Plus', 899, 'Avanceret salgsflow + kontrakter.', 20),
    ('dealer_pro', 'dealer', 'Bilforhandler Pro', 1199, 'Team, pipeline og performance dashboards.', 30),
    ('dealer_elite', 'dealer', 'Bilforhandler Elite', 1699, 'Premium support og full automation.', 40),
    ('rental_start', 'rental', 'Biludlejning Start', 499, 'Bookinger, fleet og betalinger.', 10),
    ('rental_growth', 'rental', 'Biludlejning Growth', 899, 'Automatisering, depot og kundeportal.', 20),
    ('workshop_start', 'workshop', 'Autovaerksted Start', 599, 'Opgaver, tider og kundekontakt.', 10),
    ('workshop_flow', 'workshop', 'Autovaerksted Flow', 999, 'Fakturering, reservedele og lager.', 20),
    ('workshop_scale', 'workshop', 'Autovaerksted Scale', 1399, 'Integrationer, KPI og driftsoverblik.', 30),
    ('custom_mix', 'custom', 'Bland selv', 299, 'Vaelg kun de moduler du vil have.', 10)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS fri_lessor_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'invited',
    invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
    UNIQUE(lessor_id, email)
);

CREATE INDEX IF NOT EXISTS idx_fri_team_lessor ON fri_lessor_team_members(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_team_email ON fri_lessor_team_members(email);

-- ============================================================================
-- 3. VEHICLE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    vin VARCHAR(50) UNIQUE,
    daily_rate DECIMAL(10, 2) NOT NULL,
    mileage_limit INTEGER DEFAULT 300,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'available',
    last_mileage INTEGER DEFAULT 0,
    tenant_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_vehicles_lessor ON fri_vehicles(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_vehicles_plate ON fri_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_fri_vehicles_status ON fri_vehicles(availability_status);
CREATE INDEX IF NOT EXISTS idx_fri_vehicles_tenant ON fri_vehicles(tenant_id);

-- ============================================================================
-- 3b. DEALER LISTINGS TABLE (Car sales listings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_dealer_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    reg_number VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Klar',
    image_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_dealer_listings_lessor ON fri_dealer_listings(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_dealer_listings_status ON fri_dealer_listings(status);

-- ============================================================================
-- 3c. DEALER LOYALTY CARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_dealer_loyalty_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    discount_percent DECIMAL(5, 2) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_loyalty_cards_lessor ON fri_dealer_loyalty_cards(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_loyalty_cards_active ON fri_dealer_loyalty_cards(is_active);

-- ============================================================================
-- 3d. DEALER CONTRACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_dealer_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    listing_id UUID,
    contract_type VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    contract_text TEXT,
    signed_at TIMESTAMP,
    signed_by VARCHAR(255),
    signature_id VARCHAR(10),
    signature_ip_address VARCHAR(45),
    signature_timestamp TIMESTAMP WITH TIME ZONE,
    signature_metadata JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    pdf_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
    FOREIGN KEY (listing_id) REFERENCES fri_dealer_listings(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_contracts_lessor ON fri_dealer_contracts(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_contracts_status ON fri_dealer_contracts(status);
CREATE INDEX IF NOT EXISTS idx_fri_contracts_signature_id ON fri_dealer_contracts(signature_id);

-- ============================================================================
-- 3d.1 CONTRACT SIGNATURE AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_contract_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL,
    lessor_id VARCHAR(36) NOT NULL,
    signature_code VARCHAR(10) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    signed_by VARCHAR(255),
    ip_address VARCHAR(45) NOT NULL,
    ip_country VARCHAR(2),
    ip_city VARCHAR(100),
    user_agent TEXT,
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    device_type VARCHAR(50),
    device_brand VARCHAR(100),
    device_model VARCHAR(100),
    signature_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature_metadata JSONB,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES fri_dealer_contracts(id),
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_signatures_contract ON fri_contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatures_lessor ON fri_contract_signatures(lessor_id);
CREATE INDEX IF NOT EXISTS idx_signatures_code ON fri_contract_signatures(signature_code);
CREATE INDEX IF NOT EXISTS idx_signatures_timestamp ON fri_contract_signatures(signature_timestamp);
CREATE INDEX IF NOT EXISTS idx_signatures_email ON fri_contract_signatures(customer_email);
CREATE INDEX IF NOT EXISTS idx_signatures_ip ON fri_contract_signatures(ip_address);

-- ============================================================================
-- 3e. DEALER CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_dealer_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    offer_text TEXT NOT NULL,
    target_group VARCHAR(50) NOT NULL,
    sent_count INTEGER NOT NULL DEFAULT 0,
    response_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_campaigns_lessor ON fri_dealer_campaigns(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_campaigns_active ON fri_dealer_campaigns(is_active);

-- ============================================================================
-- 4. BOOKING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    vehicle_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    rental_days INTEGER NOT NULL,
    daily_rate DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    tenant_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
    FOREIGN KEY (vehicle_id) REFERENCES fri_vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_bookings_lessor ON fri_bookings(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_bookings_vehicle ON fri_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fri_bookings_status ON fri_bookings(status);
CREATE INDEX IF NOT EXISTS idx_fri_bookings_dates ON fri_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_fri_bookings_tenant ON fri_bookings(tenant_id);

-- ============================================================================
-- 5. INVOICE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    booking_id UUID,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    due_date TIMESTAMP,
    notes TEXT,
    tenant_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
    FOREIGN KEY (booking_id) REFERENCES fri_bookings(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_invoices_lessor ON fri_invoices(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_invoices_status ON fri_invoices(status);
CREATE INDEX IF NOT EXISTS idx_fri_invoices_number ON fri_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_fri_invoices_tenant ON fri_invoices(tenant_id);

-- ============================================================================
-- 6. PAYMENT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'DKK',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL,
    subscription_type VARCHAR(50) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    tenant_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_payments_lessor ON fri_payments(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_payments_status ON fri_payments(status);
CREATE INDEX IF NOT EXISTS idx_fri_payments_tenant ON fri_payments(tenant_id);

-- ============================================================================
-- 7. SUPPORT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_tickets_lessor ON fri_support_tickets(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_tickets_status ON fri_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_fri_tickets_priority ON fri_support_tickets(priority);

CREATE TABLE IF NOT EXISTS fri_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES fri_support_tickets(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_messages_ticket ON fri_ticket_messages(ticket_id);

-- ============================================================================
-- 8. API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_api_keys_lessor ON fri_api_keys(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_api_keys_key ON fri_api_keys(key);

-- ============================================================================
-- 9. AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id TEXT,
    changes TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
);

CREATE INDEX IF NOT EXISTS idx_fri_audit_lessor ON fri_audit_logs(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_audit_date ON fri_audit_logs(created_at);

-- ============================================================================
-- 10. MULTI-TENANT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fri_tenants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    subdomain VARCHAR(100) UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'trial',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    owner_email VARCHAR(255) NOT NULL,
    cvr_number VARCHAR(50),
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    logo_url TEXT,
    trial_start_date TIMESTAMP NOT NULL,
    trial_end_date TIMESTAMP NOT NULL,
    subscription_start_date TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fri_tenants_slug ON fri_tenants(slug);
CREATE INDEX IF NOT EXISTS idx_fri_tenants_subdomain ON fri_tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_fri_tenants_domain ON fri_tenants(domain);
CREATE INDEX IF NOT EXISTS idx_fri_tenants_status ON fri_tenants(status);

-- ============================================================================
-- 11. PAGE BUILDER TABLES
-- ============================================================================

-- Drop existing tables to recreate without FK constraint
DROP TABLE IF EXISTS fri_page_blocks CASCADE;
DROP TABLE IF EXISTS fri_pages CASCADE;

CREATE TABLE IF NOT EXISTS fri_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lessor_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    meta_description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_fri_page_slug UNIQUE (lessor_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_fri_pages_lessor ON fri_pages(lessor_id);
CREATE INDEX IF NOT EXISTS idx_fri_pages_published ON fri_pages(lessor_id, is_published);

CREATE TABLE IF NOT EXISTS fri_page_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL,
    block_type VARCHAR(50) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES fri_pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fri_page_blocks_page ON fri_page_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_fri_page_blocks_type ON fri_page_blocks(block_type);
