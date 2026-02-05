-- Update default per_booking_fee for private lessors from 49 kr to 59 kr
ALTER TABLE public.profiles ALTER COLUMN per_booking_fee SET DEFAULT 59;

-- Update the platform fee trigger function to use new default
CREATE OR REPLACE FUNCTION public.create_platform_fee_for_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  lessor_user_type TEXT;
  fee_amount NUMERIC;
BEGIN
  -- Get the lessor's user type and fee
  SELECT user_type, COALESCE(per_booking_fee, 59)
  INTO lessor_user_type, fee_amount
  FROM public.profiles
  WHERE id = NEW.lessor_id;
  
  -- Only create fee for private lessors
  IF lessor_user_type = 'privat' AND fee_amount > 0 THEN
    INSERT INTO public.platform_fees (lessor_id, booking_id, amount, description)
    VALUES (
      NEW.lessor_id, 
      NEW.id, 
      fee_amount,
      'Booking gebyr'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;