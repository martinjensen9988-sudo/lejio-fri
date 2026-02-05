-- Fix the SECURITY DEFINER view warning by explicitly setting SECURITY INVOKER
-- This ensures the view respects the RLS policies of the querying user
DROP VIEW IF EXISTS public.public_lessor_profiles;

CREATE VIEW public.public_lessor_profiles 
WITH (security_invoker = true)
AS
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

-- Re-grant SELECT permissions
GRANT SELECT ON public.public_lessor_profiles TO anon, authenticated;