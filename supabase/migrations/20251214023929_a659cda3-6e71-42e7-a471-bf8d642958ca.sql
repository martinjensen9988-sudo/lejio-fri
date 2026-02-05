-- Add subscription fields to vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS subscription_available boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_monthly_price numeric DEFAULT NULL;

-- Add service/maintenance fields to vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS service_interval_km integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS service_interval_months integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_inspection_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_odometer integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_service_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_service_odometer integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS service_status text DEFAULT 'ok' CHECK (service_status IN ('ok', 'service_soon', 'service_required', 'blocked')),
ADD COLUMN IF NOT EXISTS tire_type text DEFAULT 'summer' CHECK (tire_type IN ('summer', 'winter', 'all_season')),
ADD COLUMN IF NOT EXISTS tire_size text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tire_hotel_location text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tire_change_reminder_sent boolean DEFAULT false;

-- Create vehicle_service_logs table to track service history
CREATE TABLE IF NOT EXISTS public.vehicle_service_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading integer,
  description text,
  cost numeric,
  performed_by text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS on service logs
ALTER TABLE public.vehicle_service_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for service logs
CREATE POLICY "Vehicle owners can view their service logs"
ON public.vehicle_service_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vehicles v 
  WHERE v.id = vehicle_service_logs.vehicle_id 
  AND v.owner_id = auth.uid()
));

CREATE POLICY "Vehicle owners can insert service logs"
ON public.vehicle_service_logs FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.vehicles v 
  WHERE v.id = vehicle_service_logs.vehicle_id 
  AND v.owner_id = auth.uid()
));

CREATE POLICY "Vehicle owners can update their service logs"
ON public.vehicle_service_logs FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.vehicles v 
  WHERE v.id = vehicle_service_logs.vehicle_id 
  AND v.owner_id = auth.uid()
));

CREATE POLICY "Vehicle owners can delete their service logs"
ON public.vehicle_service_logs FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.vehicles v 
  WHERE v.id = vehicle_service_logs.vehicle_id 
  AND v.owner_id = auth.uid()
));

-- Create vehicle_swaps table to track vehicle replacements
CREATE TABLE IF NOT EXISTS public.vehicle_swaps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  original_vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  new_vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  swap_reason text NOT NULL CHECK (swap_reason IN ('service', 'breakdown', 'damage', 'upgrade')),
  swap_date timestamp with time zone NOT NULL DEFAULT now(),
  original_odometer integer,
  notes text,
  contract_addendum_url text,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS on vehicle swaps
ALTER TABLE public.vehicle_swaps ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle swaps
CREATE POLICY "Lessors can view their vehicle swaps"
ON public.vehicle_swaps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings b 
  WHERE b.id = vehicle_swaps.booking_id 
  AND b.lessor_id = auth.uid()
));

CREATE POLICY "Lessors can insert vehicle swaps"
ON public.vehicle_swaps FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bookings b 
  WHERE b.id = vehicle_swaps.booking_id 
  AND b.lessor_id = auth.uid()
));

CREATE POLICY "Lessors can update their vehicle swaps"
ON public.vehicle_swaps FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.bookings b 
  WHERE b.id = vehicle_swaps.booking_id 
  AND b.lessor_id = auth.uid()
));

-- Renters can view swaps for their bookings
CREATE POLICY "Renters can view their vehicle swaps"
ON public.vehicle_swaps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings b 
  WHERE b.id = vehicle_swaps.booking_id 
  AND b.renter_id = auth.uid()
));

-- Create subscription_rentals table for recurring monthly rentals via card
CREATE TABLE IF NOT EXISTS public.subscription_rentals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id uuid NOT NULL,
  renter_id uuid,
  renter_name text,
  renter_email text NOT NULL,
  renter_phone text,
  monthly_price numeric NOT NULL,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'expired')),
  start_date date NOT NULL,
  current_period_start date,
  current_period_end date,
  next_payment_date date,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on subscription rentals
ALTER TABLE public.subscription_rentals ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription rentals
CREATE POLICY "Lessors can view their subscription rentals"
ON public.subscription_rentals FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert subscription rentals"
ON public.subscription_rentals FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their subscription rentals"
ON public.subscription_rentals FOR UPDATE
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can delete their subscription rentals"
ON public.subscription_rentals FOR DELETE
USING (auth.uid() = lessor_id);

CREATE POLICY "Renters can view their subscription rentals"
ON public.subscription_rentals FOR SELECT
USING (auth.uid() = renter_id);

-- Add updated_at trigger for subscription_rentals
CREATE TRIGGER update_subscription_rentals_updated_at
  BEFORE UPDATE ON public.subscription_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();