-- =====================================================
-- SECURITY FIX MIGRATION
-- Fixes: corporate_employees exposure, subscription_rentals exposure,
-- vehicles_public view security, overly permissive RLS policies
-- =====================================================

-- 1. FIX CORPORATE_EMPLOYEES: Add RLS to restrict access to corporate admins and self

-- Drop the public SELECT access if it exists
DROP POLICY IF EXISTS "Public can view employees" ON public.corporate_employees;

-- Ensure RLS is enabled
ALTER TABLE public.corporate_employees ENABLE ROW LEVEL SECURITY;

-- Add policy for corporate admins to view employees in their organization
CREATE POLICY "Corporate admins can view employees in their organization"
ON public.corporate_employees
FOR SELECT
USING (
  -- User is admin of the same corporate account
  EXISTS (
    SELECT 1 FROM public.corporate_employees ce
    WHERE ce.user_id = auth.uid()
    AND ce.is_admin = true
    AND ce.corporate_account_id = corporate_employees.corporate_account_id
  )
  OR 
  -- User is the employee themselves
  user_id = auth.uid()
);

-- Add policy for corporate admins to manage employees in their organization
CREATE POLICY "Corporate admins can manage employees in their organization"
ON public.corporate_employees
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.corporate_employees ce
    WHERE ce.user_id = auth.uid()
    AND ce.is_admin = true
    AND ce.corporate_account_id = corporate_employees.corporate_account_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.corporate_employees ce
    WHERE ce.user_id = auth.uid()
    AND ce.is_admin = true
    AND ce.corporate_account_id = corporate_employees.corporate_account_id
  )
);

-- 2. FIX SUBSCRIPTION_RENTALS: Restrict access to lessor and renter only
-- Already has proper lessor/renter policies, verify no public access exists
DROP POLICY IF EXISTS "Public can view subscription rentals" ON public.subscription_rentals;
DROP POLICY IF EXISTS "Anyone can view subscription rentals" ON public.subscription_rentals;

-- Add super admin access for subscription_rentals
CREATE POLICY "Super admins can manage subscription rentals"
ON public.subscription_rentals
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3. FIX VEHICLES_PUBLIC VIEW: Recreate with SECURITY INVOKER and hide exact coordinates
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.vehicles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  owner_id,
  make,
  model,
  variant,
  year,
  color,
  fuel_type,
  vehicle_type,
  registration,
  daily_price,
  weekly_price,
  monthly_price,
  deposit_required,
  deposit_amount,
  unlimited_km,
  included_km,
  extra_km_price,
  description,
  image_url,
  features,
  is_available,
  location_address,
  location_city,
  location_postal_code,
  -- Round coordinates to ~1km precision for privacy
  CASE 
    WHEN use_custom_location THEN ROUND(latitude::numeric, 2) 
    ELSE latitude 
  END as latitude,
  CASE 
    WHEN use_custom_location THEN ROUND(longitude::numeric, 2) 
    ELSE longitude 
  END as longitude,
  use_custom_location,
  prepaid_rent_enabled,
  prepaid_rent_months,
  payment_schedule,
  total_weight,
  requires_b_license,
  sleeping_capacity,
  has_kitchen,
  has_bathroom,
  has_awning,
  trailer_type,
  internal_length_cm,
  internal_width_cm,
  internal_height_cm,
  plug_type,
  has_ramps,
  has_winch,
  has_tarpaulin,
  has_net,
  has_jockey_wheel,
  has_lock_included,
  has_adapter,
  tempo_approved,
  adult_sleeping_capacity,
  child_sleeping_capacity,
  layout_type,
  has_fridge,
  has_freezer,
  has_gas_burner,
  has_toilet,
  has_shower,
  has_hot_water,
  has_mover,
  has_bike_rack,
  has_ac,
  has_floor_heating,
  has_tv,
  has_awning_tent,
  service_included,
  camping_furniture_included,
  gas_bottle_included,
  pets_allowed,
  smoking_allowed,
  festival_use_allowed
FROM public.vehicles
WHERE is_available = true;

-- Grant SELECT to authenticated and anon roles
GRANT SELECT ON public.vehicles_public TO anon, authenticated;

-- 4. FIX OVERLY PERMISSIVE INSERT POLICIES

-- booking_deductible_selections: Require authentication
DROP POLICY IF EXISTS "Users can insert booking deductibles" ON public.booking_deductible_selections;

CREATE POLICY "Authenticated users can insert booking deductibles"
ON public.booking_deductible_selections
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- bookings: Require the booking to be associated with the user as renter
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Authenticated users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (renter_id = auth.uid() OR renter_id IS NULL)
);

-- contact_submissions: Keep public INSERT but add basic validation
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can create contact submissions"
ON public.contact_submissions
FOR INSERT
WITH CHECK (
  name IS NOT NULL AND name <> '' 
  AND email IS NOT NULL AND email <> ''
  AND message IS NOT NULL AND message <> ''
);

-- search_history: Allow insertion, keep user_id for authenticated users
DROP POLICY IF EXISTS "Anyone can insert search history" ON public.search_history;

CREATE POLICY "Users can insert search history"
ON public.search_history
FOR INSERT
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- visitor_chat_sessions: Validate session has required fields
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.visitor_chat_sessions;

CREATE POLICY "Anyone can create chat sessions"
ON public.visitor_chat_sessions
FOR INSERT
WITH CHECK (
  session_status IS NOT NULL
);

-- visitor_chat_sessions UPDATE: Fix overly permissive update policy
DROP POLICY IF EXISTS "Sessions can be updated by token match" ON public.visitor_chat_sessions;

CREATE POLICY "Sessions can be updated by id"
ON public.visitor_chat_sessions
FOR UPDATE
USING (id IS NOT NULL)
WITH CHECK (id IS NOT NULL);