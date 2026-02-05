
-- Add new columns for trailers
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS trailer_type text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS internal_length_cm integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS internal_width_cm integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS internal_height_cm integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS plug_type text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_ramps boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_winch boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_tarpaulin boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_net boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_jockey_wheel boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_lock_included boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_adapter boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS tempo_approved boolean DEFAULT false;

-- Add new columns for caravans
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS adult_sleeping_capacity integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS child_sleeping_capacity integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS layout_type text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_fridge boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_freezer boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_gas_burner boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_toilet boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_shower boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_hot_water boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_mover boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_bike_rack boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_ac boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_floor_heating boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_tv boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS has_awning_tent boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS service_included boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS camping_furniture_included boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS gas_bottle_included boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS pets_allowed boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS smoking_allowed boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS festival_use_allowed boolean DEFAULT false;

-- Update the vehicles_public view to include new columns
DROP VIEW IF EXISTS public.vehicles_public;
CREATE VIEW public.vehicles_public AS
SELECT 
  id, owner_id, make, model, variant, year, color, fuel_type,
  vehicle_type, registration, daily_price, weekly_price, monthly_price,
  deposit_required, deposit_amount, unlimited_km, included_km, extra_km_price,
  description, image_url, features, is_available,
  location_address, location_city, location_postal_code, latitude, longitude,
  use_custom_location, prepaid_rent_enabled, prepaid_rent_months, payment_schedule,
  total_weight, requires_b_license, sleeping_capacity, has_kitchen, has_bathroom, has_awning,
  -- New trailer fields
  trailer_type, internal_length_cm, internal_width_cm, internal_height_cm, plug_type,
  has_ramps, has_winch, has_tarpaulin, has_net, has_jockey_wheel, has_lock_included,
  has_adapter, tempo_approved,
  -- New caravan fields
  adult_sleeping_capacity, child_sleeping_capacity, layout_type,
  has_fridge, has_freezer, has_gas_burner, has_toilet, has_shower, has_hot_water,
  has_mover, has_bike_rack, has_ac, has_floor_heating, has_tv, has_awning_tent,
  service_included, camping_furniture_included, gas_bottle_included,
  pets_allowed, smoking_allowed, festival_use_allowed
FROM public.vehicles
WHERE is_available = true;
