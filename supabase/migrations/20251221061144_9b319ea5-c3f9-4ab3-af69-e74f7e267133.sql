
-- Update handle_new_user function to include BOTH private and professional users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  promotion_end_date TIMESTAMP WITH TIME ZONE := '2025-01-31 23:59:59+00';
  trial_duration INTERVAL := INTERVAL '3 months';
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    subscription_status,
    subscription_tier,
    trial_ends_at,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((new.raw_user_meta_data ->> 'user_type')::user_type, 'privat'),
    -- All users signing up during promotion period get trialing status
    CASE 
      WHEN NOW() <= promotion_end_date THEN 'trialing'
      ELSE 'inactive'
    END,
    -- All users signing up during promotion period get enterprise tier
    CASE 
      WHEN NOW() <= promotion_end_date THEN 'enterprise'
      ELSE NULL
    END,
    -- All users signing up during promotion period get 3 month trial
    CASE 
      WHEN NOW() <= promotion_end_date THEN NOW() + trial_duration
      ELSE NULL
    END,
    NOW(),
    NOW()
  );
  
  RETURN new;
END;
$$;
