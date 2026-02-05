-- Allow authenticated users to create bookings (renters booking vehicles)
-- The booking will have lessor_id set to the vehicle owner
CREATE POLICY "Authenticated users can create bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (true);

-- Also allow renters to view their own bookings by email
CREATE POLICY "Renters can view their bookings by email"
ON public.bookings FOR SELECT
USING (
  renter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);