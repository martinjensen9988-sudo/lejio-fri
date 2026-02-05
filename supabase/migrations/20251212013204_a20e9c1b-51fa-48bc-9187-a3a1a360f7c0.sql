-- Add location fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN use_custom_location boolean NOT NULL DEFAULT false,
ADD COLUMN location_address text,
ADD COLUMN location_postal_code text,
ADD COLUMN location_city text,
ADD COLUMN latitude numeric,
ADD COLUMN longitude numeric;