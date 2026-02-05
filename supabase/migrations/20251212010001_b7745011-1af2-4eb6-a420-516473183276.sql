-- Add payment method preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS accepted_payment_methods TEXT[] DEFAULT ARRAY['cash', 'bank_transfer', 'mobilepay']::TEXT[],
ADD COLUMN IF NOT EXISTS mobilepay_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_reg_number TEXT;

-- Update subscription tiers in profiles
-- subscription_tier: 'free' (private), 'starter' (1-5 cars), 'growth' (6-15 cars), 'enterprise' (16+ cars)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.subscription_tier IS 'free=private, starter=299kr 1-5 cars, growth=499kr 6-15 cars, enterprise=799kr 16+ cars';
COMMENT ON COLUMN public.profiles.accepted_payment_methods IS 'Array of accepted methods: cash, bank_transfer, mobilepay, gateway, lejio_handled';