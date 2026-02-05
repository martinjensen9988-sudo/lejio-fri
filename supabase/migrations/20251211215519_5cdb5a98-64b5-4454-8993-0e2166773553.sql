-- Add weekly and monthly price columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN weekly_price numeric NULL,
ADD COLUMN monthly_price numeric NULL;