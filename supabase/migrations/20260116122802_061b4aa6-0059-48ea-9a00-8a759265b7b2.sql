-- 1. Auto-Dispatch: Søgehistorik og AI-anbefalinger
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.dealer_locations(id),
  vehicle_type TEXT,
  search_query TEXT,
  user_id UUID,
  ip_hash TEXT,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  start_date DATE,
  end_date DATE,
  results_count INTEGER DEFAULT 0
);

CREATE TABLE public.fleet_dispatch_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lessor_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  from_location_id UUID REFERENCES public.dealer_locations(id),
  to_location_id UUID REFERENCES public.dealer_locations(id),
  recommendation_type TEXT NOT NULL DEFAULT 'move', -- move, add, remove
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  reason TEXT NOT NULL,
  expected_revenue_increase NUMERIC(10,2),
  ai_confidence NUMERIC(3,2), -- 0.00 to 1.00
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  acted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Service-Logistik: Automatisk service-planlægning
CREATE TABLE public.service_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  task_type TEXT NOT NULL, -- service, inspection, tire_change, cleaning
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, scheduled, in_progress, completed, cancelled
  assigned_to TEXT, -- medarbejder navn/id
  scheduled_date DATE,
  scheduled_time TIME,
  km_trigger INTEGER, -- trigger ved dette km tal
  date_trigger DATE, -- trigger ved denne dato
  estimated_duration_minutes INTEGER DEFAULT 60,
  actual_duration_minutes INTEGER,
  location_id UUID REFERENCES public.dealer_locations(id),
  notes TEXT,
  auto_block_bookings BOOLEAN DEFAULT true,
  booking_block_start TIMESTAMP WITH TIME ZONE,
  booking_block_end TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Dynamisk Selvrisiko: Lejer-profil baseret selvrisiko
CREATE TABLE public.deductible_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lessor_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_deductible NUMERIC(10,2) NOT NULL DEFAULT 5000,
  premium_deductible NUMERIC(10,2) DEFAULT 0,
  premium_daily_rate NUMERIC(10,2) DEFAULT 79,
  min_renter_rating NUMERIC(3,2), -- mindst denne rating for at få profilen
  min_completed_bookings INTEGER, -- mindst dette antal bookinger
  max_vehicle_value NUMERIC(12,2), -- maks bilværdi for denne profil
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.booking_deductible_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  deductible_profile_id UUID REFERENCES public.deductible_profiles(id),
  selected_tier TEXT NOT NULL DEFAULT 'standard', -- standard, premium
  deductible_amount NUMERIC(10,2) NOT NULL,
  daily_premium_paid NUMERIC(10,2) DEFAULT 0,
  total_premium_paid NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Messenger med oversættelse: Chat logs og oversættelser
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS original_language TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS translated_content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS target_language TEXT;

-- 5. Tab af Indtægt beregner
CREATE TABLE public.revenue_loss_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  damage_report_id UUID REFERENCES public.damage_reports(id),
  booking_id UUID REFERENCES public.bookings(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  lessor_id UUID NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_rate_average NUMERIC(10,2) NOT NULL,
  days_out_of_service INTEGER NOT NULL,
  total_revenue_loss NUMERIC(10,2) NOT NULL,
  historical_utilization_rate NUMERIC(5,2), -- procent
  ai_estimated_bookings INTEGER, -- forventet antal bookinger mistet
  repair_start_date DATE,
  repair_end_date DATE,
  status TEXT NOT NULL DEFAULT 'calculated', -- calculated, claimed, approved, paid
  claim_submitted_at TIMESTAMP WITH TIME ZONE,
  claim_approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_dispatch_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deductible_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_deductible_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_loss_calculations ENABLE ROW LEVEL SECURITY;

-- Search history - public insert, owner read
CREATE POLICY "Anyone can insert search history" ON public.search_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Lessors can view search history for their locations" ON public.search_history FOR SELECT
  USING (location_id IN (SELECT id FROM public.dealer_locations WHERE partner_id = auth.uid()));

-- Fleet dispatch recommendations
CREATE POLICY "Lessors can view their recommendations" ON public.fleet_dispatch_recommendations FOR SELECT USING (lessor_id = auth.uid());
CREATE POLICY "Lessors can update their recommendations" ON public.fleet_dispatch_recommendations FOR UPDATE USING (lessor_id = auth.uid());

-- Service tasks
CREATE POLICY "Lessors can manage their service tasks" ON public.service_tasks FOR ALL USING (lessor_id = auth.uid());

-- Deductible profiles
CREATE POLICY "Lessors can manage their deductible profiles" ON public.deductible_profiles FOR ALL USING (lessor_id = auth.uid());
CREATE POLICY "Anyone can view active deductible profiles" ON public.deductible_profiles FOR SELECT USING (is_active = true);

-- Booking deductible selections
CREATE POLICY "Users can view their booking deductibles" ON public.booking_deductible_selections FOR SELECT
  USING (booking_id IN (SELECT id FROM public.bookings WHERE lessor_id = auth.uid() OR renter_id = auth.uid()));
CREATE POLICY "Users can insert booking deductibles" ON public.booking_deductible_selections FOR INSERT WITH CHECK (true);

-- Revenue loss calculations
CREATE POLICY "Lessors can manage their revenue loss calculations" ON public.revenue_loss_calculations FOR ALL USING (lessor_id = auth.uid());

-- Indexes
CREATE INDEX idx_search_history_location ON public.search_history(location_id);
CREATE INDEX idx_search_history_date ON public.search_history(searched_at);
CREATE INDEX idx_fleet_dispatch_lessor ON public.fleet_dispatch_recommendations(lessor_id, status);
CREATE INDEX idx_service_tasks_vehicle ON public.service_tasks(vehicle_id);
CREATE INDEX idx_service_tasks_scheduled ON public.service_tasks(scheduled_date, status);
CREATE INDEX idx_revenue_loss_vehicle ON public.revenue_loss_calculations(vehicle_id);