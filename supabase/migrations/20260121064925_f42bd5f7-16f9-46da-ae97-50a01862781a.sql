-- Create table for vehicle images (supports multiple images per vehicle)
CREATE TABLE public.vehicle_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);

-- Enable RLS
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Policy: Vehicle owners can manage their vehicle images
CREATE POLICY "Vehicle owners can view their vehicle images"
ON public.vehicle_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles 
    WHERE vehicles.id = vehicle_images.vehicle_id 
    AND vehicles.owner_id = auth.uid()
  )
);

CREATE POLICY "Vehicle owners can insert vehicle images"
ON public.vehicle_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vehicles 
    WHERE vehicles.id = vehicle_images.vehicle_id 
    AND vehicles.owner_id = auth.uid()
  )
);

CREATE POLICY "Vehicle owners can update vehicle images"
ON public.vehicle_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles 
    WHERE vehicles.id = vehicle_images.vehicle_id 
    AND vehicles.owner_id = auth.uid()
  )
);

CREATE POLICY "Vehicle owners can delete vehicle images"
ON public.vehicle_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles 
    WHERE vehicles.id = vehicle_images.vehicle_id 
    AND vehicles.owner_id = auth.uid()
  )
);

-- Policy: Public can view images for available vehicles (for search/booking)
CREATE POLICY "Public can view vehicle images for available vehicles"
ON public.vehicle_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles 
    WHERE vehicles.id = vehicle_images.vehicle_id 
    AND vehicles.is_available = true
  )
);