/**
 * Lejio Fri - White-Label Lessor Platform
 * Azure PostgreSQL Schema Migration
 * 
 * This creates the complete schema for lessor accounts and their data
 * Separate from corporate database completely
 */

-- ============================================================================
-- LESSOR ACCOUNTS (Master table for each lessor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users from Supabase
  
  -- Basic info
  company_name VARCHAR(255) NOT NULL,
  cvr_number VARCHAR(20) UNIQUE, -- Danish CVR
  
  -- Domain & branding
  custom_domain VARCHAR(255) NOT NULL UNIQUE, -- e.g., "biluthyr.dk"
  
  -- Subscription
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'trial',
    -- 'trial' | 'professional' | 'business' | 'enterprise'
  trial_ends_at TIMESTAMP,
  
  -- Billing
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Branding (JSON storage)
  branding JSONB DEFAULT '{
    "logo_url": null,
    "primary_color": "#0066cc",
    "secondary_color": "#f0f0f0",
    "company_name": null,
    "favicon_url": null
  }',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_tier IN ('trial', 'professional', 'business', 'enterprise')
);

CREATE INDEX idx_lessor_accounts_custom_domain ON lessor_accounts(custom_domain);
CREATE INDEX idx_lessor_accounts_user_id ON lessor_accounts(user_id);
CREATE INDEX idx_lessor_accounts_stripe_customer ON lessor_accounts(stripe_customer_id);


-- ============================================================================
-- LESSOR SUBSCRIPTIONS (Billing history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  
  -- Subscription details
  tier VARCHAR(50) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  
  -- Dates
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP,
  billing_cycle_start TIMESTAMP,
  billing_cycle_end TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'paused' | 'canceled' | 'expired'
  auto_renew BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessor_subscriptions_account ON lessor_subscriptions(lessor_account_id);
CREATE INDEX idx_lessor_subscriptions_status ON lessor_subscriptions(status);


-- ============================================================================
-- LESSOR USAGE TRACKING (For rate limiting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  
  -- Usage counters
  vehicles_count INT DEFAULT 0,
  team_members_count INT DEFAULT 0,
  documents_count INT DEFAULT 0,
  api_calls_month INT DEFAULT 0,
  
  -- Track month
  month DATE NOT NULL, -- First day of month, e.g., '2026-01-01'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessor_usage_account_month ON lessor_usage(lessor_account_id, month);


-- ============================================================================
-- LESSOR FLEET VEHICLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  
  -- Vehicle info
  make VARCHAR(100) NOT NULL, -- e.g., "Toyota"
  model VARCHAR(100) NOT NULL, -- e.g., "Camry"
  year INT,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  vin VARCHAR(20), -- Vehicle Identification Number
  
  -- Rental info
  daily_rate DECIMAL(10, 2),
  mileage_limit INT, -- km per day, null = unlimited
  
  -- Status
  availability_status VARCHAR(50) DEFAULT 'available',
    -- 'available' | 'rented' | 'maintenance' | 'retired'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fleet_vehicles_account ON lessor_fleet_vehicles(lessor_account_id);
CREATE INDEX idx_fleet_vehicles_status ON lessor_fleet_vehicles(availability_status);


-- ============================================================================
-- LESSOR BOOKINGS (Rental bookings from customers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES lessor_fleet_vehicles(id) ON DELETE CASCADE,
  
  -- Booking details
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Rental period
  rental_start TIMESTAMP NOT NULL,
  rental_end TIMESTAMP NOT NULL,
  
  -- Pricing
  total_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'DKK',
  
  -- Status
  booking_status VARCHAR(50) DEFAULT 'pending',
    -- 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_account ON lessor_bookings(lessor_account_id);
CREATE INDEX idx_bookings_vehicle ON lessor_bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON lessor_bookings(booking_status);
CREATE INDEX idx_bookings_dates ON lessor_bookings(rental_start, rental_end);


-- ============================================================================
-- LESSOR TEAM MEMBERS (Access control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users from Supabase
  
  -- Role
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    -- 'owner' | 'manager' | 'operator' | 'viewer'
  
  -- Permissions (JSON)
  permissions JSONB DEFAULT '{}',
  
  -- Status
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_members_account ON lessor_team_members(lessor_account_id);
CREATE INDEX idx_team_members_user ON lessor_team_members(user_id);


-- ============================================================================
-- LESSOR INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES lessor_bookings(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'DKK',
  
  -- Dates
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_at TIMESTAMP,
  paid_at TIMESTAMP,
  
  -- Status
  invoice_status VARCHAR(50) DEFAULT 'pending',
    -- 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_account ON lessor_invoices(lessor_account_id);
CREATE INDEX idx_invoices_status ON lessor_invoices(invoice_status);
CREATE INDEX idx_invoices_booking ON lessor_invoices(booking_id);


-- ============================================================================
-- LESSOR DOCUMENTS (File storage metadata)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  
  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Azure Storage path
  file_size INT, -- bytes
  file_type VARCHAR(50), -- 'contract' | 'insurance' | 'license' | 'other'
  
  -- Metadata
  uploaded_by UUID, -- user_id
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_account ON lessor_documents(lessor_account_id);
CREATE INDEX idx_documents_type ON lessor_documents(file_type);


-- ============================================================================
-- LESSOR SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL UNIQUE REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  
  -- Settings (JSON)
  settings JSONB DEFAULT '{
    "email_notifications": true,
    "sms_notifications": false,
    "language": "da",
    "timezone": "Europe/Copenhagen",
    "currency": "DKK"
  }',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_account ON lessor_settings(lessor_account_id);


-- ============================================================================
-- ACTIVITY LOG (Audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lessor_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_account_id UUID NOT NULL REFERENCES lessor_accounts(id) ON DELETE CASCADE,
  user_id UUID, -- Who did this action
  
  -- Action
  action_type VARCHAR(100) NOT NULL, -- 'vehicle_added' | 'booking_created' | etc.
  resource_type VARCHAR(50), -- 'vehicle' | 'booking' | 'invoice'
  resource_id UUID,
  
  -- Details
  details JSONB, -- Store what changed
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_account ON lessor_activity_log(lessor_account_id);
CREATE INDEX idx_activity_log_user ON lessor_activity_log(user_id);
CREATE INDEX idx_activity_log_created ON lessor_activity_log(created_at DESC);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE lessor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessor_activity_log ENABLE ROW LEVEL SECURITY;

-- LESSOR_ACCOUNTS: Only owner can view/edit
CREATE POLICY "Users can view own lessor account"
  ON lessor_accounts FOR SELECT
  USING (user_id = CURRENT_USER_ID());

CREATE POLICY "Users can update own lessor account"
  ON lessor_accounts FOR UPDATE
  USING (user_id = CURRENT_USER_ID());

-- FLEET_VEHICLES: Access via team membership
CREATE POLICY "Team members can view lessor vehicles"
  ON lessor_fleet_vehicles FOR SELECT
  USING (
    lessor_account_id IN (
      SELECT lessor_account_id FROM lessor_team_members 
      WHERE user_id = CURRENT_USER_ID() AND active = true
    )
  );

-- BOOKINGS: Access via team membership
CREATE POLICY "Team members can view lessor bookings"
  ON lessor_bookings FOR SELECT
  USING (
    lessor_account_id IN (
      SELECT lessor_account_id FROM lessor_team_members 
      WHERE user_id = CURRENT_USER_ID() AND active = true
    )
  );

-- INVOICES: Access via team membership
CREATE POLICY "Team members can view lessor invoices"
  ON lessor_invoices FOR SELECT
  USING (
    lessor_account_id IN (
      SELECT lessor_account_id FROM lessor_team_members 
      WHERE user_id = CURRENT_USER_ID() AND active = true
    )
  );

-- TEAM_MEMBERS: Owners can view all, members see themselves
CREATE POLICY "Owners can view team members"
  ON lessor_team_members FOR SELECT
  USING (
    lessor_account_id IN (
      SELECT id FROM lessor_accounts WHERE user_id = CURRENT_USER_ID()
    )
    OR user_id = CURRENT_USER_ID()
  );

-- ACTIVITY_LOG: Access via team membership
CREATE POLICY "Team members can view activity log"
  ON lessor_activity_log FOR SELECT
  USING (
    lessor_account_id IN (
      SELECT lessor_account_id FROM lessor_team_members 
      WHERE user_id = CURRENT_USER_ID() AND active = true
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get lessor account by domain
CREATE OR REPLACE FUNCTION get_lessor_by_domain(p_domain VARCHAR)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  company_name VARCHAR,
  subscription_tier VARCHAR,
  branding JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.id,
    la.user_id,
    la.company_name,
    la.subscription_tier,
    la.branding
  FROM lessor_accounts la
  WHERE la.custom_domain = p_domain;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- DONE
-- ============================================================================
-- Migration complete. All tables, indexes, and RLS policies created.
-- Ready for Lejio Fri platform!
