-- Add missing fields to bookings table for proper contract generation
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS period_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS daily_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS weekly_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS included_km INTEGER,
ADD COLUMN IF NOT EXISTS extra_km_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deductible_insurance_selected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deductible_insurance_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_deductible DECIMAL(10,2) DEFAULT 5000,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS unlimited_km BOOLEAN DEFAULT false;