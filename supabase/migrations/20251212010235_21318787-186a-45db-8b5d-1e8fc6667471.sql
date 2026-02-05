-- Update subscription tier comment to reflect correct pricing
COMMENT ON COLUMN public.profiles.subscription_tier IS 'free=private (49kr/booking), starter=299kr/md 1-5 cars, growth=499kr/md 6-15 cars, enterprise=799kr/md 16+ cars';

-- Add per_booking_fee column to track fees
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS per_booking_fee NUMERIC DEFAULT 49;

-- Set per_booking_fee based on user_type
-- Private users: 49 kr per booking
-- Professional users: 0 (included in subscription)
UPDATE public.profiles 
SET per_booking_fee = CASE 
  WHEN user_type = 'privat' THEN 49 
  ELSE 0 
END;