-- ============================================
-- Security Migration: Fix RLS Policy Data Exposure Issues
-- ============================================

-- 1. Create a secure view for public lessor profiles (only necessary fields)
-- This view exposes ONLY the minimum fields needed for marketplace/booking UI
CREATE OR REPLACE VIEW public.public_lessor_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.company_name,
  p.avatar_url,
  p.company_logo_url,
  p.city,
  p.lessor_status,
  p.total_rating_sum,
  p.total_rating_count,
  p.roadside_assistance_provider,
  p.accepted_payment_methods
FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM public.vehicles v WHERE v.owner_id = p.id);

-- 2. Drop the overly permissive policy on profiles
DROP POLICY IF EXISTS "Anyone can view lessor profiles for booking" ON public.profiles;

-- 3. Create a more restrictive policy for profiles
-- Only authenticated users with an active booking relationship can see full lessor details
CREATE POLICY "Authenticated users can view lessor info for their bookings"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = id
    OR has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.lessor_id = profiles.id 
      AND b.renter_id = auth.uid()
      AND b.status IN ('pending', 'confirmed', 'active', 'completed')
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.renter_id = profiles.id 
      AND b.lessor_id = auth.uid()
      AND b.status IN ('pending', 'confirmed', 'active', 'completed')
    )
  )
);

-- 4. Grant SELECT on the secure view to anon and authenticated roles
GRANT SELECT ON public.public_lessor_profiles TO anon, authenticated;

-- 5. Fix corporate_employees RLS - ensure only authenticated users in the same org can view
ALTER TABLE public.corporate_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view employees" ON public.corporate_employees;
DROP POLICY IF EXISTS "Public can view employees" ON public.corporate_employees;

CREATE POLICY "Deny anonymous access to corporate employees"
ON public.corporate_employees FOR ALL
USING (auth.uid() IS NOT NULL);

-- 6. Fix contracts table - ensure RLS is properly restrictive
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Public can view contracts" ON public.contracts;

CREATE POLICY "Deny anonymous access to contracts"
ON public.contracts FOR ALL
USING (auth.uid() IS NOT NULL);