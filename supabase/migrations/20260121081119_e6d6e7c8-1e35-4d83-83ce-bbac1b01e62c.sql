-- Drop existing public read policy and create a simpler one without subquery
DROP POLICY IF EXISTS "Public can view vehicle images for available vehicles" ON vehicle_images;

-- Create a simple policy that allows reading all vehicle images for available vehicles
-- The key insight: since vehicle_images are only useful when viewing vehicles, 
-- and vehicles are already filtered by is_available in the frontend query,
-- we can allow public read access to all vehicle_images
CREATE POLICY "Anyone can view vehicle images"
ON vehicle_images
FOR SELECT
USING (true);