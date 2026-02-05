-- Fix security definer view by using SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.vehicles_public 
WITH (security_invoker = true) AS
SELECT 
  v.id,
  v.make,
  v.model,
  v.variant,
  v.year,
  v.fuel_type,
  v.color,
  v.daily_price,
  v.weekly_price,
  v.monthly_price,
  v.included_km,
  v.extra_km_price,
  v.unlimited_km,
  v.deposit_required,
  v.deposit_amount,
  v.features,
  v.image_url,
  v.is_available,
  v.created_at,
  v.use_custom_location,
  v.location_address,
  v.location_city,
  v.location_postal_code,
  v.latitude,
  v.longitude,
  CASE 
    WHEN v.use_custom_location THEN v.location_address
    ELSE p.address
  END as display_address,
  CASE 
    WHEN v.use_custom_location THEN v.location_city
    ELSE p.city
  END as display_city,
  CASE 
    WHEN v.use_custom_location THEN v.location_postal_code
    ELSE p.postal_code
  END as display_postal_code,
  p.company_name as owner_company_name,
  p.average_rating as owner_average_rating,
  p.lessor_status as owner_lessor_status,
  p.fleet_plan as owner_fleet_plan
FROM vehicles v
JOIN profiles p ON v.owner_id = p.id
WHERE 
  v.is_available = true
  AND (
    p.user_type = 'privat'
    OR (
      p.user_type = 'professionel'
      AND (
        p.subscription_status = 'active'
        OR (p.trial_ends_at IS NOT NULL AND p.trial_ends_at < now())
      )
    )
  );