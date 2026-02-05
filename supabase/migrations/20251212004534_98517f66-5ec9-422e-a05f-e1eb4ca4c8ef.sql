-- Drop and recreate view with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.vehicles_public 
WITH (security_invoker = true)
AS
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
  created_at
FROM public.vehicles
WHERE is_available = true;

-- Grant anonymous access to the view
GRANT SELECT ON public.vehicles_public TO anon;
GRANT SELECT ON public.vehicles_public TO authenticated;

-- Update RLS policy on vehicles to allow SELECT for the view to work
-- We need to allow reading vehicles where is_available = true for anyone
DROP POLICY IF EXISTS "Authenticated users can view available vehicles" ON public.vehicles;

CREATE POLICY "Anyone can view available vehicles" 
ON public.vehicles 
FOR SELECT 
USING (is_available = true);