-- Fix: Parse path manually instead of relying on storage.foldername
CREATE OR REPLACE FUNCTION public.can_manage_vehicle_image(object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vehicle_uuid text;
  slash_pos int;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admin roles can manage any vehicle images
  IF public.has_any_admin_role(auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Validate input
  IF object_name IS NULL OR object_name = '' THEN
    RETURN false;
  END IF;
  
  -- Extract vehicle ID from path (format: vehicleId/filename.ext)
  slash_pos := position('/' in object_name);
  IF slash_pos = 0 THEN
    RETURN false;
  END IF;
  
  vehicle_uuid := substring(object_name from 1 for slash_pos - 1);
  
  -- Validate UUID format
  IF vehicle_uuid !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RETURN false;
  END IF;
  
  -- Check if user owns this vehicle
  RETURN EXISTS (
    SELECT 1
    FROM public.vehicles v
    WHERE v.id = vehicle_uuid::uuid
      AND v.owner_id = auth.uid()
  );
END;
$$;