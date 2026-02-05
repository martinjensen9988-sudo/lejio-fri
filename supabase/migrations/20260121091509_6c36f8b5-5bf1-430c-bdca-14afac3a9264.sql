
-- =====================================================
-- SECURITY FIX: Visitor Chat Public Data Exposure
-- Drop overly permissive SELECT policies and replace with secure versions
-- =====================================================

-- 1. Drop the vulnerable "Public can read" policies
DROP POLICY IF EXISTS "Public can read sessions" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Public can read messages" ON public.visitor_chat_messages;

-- 2. Keep admin access policies (already exist)
-- Admins can already read all via "Admins can read all sessions" and "Admins can read all messages"

-- Note: Anonymous visitors access their sessions via the chat-session edge function
-- which validates session tokens server-side, not via direct database access.
-- This is the secure pattern - no direct public SELECT access is needed.

-- =====================================================
-- SECURITY FIX: Check-in/out Images Storage Bucket
-- Make bucket private to enforce RLS policies
-- =====================================================

-- Make the checkinout-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'checkinout-images';

-- Drop existing storage policies for checkinout-images to recreate properly
DROP POLICY IF EXISTS "Authenticated users can upload checkinout images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view checkinout images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update checkinout images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete checkinout images" ON storage.objects;

-- Create secure user-specific storage policies
CREATE POLICY "Users can upload to their checkinout folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'checkinout-images' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own checkinout images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'checkinout-images'
  AND auth.uid() IS NOT NULL
  AND (
    -- Owner of the folder
    (storage.foldername(name))[1] = auth.uid()::text
    -- Or admin/support
    OR public.has_any_admin_role(auth.uid())
  )
);

CREATE POLICY "Users can update their own checkinout images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'checkinout-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own checkinout images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'checkinout-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- SECURITY FIX: Booking INSERT Validation
-- Replace the overly permissive booking insert policy
-- =====================================================

-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;

-- Create a properly validated insert policy
CREATE POLICY "Authenticated users can create valid bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  -- Renter must be the authenticated user or null (lessor-created booking)
  AND (renter_id = auth.uid() OR renter_id IS NULL)
  -- Vehicle must exist and be available
  AND vehicle_id IN (SELECT id FROM public.vehicles WHERE is_available = true)
  -- Lessor must be the vehicle owner (prevents assigning bookings to arbitrary users)
  AND lessor_id = (SELECT owner_id FROM public.vehicles WHERE id = vehicle_id)
  -- Valid date range
  AND start_date <= end_date
  AND start_date >= CURRENT_DATE
  -- Price must be non-negative
  AND (total_price IS NULL OR total_price >= 0)
);

-- =====================================================
-- SECURITY FIX: Update Sessions Policy
-- The "Sessions can be updated by id" policy is too permissive
-- =====================================================

DROP POLICY IF EXISTS "Sessions can be updated by id" ON public.visitor_chat_sessions;

-- Only allow update through admin or via the edge function (service role)
-- Anonymous users should not be able to update sessions directly
CREATE POLICY "Only admins can update sessions directly"
ON public.visitor_chat_sessions FOR UPDATE
USING (
  public.has_any_admin_role(auth.uid())
)
WITH CHECK (
  public.has_any_admin_role(auth.uid())
);
