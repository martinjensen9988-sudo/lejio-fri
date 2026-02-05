-- Add vehicle_value column to vehicles table for vanvidskørsel liability
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS vehicle_value numeric DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.vehicles.vehicle_value IS 'Vehicle purchase value in DKK for vanvidskørsel liability. Must not exceed actual purchase price. Documentation (receipt/bank transfer) may be required.';

-- Update the public view to include vehicle_value for owners only (not public)
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.vehicles_public AS
SELECT 
  v.id,
  v.make,
  v.model,
  v.variant,
  v.year,
  v.daily_price,
  v.weekly_price,
  v.monthly_price,
  v.image_url,
  v.fuel_type,
  v.color,
  v.included_km,
  v.extra_km_price,
  v.unlimited_km,
  v.features,
  v.deposit_required,
  v.deposit_amount,
  v.use_custom_location,
  v.location_address,
  v.location_postal_code,
  v.location_city,
  v.latitude,
  v.longitude,
  v.is_available,
  v.created_at,
  -- Display address logic: use custom location if set, otherwise owner's address
  CASE 
    WHEN v.use_custom_location THEN v.location_address
    ELSE p.address
  END as display_address,
  CASE 
    WHEN v.use_custom_location THEN v.location_postal_code
    ELSE p.postal_code
  END as display_postal_code,
  CASE 
    WHEN v.use_custom_location THEN v.location_city
    ELSE p.city
  END as display_city,
  -- Owner info for badges (public info only)
  p.company_name as owner_company_name,
  p.fleet_plan as owner_fleet_plan,
  p.lessor_status as owner_lessor_status,
  p.average_rating as owner_average_rating
FROM public.vehicles v
LEFT JOIN public.profiles p ON v.owner_id = p.id
WHERE v.is_available = true;