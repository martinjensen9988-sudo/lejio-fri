-- ============================================
-- DEALER LOCATIONS SYSTEM
-- ============================================

-- 1. Create dealer_locations table (branches/afdelinger)
CREATE TABLE public.dealer_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  preparation_time_minutes INTEGER NOT NULL DEFAULT 120, -- Klargøringstid (buffer)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create opening_hours table (ugentlige åbningstider per lokation)
CREATE TABLE public.location_opening_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.dealer_locations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday...6=Saturday
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (location_id, day_of_week)
);

-- 3. Create special_closing_days table (helligdage/særlige lukkedage)
CREATE TABLE public.location_special_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.dealer_locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT true,
  opens_at TIME, -- If not fully closed, custom hours
  closes_at TIME,
  reason TEXT, -- e.g. "Helligdag", "Ferie"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (location_id, date)
);

-- 4. Add current_location_id to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS current_location_id UUID REFERENCES public.dealer_locations(id) ON DELETE SET NULL;

-- 5. Add pickup/dropoff location to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pickup_location_id UUID REFERENCES public.dealer_locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dropoff_location_id UUID REFERENCES public.dealer_locations(id) ON DELETE SET NULL;

-- 6. Add location info to contracts for autofill
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS pickup_location_name TEXT,
ADD COLUMN IF NOT EXISTS pickup_location_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_location_phone TEXT;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.dealer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_special_days ENABLE ROW LEVEL SECURITY;

-- Dealer locations: Partners can manage their own, admins can manage all
CREATE POLICY "Partners can view their own locations"
  ON public.dealer_locations FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Partners can insert their own locations"
  ON public.dealer_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    partner_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Partners can update their own locations"
  ON public.dealer_locations FOR UPDATE
  TO authenticated
  USING (
    partner_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Partners can delete their own locations"
  ON public.dealer_locations FOR DELETE
  TO authenticated
  USING (
    partner_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Public read for active locations (for booking flow)
CREATE POLICY "Anyone can view active locations for booking"
  ON public.dealer_locations FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Opening hours: Same pattern as locations
CREATE POLICY "Partners can manage opening hours for their locations"
  ON public.location_opening_hours FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dealer_locations dl 
      WHERE dl.id = location_id 
      AND (dl.partner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
    )
  );

CREATE POLICY "Anyone can view opening hours for active locations"
  ON public.location_opening_hours FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dealer_locations dl 
      WHERE dl.id = location_id AND dl.is_active = true
    )
  );

-- Special days: Same pattern
CREATE POLICY "Partners can manage special days for their locations"
  ON public.location_special_days FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dealer_locations dl 
      WHERE dl.id = location_id 
      AND (dl.partner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
    )
  );

CREATE POLICY "Anyone can view special days for active locations"
  ON public.location_special_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dealer_locations dl 
      WHERE dl.id = location_id AND dl.is_active = true
    )
  );

-- ============================================
-- HELPER FUNCTION: Check if location is open at given datetime
-- ============================================
CREATE OR REPLACE FUNCTION public.is_location_open(
  _location_id UUID,
  _datetime TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _date DATE;
  _time TIME;
  _day_of_week INTEGER;
  _special_day RECORD;
  _opening_hours RECORD;
  _location RECORD;
BEGIN
  _date := _datetime::DATE;
  _time := _datetime::TIME;
  _day_of_week := EXTRACT(DOW FROM _datetime)::INTEGER;

  -- Check if location exists and is active
  SELECT * INTO _location FROM public.dealer_locations WHERE id = _location_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check special days first (overrides regular hours)
  SELECT * INTO _special_day 
  FROM public.location_special_days 
  WHERE location_id = _location_id AND date = _date;
  
  IF FOUND THEN
    IF _special_day.is_closed THEN
      RETURN false;
    ELSE
      -- Custom hours for this special day
      RETURN _time >= _special_day.opens_at AND _time <= _special_day.closes_at;
    END IF;
  END IF;

  -- Check regular opening hours
  SELECT * INTO _opening_hours 
  FROM public.location_opening_hours 
  WHERE location_id = _location_id AND day_of_week = _day_of_week;

  IF NOT FOUND OR _opening_hours.is_closed THEN
    RETURN false;
  END IF;

  RETURN _time >= _opening_hours.opens_at AND _time <= _opening_hours.closes_at;
END;
$$;

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_dealer_locations_updated_at
  BEFORE UPDATE ON public.dealer_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_dealer_locations_partner_id ON public.dealer_locations(partner_id);
CREATE INDEX idx_dealer_locations_is_active ON public.dealer_locations(is_active);
CREATE INDEX idx_location_opening_hours_location_id ON public.location_opening_hours(location_id);
CREATE INDEX idx_location_special_days_location_id_date ON public.location_special_days(location_id, date);
CREATE INDEX idx_vehicles_current_location_id ON public.vehicles(current_location_id);
CREATE INDEX idx_bookings_pickup_location_id ON public.bookings(pickup_location_id);
CREATE INDEX idx_bookings_dropoff_location_id ON public.bookings(dropoff_location_id);