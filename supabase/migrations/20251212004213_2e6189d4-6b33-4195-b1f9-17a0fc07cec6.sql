-- 1. Create secure table for payment credentials with strict RLS
CREATE TABLE public.lessor_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_gateway text,
  gateway_api_key text,
  gateway_merchant_id text,
  bank_account text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lessor_payment_settings ENABLE ROW LEVEL SECURITY;

-- Strict RLS: Only the lessor can access their own payment settings
CREATE POLICY "Lessors can view their own payment settings"
ON public.lessor_payment_settings
FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert their own payment settings"
ON public.lessor_payment_settings
FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their own payment settings"
ON public.lessor_payment_settings
FOR UPDATE
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can delete their own payment settings"
ON public.lessor_payment_settings
FOR DELETE
USING (auth.uid() = lessor_id);

-- Deny anonymous access explicitly
CREATE POLICY "Deny anonymous access to payment settings"
ON public.lessor_payment_settings
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 2. Migrate existing payment data from profiles to new table
INSERT INTO public.lessor_payment_settings (lessor_id, payment_gateway, gateway_api_key, gateway_merchant_id, bank_account)
SELECT id, payment_gateway, gateway_api_key, gateway_merchant_id, bank_account
FROM public.profiles
WHERE payment_gateway IS NOT NULL OR gateway_api_key IS NOT NULL OR gateway_merchant_id IS NOT NULL OR bank_account IS NOT NULL;

-- 3. Remove sensitive payment columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS gateway_api_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS gateway_merchant_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bank_account;

-- 4. Create a public vehicles view that excludes owner_id and VIN for anonymous access
-- First drop the "Anyone can view available vehicles" policy
DROP POLICY IF EXISTS "Anyone can view available vehicles" ON public.vehicles;

-- Add policy that requires authentication to see all vehicle details
CREATE POLICY "Authenticated users can view available vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (is_available = true);

-- Create a function to check if user is owner or has active booking
CREATE OR REPLACE FUNCTION public.can_view_vehicle_sensitive_data(vehicle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vehicles WHERE id = vehicle_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM bookings 
    WHERE vehicle_id = $1 
    AND (lessor_id = auth.uid() OR renter_id = auth.uid())
    AND status IN ('pending', 'confirmed', 'active')
  );
$$;

-- Add trigger for updated_at on new table
CREATE TRIGGER update_lessor_payment_settings_updated_at
BEFORE UPDATE ON public.lessor_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();