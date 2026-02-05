-- Update handle_new_user function to give 6 months free trial for everyone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
DECLARE
  trial_duration INTERVAL := INTERVAL '6 months';
BEGIN
  -- Insert profile for new user with 6 months free trial
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
    'trialing',
    'enterprise',
    NOW() + trial_duration,
    NOW(),
    NOW()
  );
  
  RETURN new;
END;
$$;