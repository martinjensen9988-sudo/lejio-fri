-- Fix: renter_warnings table exposes ALL active warnings to any authenticated user
-- This is a critical security vulnerability exposing PII

-- Step 1: Drop the overly permissive "Lessors can view active warnings" policy
DROP POLICY IF EXISTS "Lessors can view active warnings" ON public.renter_warnings;

-- Step 2: Create a more restrictive policy that only allows:
-- 1. Users to view warnings they reported
-- 2. Admins to view all warnings
-- (Renter lookup will be done through a secure RPC function)

-- The existing policy "Lessors can view own reported warnings" already handles viewing own warnings
-- Just ensure admins can still access all warnings through their policy

-- Step 3: Create a secure RPC function for checking if a renter has warnings
-- This returns minimal info (counts only) without exposing sensitive details
CREATE OR REPLACE FUNCTION public.check_renter_warnings(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_license_number TEXT DEFAULT NULL
)
RETURNS TABLE (
  has_warnings BOOLEAN,
  warning_count INTEGER,
  max_severity INTEGER,
  reasons TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- At least one search parameter required
  IF p_email IS NULL AND p_phone IS NULL AND p_license_number IS NULL THEN
    RAISE EXCEPTION 'At least one search parameter required';
  END IF;
  
  -- Validate email format if provided
  IF p_email IS NOT NULL AND p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Return aggregated warning info (no PII exposed)
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 AS has_warnings,
    COUNT(*)::INTEGER AS warning_count,
    COALESCE(MAX(rw.severity), 0)::INTEGER AS max_severity,
    ARRAY_AGG(DISTINCT rw.reason::TEXT) FILTER (WHERE rw.reason IS NOT NULL) AS reasons
  FROM public.renter_warnings rw
  WHERE rw.status = 'active'
    AND rw.expires_at > now()
    AND (
      (p_email IS NOT NULL AND LOWER(rw.renter_email) = LOWER(p_email))
      OR (p_phone IS NOT NULL AND rw.renter_phone = p_phone)
      OR (p_license_number IS NOT NULL AND LOWER(rw.renter_license_number) = LOWER(p_license_number))
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_renter_warnings(TEXT, TEXT, TEXT) TO authenticated;

-- Step 4: Create a function for lessors to get warning details only for renters they're about to book
-- This requires a pending/confirmed booking relationship
CREATE OR REPLACE FUNCTION public.get_renter_warning_details(
  p_renter_email TEXT
)
RETURNS TABLE (
  id UUID,
  reason TEXT,
  description TEXT,
  severity INTEGER,
  damage_amount NUMERIC,
  unpaid_amount NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate email
  IF p_renter_email IS NULL OR p_renter_email = '' THEN
    RAISE EXCEPTION 'Renter email is required';
  END IF;
  
  -- Check if user has an active/pending booking with this renter
  -- OR if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.lessor_id = auth.uid()
      AND LOWER(b.renter_email) = LOWER(p_renter_email)
      AND b.status IN ('pending', 'confirmed', 'active')
  ) AND NOT has_any_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: No active booking relationship with this renter';
  END IF;
  
  -- Return warning details (without exposing phone/license to unrelated parties)
  RETURN QUERY
  SELECT 
    rw.id,
    rw.reason::TEXT,
    rw.description,
    rw.severity,
    rw.damage_amount,
    rw.unpaid_amount,
    rw.created_at
  FROM public.renter_warnings rw
  WHERE rw.status = 'active'
    AND rw.expires_at > now()
    AND LOWER(rw.renter_email) = LOWER(p_renter_email);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_renter_warning_details(TEXT) TO authenticated;

-- Step 5: Fix discount code race condition in update_discount_code_usage
CREATE OR REPLACE FUNCTION public.update_discount_code_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_uses INTEGER;
  v_max_uses INTEGER;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT current_uses, max_uses 
  INTO v_current_uses, v_max_uses
  FROM public.discount_codes 
  WHERE id = NEW.discount_code_id
  FOR UPDATE;
  
  -- Check if max uses exceeded
  IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
    RAISE EXCEPTION 'Discount code has reached maximum uses';
  END IF;
  
  -- Increment usage
  UPDATE public.discount_codes 
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = NEW.discount_code_id;
  
  RETURN NEW;
END;
$$;