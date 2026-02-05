-- Create function to check if a vehicle is available for a given date range
CREATE OR REPLACE FUNCTION public.check_vehicle_availability(
  p_vehicle_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  overlapping_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO overlapping_count
  FROM public.bookings
  WHERE vehicle_id = p_vehicle_id
    AND status NOT IN ('cancelled', 'completed')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
    );
  
  RETURN overlapping_count = 0;
END;
$$;

-- Create trigger function to prevent double booking
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_available BOOLEAN;
BEGIN
  -- Skip check for cancelled or completed bookings
  IF NEW.status IN ('cancelled', 'completed') THEN
    RETURN NEW;
  END IF;
  
  -- Check availability (exclude current booking on UPDATE)
  SELECT public.check_vehicle_availability(
    NEW.vehicle_id,
    NEW.start_date::DATE,
    NEW.end_date::DATE,
    CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
  ) INTO is_available;
  
  IF NOT is_available THEN
    RAISE EXCEPTION 'Køretøjet er allerede booket i den valgte periode. Vælg venligst andre datoer.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON public.bookings;
CREATE TRIGGER prevent_double_booking_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_double_booking();

-- Add comment for documentation
COMMENT ON FUNCTION public.check_vehicle_availability IS 'Checks if a vehicle is available for booking in the given date range';
COMMENT ON FUNCTION public.prevent_double_booking IS 'Trigger function that prevents overlapping bookings for the same vehicle';