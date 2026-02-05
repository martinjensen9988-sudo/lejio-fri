
-- Create or replace the handle_new_user function to include promotional trial
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
    -- If signing up during promotion period AND is professional, give trialing status
    CASE 
      WHEN NOW() <= promotion_end_date AND (new.raw_user_meta_data ->> 'user_type') = 'professionel' 
      THEN 'trialing'
      ELSE 'inactive'
    END,
    -- If signing up during promotion period AND is professional, give enterprise tier
    CASE 
      WHEN NOW() <= promotion_end_date AND (new.raw_user_meta_data ->> 'user_type') = 'professionel' 
      THEN 'enterprise'
      ELSE NULL
    END,
    -- If signing up during promotion period AND is professional, set 3 month trial
    CASE 
      WHEN NOW() <= promotion_end_date AND (new.raw_user_meta_data ->> 'user_type') = 'professionel' 
      THEN NOW() + trial_duration
      ELSE NULL
    END,
    NOW(),
    NOW()
  );
  
  RETURN new;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
