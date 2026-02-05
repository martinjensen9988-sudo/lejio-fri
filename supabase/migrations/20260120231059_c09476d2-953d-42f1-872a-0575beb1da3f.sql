-- Drop existing insert policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;

-- Allow both authenticated and anonymous users to create bookings
-- The booking will capture renter details as text fields
CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- Update policy to allow renters to update their own bookings (to link renter_id after signup)
CREATE POLICY "Users can update their own bookings by email"
ON public.bookings FOR UPDATE
USING (
  renter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR lessor_id = auth.uid()
)
WITH CHECK (
  renter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR lessor_id = auth.uid()
);