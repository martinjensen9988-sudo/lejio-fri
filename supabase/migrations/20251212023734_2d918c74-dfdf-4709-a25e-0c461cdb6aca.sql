-- Drop and recreate vehicles_public view to include fleet_plan from owner's profile
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
  -- Display address logic
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
  -- Fleet plan info for badge
  p.fleet_plan as owner_fleet_plan,
  p.lessor_status as owner_lessor_status,
  p.average_rating as owner_average_rating,
  p.company_name as owner_company_name
FROM public.vehicles v
LEFT JOIN public.profiles p ON v.owner_id = p.id
WHERE v.is_available = true;