-- Drop the existing policy and create a new one with proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins can manage sales leads" ON public.sales_leads;

-- Create a complete policy with both USING and WITH CHECK clauses
CREATE POLICY "Admins can manage sales leads" 
ON public.sales_leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin', 'support')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin', 'support')
  )
);