-- Lejio Fri Azure SQL Database Schema (CLEAN VERSION - No IF NOT EXISTS)
-- Complete initialization script for Lejio Fri platform
-- Run after dropping all existing fri_* tables
-- Includes all tables for lessors, vehicles, bookings, invoices, and page builder

-- ============================================
-- 1. LESSOR MANAGEMENT TABLES
-- ============================================

-- Lessors (main account)
CREATE TABLE fri_lessors (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  company_name NVARCHAR(255) NOT NULL,
  contact_email NVARCHAR(255) NOT NULL UNIQUE,
  contact_phone NVARCHAR(20),
  subscription_plan NVARCHAR(50) DEFAULT 'professional',
  subscription_status NVARCHAR(50) DEFAULT 'active',
  custom_domain NVARCHAR(255),
  logo_url NVARCHAR(2048),
  primary_color NVARCHAR(7) DEFAULT '#0066cc',
  secondary_color NVARCHAR(7) DEFAULT '#00cc99',
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  CONSTRAINT chk_plan CHECK (subscription_plan IN ('professional', 'business', 'enterprise')),
  CONSTRAINT chk_status CHECK (subscription_status IN ('active', 'paused', 'cancelled'))
);

-- Team members
CREATE TABLE fri_lessor_team_members (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  full_name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) NOT NULL,
  phone NVARCHAR(20),
  role NVARCHAR(50) NOT NULL,
  is_active BIT DEFAULT 1,
  invited_at DATETIME2 DEFAULT GETUTCDATE(),
  joined_at DATETIME2,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  CONSTRAINT chk_role CHECK (role IN ('owner', 'admin', 'manager', 'driver', 'mechanic', 'accountant')),
  INDEX idx_lessor_email (lessor_id, email)
);

-- ============================================
-- 2. FLEET MANAGEMENT TABLES
-- ============================================

-- Vehicles
CREATE TABLE fri_vehicles (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  make NVARCHAR(100) NOT NULL,
  model NVARCHAR(100) NOT NULL,
  year INT NOT NULL,
  license_plate NVARCHAR(50) NOT NULL UNIQUE,
  vin NVARCHAR(100),
  daily_rate DECIMAL(10, 2) NOT NULL,
  status NVARCHAR(50) DEFAULT 'available',
  odometer INT DEFAULT 0,
  fuel_type NVARCHAR(50),
  transmission NVARCHAR(50),
  seats INT DEFAULT 5,
  insurance_expiry DATE,
  registration_expiry DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  image_url NVARCHAR(2048),
  notes NVARCHAR(MAX),
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  CONSTRAINT chk_vehicle_status CHECK (status IN ('available', 'unavailable', 'maintenance', 'sold')),
  INDEX idx_lessor_plate (lessor_id, license_plate)
);

-- Vehicle maintenance log
CREATE TABLE fri_vehicle_maintenance (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  vehicle_id UNIQUEIDENTIFIER NOT NULL,
  maintenance_type NVARCHAR(100) NOT NULL,
  description NVARCHAR(MAX),
  cost DECIMAL(10, 2),
  performed_by NVARCHAR(255),
  performed_at DATETIME2,
  next_due_date DATE,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (vehicle_id) REFERENCES fri_vehicles(id) ON DELETE CASCADE
);

-- ============================================
-- 3. BOOKING SYSTEM TABLES
-- ============================================

-- Customers (renters)
CREATE TABLE fri_customers (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  full_name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) NOT NULL,
  phone NVARCHAR(20),
  driver_license_number NVARCHAR(100),
  driver_license_expiry DATE,
  address NVARCHAR(500),
  city NVARCHAR(100),
  postal_code NVARCHAR(20),
  country NVARCHAR(100),
  id_number NVARCHAR(100),
  is_verified BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  INDEX idx_lessor_email (lessor_id, email)
);

-- Bookings
CREATE TABLE fri_bookings (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  vehicle_id UNIQUEIDENTIFIER NOT NULL,
  customer_id UNIQUEIDENTIFIER NOT NULL,
  pickup_date DATETIME2 NOT NULL,
  return_date DATETIME2 NOT NULL,
  pickup_location NVARCHAR(255),
  return_location NVARCHAR(255),
  daily_rate DECIMAL(10, 2) NOT NULL,
  number_of_days INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  additional_fees DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  status NVARCHAR(50) DEFAULT 'pending',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES fri_vehicles(id),
  FOREIGN KEY (customer_id) REFERENCES fri_customers(id),
  CONSTRAINT chk_booking_status CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  INDEX idx_lessor_vehicle (lessor_id, vehicle_id),
  INDEX idx_dates (pickup_date, return_date)
);

-- ============================================
-- 4. INVOICING & PAYMENT TABLES
-- ============================================

-- Invoices
CREATE TABLE fri_invoices (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  booking_id UNIQUEIDENTIFIER NOT NULL,
  customer_id UNIQUEIDENTIFIER NOT NULL,
  invoice_number NVARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  status NVARCHAR(50) DEFAULT 'draft',
  paid_date DATE,
  payment_method NVARCHAR(50),
  notes NVARCHAR(MAX),
  pdf_url NVARCHAR(2048),
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES fri_bookings(id),
  FOREIGN KEY (customer_id) REFERENCES fri_customers(id),
  CONSTRAINT chk_invoice_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  INDEX idx_lessor_status (lessor_id, status),
  INDEX idx_due_date (due_date)
);

-- Payments
CREATE TABLE fri_payments (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  invoice_id UNIQUEIDENTIFIER NOT NULL,
  payment_date DATETIME2 NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method NVARCHAR(50),
  transaction_id NVARCHAR(100),
  status NVARCHAR(50) DEFAULT 'completed',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (invoice_id) REFERENCES fri_invoices(id) ON DELETE CASCADE,
  CONSTRAINT chk_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- ============================================
-- 5. PAGE BUILDER TABLES
-- ============================================

-- Website pages
CREATE TABLE fri_pages (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  title NVARCHAR(255) NOT NULL,
  slug NVARCHAR(255) NOT NULL,
  meta_description NVARCHAR(500),
  meta_keywords NVARCHAR(500),
  status NVARCHAR(50) DEFAULT 'draft',
  layout_json NVARCHAR(MAX),
  layout_data NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  published_at DATETIME2,
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  CONSTRAINT chk_page_status CHECK (status IN ('draft', 'published', 'archived')),
  UNIQUE (lessor_id, slug),
  INDEX idx_lessor_status (lessor_id, status)
);

-- Page blocks (components within pages)
CREATE TABLE fri_page_blocks (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  page_id UNIQUEIDENTIFIER NOT NULL,
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  block_type NVARCHAR(100) NOT NULL,
  position INT NOT NULL,
  config_json NVARCHAR(MAX),
  block_data NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (page_id) REFERENCES fri_pages(id) ON DELETE CASCADE,
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  CONSTRAINT chk_block_type CHECK (block_type IN ('hero', 'text', 'pricing', 'vehicles', 'booking', 'contact', 'image', 'cta', 'testimonial', 'footer')),
  INDEX idx_page_position (page_id, position)
);

-- Custom domains
CREATE TABLE fri_custom_domains (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
  domain NVARCHAR(255) NOT NULL UNIQUE,
  is_verified BIT DEFAULT 0,
  is_active BIT DEFAULT 0,
  verification_token NVARCHAR(500),
  verified_at DATETIME2,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE
);

-- ============================================
-- 6. AUDIT & LOGGING TABLES
-- ============================================

-- Audit log
CREATE TABLE fri_audit_logs (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER,
  action NVARCHAR(100) NOT NULL,
  entity_type NVARCHAR(100),
  entity_id UNIQUEIDENTIFIER,
  old_values NVARCHAR(MAX),
  new_values NVARCHAR(MAX),
  ip_address NVARCHAR(50),
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  INDEX idx_lessor_date (lessor_id, created_at),
  INDEX idx_entity (entity_type, entity_id)
);

-- ============================================
-- 7. API & INTEGRATIONS
-- ============================================

-- API keys for third-party integrations
CREATE TABLE fri_api_keys (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  lessor_id UNIQUEIDENTIFIER NOT NULL,
  key_name NVARCHAR(255) NOT NULL,
  api_key NVARCHAR(500) NOT NULL,
  key_secret NVARCHAR(500),
  service_type NVARCHAR(100),
  is_active BIT DEFAULT 1,
  last_used_at DATETIME2,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id) ON DELETE CASCADE,
  INDEX idx_lessor_service (lessor_id, service_type)
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_bookings_lessor_dates ON fri_bookings(lessor_id, pickup_date, return_date);
CREATE INDEX idx_invoices_lessor_date ON fri_invoices(lessor_id, invoice_date);
CREATE INDEX idx_vehicles_lessor_active ON fri_vehicles(lessor_id, is_active);
CREATE INDEX idx_customers_lessor ON fri_customers(lessor_id);
CREATE INDEX idx_team_lessor_active ON fri_lessor_team_members(lessor_id, is_active);
CREATE INDEX idx_pages_lessor_published ON fri_pages(lessor_id, status);
