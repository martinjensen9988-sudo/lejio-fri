-- Fix remaining security issues with stricter policies

-- 1. WARNING_APPEALS - Add policy for users to view their own appeals
DROP POLICY IF EXISTS "Users can view their own appeals" ON public.warning_appeals;

CREATE POLICY "Users can view their own appeals"
ON public.warning_appeals FOR SELECT
USING (
  appellant_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR public.has_any_admin_role(auth.uid())
);

-- 2. FINES - Add renter access to view their own fines
DROP POLICY IF EXISTS "Renters can view fines for their bookings" ON public.fines;

CREATE POLICY "Renters can view fines for their bookings"
ON public.fines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = fines.booking_id
    AND (b.renter_id = auth.uid() OR b.renter_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
  )
  OR public.has_any_admin_role(auth.uid())
);

-- 3. CORPORATE_BOOKINGS - Fix INSERT policy to require proper check
DROP POLICY IF EXISTS "Corporate employees can create bookings" ON public.corporate_bookings;

CREATE POLICY "Corporate employees can create bookings"
ON public.corporate_bookings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.corporate_employees ce
    WHERE ce.id = corporate_bookings.corporate_employee_id
    AND ce.user_id = auth.uid()
  )
  OR public.has_any_admin_role(auth.uid())
);

-- 4. VISITOR_CHAT_MESSAGES - Restrict INSERT to require valid session
DROP POLICY IF EXISTS "Anyone can create chat messages" ON public.visitor_chat_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.visitor_chat_messages;
DROP POLICY IF EXISTS "Public can insert chat messages with session" ON public.visitor_chat_messages;

CREATE POLICY "Anyone can create chat messages with valid session"
ON public.visitor_chat_messages FOR INSERT
WITH CHECK (
  session_id IS NOT NULL
  AND content IS NOT NULL
  AND content != ''
);

-- 5. VISITOR_CHAT_SESSIONS - Restrict INSERT
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.visitor_chat_sessions;

CREATE POLICY "Anyone can create chat sessions"
ON public.visitor_chat_sessions FOR INSERT
WITH CHECK (
  session_status IS NOT NULL
  AND session_status = 'active'
);

-- 6. WARNING_APPEALS - Restrict INSERT to require valid warning
DROP POLICY IF EXISTS "Users can create appeal for their email" ON public.warning_appeals;

CREATE POLICY "Users can create appeal for their email"
ON public.warning_appeals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.renter_warnings w
    WHERE w.id = warning_appeals.warning_id
    AND w.renter_email = warning_appeals.appellant_email
  )
  AND appellant_email IS NOT NULL
  AND appeal_reason IS NOT NULL
  AND appeal_reason != ''
);

-- 7. LESSOR_REPORTS - Ensure only admins can SELECT
DROP POLICY IF EXISTS "Admins can view lessor reports" ON public.lessor_reports;
DROP POLICY IF EXISTS "Super admins can manage lessor reports" ON public.lessor_reports;

CREATE POLICY "Only admins can view lessor reports"
ON public.lessor_reports FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Only admins can manage lessor reports"
ON public.lessor_reports FOR ALL
USING (public.has_any_admin_role(auth.uid()));

-- 8. Add admin access for fines
DROP POLICY IF EXISTS "Admins can manage all fines" ON public.fines;

CREATE POLICY "Admins can manage all fines"
ON public.fines FOR ALL
USING (public.has_any_admin_role(auth.uid()));