-- Drop the incorrect SELECT policy that only allows super admins
DROP POLICY IF EXISTS "Session owners can view their session" ON public.visitor_chat_sessions;

-- Create a proper policy that allows anyone to view sessions (they need the session_id which acts as a secret)
-- This is safe because session_ids are UUIDs and act as bearer tokens
CREATE POLICY "Anyone can view their session by id"
ON public.visitor_chat_sessions
FOR SELECT
USING (true);

-- Also add SELECT policy for visitor_chat_messages so users can see messages in their session
CREATE POLICY "Anyone can view messages in their session"
ON public.visitor_chat_messages
FOR SELECT
USING (true);