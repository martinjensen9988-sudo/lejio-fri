-- Create fleet loan requests table (for "Anmod om finansiering" feature)
CREATE TABLE public.fleet_loan_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lessor_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  requested_amount NUMERIC(10,2) NOT NULL,
  workshop_name TEXT,
  workshop_invoice_url TEXT,
  description TEXT NOT NULL,
  suggested_monthly_installment NUMERIC(10,2),
  suggested_months INTEGER,
  ai_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fleet category caps table (for max loan amounts per category)
CREATE TABLE public.fleet_category_caps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  max_amount NUMERIC(10,2) NOT NULL DEFAULT 10000,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default category caps
INSERT INTO public.fleet_category_caps (category, max_amount, description) VALUES
  ('bil', 15000, 'Maksimalt lån for personbiler'),
  ('trailer', 5000, 'Maksimalt lån for trailere'),
  ('campingvogn', 8000, 'Maksimalt lån for campingvogne'),
  ('motorcykel', 7000, 'Maksimalt lån for motorcykler'),
  ('scooter', 3000, 'Maksimalt lån for scootere');

-- Create fleet coverage shortfall log (for vehicles not earning enough)
CREATE TABLE public.fleet_coverage_shortfalls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  month TEXT NOT NULL, -- format: YYYY-MM
  required_amount NUMERIC(10,2) NOT NULL, -- monthly installment due
  earned_amount NUMERIC(10,2) NOT NULL, -- actual revenue
  shortfall_amount NUMERIC(10,2) NOT NULL, -- difference
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'covered', 'written_off')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, month)
);

-- Create fleet service queue table (for service/cleaning/tire tasks)
CREATE TABLE public.fleet_service_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('cleaning', 'tire_change', 'inspection', 'maintenance', 'repair')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  description TEXT,
  scheduled_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add contract expiration tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fleet_contract_start_date DATE,
ADD COLUMN IF NOT EXISTS fleet_contract_months INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS fleet_contract_expires_at DATE;

-- Enable RLS
ALTER TABLE public.fleet_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_category_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_coverage_shortfalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_service_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fleet_loan_requests
CREATE POLICY "Lessors can view own loan requests" ON public.fleet_loan_requests
  FOR SELECT USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can create loan requests" ON public.fleet_loan_requests
  FOR INSERT WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Admins can manage all loan requests" ON public.fleet_loan_requests
  FOR ALL USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for fleet_category_caps (read-only for lessors)
CREATE POLICY "Anyone can read category caps" ON public.fleet_category_caps
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage category caps" ON public.fleet_category_caps
  FOR ALL USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for fleet_coverage_shortfalls
CREATE POLICY "Lessors can view own shortfalls" ON public.fleet_coverage_shortfalls
  FOR SELECT USING (auth.uid() = lessor_id);

CREATE POLICY "Admins can manage all shortfalls" ON public.fleet_coverage_shortfalls
  FOR ALL USING (public.has_any_admin_role(auth.uid()));

-- RLS Policies for fleet_service_queue
CREATE POLICY "Lessors can view own service queue" ON public.fleet_service_queue
  FOR SELECT USING (auth.uid() = lessor_id);

CREATE POLICY "Admins can manage all service queue" ON public.fleet_service_queue
  FOR ALL USING (public.has_any_admin_role(auth.uid()));