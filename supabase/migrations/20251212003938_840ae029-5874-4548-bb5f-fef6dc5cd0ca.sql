-- Add explicit RESTRICTIVE policies to deny anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Add explicit RESTRICTIVE policy to deny anonymous access to bookings
CREATE POLICY "Deny anonymous access to bookings"
ON public.bookings
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);