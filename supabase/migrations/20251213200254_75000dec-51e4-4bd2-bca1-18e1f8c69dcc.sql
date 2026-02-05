-- Add vehicle type and related fields for trailers and caravans
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_type text NOT NULL DEFAULT 'bil';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS total_weight integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS requires_b_license boolean DEFAULT true;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS sleeping_capacity integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_kitchen boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_bathroom boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_awning boolean DEFAULT false;

-- Update the vehicles_public view to include the new fields
DROP VIEW IF EXISTS public.vehicles_public;
CREATE VIEW public.vehicles_public AS
SELECT 
  id,
  make,
  model,
  variant,
  year,
  fuel_type,
  color,
  daily_price,
  weekly_price,
  monthly_price,
  included_km,
  extra_km_price,
  unlimited_km,
  description,
  image_url,
  features,
  is_available,
  deposit_required,
  deposit_amount,
  prepaid_rent_enabled,
  prepaid_rent_months,
  payment_schedule,
  use_custom_location,
  location_address,
  location_postal_code,
  location_city,
  latitude,
  longitude,
  owner_id,
  vehicle_type,
  total_weight,
  requires_b_license,
  sleeping_capacity,
  has_kitchen,
  has_bathroom,
  has_awning
FROM public.vehicles
WHERE is_available = true;

-- Grant access to the view
GRANT SELECT ON public.vehicles_public TO anon, authenticated;