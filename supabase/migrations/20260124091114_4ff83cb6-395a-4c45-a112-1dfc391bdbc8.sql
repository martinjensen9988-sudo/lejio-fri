-- ================================================
-- FIX 1: Strengthen corporate_employees RLS policies
-- The existing policies allow too broad access within organizations
-- We need to ensure only authenticated users within the SAME corporate account
-- can see employee data, and non-corporate users cannot see any employee data
-- ================================================

-- First, drop the overly permissive policies
DROP POLICY IF EXISTS "Users can view employees in their organization" ON public.corporate_employees;
DROP POLICY IF EXISTS "Corporate admins can view their employees" ON public.corporate_employees;
DROP POLICY IF EXISTS "Corporate admins can view employees in their organization" ON public.corporate_employees;
DROP POLICY IF EXISTS "Users can view own employee record" ON public.corporate_employees;

-- Create consolidated, secure policies for viewing employees
-- Policy 1: Users can ONLY view their own employee record
CREATE POLICY "Users can view own employee record"
ON public.corporate_employees
FOR SELECT
USING (user_id = auth.uid());

-- Policy 2: Corporate admins can view employees in their own organization ONLY
CREATE POLICY "Corporate admins can view employees in their organization"
ON public.corporate_employees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM corporate_employees ce
    WHERE ce.user_id = auth.uid()
    AND ce.is_admin = true
    AND ce.is_active = true
    AND ce.corporate_account_id = corporate_employees.corporate_account_id
  )
);

-- Policy 3: Platform admins can view all employees
CREATE POLICY "Platform admins can view all employees"
ON public.corporate_employees
FOR SELECT
USING (has_any_admin_role(auth.uid()));

-- ================================================
-- FIX 2: Strengthen contracts RLS policies
-- The current policy allows renter access via email match when renter_id IS NULL
-- This could allow unauthorized access if someone knows the renter's email
-- Change to require authenticated user ID match, not just email
-- ================================================

-- Drop the weak email-based policies
DROP POLICY IF EXISTS "Renters can view contracts by email" ON public.contracts;
DROP POLICY IF EXISTS "Renters can update signature by email" ON public.contracts;

-- Create stronger policies that require authenticated user
-- Policy: Renters can view contracts ONLY when their authenticated user ID matches
-- OR when signed in with the same email AND have an active booking relationship
CREATE POLICY "Renters can view their contracts securely"
ON public.contracts
FOR SELECT
USING (
  -- Direct renter_id match
  (renter_id = auth.uid())
  OR
  -- Email match with additional security: must have a booking relationship
  (
    renter_id IS NULL
    AND renter_email = (auth.jwt() ->> 'email'::text)
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = contracts.booking_id
      AND (b.renter_id = auth.uid() OR b.renter_email = (auth.jwt() ->> 'email'::text))
      AND b.status IN ('pending', 'confirmed', 'active', 'completed')
    )
  )
);

-- Policy: Renters can update signature ONLY with proper verification
CREATE POLICY "Renters can update signature securely"
ON public.contracts
FOR UPDATE
USING (
  -- Direct renter_id match
  (renter_id = auth.uid())
  OR
  -- Email match with additional security: must have a booking relationship
  (
    renter_id IS NULL
    AND renter_email = (auth.jwt() ->> 'email'::text)
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = contracts.booking_id
      AND (b.renter_id = auth.uid() OR b.renter_email = (auth.jwt() ->> 'email'::text))
      AND b.status IN ('pending', 'confirmed', 'active')
    )
  )
);