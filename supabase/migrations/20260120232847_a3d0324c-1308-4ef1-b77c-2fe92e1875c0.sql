-- Drop and recreate the policy to allow viewing lessor payment settings for booking
DROP POLICY IF EXISTS "Users can view lessor profiles for booking" ON public.profiles;

-- Create a more permissive policy that allows viewing lessor payment info
CREATE POLICY "Anyone can view lessor profiles for booking" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM vehicles v WHERE v.owner_id = profiles.id)
);