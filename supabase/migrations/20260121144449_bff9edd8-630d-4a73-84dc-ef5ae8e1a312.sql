CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (has_any_admin_role(auth.uid()));