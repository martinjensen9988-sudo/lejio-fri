-- Add explicit RLS policy for rate_limits table
-- Only service role should have access (edge functions use service role key)
-- This is intentionally restrictive - no user access

-- Create a policy that explicitly denies all access to regular users
-- Service role bypasses RLS, so edge functions will still work
CREATE POLICY "Deny all user access to rate_limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);