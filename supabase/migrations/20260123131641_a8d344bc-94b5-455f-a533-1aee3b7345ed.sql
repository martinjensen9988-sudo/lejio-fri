
-- Allow admins to view all vehicle swaps
CREATE POLICY "Admins can view all vehicle swaps" 
ON public.vehicle_swaps 
FOR SELECT 
TO authenticated
USING (has_any_admin_role(auth.uid()));

-- Allow admins to insert vehicle swaps
CREATE POLICY "Admins can insert vehicle swaps" 
ON public.vehicle_swaps 
FOR INSERT 
TO authenticated
WITH CHECK (has_any_admin_role(auth.uid()));

-- Allow admins to update vehicle swaps
CREATE POLICY "Admins can update vehicle swaps" 
ON public.vehicle_swaps 
FOR UPDATE 
TO authenticated
USING (has_any_admin_role(auth.uid()))
WITH CHECK (has_any_admin_role(auth.uid()));

-- Allow admins to delete vehicle swaps
CREATE POLICY "Admins can delete vehicle swaps" 
ON public.vehicle_swaps 
FOR DELETE 
TO authenticated
USING (has_any_admin_role(auth.uid()));
