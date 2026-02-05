-- Drop existing update policy for super admins
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;

-- Create new update policy with proper with_check expression
CREATE POLICY "Super admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));