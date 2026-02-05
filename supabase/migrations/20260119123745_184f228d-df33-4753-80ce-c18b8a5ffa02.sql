-- Fix sales_leads RLS to avoid depending on user_roles visibility under RLS
DROP POLICY IF EXISTS "Admins can manage sales leads" ON public.sales_leads;

CREATE POLICY "Admins can manage sales leads"
ON public.sales_leads
FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));