-- Create platform fees table to track booking fees
CREATE TABLE public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 49,
  currency TEXT NOT NULL DEFAULT 'DKK',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
  description TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);

ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- Lessors can view their own fees
CREATE POLICY "Lessors can view their own fees"
ON public.platform_fees
FOR SELECT
TO authenticated
USING (auth.uid() = lessor_id);

-- Super admins can view and manage all fees
CREATE POLICY "Super admins can view all fees"
ON public.platform_fees
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all fees"
ON public.platform_fees
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Function to create platform fee for private lessors
CREATE OR REPLACE FUNCTION public.create_platform_fee_for_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lessor_user_type TEXT;
  fee_amount NUMERIC;
BEGIN
  -- Get the lessor's user type and fee
  SELECT user_type, COALESCE(per_booking_fee, 49)
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
$$;

-- Trigger to create fee when booking is created
CREATE TRIGGER on_booking_created_create_fee
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.create_platform_fee_for_booking();

-- Update timestamp trigger
CREATE TRIGGER update_platform_fees_updated_at
  BEFORE UPDATE ON public.platform_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();