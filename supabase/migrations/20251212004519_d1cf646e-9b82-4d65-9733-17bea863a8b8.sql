-- Create a public view for vehicles with only non-sensitive fields
CREATE OR REPLACE VIEW public.vehicles_public AS
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