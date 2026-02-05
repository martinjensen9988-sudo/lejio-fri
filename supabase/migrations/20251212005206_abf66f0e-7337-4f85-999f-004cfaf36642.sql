-- Create user roles table for super admin
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Add subscription status to profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN manual_activation BOOLEAN DEFAULT false,
ADD COLUMN manual_activation_notes TEXT;

-- Create discount codes table
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'free_months')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage discount codes
CREATE POLICY "Super admins can manage discount codes"
ON public.discount_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Track which users used discount codes
CREATE TABLE public.discount_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (discount_code_id, user_id)
);

ALTER TABLE public.discount_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view redemptions"
ON public.discount_code_redemptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can redeem codes"
ON public.discount_code_redemptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update discount code usage count
CREATE OR REPLACE FUNCTION public.update_discount_code_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes 
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = NEW.discount_code_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_discount_code_redemption
  AFTER INSERT ON public.discount_code_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_discount_code_usage();

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can update all profiles (for manual activation)
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can view all vehicles
CREATE POLICY "Super admins can view all vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage all bookings
CREATE POLICY "Super admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update vehicles public view to only show vehicles from active subscribers
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.vehicles_public 
WITH (security_invoker = true)
AS
SELECT 
  v.id,
  v.make,
  v.model,
  v.variant,
  v.year,
  v.fuel_type,
  v.color,
  v.daily_price,
  v.weekly_price,
  v.monthly_price,
  v.included_km,
  v.extra_km_price,
  v.unlimited_km,
  v.description,
  v.image_url,
  v.features,
  v.is_available,
  v.deposit_required,
  v.deposit_amount,
  v.created_at
FROM public.vehicles v
INNER JOIN public.profiles p ON v.owner_id = p.id
WHERE v.is_available = true
  AND (
    p.subscription_status = 'active' 
    OR p.manual_activation = true
  );

GRANT SELECT ON public.vehicles_public TO anon;
GRANT SELECT ON public.vehicles_public TO authenticated;