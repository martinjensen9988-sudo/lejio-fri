-- Add unlimited_km column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN unlimited_km boolean NOT NULL DEFAULT false;