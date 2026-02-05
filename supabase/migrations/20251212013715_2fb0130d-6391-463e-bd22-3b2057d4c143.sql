-- Drop and recreate vehicles_public view with location fields
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
    v.description,
    v.image_url,
    v.features,
    v.is_available,
    v.deposit_required,
    v.deposit_amount,
    v.created_at,
    v.use_custom_location,
    v.location_address,
    v.location_postal_code,
    v.location_city,
    v.latitude,
    v.longitude,
    -- Fallback to lessor's address if no custom location
    CASE 
        WHEN v.use_custom_location = true THEN v.location_address
        ELSE p.address
    END as display_address,
    CASE 
        WHEN v.use_custom_location = true THEN v.location_postal_code
        ELSE p.postal_code
    END as display_postal_code,
    CASE 
        WHEN v.use_custom_location = true THEN v.location_city
        ELSE p.city
    END as display_city
FROM vehicles v
JOIN profiles p ON (v.owner_id = p.id)
WHERE v.is_available = true 
AND (p.subscription_status = 'active' OR p.manual_activation = true);