-- Fix: Require authentication for lessor reports to prevent spam/harassment
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can create lessor report" ON public.lessor_reports;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can create lessor report" 
ON public.lessor_reports 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);