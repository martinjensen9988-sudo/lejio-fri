-- Drop the old function that uses gen_random_bytes
DROP FUNCTION IF EXISTS public.generate_fleet_api_key();

-- Create a new function using gen_random_uuid instead (which is always available)
CREATE OR REPLACE FUNCTION public.generate_fleet_api_key()
RETURNS TEXT AS $$
DECLARE
  key_part1 TEXT;
  key_part2 TEXT;
BEGIN
  -- Generate API key using two UUIDs combined and encoded
  key_part1 := replace(gen_random_uuid()::text, '-', '');
  key_part2 := substring(replace(gen_random_uuid()::text, '-', ''), 1, 16);
  RETURN 'flk_' || substring(key_part1, 1, 24) || key_part2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;