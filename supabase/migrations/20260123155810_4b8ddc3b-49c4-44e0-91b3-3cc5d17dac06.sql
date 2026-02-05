-- Allow NULL values in the name column
ALTER TABLE public.fleet_api_keys ALTER COLUMN name DROP NOT NULL;