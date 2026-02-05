-- Allow users to view lessor profiles when booking vehicles
-- This is needed so renters can see lessor contact info for the booking process
CREATE POLICY "Users can view lessor profiles for booking"
ON public.profiles FOR SELECT
USING (
  -- User can view profiles of vehicle owners who have vehicles
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.owner_id = profiles.id
  )
);