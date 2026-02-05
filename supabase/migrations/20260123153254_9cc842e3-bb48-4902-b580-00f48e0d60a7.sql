-- Create workshop_services table for fleet owners to define their service offerings
CREATE TABLE public.workshop_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fleet_owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.workshop_services IS 'Workshop service offerings defined by fleet owners';
COMMENT ON COLUMN public.workshop_services.fleet_owner_id IS 'The user ID of the fleet owner who created this service';
COMMENT ON COLUMN public.workshop_services.estimated_minutes IS 'Estimated time in minutes to complete the service';

-- Enable Row Level Security
ALTER TABLE public.workshop_services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active services (for public booking display)
CREATE POLICY "Anyone can view active workshop services"
ON public.workshop_services
FOR SELECT
USING (is_active = true);

-- Policy: Fleet owners can view all their own services (including inactive)
CREATE POLICY "Fleet owners can view all their services"
ON public.workshop_services
FOR SELECT
USING (auth.uid() = fleet_owner_id);

-- Policy: Fleet owners can create their own services
CREATE POLICY "Fleet owners can create their own services"
ON public.workshop_services
FOR INSERT
WITH CHECK (auth.uid() = fleet_owner_id);

-- Policy: Fleet owners can update their own services
CREATE POLICY "Fleet owners can update their own services"
ON public.workshop_services
FOR UPDATE
USING (auth.uid() = fleet_owner_id);

-- Policy: Fleet owners can delete their own services
CREATE POLICY "Fleet owners can delete their own services"
ON public.workshop_services
FOR DELETE
USING (auth.uid() = fleet_owner_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workshop_services_updated_at
BEFORE UPDATE ON public.workshop_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_workshop_services_fleet_owner ON public.workshop_services(fleet_owner_id);
CREATE INDEX idx_workshop_services_active ON public.workshop_services(is_active) WHERE is_active = true;