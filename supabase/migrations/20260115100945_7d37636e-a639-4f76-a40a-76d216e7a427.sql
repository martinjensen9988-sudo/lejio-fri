-- Corporate Fleet Outsourcing - Full Solution

-- Corporate accounts (virksomheder)
CREATE TABLE public.corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cvr_number TEXT UNIQUE NOT NULL,
  ean_number TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_postal_code TEXT,
  monthly_budget NUMERIC,
  contract_start_date DATE,
  contract_end_date DATE,
  commission_rate NUMERIC DEFAULT 15,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Corporate departments (afdelinger for cost allocation)
CREATE TABLE public.corporate_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID REFERENCES public.corporate_accounts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cost_center_code TEXT,
  monthly_budget NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Corporate employees (medarbejdere)
CREATE TABLE public.corporate_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID REFERENCES public.corporate_accounts(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.corporate_departments(id) ON DELETE SET NULL,
  user_id UUID,
  employee_number TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  driver_license_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corporate_account_id, email)
);

-- Corporate fleet vehicles (køretøjer tilknyttet virksomhed)
CREATE TABLE public.corporate_fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID REFERENCES public.corporate_accounts(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID NOT NULL,
  lessor_id UUID NOT NULL,
  assigned_department_id UUID REFERENCES public.corporate_departments(id) ON DELETE SET NULL,
  monthly_rate NUMERIC NOT NULL,
  included_km_per_month INTEGER DEFAULT 2500,
  extra_km_rate NUMERIC DEFAULT 2.50,
  is_exclusive BOOLEAN DEFAULT false,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Corporate bookings (bookinger lavet af medarbejdere)
CREATE TABLE public.corporate_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID REFERENCES public.corporate_accounts(id) ON DELETE CASCADE NOT NULL,
  corporate_employee_id UUID REFERENCES public.corporate_employees(id) ON DELETE SET NULL NOT NULL,
  department_id UUID REFERENCES public.corporate_departments(id) ON DELETE SET NULL,
  fleet_vehicle_id UUID REFERENCES public.corporate_fleet_vehicles(id) ON DELETE SET NULL,
  booking_id UUID NOT NULL,
  purpose TEXT,
  destination TEXT,
  km_driven INTEGER,
  cost_allocated NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Corporate invoices (månedlige fakturaer)
CREATE TABLE public.corporate_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID REFERENCES public.corporate_accounts(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_period_start DATE NOT NULL,
  invoice_period_end DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_km_driven INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  line_items JSONB DEFAULT '[]',
  department_breakdown JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
  issued_at TIMESTAMPTZ,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Corporate usage stats (for analytics)
CREATE TABLE public.corporate_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID REFERENCES public.corporate_accounts(id) ON DELETE CASCADE NOT NULL,
  period_month DATE NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  total_km_driven INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  co2_emissions_kg NUMERIC DEFAULT 0,
  avg_utilization_rate NUMERIC DEFAULT 0,
  most_used_vehicle_id UUID,
  department_stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corporate_account_id, period_month)
);

-- Enable RLS
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Corporate accounts: Super admins can manage all, corporate admins can view their own
CREATE POLICY "Super admins can manage corporate accounts" ON public.corporate_accounts
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Corporate admins can view their account" ON public.corporate_accounts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_accounts.id 
    AND user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Corporate departments
CREATE POLICY "Super admins can manage departments" ON public.corporate_departments
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Corporate users can view their departments" ON public.corporate_departments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_departments.corporate_account_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Corporate admins can manage their departments" ON public.corporate_departments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_departments.corporate_account_id 
    AND user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Corporate employees
CREATE POLICY "Super admins can manage employees" ON public.corporate_employees
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Corporate admins can manage their employees" ON public.corporate_employees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees ce
    WHERE ce.corporate_account_id = corporate_employees.corporate_account_id 
    AND ce.user_id = auth.uid() 
    AND ce.is_admin = true
  )
);

CREATE POLICY "Employees can view colleagues" ON public.corporate_employees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees ce
    WHERE ce.corporate_account_id = corporate_employees.corporate_account_id 
    AND ce.user_id = auth.uid()
  )
);

-- Corporate fleet vehicles
CREATE POLICY "Super admins can manage fleet vehicles" ON public.corporate_fleet_vehicles
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Corporate users can view their fleet" ON public.corporate_fleet_vehicles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_fleet_vehicles.corporate_account_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Lessors can view vehicles assigned from them" ON public.corporate_fleet_vehicles
FOR SELECT USING (lessor_id = auth.uid());

-- Corporate bookings
CREATE POLICY "Super admins can manage corporate bookings" ON public.corporate_bookings
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Corporate users can view their bookings" ON public.corporate_bookings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_bookings.corporate_account_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Corporate employees can create bookings" ON public.corporate_bookings
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_bookings.corporate_account_id 
    AND user_id = auth.uid()
    AND is_active = true
  )
);

-- Corporate invoices
CREATE POLICY "Super admins can manage invoices" ON public.corporate_invoices
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Corporate admins can view their invoices" ON public.corporate_invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_invoices.corporate_account_id 
    AND user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Corporate usage stats
CREATE POLICY "Super admins can manage usage stats" ON public.corporate_usage_stats
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Corporate admins can view their stats" ON public.corporate_usage_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees 
    WHERE corporate_account_id = corporate_usage_stats.corporate_account_id 
    AND user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Function to generate corporate invoice number
CREATE OR REPLACE FUNCTION public.generate_corporate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.corporate_invoices
  WHERE invoice_number LIKE 'CORP-' || year_prefix || '%';
  
  new_number := 'CORP-' || year_prefix || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_corporate_employees_account ON public.corporate_employees(corporate_account_id);
CREATE INDEX idx_corporate_employees_user ON public.corporate_employees(user_id);
CREATE INDEX idx_corporate_fleet_vehicles_account ON public.corporate_fleet_vehicles(corporate_account_id);
CREATE INDEX idx_corporate_bookings_account ON public.corporate_bookings(corporate_account_id);
CREATE INDEX idx_corporate_bookings_employee ON public.corporate_bookings(corporate_employee_id);
CREATE INDEX idx_corporate_invoices_account ON public.corporate_invoices(corporate_account_id);