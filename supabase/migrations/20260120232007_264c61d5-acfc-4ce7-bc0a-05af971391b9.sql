-- Drop problematic policies that reference auth.users directly
DROP POLICY IF EXISTS "Renters can view their bookings by email" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings by email" ON public.bookings;
DROP POLICY IF EXISTS "Renters can view contracts by email" ON public.contracts;
DROP POLICY IF EXISTS "Renters can update signature by email" ON public.contracts;

-- Recreate policies using auth.jwt() instead of auth.users subquery
CREATE POLICY "Renters can view their bookings by email" 
ON public.bookings 
FOR SELECT 
USING (renter_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can update their own bookings by email" 
ON public.bookings 
FOR UPDATE 
USING (renter_email = (auth.jwt() ->> 'email') OR lessor_id = auth.uid())
WITH CHECK (renter_email = (auth.jwt() ->> 'email') OR lessor_id = auth.uid());

CREATE POLICY "Renters can view contracts by email" 
ON public.contracts 
FOR SELECT 
USING (auth.uid() = renter_id OR (renter_id IS NULL AND renter_email = (auth.jwt() ->> 'email')));

CREATE POLICY "Renters can update signature by email" 
ON public.contracts 
FOR UPDATE 
USING (auth.uid() = renter_id OR (renter_id IS NULL AND renter_email = (auth.jwt() ->> 'email')));