-- Fix: corporate_employees table - Add SELECT policy to restrict access
-- Issue: corporate_employees_pii - PII exposed without proper SELECT restrictions

-- Add SELECT policy for corporate employees
CREATE POLICY "Users can view employees in their organization"
ON public.corporate_employees
FOR SELECT
USING (
  -- Employee can see their own record
  user_id = auth.uid() 
  OR
  -- Corporate admin can see employees in their organization
  EXISTS (
    SELECT 1 FROM public.corporate_employees ce
    WHERE ce.user_id = auth.uid()
    AND ce.is_admin = true
    AND ce.is_active = true
    AND ce.corporate_account_id = corporate_employees.corporate_account_id
  )
  OR
  -- Platform admins can see all employees
  public.has_any_admin_role(auth.uid())
);

-- Fix: subscription_rentals table - Ensure proper authentication required for all operations
-- Issue: subscription_rentals_renter_data_exposure - Renter data exposed

-- Drop existing policies that might be too permissive and recreate with auth requirement
DROP POLICY IF EXISTS "Lessors can view their subscription rentals" ON public.subscription_rentals;
DROP POLICY IF EXISTS "Renters can view their subscription rentals" ON public.subscription_rentals;
DROP POLICY IF EXISTS "Lessors can manage their subscription rentals" ON public.subscription_rentals;

-- Recreate with explicit auth.uid() check
CREATE POLICY "Authenticated lessors can view their subscription rentals"
ON public.subscription_rentals
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    lessor_id = auth.uid() 
    OR renter_id = auth.uid() 
    OR public.has_any_admin_role(auth.uid())
  )
);

CREATE POLICY "Authenticated lessors can manage their subscription rentals"
ON public.subscription_rentals
FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND (
    lessor_id = auth.uid() 
    OR public.has_any_admin_role(auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    lessor_id = auth.uid() 
    OR public.has_any_admin_role(auth.uid())
  )
);