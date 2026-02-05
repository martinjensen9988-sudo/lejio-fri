-- Update handle_new_user to set trial period for professional users (14 days)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, company_name, cvr_number, trial_ends_at, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::public.user_type, 'privat'),
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'cvr_number',
    -- Set 14-day trial for professional users
    CASE 
      WHEN (NEW.raw_user_meta_data ->> 'user_type') = 'professionel' 
      THEN now() + interval '14 days'
      ELSE NULL
    END,
    -- Set subscription status to trial for professional users
    CASE 
      WHEN (NEW.raw_user_meta_data ->> 'user_type') = 'professionel' 
      THEN 'trial'
      ELSE 'inactive'
    END
  );
  RETURN NEW;
END;
$function$;

-- Drop and recreate vehicles_public view to hide trial users' vehicles
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.vehicles_public AS
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
  -- Use custom location or profile location
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
  -- Owner info for display
  p.company_name as owner_company_name,
  p.average_rating as owner_average_rating,
  p.lessor_status as owner_lessor_status,
  p.fleet_plan as owner_fleet_plan
FROM vehicles v
JOIN profiles p ON v.owner_id = p.id
WHERE 
  v.is_available = true
  AND (
    -- Private users: always show their vehicles
    p.user_type = 'privat'
    OR (
      -- Professional users: only show if they have active subscription OR are NOT in trial period
      p.user_type = 'professionel'
      AND (
        p.subscription_status = 'active'
        OR (p.trial_ends_at IS NOT NULL AND p.trial_ends_at < now())
      )
    )
  );