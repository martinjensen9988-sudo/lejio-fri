-- Fix security definer view by recreating with security_invoker = true
DROP VIEW IF EXISTS public.vehicles_public;
CREATE VIEW public.vehicles_public WITH (security_invoker = true) AS
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