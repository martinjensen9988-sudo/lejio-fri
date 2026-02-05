-- Add motorcycle/scooter type to vehicle_type options (handled in application code)
-- Add motorcycle/scooter specific fields to vehicles table

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS mc_category TEXT,
ADD COLUMN IF NOT EXISTS engine_cc INTEGER,
ADD COLUMN IF NOT EXISTS engine_kw NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS has_abs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seat_height_mm INTEGER,
ADD COLUMN IF NOT EXISTS helmet_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS helmet_size TEXT,
ADD COLUMN IF NOT EXISTS has_disc_lock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_chain_lock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_steering_lock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_top_box BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_side_bags BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_tank_bag BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_phone_mount BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_usb_outlet BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_heated_grips BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_windscreen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chain_last_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS chain_last_checked_km INTEGER,
ADD COLUMN IF NOT EXISTS tire_tread_front_mm NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS tire_tread_rear_mm NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS mc_daily_km_limit INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS winter_deactivated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rain_guarantee_enabled BOOLEAN DEFAULT false;

-- Create maintenance log for motorcycles
CREATE TABLE IF NOT EXISTS public.mc_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- 'chain_check', 'chain_service', 'tire_check', 'oil_change', 'brake_check', 'general_service'
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  performed_by UUID REFERENCES auth.users(id),
  odometer_reading INTEGER,
  notes TEXT,
  next_service_km INTEGER,
  next_service_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mc_maintenance_log ENABLE ROW LEVEL SECURITY;

-- Vehicle owners can manage their own maintenance logs
CREATE POLICY "Owners can manage mc maintenance logs" 
ON public.mc_maintenance_log 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles 
    WHERE vehicles.id = mc_maintenance_log.vehicle_id 
    AND vehicles.owner_id = auth.uid()
  )
);

-- Create table for MC check-in photos (specific angles)
CREATE TABLE IF NOT EXISTS public.mc_check_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL, -- 'left_side', 'right_side', 'front_wheel', 'rear_wheel', 'dashboard', 'chain'
  photo_url TEXT NOT NULL,
  check_type TEXT NOT NULL, -- 'check_in', 'check_out'
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mc_check_photos ENABLE ROW LEVEL SECURITY;

-- Policy for MC check photos
CREATE POLICY "Users can view related mc photos" 
ON public.mc_check_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = mc_check_photos.booking_id 
    AND (bookings.lessor_id = auth.uid() OR bookings.renter_id = auth.uid())
  )
);

CREATE POLICY "Users can insert mc photos for their bookings" 
ON public.mc_check_photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = mc_check_photos.booking_id 
    AND (bookings.lessor_id = auth.uid() OR bookings.renter_id = auth.uid())
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_mc_maintenance_vehicle_id ON public.mc_maintenance_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mc_check_photos_booking_id ON public.mc_check_photos(booking_id);